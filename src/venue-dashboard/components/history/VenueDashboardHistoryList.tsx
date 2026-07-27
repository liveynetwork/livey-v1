import type {
  VenueDashboardEvent,
} from "../../venueDashboardService";
import type {
  HistoryReuseMode,
} from "./VenueDashboardHistoryReuseAction";
import { VenueDashboardHistoryRowActions } from "./VenueDashboardHistoryRowActions";
import {
  getHistoryEventTiming,
  wasHistoryEventRemoved,
} from "./historyUtils";
import "./VenueDashboardHistoryList.css";

type VenueDashboardHistoryListProps = {
  events: VenueDashboardEvent[];
  onOpenEvent: (
    event: VenueDashboardEvent
  ) => void;
  onReuseEvent?: (
    event: VenueDashboardEvent,
    mode: HistoryReuseMode
  ) => void;
  variant?: "preview" | "archive";
};

export function VenueDashboardHistoryList({
  events,
  onOpenEvent,
  onReuseEvent,
  variant = "preview",
}: VenueDashboardHistoryListProps) {
  return (
    <div
      className={`venue-dashboard-history-list venue-dashboard-history-list-${variant}`}
    >
      {events.map((event) => {
        const wasRemoved =
          wasHistoryEventRemoved(event);

        const reuseMode: HistoryReuseMode =
          wasRemoved
            ? "restore"
            : "reuse";

        const shouldShowQuickActions =
          Boolean(onReuseEvent);

        return (
          <article
            className={[
              "venue-dashboard-history-item",
              variant === "archive"
                ? "is-archive"
                : "is-preview",
            ].join(" ")}
            key={event.id}
          >
            <div
              className="venue-dashboard-history-item-icon"
              aria-hidden="true"
            >
              <ArchivedIcon />
            </div>

            <div className="venue-dashboard-history-main">
              <strong>
                {event.title ||
                  "Untitled activity"}
              </strong>

              <span>
                {getHistoryEventTiming(
                  event
                )}
              </span>
            </div>

            <div className="venue-dashboard-history-actions">
              {shouldShowQuickActions &&
              onReuseEvent ? (
                <VenueDashboardHistoryRowActions
                  event={event}
                  mode={reuseMode}
                  onOpenEvent={
                    onOpenEvent
                  }
                  onReuseEvent={
                    onReuseEvent
                  }
                />
              ) : null}

              <small
                className={[
                  "venue-dashboard-history-status",
                  wasRemoved
                    ? "is-removed"
                    : "is-expired",
                ].join(" ")}
              >
                <span aria-hidden="true" />

                {wasRemoved
                  ? "Removed"
                  : "Expired"}
              </small>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ArchivedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
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
  );
}