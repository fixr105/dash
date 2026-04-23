import { useMemo, useState } from "react";

import { useDashboardContext } from "../../app/providers";
import type { TransactionStatus } from "../../lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function addDays(date: string, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().split("T")[0] ?? "";
}

function today() {
  return new Date().toISOString().split("T")[0] ?? "";
}

export function TransactionsPage() {
  const { createTransaction, data, deleteTransaction, refresh, updateTransactionStatus } = useDashboardContext();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    amount: 0,
    cycleDays: 28,
    drawDate: today(),
    note: "",
  });

  const clients = data.dashboard?.clients ?? [];
  const transactions = data.dashboard?.transactions ?? [];
  const selectedClient = clients.find((client) => client.id === form.clientId);
  const dueDate = useMemo(() => addDays(form.drawDate, Number(form.cycleDays)), [form.cycleDays, form.drawDate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createTransaction({
        clientId: form.clientId,
        amount: Number(form.amount),
        cycleDays: Number(form.cycleDays),
        drawDate: form.drawDate,
        dueDate,
        note: form.note,
      });
      setForm({
        clientId: "",
        amount: 0,
        cycleDays: 28,
        drawDate: today(),
        note: "",
      });
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(transactionId: string, status: TransactionStatus) {
    await updateTransactionStatus(transactionId, status);
  }

  return (
    <div className="page-grid">
      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">New Transaction / Draw</p>
            <h3>Record a draw against an approved limit</h3>
          </div>
          {selectedClient ? <span className="pill">{selectedClient.utilizationPct.toFixed(1)}% utilized</span> : null}
        </div>
        <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            Client
            <select
              onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
              required
              value={form.clientId}
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Draw Amount
            <input
              min={0}
              onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))}
              required
              type="number"
              value={form.amount}
            />
          </label>
          <label>
            Cycle Days
            <select
              onChange={(event) => setForm((current) => ({ ...current, cycleDays: Number(event.target.value) }))}
              value={form.cycleDays}
            >
              <option value={28}>28</option>
              <option value={54}>54</option>
            </select>
          </label>
          <label>
            Draw Date
            <input
              onChange={(event) => setForm((current) => ({ ...current, drawDate: event.target.value }))}
              required
              type="date"
              value={form.drawDate}
            />
          </label>
          <label>
            Due Date
            <input readOnly type="date" value={dueDate} />
          </label>
          <label className="form-grid__full">
            Note
            <input
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              placeholder="Invoice / buyer / supplier reference"
              value={form.note}
            />
          </label>
          <div className="form-actions">
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? "Recording..." : "Record Draw"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Active & Historical Draws</p>
            <h3>{transactions.length} transactions</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Amount</th>
                <th>Days Left</th>
                <th>Status</th>
                <th>NBFC</th>
                <th>Seven</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <strong>{transaction.clientName}</strong>
                    <small>{transaction.note}</small>
                  </td>
                  <td>{formatCurrency(transaction.amount)}</td>
                  <td>{transaction.daysLeft}</td>
                  <td>{transaction.status}</td>
                  <td>{formatCurrency(transaction.income.nbfcIncome)}</td>
                  <td>{formatCurrency(transaction.income.sevenIncome)}</td>
                  <td className="button-group">
                    {transaction.status === "Active" ? (
                      <button
                        className="ghost-button"
                        onClick={() => void handleStatusChange(transaction.id, "Repaid")}
                        type="button"
                      >
                        Mark Repaid
                      </button>
                    ) : (
                      <button
                        className="ghost-button"
                        onClick={() => void handleStatusChange(transaction.id, "Active")}
                        type="button"
                      >
                        Reopen
                      </button>
                    )}
                    <button className="ghost-button" onClick={() => void deleteTransaction(transaction.id)} type="button">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
