import { useEffect, useMemo, useState } from "react";

import { useDashboardContext } from "../../app/providers";
import type { MetricsFormValues, MetricsSnapshot } from "../../lib/types";

const defaultForm: MetricsFormValues = {
  receivables: 6000000,
  revenue: 36000000,
  inventory: 3000000,
  cogs: 24000000,
  payables: 2000000,
  limit: 2000000,
  monthlyRevenue: 5000000,
  monthlyInflow: 3500000,
  days: 28,
  nbfcRate: 110,
  matrix: [3, 2, 2, 3, 2, 1],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function MetricsPage() {
  const { calculateMetrics } = useDashboardContext();
  const [form, setForm] = useState<MetricsFormValues>(defaultForm);
  const [result, setResult] = useState<MetricsSnapshot | null>(null);

  const matrixOptions = useMemo(() => ["Portfolio fit", "Collections", "Underwriting", "Speed", "Documentation", "Pricing"], []);

  useEffect(() => {
    let isMounted = true;

    void calculateMetrics(form).then((nextResult) => {
      if (isMounted) {
        setResult(nextResult);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [calculateMetrics, form]);

  return (
    <div className="page-grid">
      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Underwriting Inputs</p>
            <h3>WCC, LSR, RCS, and NBFC fit</h3>
          </div>
        </div>
        <div className="form-grid">
          {(
            [
              ["receivables", "Receivables"],
              ["revenue", "Revenue"],
              ["inventory", "Inventory"],
              ["cogs", "COGS"],
              ["payables", "Payables"],
              ["limit", "Proposed Limit"],
              ["monthlyRevenue", "Monthly Revenue"],
              ["monthlyInflow", "Monthly Inflow"],
              ["days", "Cycle Days"],
              ["nbfcRate", "NBFC Rate"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [key]: Number(event.target.value),
                  }))
                }
                type="number"
                value={form[key]}
              />
            </label>
          ))}
        </div>

        <div className="matrix-grid">
          {matrixOptions.map((label, index) => (
            <label key={label}>
              {label}
              <select
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    matrix: current.matrix.map((value, valueIndex) =>
                      valueIndex === index ? Number(event.target.value) : value,
                    ),
                  }))
                }
                value={form.matrix[index]}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>
          ))}
        </div>
      </section>

      {result ? (
        <section className="stats-grid">
          <article className="card">
            <p className="eyebrow">WCC</p>
            <h3>{result.wcc.value.toFixed(2)} days</h3>
            <small>{result.wcc.verdict}</small>
          </article>
          <article className="card">
            <p className="eyebrow">LSR</p>
            <h3>{result.lsr.value.toFixed(2)}</h3>
            <small>{result.lsr.verdict}</small>
          </article>
          <article className="card">
            <p className="eyebrow">RCS</p>
            <h3>{result.rcs.value.toFixed(2)}</h3>
            <small>{result.rcs.verdict}</small>
          </article>
          <article className="card">
            <p className="eyebrow">NBFC Match</p>
            <h3>{result.nbfcSelection.totalScore}</h3>
            <small>{result.nbfcSelection.verdict}</small>
          </article>
        </section>
      ) : null}

      {result ? (
        <section className="page-grid page-grid--columns">
          <article className="card">
            <p className="eyebrow">Working Capital Cycle</p>
            <div className="detail-list">
              <div>
                <span>Debtor Days</span>
                <strong>{result.wcc.debtorDays.toFixed(2)}</strong>
              </div>
              <div>
                <span>Inventory Days</span>
                <strong>{result.wcc.inventoryDays.toFixed(2)}</strong>
              </div>
              <div>
                <span>Creditor Days</span>
                <strong>{result.wcc.creditorDays.toFixed(2)}</strong>
              </div>
            </div>
          </article>
          <article className="card">
            <p className="eyebrow">Sizing & Repayment</p>
            <div className="detail-list">
              <div>
                <span>Recommended Limit Range</span>
                <strong>
                  {formatCurrency(result.lsr.recommendedMin)} - {formatCurrency(result.lsr.recommendedMax)}
                </strong>
              </div>
              <div>
                <span>Max Repayment</span>
                <strong>{formatCurrency(result.rcs.maxRepayment)}</strong>
              </div>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
