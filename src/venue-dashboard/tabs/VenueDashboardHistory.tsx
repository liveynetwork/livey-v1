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
  return (
    <section className="venue-dashboard-card">
      <div className="venue-dashboard-section-heading">
        <p className="venue-dashboard-eyebrow">History</p>
        <h2>Expired and removed activities</h2>
      </div>

      {historyEvents.length === 0 ? (
        <p className="venue-dashboard-muted">
          No expired or removed activities yet.
        </p>
      ) : (
        <div className="venue-dashboard-history-list">
          {historyEvents.map((event) => {
            const wasRemoved = Boolean(event.deleted_at);

            return (
              <article className="venue-dashboard-history-item" key={event.id}>
                <div>
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