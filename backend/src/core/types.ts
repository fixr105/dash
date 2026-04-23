export type ChargeOwner = "NBFC" | "Seven";
export type ChargeType = "%" | "flat";
export type CommercialSource = "system" | "default" | "actual" | "override";
export type ClientStatus = "Active" | "On Hold" | "Inactive";
export type TransactionStatus = "Active" | "Repaid";
export type PortfolioStatus = "idle" | "healthy" | "high-risk";
export type Urgency = "overdue" | "due-soon" | "upcoming";
export type HealthBand = "healthy" | "moderate" | "at-risk";
export type WccVerdict =
  | "financing-likely-unnecessary"
  | "fit-28-day-cycle"
  | "fit-54-day-cycle"
  | "custom-terms-required";
export type LsrVerdict = "undersized" | "well-sized" | "oversized";
export type RcsVerdict = "pass" | "caution" | "fail";
export type NbfcVerdict =
  | "excellent-match"
  | "good-match"
  | "moderate-match"
  | "poor-match";

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

export interface ClientCommercialTerms {
  default: CommercialConfig;
  actual: CommercialConfig | null;
  override: {
    enabled: boolean;
    config: CommercialConfig | null;
  };
}

export interface Client {
  id: string;
  name: string;
  product: string;
  limit: number;
  industry: string;
  status: ClientStatus;
  commercial: ClientCommercialTerms;
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
}

export interface PortfolioState {
  capital: number;
  capitalLabel: string;
  clients: Client[];
  transactions: Transaction[];
  commercial: CommercialConfig;
  nbfcMatrix: number[];
}

export interface ResolvedCommercialConfig {
  source: CommercialSource;
  config: CommercialConfig;
}

export interface TransactionIncomeBreakdown {
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

export interface DashboardMetricCard {
  label: string;
  value: number;
  helper: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}

export interface ClientSummary extends Client {
  activeExposure: number;
  utilizationPct: number;
  activeDrawCount: number;
  commercialSource: CommercialSource;
}

export interface TransactionSummary extends Transaction {
  drawPct: number;
  daysLeft: number;
  income: TransactionIncomeBreakdown;
  urgency: Urgency;
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
  status: PortfolioStatus;
  statusNote: string;
  metricCards: DashboardMetricCard[];
}

export interface LiquidityBucket {
  label: string;
  value: number;
}

export interface RepaymentScheduleItem {
  transactionId: string;
  clientName: string;
  amount: number;
  dueDate: string;
  daysLeft: number;
  urgency: Urgency;
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
  inflowBuckets: LiquidityBucket[];
  utilizationPct: number;
  schedule: RepaymentScheduleItem[];
  heatmap: RepaymentScheduleItem[];
  riskAssessment: string[];
}

export interface CashflowClientSummary {
  clientId: string;
  clientName: string;
  totalExposure: number;
  overdueCount: number;
  nearestDueDate: string | null;
  nearestDaysLeft: number | null;
  expectedIncome: number;
  shareOfActiveExposure: number;
}

export interface CashflowTimelineItem extends RepaymentScheduleItem {
  drawDate: string;
  elapsedPct: number;
  note: string;
}

export interface CashflowSummary {
  clients: CashflowClientSummary[];
  timeline: CashflowTimelineItem[];
}

export interface DecisionSnapshot {
  health: {
    score: number;
    band: HealthBand;
  };
  insights: string[];
  flags: string[];
}

export interface MetricRequest {
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
    verdict: WccVerdict;
  };
  lsr: {
    value: number;
    verdict: LsrVerdict;
    recommendedMin: number;
    recommendedMax: number;
  };
  rcs: {
    maxRepayment: number;
    value: number;
    verdict: RcsVerdict;
  };
  nbfcSelection: {
    totalScore: number;
    verdict: NbfcVerdict;
  };
}

export interface DashboardResponse {
  portfolio: PortfolioSnapshot;
  clients: ClientSummary[];
  transactions: TransactionSummary[];
  commercial: CommercialConfig;
}
