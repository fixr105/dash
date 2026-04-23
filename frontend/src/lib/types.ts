export type ChargeOwner = "NBFC" | "Seven";
export type ChargeType = "%" | "flat";
export type CommercialSource = "system" | "default" | "actual" | "override";
export type ClientStatus = "Active" | "On Hold" | "Inactive";
export type TransactionStatus = "Active" | "Repaid";
export type ThemeName = "classic" | "dark" | "beige";

export interface Charge {
  label: string;
  value: number;
  type: ChargeType;
  owner: ChargeOwner;
}

export interface CommercialConfig {
  nbfc28: number;
  nbfc54: number;
  sourcing: number;
  collection: number;
  charges: Charge[];
}

export interface Client {
  id: string;
  name: string;
  product: string;
  limit: number;
  industry: string;
  status: ClientStatus;
  activeExposure: number;
  utilizationPct: number;
  activeDrawCount: number;
  commercialSource: CommercialSource;
}

export interface TransactionIncome {
  interest: number;
  sourcingFee: number;
  collectionFee: number;
  otherNbfcCharges: number;
  otherSevenCharges: number;
  nbfcIncome: number;
  sevenIncome: number;
  totalIncome: number;
  rateSource: CommercialSource;
}

export interface Transaction {
  id: string;
  clientId: string;
  clientName: string;
  product: string;
  amount: number;
  approvedLimit: number;
  cycleDays: number;
  drawDate: string;
  dueDate: string;
  note: string;
  status: TransactionStatus;
  drawPct: number;
  daysLeft: number;
  urgency: "overdue" | "due-soon" | "upcoming";
  income: TransactionIncome;
}

export interface PortfolioSnapshot {
  capital: number;
  capitalLabel: string;
  deployed: number;
  available: number;
  utilizationPct: number;
  totalDisbursed: number;
  capitalMultiplier: number;
  totalIncome: number;
  totalNbfcIncome: number;
  totalSevenIncome: number;
  annualizedYieldPct: number;
  status: "idle" | "healthy" | "high-risk";
  statusNote: string;
}

export interface RevenueSummary {
  totalIncome: number;
  totalNbfcIncome: number;
  totalSevenIncome: number;
  annualizedYieldPct: number;
}

export interface LiquiditySnapshot {
  currentAvailable: number;
  next7DaysInflow: number;
  next30DaysInflow: number;
  totalFutureInflow: number;
  overdueAmount: number;
  allocation: {
    deployed: number;
    available: number;
  };
  inflowBuckets: Array<{ label: string; value: number }>;
  utilizationPct: number;
  schedule: Array<{
    transactionId: string;
    clientName: string;
    amount: number;
    dueDate: string;
    daysLeft: number;
    urgency: "overdue" | "due-soon" | "upcoming";
  }>;
  heatmap: Array<{
    transactionId: string;
    clientName: string;
    amount: number;
    dueDate: string;
    daysLeft: number;
    urgency: "overdue" | "due-soon" | "upcoming";
  }>;
  riskAssessment: string[];
}

export interface CashflowSummary {
  clients: Array<{
    clientId: string;
    clientName: string;
    totalExposure: number;
    overdueCount: number;
    nearestDueDate: string | null;
    nearestDaysLeft: number | null;
    expectedIncome: number;
    shareOfActiveExposure: number;
  }>;
  timeline: Array<{
    transactionId: string;
    clientName: string;
    amount: number;
    dueDate: string;
    daysLeft: number;
    urgency: "overdue" | "due-soon" | "upcoming";
    drawDate: string;
    elapsedPct: number;
    note: string;
  }>;
}

export interface DecisionSnapshot {
  health: {
    score: number;
    band: "healthy" | "moderate" | "at-risk";
  };
  insights: string[];
  flags: string[];
}

export interface MetricsFormValues {
  receivables: number;
  revenue: number;
  inventory: number;
  cogs: number;
  payables: number;
  limit: number;
  monthlyRevenue: number;
  monthlyInflow: number;
  days: number;
  nbfcRate: number;
  matrix: number[];
}

export interface MetricsSnapshot {
  wcc: {
    value: number;
    debtorDays: number;
    inventoryDays: number;
    creditorDays: number;
    verdict: string;
  };
  lsr: {
    value: number;
    verdict: string;
    recommendedMin: number;
    recommendedMax: number;
  };
  rcs: {
    maxRepayment: number;
    value: number;
    verdict: string;
  };
  nbfcSelection: {
    totalScore: number;
    verdict: string;
  };
}

export interface DashboardResponse {
  portfolio: PortfolioSnapshot;
  clients: Client[];
  transactions: Transaction[];
  commercial: CommercialConfig;
}

export interface DashboardData {
  dashboard: DashboardResponse | null;
  revenue: {
    summary: RevenueSummary;
    transactions: Transaction[];
  } | null;
  liquidity: LiquiditySnapshot | null;
  cashflow: CashflowSummary | null;
  decisions: DecisionSnapshot | null;
}
