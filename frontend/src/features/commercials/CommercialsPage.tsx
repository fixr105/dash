import { useEffect, useState } from "react";

import { useDashboardContext } from "../../app/providers";
import { createEmptyCharge } from "../../lib/api";
import type { CommercialConfig } from "../../lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CommercialsPage() {
  const { data, updateCommercials } = useDashboardContext();
  const sourceConfig = data.dashboard?.commercial;
  const [form, setForm] = useState<CommercialConfig | null>(sourceConfig ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sourceConfig) {
      setForm(sourceConfig);
    }
  }, [sourceConfig]);

  if (!form) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) {
      return;
    }
    setSaving(true);
    try {
      await updateCommercials(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-grid">
      <section className="card">
        <div className="card__header">
          <div>
            <p className="eyebrow">System Commercials</p>
            <h3>Interest rates, fees, and dynamic charges</h3>
          </div>
        </div>
        <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            NBFC 28-Day Rate
            <input
              onChange={(event) =>
                setForm((current) => (current ? { ...current, nbfc28: Number(event.target.value) } : current))
              }
              type="number"
              value={form.nbfc28}
            />
          </label>
          <label>
            NBFC 54-Day Rate
            <input
              onChange={(event) =>
                setForm((current) => (current ? { ...current, nbfc54: Number(event.target.value) } : current))
              }
              type="number"
              value={form.nbfc54}
            />
          </label>
          <label>
            Sourcing Fee %
            <input
              onChange={(event) =>
                setForm((current) => (current ? { ...current, sourcing: Number(event.target.value) } : current))
              }
              step="0.01"
              type="number"
              value={form.sourcing}
            />
          </label>
          <label>
            Collection Fee %
            <input
              onChange={(event) =>
                setForm((current) => (current ? { ...current, collection: Number(event.target.value) } : current))
              }
              step="0.01"
              type="number"
              value={form.collection}
            />
          </label>

          <div className="form-grid__full">
            <div className="table-toolbar">
              <div>
                <p className="eyebrow">Other Charges</p>
                <h4>Dynamic charge matrix</h4>
              </div>
              <button
                className="ghost-button"
                onClick={() =>
                  setForm((current) =>
                    current
                      ? {
                          ...current,
                          charges: [...current.charges, createEmptyCharge()],
                        }
                      : current,
                  )
                }
                type="button"
              >
                Add Charge
              </button>
            </div>

            <div className="charge-stack">
              {form.charges.map((charge, index) => (
                <div className="charge-row" key={`${charge.label}-${index}`}>
                  <input
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              charges: current.charges.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, label: event.target.value } : item,
                              ),
                            }
                          : current,
                      )
                    }
                    placeholder="Charge label"
                    value={charge.label}
                  />
                  <input
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              charges: current.charges.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, value: Number(event.target.value) } : item,
                              ),
                            }
                          : current,
                      )
                    }
                    step="0.01"
                    type="number"
                    value={charge.value}
                  />
                  <select
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              charges: current.charges.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, type: event.target.value as CommercialConfig["charges"][number]["type"] }
                                  : item,
                              ),
                            }
                          : current,
                      )
                    }
                    value={charge.type}
                  >
                    <option value="%">%</option>
                    <option value="flat">Flat</option>
                  </select>
                  <select
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              charges: current.charges.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, owner: event.target.value as CommercialConfig["charges"][number]["owner"] }
                                  : item,
                              ),
                            }
                          : current,
                      )
                    }
                    value={charge.owner}
                  >
                    <option value="NBFC">NBFC</option>
                    <option value="Seven">Seven</option>
                  </select>
                  <button
                    className="ghost-button"
                    onClick={() =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              charges: current.charges.filter((_item, itemIndex) => itemIndex !== index),
                            }
                          : current,
                      )
                    }
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? "Saving..." : "Save Commercials"}
            </button>
          </div>
        </form>
      </section>

      <section className="page-grid page-grid--columns">
        <article className="card">
          <p className="eyebrow">Preview: 28 Day</p>
          <h3>{form.nbfc28} per lakh/day</h3>
          <p>{form.sourcing}% sourcing and {form.collection}% collection</p>
        </article>
        <article className="card">
          <p className="eyebrow">Preview: Sample Charge Rollup</p>
          <h3>{formatCurrency(form.charges.reduce((sum, charge) => sum + charge.value, 0))}</h3>
          <p>{form.charges.length} configured charges</p>
        </article>
      </section>
    </div>
  );
}
