import bcrypt from "bcrypt";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import { createApp } from "../server.js";

function cookieHeader(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value.join(";") : value;
}

describe("auth routes", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-64-hex-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    const passwordHash = await bcrypt.hash("changeme123", 10);

    const user = await prisma.user.upsert({
      where: { email: "rahul@sevenfincorp.com" },
      update: {
        name: "Rahul Gonsalves",
        passwordHash,
      },
      create: {
        email: "rahul@sevenfincorp.com",
        name: "Rahul Gonsalves",
        passwordHash,
      },
    });

    await prisma.userMembership.upsert({
      where: {
        userId_scope: {
          userId: user.id,
          scope: "platform:dash",
        },
      },
      update: { role: "admin" },
      create: {
        userId: user.id,
        scope: "platform:dash",
        role: "admin",
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 200 with token + user for valid credentials", async () => {
    const app = createApp();

    const response = await request(app).post("/api/auth/login").send({
      email: "rahul@sevenfincorp.com",
      password: "changeme123",
    });

    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe("string");
    expect(response.body.user.email).toBe("rahul@sevenfincorp.com");
    expect(Array.isArray(response.body.user.memberships)).toBe(true);
    expect(cookieHeader(response.headers["set-cookie"])).toContain("sf_token=");
  });

  it("returns 401 for invalid credentials", async () => {
    const app = createApp();

    const response = await request(app).post("/api/auth/login").send({
      email: "rahul@sevenfincorp.com",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
  });

  it("enforces auth-by-default and allows public endpoints", async () => {
    const app = createApp();

    const health = await request(app).get("/api/health");
    expect(health.status).toBe(200);

    const meWithoutToken = await request(app).get("/api/auth/me");
    expect(meWithoutToken.status).toBe(401);
  });

  it("returns current user + memberships from /api/auth/me with bearer token", async () => {
    const app = createApp();

    const login = await request(app).post("/api/auth/login").send({
      email: "rahul@sevenfincorp.com",
      password: "changeme123",
    });

    const token = login.body.token as string;

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("rahul@sevenfincorp.com");
    expect(Array.isArray(me.body.user.memberships)).toBe(true);
    expect(me.body.user.memberships[0]).toMatchObject({
      scope: "platform:dash",
      role: "admin",
    });
  });

  it("keeps logout public and clears sf_token cookie", async () => {
    const app = createApp();

    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(cookieHeader(response.headers["set-cookie"])).toContain("sf_token=;");
  });
});
