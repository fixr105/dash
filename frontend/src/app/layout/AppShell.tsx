import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useDashboardContext } from "../providers";

const navItems = [
  { path: "/dashboard", label: "Capital Dashboard", subtitle: "Portfolio overview" },
  { path: "/clients", label: "Clients", subtitle: "Client book and limits" },
  { path: "/transactions", label: "Transactions", subtitle: "Draw lifecycle tracking" },
  { path: "/commercials", label: "Commercial Setup", subtitle: "Rates, fees, and charges" },
  { path: "/revenue", label: "Revenue Split", subtitle: "Income contribution" },
  { path: "/liquidity", label: "Liquidity Engine", subtitle: "Inflow visibility" },
  { path: "/cashflow", label: "Cashflow Timeline", subtitle: "Client repayment view" },
  { path: "/decisions", label: "Decision Engine", subtitle: "Portfolio health" },
  { path: "/metrics", label: "Metric Engine", subtitle: "Underwriting calculators" },
];

const themeOptions = [
  { value: "classic", label: "Classic" },
  { value: "dark", label: "Dark Pro" },
  { value: "beige", label: "Beige" },
] as const;

export function AppShell() {
  const { data, error, loading, refresh, setTheme, theme } = useDashboardContext();
  const location = useLocation();
  const activeNav = navItems.find((item) => location.pathname.startsWith(item.path)) ?? navItems[0];
  const status = data.dashboard?.portfolio.status ?? "healthy";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <p className="sidebar__eyebrow">Seven Fincorp</p>
          <h1>Money Multiplier</h1>
          <p className="sidebar__muted">Backend-ready portfolio dashboard</p>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
              key={item.path}
              to={item.path}
            >
              <span>{item.label}</span>
              <small>{item.subtitle}</small>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <p className="sidebar__eyebrow">Theme</p>
          <div className="theme-switcher">
            {themeOptions.map((option) => (
              <button
                className={theme === option.value ? "theme-switcher__button is-active" : "theme-switcher__button"}
                key={option.value}
                onClick={() => setTheme(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="page">
        <header className="topbar">
          <div>
            <h2>{activeNav.label}</h2>
            <p>{activeNav.subtitle}</p>
          </div>

          <div className="topbar__actions">
            <span className={`status-badge status-badge--${status}`}>{status.replace("-", " ")}</span>
            <button className="ghost-button" onClick={() => void refresh()} type="button">
              Refresh data
            </button>
          </div>
        </header>

        {error ? <div className="alert alert--danger">{error}</div> : null}
        {loading && !data.dashboard ? <div className="loading-card">Loading Money Multiplier...</div> : <Outlet />}
      </main>
    </div>
  );
}
