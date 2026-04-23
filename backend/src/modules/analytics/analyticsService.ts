import type {
  CashflowClientSummary,
  CashflowSummary,
  Charge,
  Client,
  ClientSummary,
  CommercialConfig,
  CommercialSource,
  DecisionSnapshot,
  LiquiditySnapshot,
  MetricRequest,
  MetricsSnapshot,
  PortfolioSnapshot,
  PortfolioState,
  ResolvedCommercialConfig,
  Transaction,
  TransactionIncomeBreakdown,
  TransactionSummary,
  Urgency,
} from "../../core/types.js";

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function today(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export function addDays(date: string, days: number): string {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().split("T")[0] ?? "";
}

export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function cloneCharges(charges: Charge[]): Charge[] {
  return charges.map((charge) => ({ ...charge }));
}

function cloneCommercialConfig(config: CommercialConfig): CommercialConfig {
  return {
    ...config,
    charges: cloneCharges(config.charges),
  };
}

export function resolveCommercialConfig(
  client: Client | undefined,
  systemCommercial: CommercialConfig,
): ResolvedCommercialConfig {
  if (client?.commercial.override.enabled && client.commercial.override.config) {
    return {
      source: "override",
      config: cloneCommercialConfig(client.commercial.override.config),
    };
  }

  if (client?.commercial.actual) {
    return {
      source: "actual",
      config: cloneCommercialConfig(client.commercial.actual),
    };
  }

  if (client?.commercial.default) {
    return {
      source: "default",
      config: cloneCommercialConfig(client.commercial.default),
    };
  }

  return {
    source: "system",
    config: cloneCommercialConfig(systemCommercial),
  };
}

export function calculateTransactionIncome(
  transaction: Transaction,
  client: Client | undefined,
  systemCommercial: CommercialConfig,
): TransactionIncomeBreakdown {
  const { source, config } = resolveCommercialConfig(client, systemCommercial);
  const rate = transaction.cycleDays <= 28 ? config.nbfc28 : config.nbfc54;
  const lakhs = transaction.amount / 100000;
  const interest = round(rate * lakhs * transaction.cycleDays);
  const sourcingFee = round((config.sourcing / 100) * transaction.amount);
  const collectionFee = round((config.collection / 100) * transaction.amount);

  let otherNbfcCharges = 0;
  let otherSevenCharges = 0;
  for (const charge of config.charges) {
    const chargeValue =
      charge.type === "%" ? round((charge.value / 100) * transaction.amount) : round(charge.value);
    if (charge.owner === "NBFC") {
      otherNbfcCharges += chargeValue;
    } else {
      otherSevenCharges += chargeValue;
    }
  }

  const nbfcIncome = round(interest + otherNbfcCharges);
  const sevenIncome = round(sourcingFee + collectionFee + otherSevenCharges);

  return {
    interest,
    sourcingFee,
    collectionFee,
    otherNbfcCharges: round(otherNbfcCharges),
    otherSevenCharges: round(otherSevenCharges),
    nbfcIncome,
    sevenIncome,
    totalIncome: round(nbfcIncome + sevenIncome),
    rateSource: source,
  };
}

function getUrgency(daysLeft: number): Urgency {
  if (daysLeft < 0) {
    return "overdue";
  }
  if (daysLeft <= 7) {
    return "due-soon";
  }
  return "upcoming";
}

function summarizeTransactions(
  state: PortfolioState,
  referenceDate: string,
): TransactionSummary[] {
  return state.transactions
    .map((transaction) => {
      const client = state.clients.find((candidate) => candidate.id === transaction.clientId);
      const income = calculateTransactionIncome(transaction, client, state.commercial);
      const daysLeft = daysBetween(referenceDate, transaction.dueDate);
      const drawPct = transaction.approvedLimit > 0 ? round((transaction.amount / transaction.approvedLimit) * 100) : 0;

      return {
        ...transaction,
        drawPct,
        daysLeft,
        income,
        urgency: getUrgency(daysLeft),
      };
    })
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());
}

export function summarizeClients(state: PortfolioState): ClientSummary[] {
  return state.clients.map((client) => {
    const activeTransactions = state.transactions.filter(
      (transaction) => transaction.clientId === client.id && transaction.status === "Active",
    );
    const activeExposure = activeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const utilizationPct = client.limit > 0 ? round((activeExposure / client.limit) * 100) : 0;
    const commercialSource = resolveCommercialConfig(client, state.commercial).source;

    return {
      ...client,
      activeExposure,
      utilizationPct,
      activeDrawCount: activeTransactions.length,
      commercialSource,
    };
  });
}

export function buildPortfolioSnapshot(
  state: PortfolioState,
  referenceDate: string = today(),
): PortfolioSnapshot {
  const transactions = summarizeTransactions(state, referenceDate);
  const activeTransactions = transactions.filter((transaction) => transaction.status === "Active");
  const deployed = activeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const available = Math.max(0, state.capital - deployed);
  const utilizationPct = state.capital > 0 ? round((deployed / state.capital) * 100) : 0;
  const totalDisbursed = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const capitalMultiplier = state.capital > 0 ? round(totalDisbursed / state.capital, 3) : 0;
  const totalNbfcIncome = round(transactions.reduce((sum, transaction) => sum + transaction.income.nbfcIncome, 0));
  const totalSevenIncome = round(transactions.reduce((sum, transaction) => sum + transaction.income.sevenIncome, 0));
  const totalIncome = round(totalNbfcIncome + totalSevenIncome);
  const annualizedYieldPct =
    deployed > 0 ? round(((totalIncome / deployed) * (365 / 30)) * 100, 2) : 0;

  let status: PortfolioSnapshot["status"] = "healthy";
  let statusNote = "Healthy deployment range";
  if (utilizationPct < 20) {
    status = "idle";
    statusNote = "Capital under-utilized";
  } else if (utilizationPct >= 85) {
    status = "high-risk";
    statusNote = "Near full capacity";
  }

  return {
    capital: state.capital,
    capitalLabel: state.capitalLabel,
    deployed,
    available,
    utilizationPct,
    totalDisbursed,
    capitalMultiplier,
    totalIncome,
    totalNbfcIncome,
    totalSevenIncome,
    annualizedYieldPct,
    status,
    statusNote,
    metricCards: [
      {
        label: "Total Capital Pool",
        value: state.capital,
        helper: `${round(state.capital / 100000, 2)} Lakhs`,
      },
      {
        label: "Available Capital",
        value: available,
        helper: `${round(state.capital > 0 ? (available / state.capital) * 100 : 0, 1)}% free`,
        tone: "success",
      },
      {
        label: "Deployed Capital",
        value: deployed,
        helper: `${utilizationPct}% utilized`,
        tone: utilizationPct >= 85 ? "danger" : utilizationPct >= 60 ? "warning" : "neutral",
      },
      {
        label: "Capital Multiplier",
        value: capitalMultiplier,
        helper: `${totalDisbursed} cumulative disbursed`,
      },
    ],
  };
}

export function buildLiquiditySnapshot(
  state: PortfolioState,
  referenceDate: string = today(),
): LiquiditySnapshot {
  const portfolio = buildPortfolioSnapshot(state, referenceDate);
  const activeTransactions = summarizeTransactions(state, referenceDate).filter(
    (transaction) => transaction.status === "Active",
  );

  const next7DaysInflow = activeTransactions
    .filter((transaction) => transaction.daysLeft >= 0 && transaction.daysLeft <= 7)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const next30DaysInflow = activeTransactions
    .filter((transaction) => transaction.daysLeft >= 0 && transaction.daysLeft <= 30)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalFutureInflow = activeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const overdueAmount = activeTransactions
    .filter((transaction) => transaction.daysLeft < 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const beyond30 = totalFutureInflow - next30DaysInflow;

  const riskAssessment: string[] = [];
  if (overdueAmount > 0) {
    riskAssessment.push("At least one repayment is overdue and requires immediate follow-up.");
  }
  if (activeTransactions.some((transaction) => transaction.daysLeft >= 0 && transaction.daysLeft <= 7)) {
    riskAssessment.push("There are repayments due within the next 7 days.");
  }
  if (portfolio.utilizationPct > 85) {
    riskAssessment.push("Capital utilization is above the healthy operating range.");
  }
  if (riskAssessment.length === 0) {
    riskAssessment.push("Liquidity profile is healthy across the next 30 days.");
  }

  const schedule = activeTransactions.map((transaction) => ({
    transactionId: transaction.id,
    clientName: transaction.clientName,
    amount: transaction.amount,
    dueDate: transaction.dueDate,
    daysLeft: transaction.daysLeft,
    urgency: transaction.urgency,
  }));

  return {
    currentAvailable: portfolio.available,
    next7DaysInflow,
    next30DaysInflow,
    totalFutureInflow,
    overdueAmount,
    allocation: {
      deployed: portfolio.deployed,
      available: portfolio.available,
    },
    inflowBuckets: [
      { label: "Overdue", value: overdueAmount },
      { label: "Next 7 Days", value: next7DaysInflow },
      { label: "8-30 Days", value: Math.max(0, next30DaysInflow - next7DaysInflow) },
      { label: "Beyond 30 Days", value: Math.max(0, beyond30) },
    ],
    utilizationPct: portfolio.utilizationPct,
    schedule,
    heatmap: schedule,
    riskAssessment,
  };
}

export function buildCashflowSummary(
  state: PortfolioState,
  referenceDate: string = today(),
): CashflowSummary {
  const activeTransactions = summarizeTransactions(state, referenceDate).filter(
    (transaction) => transaction.status === "Active",
  );
  const totalActiveExposure = activeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  const clientSummaries = state.clients
    .flatMap((client): CashflowClientSummary[] => {
      const clientTransactions = activeTransactions.filter((transaction) => transaction.clientId === client.id);
      if (clientTransactions.length === 0) {
        return [];
      }

      const totalExposure = clientTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      const overdueCount = clientTransactions.filter((transaction) => transaction.daysLeft < 0).length;
      const nearestTransaction = [...clientTransactions].sort(
        (left, right) => left.daysLeft - right.daysLeft,
      )[0];
      const expectedIncome = round(
        clientTransactions.reduce((sum, transaction) => sum + transaction.income.totalIncome, 0),
      );

      return [
        {
          clientId: client.id,
          clientName: client.name,
          totalExposure,
          overdueCount,
          nearestDueDate: nearestTransaction?.dueDate ?? null,
          nearestDaysLeft: nearestTransaction?.daysLeft ?? null,
          expectedIncome,
          shareOfActiveExposure:
            totalActiveExposure > 0 ? round(totalExposure / totalActiveExposure, 3) : 0,
        },
      ];
    })
    .sort((left, right) => {
      const leftDays = left.nearestDaysLeft ?? Number.MAX_SAFE_INTEGER;
      const rightDays = right.nearestDaysLeft ?? Number.MAX_SAFE_INTEGER;
      return leftDays - rightDays;
    });

  const timeline = activeTransactions.map((transaction) => {
    const elapsed = clamp(transaction.cycleDays - Math.max(0, transaction.daysLeft), 0, transaction.cycleDays);
    const elapsedPct = transaction.cycleDays > 0 ? round((elapsed / transaction.cycleDays) * 100, 1) : 0;

    return {
      transactionId: transaction.id,
      clientName: transaction.clientName,
      amount: transaction.amount,
      dueDate: transaction.dueDate,
      daysLeft: transaction.daysLeft,
      urgency: transaction.urgency,
      drawDate: transaction.drawDate,
      elapsedPct,
      note: transaction.note,
    };
  });

  return {
    clients: clientSummaries,
    timeline,
  };
}

function largestClientExposureShare(cashflow: CashflowSummary): number {
  if (cashflow.clients.length === 0) {
    return 0;
  }
  return Math.max(...cashflow.clients.map((client) => client.shareOfActiveExposure));
}

export function buildDecisionSnapshot(
  state: PortfolioState,
  referenceDate: string = today(),
): DecisionSnapshot {
  const portfolio = buildPortfolioSnapshot(state, referenceDate);
  const cashflow = buildCashflowSummary(state, referenceDate);
  const overdueCount = cashflow.timeline.filter((transaction) => transaction.daysLeft < 0).length;

  let score = 50;
  if (portfolio.utilizationPct >= 60 && portfolio.utilizationPct <= 85) {
    score += 20;
  }
  if (portfolio.utilizationPct > 85) {
    score -= 10;
  }
  if (portfolio.utilizationPct < 20) {
    score -= 15;
  }
  if (portfolio.capitalMultiplier >= 2) {
    score += 15;
  }
  if (overdueCount === 0) {
    score += 10;
  } else {
    score -= overdueCount * 8;
  }
  if (state.clients.length >= 3) {
    score += 5;
  }

  const normalizedScore = clamp(score, 0, 100);
  const band = normalizedScore >= 75 ? "healthy" : normalizedScore >= 50 ? "moderate" : "at-risk";

  const insights: string[] = [];
  if (state.transactions.length === 0) {
    insights.push("No transactions have been recorded yet.");
  }
  if (portfolio.utilizationPct < 20) {
    insights.push("The capital pool is significantly under-utilized.");
  }
  if (portfolio.utilizationPct >= 60 && portfolio.utilizationPct <= 85) {
    insights.push("Deployment is within the healthy operating range.");
  }
  if (portfolio.utilizationPct > 90) {
    insights.push("Capital capacity is almost fully consumed.");
  }
  if (portfolio.capitalMultiplier >= 3) {
    insights.push("Capital rotation is excellent for the current pool size.");
  } else if (portfolio.capitalMultiplier > 0) {
    insights.push(`Current capital multiplier is ${portfolio.capitalMultiplier.toFixed(2)}x.`);
  }
  if (overdueCount > 0) {
    insights.push("Overdue repayments are putting portfolio health at risk.");
  }
  if (largestClientExposureShare(cashflow) > 0.5) {
    insights.push("More than half of deployed capital is concentrated in one client.");
  }

  const flags: string[] = [];
  if (overdueCount > 0) {
    flags.push(`${overdueCount} active repayment is overdue.`);
  }
  if (portfolio.utilizationPct > 95) {
    flags.push("Capital is effectively exhausted.");
  }
  if (flags.length === 0) {
    flags.push("No critical portfolio risk flags are active.");
  }

  return {
    health: {
      score: normalizedScore,
      band,
    },
    insights,
    flags,
  };
}

export function calculateMetricsSnapshot(input: MetricRequest): MetricsSnapshot {
  const debtorDays = input.revenue > 0 ? (input.receivables / input.revenue) * 365 : 0;
  const inventoryDays = input.cogs > 0 ? (input.inventory / input.cogs) * 365 : 0;
  const creditorDays = input.cogs > 0 ? (input.payables / input.cogs) * 365 : 0;
  const wccValue = debtorDays + inventoryDays - creditorDays;
  let wccVerdict: MetricsSnapshot["wcc"]["verdict"] = "financing-likely-unnecessary";
  if (wccValue >= 15 && wccValue <= 35) {
    wccVerdict = "fit-28-day-cycle";
  } else if (wccValue > 35 && wccValue <= 60) {
    wccVerdict = "fit-54-day-cycle";
  } else if (wccValue > 60) {
    wccVerdict = "custom-terms-required";
  }

  const lsrValue = input.monthlyRevenue > 0 ? input.limit / input.monthlyRevenue : 0;
  let lsrVerdict: MetricsSnapshot["lsr"]["verdict"] = "undersized";
  if (lsrValue >= 0.25 && lsrValue <= 0.75) {
    lsrVerdict = "well-sized";
  } else if (lsrValue > 0.75) {
    lsrVerdict = "oversized";
  }

  const maxRepayment = input.limit + input.nbfcRate * (input.limit / 100000) * input.days;
  const rcsValue = maxRepayment > 0 ? input.monthlyInflow / maxRepayment : 0;
  let rcsVerdict: MetricsSnapshot["rcs"]["verdict"] = "fail";
  if (rcsValue >= 1.5) {
    rcsVerdict = "pass";
  } else if (rcsValue >= 1) {
    rcsVerdict = "caution";
  }

  const totalScore = input.matrix.reduce((sum, score) => sum + score, 0);
  let nbfcVerdict: MetricsSnapshot["nbfcSelection"]["verdict"] = "poor-match";
  if (totalScore >= 11) {
    nbfcVerdict = "excellent-match";
  } else if (totalScore >= 8) {
    nbfcVerdict = "good-match";
  } else if (totalScore >= 5) {
    nbfcVerdict = "moderate-match";
  }

  return {
    wcc: {
      value: round(wccValue, 2),
      debtorDays: round(debtorDays, 2),
      inventoryDays: round(inventoryDays, 2),
      creditorDays: round(creditorDays, 2),
      verdict: wccVerdict,
    },
    lsr: {
      value: round(lsrValue, 2),
      verdict: lsrVerdict,
      recommendedMin: round(input.monthlyRevenue * 0.6),
      recommendedMax: round(input.monthlyRevenue * 0.75),
    },
    rcs: {
      maxRepayment: round(maxRepayment, 2),
      value: round(rcsValue, 2),
      verdict: rcsVerdict,
    },
    nbfcSelection: {
      totalScore,
      verdict: nbfcVerdict,
    },
  };
}

export function buildRevenueBreakdown(
  state: PortfolioState,
  referenceDate: string = today(),
): TransactionSummary[] {
  return summarizeTransactions(state, referenceDate);
}
