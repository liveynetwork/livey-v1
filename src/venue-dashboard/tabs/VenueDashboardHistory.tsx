import type { VenueDashboardEvent } from "../venueDashboardService";

type VenueDashboardHistoryProps = {
  historyEvents: VenueDashboardEvent[];
  isRestoringEvent: boolean;
  onRestoreEvent: (event: VenueDashboardEvent) => void;
};

export function VenueDashboardHistory({
  historyEvents,
  isRestoringEvent,
  onRestoreEvent,
}: VenueDashboardHistoryProps) {
  const removedEvents = historyEvents.filter((event) =>
    Boolean(event.deleted_at)
  );

  const expiredEvents = historyEvents.filter((event) => !event.deleted_at);

  return (
    <section className="venue-dashboard-history-page">
      <section className="venue-dashboard-card venue-dashboard-history-hero">
        <div className="venue-dashboard-history-hero-copy">
          <p className="venue-dashboard-eyebrow">History</p>
          <h2>Past activity</h2>
          <p>
            Review activities that expired naturally or were removed from
            Livey.
          </p>
        </div>

        <div className="venue-dashboard-history-summary">
          <article className="venue-dashboard-history-summary-item">
            <span>Total activity</span>
            <strong>{historyEvents.length}</strong>
            <small>All archived activity</small>
          </article>

          <article className="venue-dashboard-history-summary-item is-removed">
            <span>Removed</span>
            <strong>{removedEvents.length}</strong>
            <small>Manually removed</small>
          </article>

          <article className="venue-dashboard-history-summary-item is-expired">
            <span>Expired</span>
            <strong>{expiredEvents.length}</strong>
            <small>Ended automatically</small>
          </article>
        </div>
      </section>

      <section className="venue-dashboard-card venue-dashboard-history-card">
        <div className="venue-dashboard-history-heading">
          <div>
            <p className="venue-dashboard-eyebrow">Archive</p>
            <h2>Expired and removed</h2>
          </div>

          <span className="venue-dashboard-history-count">
            {historyEvents.length}{" "}
            {historyEvents.length === 1 ? "activity" : "activities"}
          </span>
        </div>

        {historyEvents.length === 0 ? (
          <div className="venue-dashboard-history-empty">
            <div
              className="venue-dashboard-history-empty-icon"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                width="27"
                height="27"
                fill="none"
              >
                <path
                  d="M5 8.5h14v10A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-10Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M4 5.5h16v3H4v-3ZM9.5 12h5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3>No history yet</h3>

            <p>
              Activities that expire or are removed will be stored safely
              here.
            </p>
          </div>
        ) : (
          <div className="venue-dashboard-history-list">
            {historyEvents.map((event) => {
              const wasRemoved = Boolean(event.deleted_at);

              return (
                <article
                  className={`venue-dashboard-history-item ${
                    wasRemoved ? "is-removed" : "is-expired"
                  }`}
                  key={event.id}
                >
                  <div
                    className="venue-dashboard-history-item-icon"
                    aria-hidden="true"
                  >
                    {wasRemoved ? (
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                      >
                        <path
                          d="M5.5 7.5h13M9 7.5V5.8c0-.44.36-.8.8-.8h4.4c.44 0 .8.36.8.8v1.7M7.5 7.5l.7 11c.05.84.75 1.5 1.6 1.5h4.4c.85 0 1.55-.66 1.6-1.5l.7-11"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 11v5M14 11v5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="8.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M12 7.5V12l3 2"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="venue-dashboard-history-main">
                    <strong>{event.title || "Untitled activity"}</strong>

                    <span>
                      {event.display_time ||
                        formatHistoryDate(event.starts_at)}
                    </span>
                  </div>

                  <div className="venue-dashboard-history-actions">
                    <small
                      className={`venue-dashboard-history-status ${
                        wasRemoved ? "is-removed" : "is-expired"
                      }`}
                    >
                      <span aria-hidden="true" />
                      {wasRemoved ? "Removed" : "Expired"}
                    </small>

                    {wasRemoved ? (
                      <button
                        className="venue-dashboard-restore-button"
                        type="button"
                        onClick={() => onRestoreEvent(event)}
                        disabled={isRestoringEvent}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M5.5 9A7.5 7.5 0 1 1 5 14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M5.5 5.5V9H9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                        {isRestoringEvent ? "Restoring..." : "Restore"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}

function formatHistoryDate(isoValue: string | null) {
  if (!isoValue) return "No date saved";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoValue));
}