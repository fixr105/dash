import { useDashboardContext } from "../../app/providers";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function RevenuePage() {
  const { data } = useDashboardContext();
  const revenue = data.revenue;

  if (!revenue) {
    return null;
  }

  return (
    <div className="page-grid">
      <section className="stats-grid">
        <article className="card">
          <p className="eyebrow">Total Portfolio Income</p>
          <h3>{formatCurrency(revenue.summary.totalIncome)}</h3>
        </article>
        <article className="card">
          <p className="eyebrow">NBFC Earnings</p>
          <h3>{formatCurrency(revenue.summary.totalNbfcIncome)}</h3>
        </article>
        <article className="card">
          <p className="eyebrow">Seven Earnings</p>
          <h3>{formatCurrency(revenue.summary.totalSevenIncome)}</h3>
        </article>
        <article className="card">
          <p className="eyebrow">Annualized Yield</p>
          <h3>{revenue.summary.annualizedYieldPct.toFixed(2)}%</h3>
        </article>
      </section>

      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Transaction Revenue Breakdown</p>
            <h3>Income by draw</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Amount</th>
                <th>NBFC Interest</th>
                <th>Seven Fees</th>
                <th>Other Charges</th>
                <th>Total Income</th>
                <th>Rate Source</th>
              </tr>
            </thead>
            <tbody>
              {revenue.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.clientName}</td>
                  <td>{formatCurrency(transaction.amount)}</td>
                  <td>{formatCurrency(transaction.income.interest)}</td>
                  <td>{formatCurrency(transaction.income.sourcingFee + transaction.income.collectionFee)}</td>
                  <td>
                    {formatCurrency(
                      transaction.income.otherNbfcCharges + transaction.income.otherSevenCharges,
                    )}
                  </td>
                  <td>{formatCurrency(transaction.income.totalIncome)}</td>
                  <td>{transaction.income.rateSource}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
