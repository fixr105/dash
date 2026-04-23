import { describe, expect, test } from "vitest";

import {
  buildCashflowSummary,
  buildDecisionSnapshot,
  buildLiquiditySnapshot,
  buildPortfolioSnapshot,
  calculateMetricsSnapshot,
  calculateTransactionIncome,
  resolveCommercialConfig,
} from "../../src/modules/analytics/analyticsService.js";
import type {
  Charge,
  Client,
  CommercialConfig,
  PortfolioState,
  Transaction,
} from "../../src/core/types.js";

const systemCommercial: CommercialConfig = {
  nbfc28: 110,
  nbfc54: 110,
  sourcing: 0.25,
  collection: 0.25,
  charges: [
    { label: "Processing Fee", value: 0.35, type: "%", owner: "NBFC" },
    { label: "Penal Charges", value: 500, type: "flat", owner: "Seven" },
  ],
};

const actualCommercial: CommercialConfig = {
  nbfc28: 105,
  nbfc54: 108,
  sourcing: 0.2,
  collection: 0.25,
  charges: [
    { label: "Actual Fee", value: 0.2, type: "%", owner: "Seven" },
  ],
};

const overrideCommercial: CommercialConfig = {
  nbfc28: 100,
  nbfc54: 103,
  sourcing: 0.1,
  collection: 0.15,
  charges: [
    { label: "Override Charge", value: 750, type: "flat", owner: "NBFC" },
  ],
};

function createClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "client-1",
    name: "Arjun Packaging Pvt Ltd",
    product: "Revolving Credit Line",
    limit: 2_000_000,
    industry: "Industrial Packaging",
    status: "Active",
    commercial: {
      default: systemCommercial,
      actual: actualCommercial,
      override: {
        enabled: false,
        config: null,
      },
    },
    ...overrides,
  };
}

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1",
    clientId: "client-1",
    clientName: "Arjun Packaging Pvt Ltd",
    product: "Revolving Credit Line",
    amount: 400_000,
    approvedLimit: 2_000_000,
    cycleDays: 28,
    drawDate: "2026-04-06",
    dueDate: "2026-04-23",
    note: "Invoice #AP-1041",
    status: "Active",
    ...overrides,
  };
}

function createState(): PortfolioState {
  const clientOne = createClient({
    id: "client-1",
    name: "Arjun Packaging Pvt Ltd",
    commercial: {
      default: systemCommercial,
      actual: actualCommercial,
      override: { enabled: false, config: null },
    },
  });
  const clientTwo = createClient({
    id: "client-2",
    name: "Chemex Distributions LLP",
    product: "Bill Discounting",
    limit: 1_500_000,
    commercial: {
      default: systemCommercial,
      actual: null,
      override: { enabled: false, config: null },
    },
  });
  const clientThree = createClient({
    id: "client-3",
    name: "Metro Food Ingredients",
    product: "Raw Material Purchase",
    limit: 1_000_000,
    industry: "Food Ingredients (B2B)",
    commercial: {
      default: systemCommercial,
      actual: {
        ...systemCommercial,
        sourcing: 0.3,
        collection: 0.3,
      },
      override: { enabled: false, config: null },
    },
  });

  return {
    capital: 10_000_000,
    capitalLabel: "Seed Capital – Round 1",
    commercial: systemCommercial,
    nbfcMatrix: [3, 2, 2, 3, 2, 1],
    clients: [clientOne, clientTwo, clientThree],
    transactions: [
      createTransaction(),
      createTransaction({
        id: "txn-2",
        clientId: "client-2",
        clientName: "Chemex Distributions LLP",
        product: "Bill Discounting",
        amount: 300_000,
        approvedLimit: 1_500_000,
        cycleDays: 54,
        drawDate: "2026-03-27",
        dueDate: "2026-04-30",
        note: "Buyer: JSW Paints",
      }),
      createTransaction({
        id: "txn-3",
        clientId: "client-3",
        clientName: "Metro Food Ingredients",
        product: "Raw Material Purchase",
        amount: 200_000,
        approvedLimit: 1_000_000,
        cycleDays: 28,
        drawDate: "2026-03-17",
        dueDate: "2026-04-14",
        note: "Supplier: ABC Oils",
      }),
      createTransaction({
        id: "txn-4",
        amount: 350_000,
        drawDate: "2026-02-26",
        dueDate: "2026-03-26",
        note: "Invoice #AP-1022",
        status: "Repaid",
      }),
    ],
  };
}

describe("commercial resolution", () => {
  test("prefers override over actual and default terms", () => {
    const client = createClient({
      commercial: {
        default: systemCommercial,
        actual: actualCommercial,
        override: {
          enabled: true,
          config: overrideCommercial,
        },
      },
    });

    const resolved = resolveCommercialConfig(client, systemCommercial);

    expect(resolved.source).toBe("override");
    expect(resolved.config.nbfc28).toBe(100);
    expect(resolved.config.charges).toEqual(overrideCommercial.charges);
  });

  test("falls back to system commercials when a client has no overrides", () => {
    const client = createClient({
      commercial: {
        default: systemCommercial,
        actual: null,
        override: {
          enabled: false,
          config: null,
        },
      },
    });

    const resolved = resolveCommercialConfig(client, systemCommercial);

    expect(resolved.source).toBe("default");
    expect(resolved.config.nbfc54).toBe(110);
  });
});

describe("income and analytics", () => {
  test("calculates transaction income with charge ownership preserved", () => {
    const transaction = createTransaction();
    const client = createClient();

    const income = calculateTransactionIncome(transaction, client, systemCommercial);

    expect(income.interest).toBe(11_760);
    expect(income.sourcingFee).toBe(800);
    expect(income.collectionFee).toBe(1_000);
    expect(income.otherSevenCharges).toBe(800);
    expect(income.nbfcIncome).toBe(11_760);
    expect(income.sevenIncome).toBe(2_600);
    expect(income.totalIncome).toBe(14_360);
    expect(income.rateSource).toBe("actual");
  });

  test("builds the portfolio, liquidity, cashflow, decision, and metric snapshots", () => {
    const state = createState();

    const portfolio = buildPortfolioSnapshot(state, "2026-04-16");
    const liquidity = buildLiquiditySnapshot(state, "2026-04-16");
    const cashflow = buildCashflowSummary(state, "2026-04-16");
    const decisions = buildDecisionSnapshot(state, "2026-04-16");
    const metrics = calculateMetricsSnapshot({
      receivables: 6_000_000,
      revenue: 36_000_000,
      inventory: 3_000_000,
      cogs: 24_000_000,
      payables: 2_000_000,
      limit: 2_000_000,
      monthlyRevenue: 5_000_000,
      monthlyInflow: 3_500_000,
      days: 28,
      nbfcRate: 110,
      matrix: [3, 2, 2, 3, 2, 1],
    });

    expect(portfolio.deployed).toBe(900_000);
    expect(portfolio.available).toBe(9_100_000);
    expect(portfolio.utilizationPct).toBe(9);
    expect(portfolio.totalDisbursed).toBe(1_250_000);
    expect(portfolio.capitalMultiplier).toBe(0.125);
    expect(portfolio.status).toBe("idle");
    expect(liquidity.next7DaysInflow).toBe(400_000);
    expect(liquidity.next30DaysInflow).toBe(700_000);
    expect(liquidity.overdueAmount).toBe(200_000);
    expect(cashflow.clients[0].clientName).toBe("Metro Food Ingredients");
    expect(cashflow.timeline[0].urgency).toBe("overdue");
    expect(decisions.health.band).toBe("at-risk");
    expect(decisions.flags).toContain("1 active repayment is overdue.");
    expect(metrics.wcc.value).toBeCloseTo(76.04, 2);
    expect(metrics.lsr.verdict).toBe("well-sized");
    expect(metrics.rcs.verdict).toBe("pass");
    expect(metrics.nbfcSelection.verdict).toBe("excellent-match");
  });
});
