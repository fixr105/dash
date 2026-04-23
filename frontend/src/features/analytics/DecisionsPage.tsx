import { useDashboardContext } from "../../app/providers";

export function DecisionsPage() {
  const { data } = useDashboardContext();
  const decisions = data.decisions;

  if (!decisions) {
    return null;
  }

  return (
    <div className="page-grid page-grid--columns">
      <section className="card">
        <p className="eyebrow">Portfolio Health Score</p>
        <h3>{decisions.health.score} / 100</h3>
        <div className="progress">
          <div className="progress__fill" style={{ width: `${decisions.health.score}%` }} />
        </div>
        <p className="muted">Band: {decisions.health.band}</p>
      </section>

      <section className="card">
        <p className="eyebrow">Automated Insights</p>
        <div className="bullet-list">
          {decisions.insights.map((insight) => (
            <div className="bullet-list__item" key={insight}>
              {insight}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Risk Flags</p>
        <div className="bullet-list">
          {decisions.flags.map((flag) => (
            <div className="bullet-list__item bullet-list__item--danger" key={flag}>
              {flag}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
