import request from "supertest";
import { describe, expect, test } from "vitest";

import { createApp } from "../../src/app.js";
import { createSeedState } from "../../src/data/seed.js";
import { MemoryStore } from "../../src/core/repositories/memoryStore.js";

describe("Money Multiplier API", () => {
  test("returns dashboard data from the seed store", async () => {
    const app = createApp(new MemoryStore(createSeedState("2026-04-16")));

    const response = await request(app).get("/api/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.portfolio.capital).toBe(10000000);
    expect(response.body.clients).toHaveLength(3);
    expect(response.body.transactions).toHaveLength(4);
  });

  test("creates a client and a transaction through the API", async () => {
    const app = createApp(new MemoryStore(createSeedState("2026-04-16")));

    const createClientResponse = await request(app).post("/api/clients").send({
      name: "Northwind Pharma",
      product: "Revolving Credit Line",
      limit: 1200000,
      industry: "Pharma Distribution",
      status: "Active",
    });

    expect(createClientResponse.status).toBe(201);

    const clientId = createClientResponse.body.client.id as string;
    const createTransactionResponse = await request(app).post("/api/transactions").send({
      clientId,
      amount: 200000,
      cycleDays: 28,
      drawDate: "2026-04-16",
      dueDate: "2026-05-14",
      note: "PO-4102",
    });

    expect(createTransactionResponse.status).toBe(201);
    expect(createTransactionResponse.body.transaction.clientId).toBe(clientId);
    expect(createTransactionResponse.body.transaction.status).toBe("Active");
  });

  test("updates commercial settings and exposes analytics snapshots", async () => {
    const app = createApp(new MemoryStore(createSeedState("2026-04-16")));

    const updateCommercialResponse = await request(app).put("/api/commercials").send({
      nbfc28: 115,
      nbfc54: 118,
      sourcing: 0.3,
      collection: 0.25,
      charges: [
        {
          label: "Processing Fee",
          value: 0.4,
          type: "%",
          owner: "NBFC",
        },
      ],
    });

    expect(updateCommercialResponse.status).toBe(200);
    expect(updateCommercialResponse.body.commercial.nbfc28).toBe(115);

    const revenueResponse = await request(app).get("/api/analytics/revenue");
    const liquidityResponse = await request(app).get("/api/analytics/liquidity");
    const decisionsResponse = await request(app).get("/api/analytics/decisions");
    const metricsResponse = await request(app).post("/api/analytics/metrics").send({
      receivables: 6000000,
      revenue: 36000000,
      inventory: 3000000,
      cogs: 24000000,
      payables: 2000000,
      limit: 2000000,
      monthlyRevenue: 5000000,
      monthlyInflow: 3500000,
      days: 28,
      nbfcRate: 110,
      matrix: [3, 2, 2, 3, 2, 1],
    });

    expect(revenueResponse.status).toBe(200);
    expect(revenueResponse.body.summary.totalIncome).toBeGreaterThan(0);
    expect(liquidityResponse.status).toBe(200);
    expect(liquidityResponse.body.schedule.length).toBeGreaterThan(0);
    expect(decisionsResponse.status).toBe(200);
    expect(decisionsResponse.body.health.band).toBeDefined();
    expect(metricsResponse.status).toBe(200);
    expect(metricsResponse.body.nbfcSelection.totalScore).toBe(13);
  });
});
