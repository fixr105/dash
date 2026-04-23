import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useDashboardContext } from "../../app/providers";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CashflowPage() {
  const { data } = useDashboardContext();
  const cashflow = data.cashflow;

  if (!cashflow) {
    return null;
  }

  return (
    <div className="page-grid">
      <section className="page-grid page-grid--columns">
        {cashflow.clients.map((client) => (
          <article className="card" key={client.clientId}>
            <p className="eyebrow">{client.clientName}</p>
            <h3>{formatCurrency(client.totalExposure)}</h3>
            <div className="detail-list">
              <div>
                <span>Expected Income</span>
                <strong>{formatCurrency(client.expectedIncome)}</strong>
              </div>
              <div>
                <span>Overdue Count</span>
                <strong>{client.overdueCount}</strong>
              </div>
              <div>
                <span>Nearest Due</span>
                <strong>{client.nearestDueDate ?? "—"}</strong>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="card chart-card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Portfolio Cash Flow Summary</p>
            <h3>Exposure by client</h3>
          </div>
        </div>
        <ResponsiveContainer height={280} width="100%">
          <BarChart data={cashflow.clients}>
            <XAxis dataKey="clientName" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalExposure" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Cashflow Timeline</p>
            <h3>Active draws sorted by due date</h3>
          </div>
        </div>
        <div className="timeline-list">
          {cashflow.timeline.map((item) => (
            <article className="timeline-item" key={item.transactionId}>
              <div className="timeline-item__meta">
                <strong>{item.clientName}</strong>
                <span>{item.dueDate}</span>
              </div>
              <div className="timeline-item__progress">
                <div className="timeline-item__bar">
                  <div className="timeline-item__fill" style={{ width: `${item.elapsedPct}%` }} />
                </div>
                <small>{item.elapsedPct}% elapsed</small>
              </div>
              <div className="timeline-item__meta">
                <span>{formatCurrency(item.amount)}</span>
                <span>{item.daysLeft} days</span>
              </div>
              {item.note ? <p className="timeline-item__note">{item.note}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
