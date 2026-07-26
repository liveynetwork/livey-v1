import type { VenueDashboardEvent } from "../../venueDashboardService";

type VenueDashboardActivityOverviewProps = {
  events: VenueDashboardEvent[];
  onCreateEvent: () => void;
  onSelectEvent: (event: VenueDashboardEvent) => void;
};

export function VenueDashboardActivityOverview({
  events,
  onSelectEvent,
}: VenueDashboardActivityOverviewProps) {
  const overviewEvent = getOverviewEvent(events);

  const visibleActivityCount = events.filter(
    (event) => event.is_active !== false
  ).length;

  const hiddenActivityCount = events.filter(
    (event) => event.is_active === false
  ).length;

  const now = Date.now();

const scheduledActivityCount = events.filter(
  (event) => {
    const startsAt = getTimestamp(
      event.starts_at
    );

    return (
      startsAt !==
        Number.MAX_SAFE_INTEGER &&
      startsAt > now
    );
  }
).length;

  /*
   * The dedicated Activity Empty State handles the no-activity experience.
   * Avoid rendering a second card that communicates the same information.
   */
  if (!overviewEvent) {
    return null;
  }

  const isVisible = overviewEvent.is_active !== false;
  const isLive = isEventLive(overviewEvent);

  return (
    <section
      className={
        isLive
          ? "venue-dashboard-activity-overview is-live"
          : "venue-dashboard-activity-overview"
      }
    >
      <div className="venue-dashboard-activity-overview-main">
        <div className="venue-dashboard-activity-overview-copy">
          <p className="venue-dashboard-eyebrow">
  Current Livey activity
</p>

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
          <div className="venue-dashboard-activity-overview-visibility">
            <span>Visibility</span>

            <strong>
              {isVisible ? "Visible on Livey" : "Hidden from Livey"}
            </strong>
          </div>
        </div>
      </div>

      <div className="venue-dashboard-activity-overview-side">
        <div className="venue-dashboard-activity-overview-counts">
  <div className="venue-dashboard-activity-overview-metric">
    <span>Visible</span>

    <strong>
      {visibleActivityCount}
    </strong>
  </div>

  <div className="venue-dashboard-activity-overview-metric">
    <span>Hidden</span>

    <strong>
      {hiddenActivityCount}
    </strong>
  </div>

  <div className="venue-dashboard-activity-overview-metric">
    <span>Scheduled</span>

    <strong>
      {scheduledActivityCount}
    </strong>
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