import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../../server.js";

async function loginAndGetToken(email: string, password: string) {
  const app = createApp();
  const response = await request(app).post("/api/auth/login").send({ email, password });
  expect(response.status).toBe(200);
  return response.body.token as string;
}

describe("inbox routes", () => {
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
});
