import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useDashboardContext } from "../../app/providers";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const bucketColors = ["#dc2626", "#2563eb", "#0891b2", "#16a34a"];

export function LiquidityPage() {
  const { data } = useDashboardContext();
  const liquidity = data.liquidity;

  if (!liquidity) {
    return null;
  }

  return (
    <div className="page-grid">
      <section className="stats-grid">
        <article className="card">
          <p className="eyebrow">Current Available</p>
          <h3>{formatCurrency(liquidity.currentAvailable)}</h3>
        </article>
        <article className="card">
          <p className="eyebrow">Next 7 Days Inflow</p>
          <h3>{formatCurrency(liquidity.next7DaysInflow)}</h3>
        </article>
        <article className="card">
          <p className="eyebrow">Next 30 Days Inflow</p>
          <h3>{formatCurrency(liquidity.next30DaysInflow)}</h3>
        </article>
        <article className="card">
          <p className="eyebrow">Overdue Amount</p>
          <h3>{formatCurrency(liquidity.overdueAmount)}</h3>
        </article>
      </section>

      <section className="page-grid page-grid--columns">
        <article className="card chart-card">
          <div className="card__header">
            <div>
              <p className="eyebrow">Capital Allocation</p>
              <h3>Deployed vs available</h3>
            </div>
          </div>
          <ResponsiveContainer height={260} width="100%">
            <PieChart>
              <Pie
                data={[
                  { name: "Deployed", value: liquidity.allocation.deployed },
                  { name: "Available", value: liquidity.allocation.available },
                ]}
                dataKey="value"
                innerRadius={70}
                outerRadius={100}
              >
                <Cell fill="#1d4ed8" />
                <Cell fill="#16a34a" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className="card chart-card">
          <div className="card__header">
            <div>
              <p className="eyebrow">Inflow Forecast</p>
              <h3>Repayment buckets</h3>
            </div>
          </div>
          <ResponsiveContainer height={260} width="100%">
            <BarChart data={liquidity.inflowBuckets}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {liquidity.inflowBuckets.map((bucket, index) => (
                  <Cell fill={bucketColors[index % bucketColors.length]} key={bucket.label} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Upcoming Repayment Schedule</p>
            <h3>Urgency-ranked draws</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Days Left</th>
                <th>Urgency</th>
              </tr>
            </thead>
            <tbody>
              {liquidity.schedule.map((item) => (
                <tr key={item.transactionId}>
                  <td>{item.clientName}</td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>{item.dueDate}</td>
                  <td>{item.daysLeft}</td>
                  <td>{item.urgency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Liquidity Risk Assessment</p>
        <div className="bullet-list">
          {liquidity.riskAssessment.map((item) => (
            <div className="bullet-list__item" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
