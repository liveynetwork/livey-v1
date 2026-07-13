import type { KeyboardEvent } from "react";
import type { VenueDashboardEvent } from "../../venueDashboardService";
import "./VenueDashboardActiveList.css";

type VenueDashboardActiveListProps = {
  events: VenueDashboardEvent[];
  onSelectEvent: (event: VenueDashboardEvent) => void;
};

export function VenueDashboardActiveList({
  events,
  onSelectEvent,
}: VenueDashboardActiveListProps) {
  const sortedEvents = sortActiveEvents(events);

  if (sortedEvents.length === 0) {
    return (
      <div className="venue-dashboard-active-empty">
        <div
          className="venue-dashboard-active-empty-icon"
          aria-hidden="true"
        >
          <ActivityIcon />
        </div>

        <strong>No saved activities yet</strong>

        <span>
          Activities you save will appear here and remain available for
          editing until they expire or are removed.
        </span>
      </div>
    );
  }

  return (
    <div className="venue-dashboard-active-list">
      {sortedEvents.map((event) => {
        const stateLabel =
          event.is_active === false ? "Hidden" : event.status;

        return (
          <article
            className="venue-dashboard-active-item"
            key={event.id}
            role="button"
            tabIndex={0}
            aria-label={`Edit ${event.title || "untitled activity"}`}
            onClick={() => onSelectEvent(event)}
            onKeyDown={(keyboardEvent) =>
              handleItemKeyDown(
                keyboardEvent,
                event,
                onSelectEvent
              )
            }
          >
            <div
              className="venue-dashboard-active-item-icon"
              aria-hidden="true"
            >
              <ActivityIcon />
            </div>

            <div className="venue-dashboard-active-main">
              <strong>{event.title || "Untitled activity"}</strong>

              <span>
                {event.display_time ||
                  event.status ||
                  "Timing unavailable"}
              </span>
            </div>

            <div className="venue-dashboard-active-actions">
              <small
                className={
                  event.is_active === false
                    ? "venue-dashboard-active-status is-hidden"
                    : event.status === "Live now"
                      ? "venue-dashboard-active-status is-live"
                      : "venue-dashboard-active-status"
                }
              >
                <span aria-hidden="true" />
                {stateLabel}
              </small>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function sortActiveEvents(events: VenueDashboardEvent[]) {
  const now = Date.now();

  return events.slice().sort((firstEvent, secondEvent) => {
    const firstIsLive = isEventLive(firstEvent, now);
    const secondIsLive = isEventLive(secondEvent, now);

    if (firstIsLive !== secondIsLive) {
      return firstIsLive ? -1 : 1;
    }

    const firstTime = getStartTimestamp(firstEvent);
    const secondTime = getStartTimestamp(secondEvent);

    return firstTime - secondTime;
  });
}

function isEventLive(event: VenueDashboardEvent, now: number) {
  if (event.is_active === false) return false;
  if (event.is_live === true) return true;
  if (!event.starts_at || !event.ends_at) return false;

  const startsAt = new Date(event.starts_at).getTime();
  const endsAt = new Date(event.ends_at).getTime();

  if (
    Number.isNaN(startsAt) ||
    Number.isNaN(endsAt)
  ) {
    return false;
  }

  return now >= startsAt && now <= endsAt;
}

function getStartTimestamp(event: VenueDashboardEvent) {
  if (!event.starts_at) {
    return Number.MAX_SAFE_INTEGER;
  }

  const timestamp = new Date(event.starts_at).getTime();

  return Number.isNaN(timestamp)
    ? Number.MAX_SAFE_INTEGER
    : timestamp;
}

function handleItemKeyDown(
  keyboardEvent: KeyboardEvent<HTMLElement>,
  event: VenueDashboardEvent,
  onSelectEvent: (event: VenueDashboardEvent) => void
) {
  if (
    keyboardEvent.key !== "Enter" &&
    keyboardEvent.key !== " "
  ) {
    return;
  }

  keyboardEvent.preventDefault();
  onSelectEvent(event);
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