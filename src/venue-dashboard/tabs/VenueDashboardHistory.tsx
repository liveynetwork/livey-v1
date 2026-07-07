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
  const removedEvents = historyEvents.filter((event) => Boolean(event.deleted_at));
  const expiredEvents = historyEvents.filter((event) => !event.deleted_at);

  return (
    <section className="venue-dashboard-history-page">
      <section className="venue-dashboard-card venue-dashboard-history-hero">
        <p className="venue-dashboard-eyebrow">History</p>
        <h2>Past activity</h2>
        <p>
          Review activities that expired or were removed from Livey.
        </p>

        <div className="venue-dashboard-history-summary">
          <div>
            <span>Total</span>
            <strong>{historyEvents.length}</strong>
          </div>

          <div>
            <span>Removed</span>
            <strong>{removedEvents.length}</strong>
          </div>

          <div>
            <span>Expired</span>
            <strong>{expiredEvents.length}</strong>
          </div>
        </div>
      </section>

      <section className="venue-dashboard-card venue-dashboard-history-card">
        <div className="venue-dashboard-section-heading">
          <p className="venue-dashboard-eyebrow">Archive</p>
          <h2>Expired and removed</h2>
        </div>

        {historyEvents.length === 0 ? (
          <div className="venue-dashboard-history-empty">
            <h3>No history yet</h3>
            <p>Removed or expired activities will appear here.</p>
          </div>
        ) : (
          <div className="venue-dashboard-history-list">
            {historyEvents.map((event) => {
              const wasRemoved = Boolean(event.deleted_at);

              return (
                <article className="venue-dashboard-history-item" key={event.id}>
                  <div className="venue-dashboard-history-main">
                    <strong>{event.title}</strong>
                    <span>
                      {event.display_time || formatHistoryDate(event.starts_at)}
                    </span>
                  </div>

                  <div className="venue-dashboard-history-actions">
                    <small
                      className={
                        wasRemoved
                          ? "venue-dashboard-status-pill is-hidden"
                          : "venue-dashboard-status-pill"
                      }
                    >
                      {wasRemoved ? "Removed" : "Expired"}
                    </small>

                    {wasRemoved ? (
                      <button
                        className="venue-dashboard-restore-button"
                        type="button"
                        onClick={() => onRestoreEvent(event)}
                        disabled={isRestoringEvent}
                      >
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoValue));
}