import type { Charge, Client, CommercialConfig, PortfolioState, Transaction } from "../core/types.js";

function cloneCharges(charges: Charge[]): Charge[] {
  return charges.map((charge) => ({ ...charge }));
}

function cloneCommercialConfig(config: CommercialConfig): CommercialConfig {
  return {
    ...config,
    charges: cloneCharges(config.charges),
  };
}

function addDays(date: string, days: number): string {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().split("T")[0] ?? "";
}

export function createSeedState(referenceDate: string = "2026-04-16"): PortfolioState {
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

  const buildClientCommercial = (actualOverrides?: Partial<CommercialConfig>) => {
    const defaultConfig = cloneCommercialConfig(systemCommercial);
    const actualConfig = actualOverrides
      ? {
          ...cloneCommercialConfig(systemCommercial),
          ...actualOverrides,
          charges: actualOverrides.charges
            ? cloneCharges(actualOverrides.charges)
            : cloneCharges(systemCommercial.charges),
        }
      : null;

    return {
      default: defaultConfig,
      actual: actualConfig,
      override: {
        enabled: false,
        config: null,
      },
    };
  };

  const clients: Client[] = [
    {
      id: "client-1",
      name: "Arjun Packaging Pvt Ltd",
      product: "Revolving Credit Line",
      limit: 2_000_000,
      industry: "Industrial Packaging",
      status: "Active",
      commercial: buildClientCommercial({ nbfc28: 105, nbfc54: 108, sourcing: 0.2 }),
    },
    {
      id: "client-2",
      name: "Chemex Distributions LLP",
      product: "Bill Discounting",
      limit: 1_500_000,
      industry: "Specialty Chemicals",
      status: "Active",
      commercial: buildClientCommercial(),
    },
    {
      id: "client-3",
      name: "Metro Food Ingredients",
      product: "Raw Material Purchase",
      limit: 1_000_000,
      industry: "Food Ingredients (B2B)",
      status: "Active",
      commercial: buildClientCommercial({ sourcing: 0.3, collection: 0.3 }),
    },
  ];

  const transactions: Transaction[] = [
    {
      id: "txn-1",
      clientId: "client-1",
      clientName: "Arjun Packaging Pvt Ltd",
      product: "Revolving Credit Line",
      amount: 400_000,
      approvedLimit: 2_000_000,
      cycleDays: 28,
      drawDate: addDays(referenceDate, -10),
      dueDate: addDays(referenceDate, 8),
      note: "Invoice #AP-1041",
      status: "Active",
    },
    {
      id: "txn-2",
      clientId: "client-2",
      clientName: "Chemex Distributions LLP",
      product: "Bill Discounting",
      amount: 300_000,
      approvedLimit: 1_500_000,
      cycleDays: 54,
      drawDate: addDays(referenceDate, -20),
      dueDate: addDays(referenceDate, 14),
      note: "Buyer: JSW Paints",
      status: "Active",
    },
    {
      id: "txn-3",
      clientId: "client-3",
      clientName: "Metro Food Ingredients",
      product: "Raw Material Purchase",
      amount: 200_000,
      approvedLimit: 1_000_000,
      cycleDays: 28,
      drawDate: addDays(referenceDate, -30),
      dueDate: addDays(referenceDate, -2),
      note: "Supplier: ABC Oils",
      status: "Active",
    },
    {
      id: "txn-4",
      clientId: "client-1",
      clientName: "Arjun Packaging Pvt Ltd",
      product: "Revolving Credit Line",
      amount: 350_000,
      approvedLimit: 2_000_000,
      cycleDays: 28,
      drawDate: addDays(referenceDate, -50),
      dueDate: addDays(referenceDate, -22),
      note: "Invoice #AP-1022",
      status: "Repaid",
    },
  ];

  return {
    capital: 10_000_000,
    capitalLabel: "Seed Capital – Round 1",
    commercial: systemCommercial,
    nbfcMatrix: [3, 2, 2, 3, 2, 1],
    clients,
    transactions,
  };
}
