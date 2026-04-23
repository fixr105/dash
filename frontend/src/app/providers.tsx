import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  calculateMetrics,
  createClient,
  createTransaction,
  deleteClient,
  deleteTransaction,
  fetchDashboardData,
  updateCommercials,
  updateTransactionStatus,
} from "../lib/api";
import type {
  CommercialConfig,
  DashboardData,
  MetricsFormValues,
  MetricsSnapshot,
  ThemeName,
  TransactionStatus,
} from "../lib/types";

interface DashboardContextValue {
  data: DashboardData;
  loading: boolean;
  error: string | null;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  refresh: () => Promise<void>;
  createClient: typeof createClient;
  deleteClient: (clientId: string) => Promise<void>;
  createTransaction: typeof createTransaction;
  updateTransactionStatus: (transactionId: string, status: TransactionStatus) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  updateCommercials: (payload: CommercialConfig) => Promise<void>;
  calculateMetrics: (payload: MetricsFormValues) => Promise<MetricsSnapshot>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

const initialData: DashboardData = {
  dashboard: null,
  revenue: null,
  liquidity: null,
  cashflow: null,
  decisions: null,
};

export function AppProviders({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeName>("classic");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextData = await fetchDashboardData();
      setData(nextData);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to load dashboard data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo<DashboardContextValue>(
    () => ({
      data,
      loading,
      error,
      theme,
      setTheme,
      refresh,
      createClient,
      deleteClient: async (clientId) => {
        await deleteClient(clientId);
        await refresh();
      },
      createTransaction,
      updateTransactionStatus: async (transactionId, status) => {
        await updateTransactionStatus(transactionId, status);
        await refresh();
      },
      deleteTransaction: async (transactionId) => {
        await deleteTransaction(transactionId);
        await refresh();
      },
      updateCommercials: async (payload) => {
        await updateCommercials(payload);
        await refresh();
      },
      calculateMetrics,
    }),
    [data, error, loading, refresh, theme],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("Dashboard context is unavailable.");
  }
  return context;
}
