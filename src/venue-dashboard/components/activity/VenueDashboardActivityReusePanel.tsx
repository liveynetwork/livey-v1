import type { VenueDashboardEvent } from "../../venueDashboardService";

type VenueDashboardActivityReusePanelProps = {
  events: VenueDashboardEvent[];
  onClose: () => void;
  onUseAgain: (
    event: VenueDashboardEvent
  ) => void;
  onOpenHistory: () => void;
};

export function VenueDashboardActivityReusePanel({
  events,
  onClose,
  onUseAgain,
  onOpenHistory,
}: VenueDashboardActivityReusePanelProps) {
  const recentEvents = getRecentEvents(
    events
  ).slice(0, 3);

  return (
    <section className="venue-dashboard-activity-reuse-panel">
      <div className="venue-dashboard-activity-reuse-heading">
        <div>
          <span className="venue-dashboard-activity-section-label">
            Reuse previous
          </span>

          <h2>
            Publish something again
          </h2>

          <p>
            Copy the details of a previous
            activity and choose a fresh
            schedule before publishing it.
          </p>
        </div>

        <button
          className="venue-dashboard-activity-reuse-close"
          type="button"
          onClick={onClose}
          aria-label="Close previous activities"
        >
          <CloseIcon />
        </button>
      </div>

      {recentEvents.length > 0 ? (
        <>
          <div className="venue-dashboard-activity-reuse-list">
            {recentEvents.map((event) => (
              <article
                className="venue-dashboard-activity-reuse-item"
                key={event.id}
              >
                <div
                  className="venue-dashboard-activity-reuse-icon"
                  aria-hidden="true"
                >
                  <ActivityIcon />
                </div>

                <div className="venue-dashboard-activity-reuse-copy">
                  <strong>
                    {event.title ||
                      "Untitled activity"}
                  </strong>

                  <span>
                    {getEventDateLabel(
                      event
                    )}
                  </span>

                  <p>
                    {event.description?.trim() ||
                      "No description was added."}
                  </p>
                </div>

                <div className="venue-dashboard-activity-reuse-meta">
                  <span
                    className={
                      event.deleted_at
                        ? "venue-dashboard-activity-reuse-state is-removed"
                        : "venue-dashboard-activity-reuse-state"
                    }
                  >
                    {event.deleted_at
                      ? "Removed"
                      : "Expired"}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      onUseAgain(event)
                    }
                  >
                    Use again
                  </button>
                </div>
              </article>
            ))}
          </div>

          <button
            className="venue-dashboard-activity-reuse-history"
            type="button"
            onClick={onOpenHistory}
          >
            View full History
          </button>
        </>
      ) : (
        <div className="venue-dashboard-activity-reuse-empty">
          <div
            className="venue-dashboard-activity-reuse-empty-icon"
            aria-hidden="true"
          >
            <HistoryIcon />
          </div>

          <strong>
            No previous activities yet
          </strong>

          <p>
            Expired and removed activities
            will become available here for
            quick reuse.
          </p>

          <button
            type="button"
            onClick={onClose}
          >
            Back to Activity
          </button>
        </div>
      )}
    </section>
  );
}

function getRecentEvents(
  events: VenueDashboardEvent[]
) {
  return events
    .slice()
    .sort(
      (
        firstEvent,
        secondEvent
      ) =>
        getEventTimestamp(
          secondEvent
        ) -
        getEventTimestamp(
          firstEvent
        )
    );
}

function getEventTimestamp(
  event: VenueDashboardEvent
) {
  const values = [
    event.deleted_at,
    event.ends_at,
    event.starts_at,
    event.created_at,
  ];

  for (const value of values) {
    if (!value) {
      continue;
    }

    const timestamp =
      new Date(value).getTime();

    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  return 0;
}

function getEventDateLabel(
  event: VenueDashboardEvent
) {
  const value =
    event.deleted_at ||
    event.ends_at ||
    event.starts_at ||
    event.created_at;

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return (
      event.display_time ||
      "Previous activity"
    );
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function ActivityIcon() {
  return (
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
        d="M8 9h8M8 12h8M8 15h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="25"
      height="25"
      fill="none"
    >
      <path
        d="M5.5 8.2A8 8 0 1 1 4 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M5.5 4.8v3.4H2.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M12 8v4.3l3 1.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
    >
      <path
        d="m8 8 8 8M16 8l-8 8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}