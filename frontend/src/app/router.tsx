import { Navigate, createBrowserRouter } from "react-router-dom";

import { LoginPage } from "../auth/LoginPage";
import { RequireAuth } from "../auth/RequireAuth";
import { AppShell } from "./layout/AppShell";
import { AppProviders } from "./providers";
import { CashflowPage } from "../features/analytics/CashflowPage";
import { DecisionsPage } from "../features/analytics/DecisionsPage";
import { LiquidityPage } from "../features/analytics/LiquidityPage";
import { MetricsPage } from "../features/analytics/MetricsPage";
import { RevenuePage } from "../features/analytics/RevenuePage";
import { CommercialsPage } from "../features/commercials/CommercialsPage";
import { ClientsPage } from "../features/clients/ClientsPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { TransactionsPage } from "../features/transactions/TransactionsPage";

function ProtectedLayout() {
  return (
    <RequireAuth>
      <AppProviders>
        <AppShell />
      </AppProviders>
    </RequireAuth>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate replace to="/dashboard" /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "clients", element: <ClientsPage /> },
      { path: "transactions", element: <TransactionsPage /> },
      { path: "commercials", element: <CommercialsPage /> },
      { path: "revenue", element: <RevenuePage /> },
      { path: "liquidity", element: <LiquidityPage /> },
      { path: "cashflow", element: <CashflowPage /> },
      { path: "decisions", element: <DecisionsPage /> },
      { path: "metrics", element: <MetricsPage /> },
    ],
  },
]);
