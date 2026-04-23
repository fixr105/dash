import request from "supertest";
import bcrypt from "bcrypt";
import { beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../../lib/prisma.js";
import { createApp } from "../../server.js";

async function loginAndGetToken(email: string, password: string) {
  const app = createApp();
  const response = await request(app).post("/api/auth/login").send({ email, password });
  expect(response.status).toBe(200);
  return response.body.token as string;
}

describe("inbox routes", () => {
  const secondNbfcEmail = "other-underwriter@testnbfc.com";
  const secondNbfcPassword = "changeme123";

  beforeAll(async () => {
    const secondNbfc = await prisma.nbfc.upsert({
      where: { slug: "second-test-nbfc" },
      update: {
        name: "Second Test NBFC",
        legalEntityName: "Second Test NBFC Private Limited",
        status: "ACTIVE",
      },
      create: {
        slug: "second-test-nbfc",
        name: "Second Test NBFC",
        legalEntityName: "Second Test NBFC Private Limited",
        status: "ACTIVE",
      },
    });

    const passwordHash = await bcrypt.hash(secondNbfcPassword, 10);
    const secondUnderwriter = await prisma.user.upsert({
      where: { email: secondNbfcEmail },
      update: {
        name: "Second NBFC Underwriter",
        passwordHash,
      },
      create: {
        email: secondNbfcEmail,
        name: "Second NBFC Underwriter",
        passwordHash,
      },
    });

    await prisma.userMembership.upsert({
      where: {
        userId_scope: {
          userId: secondUnderwriter.id,
          scope: `nbfc:${secondNbfc.id}`,
        },
      },
      update: {
        role: "underwriter",
        nbfcId: secondNbfc.id,
      },
      create: {
        userId: secondUnderwriter.id,
        nbfcId: secondNbfc.id,
        scope: `nbfc:${secondNbfc.id}`,
        role: "underwriter",
      },
    });
  });

  it("returns seeded loan applications for NBFC user", async () => {
    const app = createApp();
    const token = await loginAndGetToken("underwriter@testnbfc.com", "changeme123");

    const response = await request(app).get("/api/inbox").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0]).toMatchObject({
      id: expect.any(String),
      externalRef: expect.any(String),
      productModuleKey: "MM",
      status: "SENT_TO_NBFC",
      amount: expect.any(String),
      metadata: {
        clientName: expect.any(String),
        borrowerName: expect.any(String),
      },
    });
  });

  it("returns 403 for platform-only user", async () => {
    const app = createApp();
    const token = await loginAndGetToken("rahul@sevenfincorp.com", "changeme123");

    const response = await request(app).get("/api/inbox").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: "NBFC scope required. This endpoint is only accessible to NBFC users.",
    });
  });

  it("returns 401 with no auth", async () => {
    const app = createApp();

    const response = await request(app).get("/api/inbox");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication required." });
  });

  it("returns detail for NBFC user owned application", async () => {
    const app = createApp();
    const token = await loginAndGetToken("underwriter@testnbfc.com", "changeme123");
    const inbox = await request(app).get("/api/inbox").set("Authorization", `Bearer ${token}`);
    const ownApplicationId = inbox.body.items[0].id as string;

    const response = await request(app).get(`/api/inbox/${ownApplicationId}`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.application).toMatchObject({
      id: ownApplicationId,
      externalRef: expect.any(String),
      amount: expect.any(String),
    });
    expect(Array.isArray(response.body.statusHistory)).toBe(true);
  });

  it("returns 404 when user requests another NBFC application", async () => {
    const app = createApp();
    const underwriterToken = await loginAndGetToken("underwriter@testnbfc.com", "changeme123");
    const ownInbox = await request(app).get("/api/inbox").set("Authorization", `Bearer ${underwriterToken}`);
    const firstApplicationId = ownInbox.body.items[0].id as string;
    const secondNbfcToken = await loginAndGetToken(secondNbfcEmail, secondNbfcPassword);

    const response = await request(app)
      .get(`/api/inbox/${firstApplicationId}`)
      .set("Authorization", `Bearer ${secondNbfcToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Application not found." });
  });

  it("returns 401 for detail with no auth", async () => {
    const app = createApp();
    const inbox = await request(app)
      .get("/api/inbox")
      .set(
        "Authorization",
        `Bearer ${await loginAndGetToken("underwriter@testnbfc.com", "changeme123")}`,
      );
    const ownApplicationId = inbox.body.items[0].id as string;

    const response = await request(app).get(`/api/inbox/${ownApplicationId}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication required." });
  });
});
