import cors from "cors";
import express from "express";
import { z } from "zod";

import { attachRequestContext } from "./core/auth/requestContext.js";
import { getConfig } from "./core/config/env.js";
import { MemoryStore } from "./core/repositories/memoryStore.js";
import type { ChargeType, ClientStatus, TransactionStatus } from "./core/types.js";
import {
  buildCashflowSummary,
  buildDecisionSnapshot,
  buildLiquiditySnapshot,
  buildPortfolioSnapshot,
  buildRevenueBreakdown,
  calculateMetricsSnapshot,
  summarizeClients,
} from "./modules/analytics/analyticsService.js";

const chargeSchema = z.object({
  label: z.string().min(1),
  value: z.number().nonnegative(),
  type: z.enum(["%", "flat"] satisfies [ChargeType, ChargeType]),
  owner: z.enum(["NBFC", "Seven"]),
});

const commercialConfigSchema = z.object({
  nbfc28: z.number().nonnegative(),
  nbfc54: z.number().nonnegative(),
  sourcing: z.number().nonnegative(),
  collection: z.number().nonnegative(),
  charges: z.array(chargeSchema),
});

const clientPayloadSchema = z.object({
  name: z.string().min(1),
  product: z.string().min(1),
  limit: z.number().positive(),
  industry: z.string().min(1),
  status: z.enum(["Active", "On Hold", "Inactive"] satisfies [ClientStatus, ClientStatus, ClientStatus]),
  actualCommercial: commercialConfigSchema.partial().nullable().optional(),
  overrideCommercial: commercialConfigSchema.partial().nullable().optional(),
  overrideEnabled: z.boolean().optional(),
});

const transactionPayloadSchema = z.object({
  clientId: z.string().min(1),
  amount: z.number().positive(),
  cycleDays: z.number().positive(),
  drawDate: z.string().min(1),
  dueDate: z.string().min(1),
  note: z.string().default(""),
});

const statusPayloadSchema = z.object({
  status: z.enum(["Active", "Repaid"] satisfies [TransactionStatus, TransactionStatus]),
});

const metricsPayloadSchema = z.object({
  receivables: z.number().nonnegative(),
  revenue: z.number().nonnegative(),
  inventory: z.number().nonnegative(),
  cogs: z.number().nonnegative(),
  payables: z.number().nonnegative(),
  limit: z.number().nonnegative(),
  monthlyRevenue: z.number().nonnegative(),
  monthlyInflow: z.number().nonnegative(),
  days: z.number().positive(),
  nbfcRate: z.number().nonnegative(),
  matrix: z.array(z.number()).length(6),
});

export function createApp(store: MemoryStore = new MemoryStore()) {
  const app = express();
  const config = getConfig();

  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json());
  app.use(attachRequestContext);

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/api/dashboard", (_request, response) => {
    const state = store.getState();
    response.json({
      portfolio: buildPortfolioSnapshot(state),
      clients: summarizeClients(state),
      transactions: buildRevenueBreakdown(state),
      commercial: state.commercial,
    });
  });

  app.get("/api/clients", (_request, response) => {
    response.json({ clients: summarizeClients(store.getState()) });
  });

  app.post("/api/clients", (request, response) => {
    const payload = clientPayloadSchema.parse(request.body);
    const client = store.createClient(payload);
    response.status(201).json({ client });
  });

  app.delete("/api/clients/:clientId", (request, response) => {
    store.deleteClient(request.params.clientId);
    response.status(204).send();
  });

  app.get("/api/transactions", (_request, response) => {
    response.json({ transactions: buildRevenueBreakdown(store.getState()) });
  });

  app.post("/api/transactions", (request, response) => {
    const payload = transactionPayloadSchema.parse(request.body);
    const transaction = store.createTransaction(payload);
    response.status(201).json({ transaction });
  });

  app.patch("/api/transactions/:transactionId/status", (request, response) => {
    const payload = statusPayloadSchema.parse(request.body);
    const transaction = store.updateTransactionStatus(request.params.transactionId, payload.status);
    response.json({ transaction });
  });

  app.delete("/api/transactions/:transactionId", (request, response) => {
    store.deleteTransaction(request.params.transactionId);
    response.status(204).send();
  });

  app.get("/api/commercials", (_request, response) => {
    response.json({ commercial: store.getState().commercial });
  });

  app.put("/api/commercials", (request, response) => {
    const payload = commercialConfigSchema.parse(request.body);
    const commercial = store.updateCommercials(payload);
    response.json({ commercial });
  });

  app.get("/api/analytics/revenue", (_request, response) => {
    const state = store.getState();
    const transactions = buildRevenueBreakdown(state);
    const portfolio = buildPortfolioSnapshot(state);
    response.json({
      summary: {
        totalIncome: portfolio.totalIncome,
        totalNbfcIncome: portfolio.totalNbfcIncome,
        totalSevenIncome: portfolio.totalSevenIncome,
        annualizedYieldPct: portfolio.annualizedYieldPct,
      },
      transactions,
    });
  });

  app.get("/api/analytics/liquidity", (_request, response) => {
    response.json(buildLiquiditySnapshot(store.getState()));
  });

  app.get("/api/analytics/cashflow", (_request, response) => {
    response.json(buildCashflowSummary(store.getState()));
  });

  app.get("/api/analytics/decisions", (_request, response) => {
    response.json(buildDecisionSnapshot(store.getState()));
  });

  app.post("/api/analytics/metrics", (request, response) => {
    const payload = metricsPayloadSchema.parse(request.body);
    response.json(calculateMetricsSnapshot(payload));
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof z.ZodError) {
      response.status(400).json({
        message: "Validation failed.",
        issues: error.issues,
      });
      return;
    }

    if (error instanceof Error) {
      response.status(400).json({ message: error.message });
      return;
    }

    response.status(500).json({ message: "Unexpected server error." });
  });

  return app;
}
