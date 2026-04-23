import type {
  Charge,
  ClientStatus,
  CommercialConfig,
  DashboardData,
  DashboardResponse,
  MetricsFormValues,
  MetricsSnapshot,
  RevenueSummary,
  TransactionStatus,
} from "./types";

const API_BASE = "/api";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({ message: "Request failed." }))) as {
      message?: string;
    };
    throw new Error(errorBody.message ?? "Request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [dashboard, revenue, liquidity, cashflow, decisions] = await Promise.all([
    requestJson<DashboardResponse>("/dashboard"),
    requestJson<{ summary: RevenueSummary; transactions: DashboardResponse["transactions"] }>(
      "/analytics/revenue",
    ),
    requestJson<DashboardData["liquidity"]>("/analytics/liquidity"),
    requestJson<DashboardData["cashflow"]>("/analytics/cashflow"),
    requestJson<DashboardData["decisions"]>("/analytics/decisions"),
  ]);

  return {
    dashboard,
    revenue,
    liquidity,
    cashflow,
    decisions,
  };
}

export function createClient(payload: {
  name: string;
  product: string;
  limit: number;
  industry: string;
  status: ClientStatus;
  actualCommercial?: Partial<CommercialConfig> | null;
  overrideCommercial?: Partial<CommercialConfig> | null;
  overrideEnabled?: boolean;
}) {
  return requestJson<{ client: unknown }>("/clients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteClient(clientId: string) {
  return requestJson<void>(`/clients/${clientId}`, {
    method: "DELETE",
  });
}

export function createTransaction(payload: {
  clientId: string;
  amount: number;
  cycleDays: number;
  drawDate: string;
  dueDate: string;
  note: string;
}) {
  return requestJson<{ transaction: unknown }>("/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTransactionStatus(transactionId: string, status: TransactionStatus) {
  return requestJson<{ transaction: unknown }>(`/transactions/${transactionId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteTransaction(transactionId: string) {
  return requestJson<void>(`/transactions/${transactionId}`, {
    method: "DELETE",
  });
}

export function updateCommercials(payload: CommercialConfig) {
  return requestJson<{ commercial: CommercialConfig }>("/commercials", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function calculateMetrics(payload: MetricsFormValues): Promise<MetricsSnapshot> {
  return requestJson<MetricsSnapshot>("/analytics/metrics", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createEmptyCharge(): Charge {
  return {
    label: "",
    value: 0,
    type: "%",
    owner: "NBFC",
  };
}
