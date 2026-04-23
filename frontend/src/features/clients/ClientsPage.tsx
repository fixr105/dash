import { useState } from "react";

import { useDashboardContext } from "../../app/providers";
import type { ClientStatus } from "../../lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const initialState = {
  name: "",
  product: "Revolving Credit Line",
  limit: 0,
  industry: "",
  status: "Active" as ClientStatus,
};

export function ClientsPage() {
  const { createClient, data, refresh, deleteClient } = useDashboardContext();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const clients = data.dashboard?.clients ?? [];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createClient({
        name: form.name,
        product: form.product,
        limit: Number(form.limit),
        industry: form.industry,
        status: form.status,
      });
      setForm(initialState);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-grid">
      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Add New Client</p>
            <h3>Client onboarding</h3>
          </div>
        </div>
        <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            Client Name
            <input
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              value={form.name}
            />
          </label>
          <label>
            Product
            <select
              onChange={(event) => setForm((current) => ({ ...current, product: event.target.value }))}
              value={form.product}
            >
              <option>Revolving Credit Line</option>
              <option>Bill Discounting</option>
              <option>Raw Material Purchase</option>
            </select>
          </label>
          <label>
            Approved Limit
            <input
              min={0}
              onChange={(event) => setForm((current) => ({ ...current, limit: Number(event.target.value) }))}
              required
              type="number"
              value={form.limit}
            />
          </label>
          <label>
            Industry
            <input
              onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}
              required
              value={form.industry}
            />
          </label>
          <label>
            Status
            <select
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ClientStatus }))}
              value={form.status}
            >
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <div className="form-actions">
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? "Adding..." : "Add Client"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Client Portfolio</p>
            <h3>{clients.length} clients in the book</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Product</th>
                <th>Limit</th>
                <th>Exposure</th>
                <th>Utilization</th>
                <th>Commercials</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <strong>{client.name}</strong>
                    <small>{client.industry}</small>
                  </td>
                  <td>{client.product}</td>
                  <td>{formatCurrency(client.limit)}</td>
                  <td>{formatCurrency(client.activeExposure)}</td>
                  <td>{client.utilizationPct.toFixed(1)}%</td>
                  <td>{client.commercialSource}</td>
                  <td>
                    <button className="ghost-button" onClick={() => void deleteClient(client.id)} type="button">
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
