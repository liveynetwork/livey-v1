import type { VenueDashboardEvent } from "../../venueDashboardService";

type VenueDashboardActivityOverviewProps = {
  events: VenueDashboardEvent[];
  onCreateEvent: () => void;
  onSelectEvent: (event: VenueDashboardEvent) => void;
};

export function VenueDashboardActivityOverview({
  events,
  onCreateEvent,
  onSelectEvent,
}: VenueDashboardActivityOverviewProps) {
  const overviewEvent = getOverviewEvent(events);

  const visibleActivityCount = events.filter(
    (event) => event.is_active !== false
  ).length;

  const hiddenActivityCount = events.filter(
    (event) => event.is_active === false
  ).length;

  if (!overviewEvent) {
    return (
      <section className="venue-dashboard-activity-overview">
        <div className="venue-dashboard-activity-overview-main">
          <div className="venue-dashboard-activity-overview-status">
            <span
              className="venue-dashboard-activity-overview-status-dot"
              aria-hidden="true"
            />

            <span>No activity</span>
          </div>

          <div className="venue-dashboard-activity-overview-copy">
            <span className="venue-dashboard-activity-section-label">
              Livey visibility
            </span>

            <h2>Nothing is live right now</h2>

            <p>
              Create an activity to show people what is happening at your
              venue.
            </p>

            <button
              className="venue-dashboard-primary-action venue-dashboard-activity-overview-action"
              type="button"
              onClick={onCreateEvent}
            >
              Create activity
            </button>
          </div>
        </div>

        <div className="venue-dashboard-activity-overview-side">
          <div className="venue-dashboard-activity-overview-metric">
            <span>Visible activities</span>
            <strong>{visibleActivityCount}</strong>
          </div>
        </div>
      </section>
    );
  }

  const isVisible = overviewEvent.is_active !== false;
  const isLive = isEventLive(overviewEvent);

  const overviewLabel = isLive
    ? "Live now"
    : isVisible
      ? "Next activity"
      : "Hidden activity";

  return (
    <section
      className={
        isLive
          ? "venue-dashboard-activity-overview is-live"
          : "venue-dashboard-activity-overview"
      }
    >
      <div className="venue-dashboard-activity-overview-main">
        <div
          className={
            isLive
              ? "venue-dashboard-activity-overview-status is-live"
              : isVisible
                ? "venue-dashboard-activity-overview-status"
                : "venue-dashboard-activity-overview-status is-hidden"
          }
        >
          <span
            className="venue-dashboard-activity-overview-status-dot"
            aria-hidden="true"
          />

          <span>{overviewLabel}</span>
        </div>

        <div className="venue-dashboard-activity-overview-copy">
          <span className="venue-dashboard-activity-section-label">
            Current Livey activity
          </span>

          <h2>{overviewEvent.title || "Untitled activity"}</h2>

          <p>
            {overviewEvent.display_time ||
              overviewEvent.status ||
              "Timing unavailable"}
          </p>

          <button
            className="venue-dashboard-activity-overview-edit"
            type="button"
            onClick={() => onSelectEvent(overviewEvent)}
          >
            View activity
          </button>
        </div>

        <div className="venue-dashboard-activity-overview-details">
          <div>
            <span>Visibility</span>

            <strong>
              {isVisible ? "Visible on Livey" : "Hidden from Livey"}
            </strong>
          </div>

          <div>
            <span>Activity state</span>

            <strong>
              {isLive
                ? "Currently happening"
                : overviewEvent.status || "Scheduled"}
            </strong>
          </div>
        </div>
      </div>

      <div className="venue-dashboard-activity-overview-side">
        <div className="venue-dashboard-activity-overview-counts">
          <div className="venue-dashboard-activity-overview-metric">
            <span>Visible</span>
            <strong>{visibleActivityCount}</strong>
          </div>

          <div className="venue-dashboard-activity-overview-metric">
            <span>Hidden</span>
            <strong>{hiddenActivityCount}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function getOverviewEvent(
  events: VenueDashboardEvent[]
): VenueDashboardEvent | null {
  if (events.length === 0) {
    return null;
  }

  const now = Date.now();

  const liveEvent = events.find((event) => isEventLive(event, now));

  if (liveEvent) {
    return liveEvent;
  }

  const visibleUpcomingEvents = events
    .filter((event) => {
      if (event.is_active === false) {
        return false;
      }

      const startsAt = getTimestamp(event.starts_at);

      return startsAt >= now;
    })
    .sort(
      (firstEvent, secondEvent) =>
        getTimestamp(firstEvent.starts_at) -
        getTimestamp(secondEvent.starts_at)
    );

  if (visibleUpcomingEvents.length > 0) {
    return visibleUpcomingEvents[0];
  }

  const hiddenUpcomingEvents = events
    .filter((event) => {
      if (event.is_active !== false) {
        return false;
      }

      const startsAt = getTimestamp(event.starts_at);

      return startsAt >= now;
    })
    .sort(
      (firstEvent, secondEvent) =>
        getTimestamp(firstEvent.starts_at) -
        getTimestamp(secondEvent.starts_at)
    );

  return hiddenUpcomingEvents[0] ?? events[0] ?? null;
}

function isEventLive(
  event: VenueDashboardEvent,
  now = Date.now()
) {
  if (event.is_active === false) {
    return false;
  }

  if (event.is_live === true) {
    return true;
  }

  const startsAt = getTimestamp(event.starts_at);
  const endsAt = getTimestamp(event.ends_at);

  if (
    startsAt === Number.MAX_SAFE_INTEGER ||
    endsAt === Number.MAX_SAFE_INTEGER
  ) {
    return false;
  }

  return now >= startsAt && now <= endsAt;
}

function getTimestamp(value: string | null) {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp)
    ? Number.MAX_SAFE_INTEGER
    : timestamp;
}