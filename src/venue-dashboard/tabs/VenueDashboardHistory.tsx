import { useMemo, useState } from "react";
import type { VenueDashboardEvent } from "../venueDashboardService";
import { VenueDashboardHistoryList } from "../components/history/VenueDashboardHistoryList";
import { VenueDashboardHistoryArchiveModal } from "../components/history/VenueDashboardHistoryArchiveModal";
import { VenueDashboardHistoryDetailsModal } from "../components/history/VenueDashboardHistoryDetailsModal";
import { sortHistoryEventsNewestFirst } from "../components/history/historyUtils";

type VenueDashboardHistoryProps = {
  venueName: string;
  historyEvents: VenueDashboardEvent[];
  isRestoringEvent: boolean;
  onRestoreEvent: (event: VenueDashboardEvent) => void;
};

export function VenueDashboardHistory({
  venueName,
  historyEvents,
}: VenueDashboardHistoryProps) {
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [selectedHistoryEvent, setSelectedHistoryEvent] =
    useState<VenueDashboardEvent | null>(null);

  const sortedHistoryEvents = useMemo(() => {
    return sortHistoryEventsNewestFirst(historyEvents);
  }, [historyEvents]);

  const recentHistoryEvents = useMemo(() => {
    return sortedHistoryEvents.slice(0, 3);
  }, [sortedHistoryEvents]);

  const removedEvents = historyEvents.filter((event) =>
    Boolean(event.deleted_at)
  );

  const expiredEvents = historyEvents.filter((event) => !event.deleted_at);

  const shouldShowViewAll = sortedHistoryEvents.length > 3;

  return (
    <>
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
            <HistoryEmptyState />
          ) : (
            <>
              <VenueDashboardHistoryList
                events={recentHistoryEvents}
                onOpenEvent={setSelectedHistoryEvent}
                variant="preview"
              />

              {shouldShowViewAll ? (
                <footer className="venue-dashboard-history-preview-footer">
                  <button
                    className="venue-dashboard-history-view-all-button"
                    type="button"
                    onClick={() => setIsArchiveOpen(true)}
                  >
                    View all
                  </button>
                </footer>
              ) : null}
            </>
          )}
        </section>
      </section>

      {isArchiveOpen ? (
        <VenueDashboardHistoryArchiveModal
          historyEvents={sortedHistoryEvents}
          onClose={() => setIsArchiveOpen(false)}
          onOpenEvent={setSelectedHistoryEvent}
        />
      ) : null}

      {selectedHistoryEvent ? (
        <VenueDashboardHistoryDetailsModal
          venueName={venueName}
          event={selectedHistoryEvent}
          onClose={() => setSelectedHistoryEvent(null)}
        />
      ) : null}
    </>
  );
}

function HistoryEmptyState() {
  return (
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
        Activities that expire or are removed will be stored safely here.
      </p>
    </div>
  );
}