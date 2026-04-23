import { useDashboardContext } from "../../app/providers";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLakhs(value: number) {
  return `${(value / 100000).toFixed(2)} Lakhs`;
}

export function DashboardPage() {
  const { data } = useDashboardContext();
  const portfolio = data.dashboard?.portfolio;

  if (!portfolio) {
    return null;
  }

  return (
    <div className="page-grid">
      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Capital Configuration</p>
            <h3>{portfolio.capitalLabel}</h3>
          </div>
          <span className="pill">{portfolio.statusNote}</span>
        </div>
        <div className="stats-grid">
          <article className="stat-card">
            <span>Total Capital Pool</span>
            <strong>{formatCurrency(portfolio.capital)}</strong>
            <small>{formatLakhs(portfolio.capital)}</small>
          </article>
          <article className="stat-card stat-card--success">
            <span>Available Capital</span>
            <strong>{formatCurrency(portfolio.available)}</strong>
            <small>{portfolio.utilizationPct.toFixed(1)}% utilized</small>
          </article>
          <article className="stat-card">
            <span>Deployed Capital</span>
            <strong>{formatCurrency(portfolio.deployed)}</strong>
            <small>{portfolio.status}</small>
          </article>
          <article className="stat-card">
            <span>Capital Multiplier</span>
            <strong>{portfolio.capitalMultiplier.toFixed(2)}x</strong>
            <small>{formatCurrency(portfolio.totalDisbursed)} disbursed</small>
          </article>
        </div>
      </section>

      <section className="page-grid page-grid--columns">
        <article className="card">
          <p className="eyebrow">Income</p>
          <h3>{formatCurrency(portfolio.totalIncome)}</h3>
          <div className="detail-list">
            <div>
              <span>NBFC Earnings</span>
              <strong>{formatCurrency(portfolio.totalNbfcIncome)}</strong>
            </div>
            <div>
              <span>Seven Earnings</span>
              <strong>{formatCurrency(portfolio.totalSevenIncome)}</strong>
            </div>
            <div>
              <span>Annualized Yield</span>
              <strong>{portfolio.annualizedYieldPct.toFixed(2)}%</strong>
            </div>
          </div>
        </article>

        <article className="card">
          <p className="eyebrow">Portfolio Summary</p>
          <div className="detail-list">
            <div>
              <span>Total Disbursed</span>
              <strong>{formatCurrency(portfolio.totalDisbursed)}</strong>
            </div>
            <div>
              <span>Utilization</span>
              <strong>{portfolio.utilizationPct.toFixed(1)}%</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{portfolio.statusNote}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
