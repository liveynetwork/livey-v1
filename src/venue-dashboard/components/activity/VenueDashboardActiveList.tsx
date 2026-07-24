import type { VenueDashboardEvent } from "../../venueDashboardService";
import "./VenueDashboardActiveList.css";

type VenueDashboardActiveListProps = {
  events: VenueDashboardEvent[];
  isUpdatingVisibility: boolean;
  updatingVisibilityEventId: string | null;
  onSelectEvent: (event: VenueDashboardEvent) => void;
  onToggleVisibility: (event: VenueDashboardEvent) => void;
};

type TimelineGroup = {
  key: string;
  label: string;
  description: string;
  events: VenueDashboardEvent[];
};

export function VenueDashboardActiveList({
  events,
  isUpdatingVisibility,
  updatingVisibilityEventId,
  onSelectEvent,
  onToggleVisibility,
}: VenueDashboardActiveListProps) {
  const now = Date.now();
  const sortedEvents = sortActiveEvents(events, now);

  if (sortedEvents.length === 0) {
    return (
      <div className="venue-dashboard-active-empty">
        <div
          className="venue-dashboard-active-empty-icon"
          aria-hidden="true"
        >
          <TimelineIcon />
        </div>

        <strong>Your publishing timeline is empty</strong>

        <span>
          Activities you create will appear here in chronological order.
        </span>
      </div>
    );
  }

  const timelineGroups = groupEventsByDate(sortedEvents, now);

  return (
    <div className="venue-dashboard-active-timeline">
      {timelineGroups.map((group) => (
        <section
          className="venue-dashboard-active-group"
          key={group.key}
        >
          <header className="venue-dashboard-active-group-heading">
            <div>
              <span>{group.label}</span>
              <small>{group.description}</small>
            </div>
          </header>

          <div className="venue-dashboard-active-list">
            {group.events.map((event) => {
              const timelineState = getTimelineState({
                event,
                now,
              });

              const startDate = parseDate(event.starts_at);
              const endDate = parseDate(event.ends_at);

              const isOvernight =
                startDate &&
                endDate &&
                !isSameCalendarDay(startDate, endDate);

              const isHidden = event.is_active === false;

              const isThisVisibilityUpdating =
                isUpdatingVisibility &&
                updatingVisibilityEventId === event.id;

              return (
                <article
                  className={[
                    "venue-dashboard-active-item",
                    timelineState.className,
                    isHidden ? "is-hidden" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={event.id}
                >
                  <div
                    className="venue-dashboard-active-item-marker"
                    aria-hidden="true"
                  >
                    <span />
                  </div>

                  <div className="venue-dashboard-active-content">
                    <div className="venue-dashboard-active-timing">
                      <strong>{formatEventRange(event)}</strong>

                      <span>{getRelativeTiming(event, now)}</span>
                    </div>

                    <div className="venue-dashboard-active-title-row">
                      <strong>
                        {event.title || "Untitled activity"}
                      </strong>
                    </div>

                    {event.description ? (
                      <p className="venue-dashboard-active-description">
                        {event.description}
                      </p>
                    ) : (
                      <p className="venue-dashboard-active-description is-empty">
                        No activity description added.
                      </p>
                    )}

                    {isOvernight ? (
                      <div className="venue-dashboard-active-meta">
                        <span className="is-overnight">
                          <MoonIcon />
                          Overnight
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="venue-dashboard-active-controls">
                    <button
                      className={[
                        "venue-dashboard-active-visibility-switch",
                        isHidden ? "is-off" : "is-on",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      type="button"
                      role="switch"
                      aria-checked={!isHidden}
                      aria-label={
                        isHidden
                          ? `Make ${
                              event.title || "this activity"
                            } visible on Livey`
                          : `Hide ${
                              event.title || "this activity"
                            } from Livey`
                      }
                      disabled={isUpdatingVisibility}
                      onClick={() => onToggleVisibility(event)}
                    >
                      <span
                        className="venue-dashboard-active-visibility-switch-track"
                        aria-hidden="true"
                      >
                        <span className="venue-dashboard-active-visibility-switch-thumb" />
                      </span>

                      <span className="venue-dashboard-active-visibility-switch-label">
                        {isThisVisibilityUpdating
                          ? isHidden
                            ? "Showing..."
                            : "Hiding..."
                          : isHidden
                            ? "Hidden"
                            : "Visible"}
                      </span>
                    </button>

                    <button
                      className="venue-dashboard-active-edit-button"
                      type="button"
                      aria-label={`Edit ${
                        event.title || "this activity"
                      }`}
                      title="Edit activity"
                      onClick={() => onSelectEvent(event)}
                    >
                      <PencilIcon />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function sortActiveEvents(
  events: VenueDashboardEvent[],
  now: number
) {
  return events
    .slice()
    .sort((firstEvent, secondEvent) => {
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

function groupEventsByDate(
  events: VenueDashboardEvent[],
  now: number
): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>();

  const nowDate = new Date(now);
  const tomorrowDate = new Date(nowDate);

  tomorrowDate.setDate(nowDate.getDate() + 1);

  events.forEach((event) => {
    const startDate = parseDate(event.starts_at);

    let key = "unscheduled";
    let label = "Schedule unavailable";
    let description = "Activities without a valid start time";

    if (startDate) {
      key = getCalendarDateKey(startDate);

      if (isSameCalendarDay(startDate, nowDate)) {
        label = "Today";
        description = "Live and scheduled for today";
      } else if (isSameCalendarDay(startDate, tomorrowDate)) {
        label = "Tomorrow";
        description = formatLongDate(startDate);
      } else {
        label = formatWeekday(startDate);
        description = formatLongDate(startDate);
      }
    }

    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.events.push(event);
      return;
    }

    groups.set(key, {
      key,
      label,
      description,
      events: [event],
    });
  });

  return Array.from(groups.values());
}

function getTimelineState({
  event,
  now,
}: {
  event: VenueDashboardEvent;
  now: number;
}) {
  if (event.is_active === false) {
    return {
      className: "is-hidden",
    };
  }

  if (isEventLive(event, now)) {
    return {
      className: "is-live",
    };
  }

  return {
    className: "is-upcoming",
  };
}

function isEventLive(
  event: VenueDashboardEvent,
  now: number
) {
  if (event.is_active === false) {
    return false;
  }

  if (event.is_live === true) {
    return true;
  }

  const startsAt = getStartTimestamp(event);
  const endsAt = getEndTimestamp(event);

  if (
    startsAt === Number.MAX_SAFE_INTEGER ||
    endsAt === Number.MAX_SAFE_INTEGER
  ) {
    return false;
  }

  return now >= startsAt && now <= endsAt;
}

function getRelativeTiming(
  event: VenueDashboardEvent,
  now: number
) {
  const startsAt = getStartTimestamp(event);
  const endsAt = getEndTimestamp(event);

  if (isEventLive(event, now)) {
    if (endsAt === Number.MAX_SAFE_INTEGER) {
      return "Happening now";
    }

    return `Ends ${formatRelativeDuration(endsAt - now)}`;
  }

  if (startsAt === Number.MAX_SAFE_INTEGER) {
    return "Time unavailable";
  }

  if (startsAt <= now) {
    return "Already started";
  }

  return `Starts ${formatRelativeDuration(startsAt - now)}`;
}

function formatRelativeDuration(durationMs: number) {
  const totalMinutes = Math.max(
    0,
    Math.round(durationMs / (60 * 1000))
  );

  if (totalMinutes < 1) {
    return "now";
  }

  if (totalMinutes < 60) {
    return `in ${totalMinutes}m`;
  }

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (totalHours < 24) {
    return remainingMinutes > 0
      ? `in ${totalHours}h ${remainingMinutes}m`
      : `in ${totalHours}h`;
  }

  const totalDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  return remainingHours > 0
    ? `in ${totalDays}d ${remainingHours}h`
    : `in ${totalDays}d`;
}

function formatEventRange(event: VenueDashboardEvent) {
  const startsAt = parseDate(event.starts_at);
  const endsAt = parseDate(event.ends_at);

  if (!startsAt || !endsAt) {
    return event.display_time || "Timing unavailable";
  }

  if (isSameCalendarDay(startsAt, endsAt)) {
    return `${formatTime(startsAt)}–${formatTime(endsAt)}`;
  }

  return `${formatTime(startsAt)}–${formatWeekdayShort(
    endsAt
  )} ${formatTime(endsAt)}`;
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getStartTimestamp(event: VenueDashboardEvent) {
  return getTimestamp(event.starts_at);
}

function getEndTimestamp(event: VenueDashboardEvent) {
  return getTimestamp(event.ends_at);
}

function getTimestamp(value: string | null) {
  const date = parseDate(value);

  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
}

function getCalendarDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function isSameCalendarDay(
  firstDate: Date,
  secondDate: Date
) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
  }).format(date);
}

function formatWeekdayShort(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
  }).format(date);
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function TimelineIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
    >
      <path
        d="M7 5.5h10M7 12h10M7 18.5h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle cx="4" cy="5.5" r="1.25" fill="currentColor" />
      <circle cx="4" cy="12" r="1.25" fill="currentColor" />
      <circle cx="4" cy="18.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18.3 15.4A7.2 7.2 0 0 1 8.6 5.7a7.2 7.2 0 1 0 9.7 9.7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.75 19.25 8.4 18.5 18.2 8.7a2.2 2.2 0 0 0 0-3.1l-.8-.8a2.2 2.2 0 0 0-3.1 0L4.5 14.6l-.75 3.65a.85.85 0 0 0 1 1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="m12.9 6.2 4.9 4.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}