import { formatDistanceToNow } from "date-fns";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { apiClient } from "../services/apiClient";

type DocumentLink = {
  label: string;
  url: string;
};

type DetailResponse = {
  application: {
    id: string;
    externalRef: string | null;
    productModuleKey: string | null;
    status: string | null;
    stage: string;
    amount: string;
    currency: string;
    assignedAt: string | null;
    createdAt: string;
    metadata?: {
      clientName?: string | null;
      borrowerName?: string | null;
      notes?: string | null;
      tenure?: string | null;
      documents?: DocumentLink[];
    };
  };
  statusHistory: Array<{
    id: string;
    fromStage: string | null;
    toStage: string;
    note: string | null;
    changedAt: string;
  }>;
};

function formatAmount(value: string, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "—";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusClass(status: string | null): string {
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

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      try {
        setLoading(true);
        const response = await apiClient.get<DetailResponse>(`/inbox/${id}`);
        if (!cancelled) {
          setData(response.data);
          setError(null);
          setNotFound(false);
        }
      } catch (err) {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          setNotFound(true);
          setError(null);
          return;
        }
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Unable to load application details.";
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="detail-card">
        <p>Loading application details...</p>
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="detail-card">
        <p className="detail-not-found">Application not found or not assigned to your NBFC</p>
        <Link to="/inbox" className="detail-back-link">
          Back to Inbox
        </Link>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="detail-card">
        <p className="inbox-error">{error ?? "Unable to load application details."}</p>
        <Link to="/inbox" className="detail-back-link">
          Back to Inbox
        </Link>
      </section>
    );
  }

  const { application, statusHistory } = data;
  const documents = application.metadata?.documents ?? [];

  return (
    <section className="detail-card">
      <div className="detail-header">
        <div>
          <p className="coming-soon-card__eyebrow">Loan application</p>
          <h2>{application.externalRef ?? application.id}</h2>
        </div>
        <span className={`inbox-status ${statusClass(application.status)}`}>{application.status ?? "UNKNOWN"}</span>
      </div>

      <Link to="/inbox" className="detail-back-link">
        Back to Inbox
      </Link>

      <div className="detail-grid">
        <div className="detail-main">
          <h3>Key details</h3>
          <dl className="detail-list">
            <div>
              <dt>Client</dt>
              <dd>{application.metadata?.clientName ?? application.metadata?.borrowerName ?? "—"}</dd>
            </div>
            <div>
              <dt>Product module</dt>
              <dd>{application.productModuleKey ?? "—"}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{formatAmount(application.amount, application.currency)}</dd>
            </div>
            <div>
              <dt>Tenure</dt>
              <dd>{application.metadata?.tenure ?? "—"}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}</dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{application.metadata?.notes ?? "—"}</dd>
            </div>
          </dl>

          {documents.length > 0 ? (
            <div className="detail-documents">
              <h4>Documents</h4>
              <ul>
                {documents.map((document) => (
                  <li key={`${document.label}-${document.url}`}>
                    <a href={document.url} target="_blank" rel="noreferrer">
                      {document.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="detail-history">
          <h3>Status history</h3>
          {statusHistory.length === 0 ? (
            <p>No status transitions yet.</p>
          ) : (
            <ul className="detail-history__list">
              {statusHistory.map((entry) => (
                <li key={entry.id}>
                  <p>
                    {entry.fromStage ? `${entry.fromStage} -> ` : ""}
                    <strong>{entry.toStage}</strong>
                  </p>
                  <small>{formatDistanceToNow(new Date(entry.changedAt), { addSuffix: true })}</small>
                  {entry.note ? <p className="detail-history__note">{entry.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <section className="detail-actions">
        <h3>Actions</h3>
        <div className="detail-actions__buttons">
          <button type="button" disabled title="Coming in Phase 3">
            Approve
          </button>
          <button type="button" disabled title="Coming in Phase 3">
            Reject
          </button>
          <button type="button" disabled title="Coming in Phase 3">
            Raise Query
          </button>
        </div>
      </section>
    </section>
  );
}
