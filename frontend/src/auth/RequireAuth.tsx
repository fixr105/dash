import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./useAuth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="loading-card">Checking your session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  return <>{children}</>;
}
