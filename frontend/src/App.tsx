import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";

import "./App.css";
import { LoginPage } from "./auth/LoginPage";
import { RequireAuth } from "./auth/RequireAuth";
import { AuthProvider } from "./auth/AuthContext";
import { useAuth } from "./auth/useAuth";
import { AppShell } from "./components/layout/AppShell";
import { ApplicationDetailPage } from "./pages/ApplicationDetail";
import { InboxPage } from "./pages/Inbox";

function HomeRedirect() {
  const { user } = useAuth();
  const memberships = user?.memberships ?? [];

  const hasNbfcScope = memberships.some((membership) => membership.scope.startsWith("nbfc:"));
  const hasPlatformScope = memberships.some((membership) => membership.scope === "platform:dash");

  if (hasNbfcScope) {
    return <Navigate replace to="/inbox" />;
  }
  if (hasPlatformScope) {
    return <Navigate replace to="/admin" />;
  }
  return <Navigate replace to="/settings" />;
}

function ComingSoonCard({ title }: { title: string }) {
  return (
    <section className="coming-soon-card">
      <p className="coming-soon-card__eyebrow">Seven Fincorp</p>
      <h2>{title}</h2>
      <p>Coming soon</p>
    </section>
  );
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: "inbox", element: <InboxPage /> },
      { path: "tools", element: <ComingSoonCard title="Tools" /> },
      { path: "settings", element: <ComingSoonCard title="Settings" /> },
      { path: "admin", element: <ComingSoonCard title="Dashboard" /> },
      { path: "applications/:id", element: <ApplicationDetailPage /> },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
