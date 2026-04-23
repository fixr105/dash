import { Inbox as InboxIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiClient } from "../services/apiClient";

type InboxItem = {
  id: string;
  externalRef: string | null;
  productModuleKey: string | null;
  status: string | null;
  amount: string;
  assignedAt: string | null;
  metadata?: {
    clientName?: string | null;
    borrowerName?: string | null;
  };
};

function formatAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "—";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusClass(status: string | null): string {
  switch ((status ?? "").toUpperCase()) {
    case "SENT_TO_NBFC":
      return "is-blue";
    case "APPROVED":
      return "is-green";
    case "REJECTED":
      return "is-red";
    default:
      return "is-gray";
  }
}

export function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadInbox() {
      try {
        setLoading(true);
        const response = await apiClient.get<{ items: InboxItem[] }>("/inbox");
        if (!cancelled) {
          setItems(response.data.items ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            "Unable to load applications.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInbox();
    return () => {
      cancelled = true;
    };
  }, []);

  const skeletonRows = useMemo(() => Array.from({ length: 5 }, (_, index) => index), []);

  if (loading) {
    return (
      <section className="inbox-card">
        <h2>Inbox</h2>
        <div className="inbox-skeleton">
          {skeletonRows.map((row) => (
            <div key={row} className="inbox-skeleton__row" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="inbox-card">
        <h2>Inbox</h2>
        <p className="inbox-error">{error}</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="inbox-card inbox-empty">
        <InboxIcon size={40} />
        <h2>No applications assigned yet</h2>
        <p>Newly assigned applications will appear here.</p>
      </section>
    );
  }

  return (
    <section className="inbox-card">
      <div className="inbox-header">
        <h2>Inbox</h2>
        <p>{items.length} applications</p>
      </div>

      <div className="inbox-table-wrap">
        <table className="inbox-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const displayName = item.metadata?.clientName ?? item.metadata?.borrowerName ?? "—";
              return (
                <tr key={item.id} onClick={() => navigate(`/applications/${item.id}`)} className="inbox-row">
                  <td>
                    <strong>{item.externalRef ?? "—"}</strong>
                    <small>{displayName}</small>
                  </td>
                  <td>{item.productModuleKey ?? "—"}</td>
                  <td>{formatAmount(item.amount)}</td>
                  <td>
                    <span className={`inbox-status ${getStatusClass(item.status)}`}>{item.status ?? "UNKNOWN"}</span>
                  </td>
                  <td>{item.assignedAt ? formatDistanceToNow(new Date(item.assignedAt), { addSuffix: true }) : "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="inbox-open-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/applications/${item.id}`);
                      }}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
