import type { KeyboardEvent, MouseEvent } from "react";
import type { VenueDashboardEvent } from "../../venueDashboardService";
import {
  getHistoryEventTiming,
  wasHistoryEventRemoved,
} from "./historyUtils";

type VenueDashboardHistoryListProps = {
  events: VenueDashboardEvent[];
  isRestoringEvent: boolean;
  onOpenEvent: (event: VenueDashboardEvent) => void;
  onRestoreEvent: (event: VenueDashboardEvent) => void;
  variant?: "preview" | "archive";
};

export function VenueDashboardHistoryList({
  events,
  isRestoringEvent,
  onOpenEvent,
  onRestoreEvent,
  variant = "preview",
}: VenueDashboardHistoryListProps) {
  return (
    <div
      className={`venue-dashboard-history-list venue-dashboard-history-list-${variant}`}
    >
      {events.map((event) => {
        const wasRemoved = wasHistoryEventRemoved(event);

        return (
          <article
            className={`venue-dashboard-history-item ${
              wasRemoved ? "is-removed" : "is-expired"
            }`}
            key={event.id}
            role="button"
            tabIndex={0}
            aria-label={`Open archived activity details for ${
              event.title || "Untitled activity"
            }`}
            onClick={() => onOpenEvent(event)}
            onKeyDown={(keyboardEvent) =>
              handleHistoryItemKeyDown(keyboardEvent, event, onOpenEvent)
            }
          >
            <div
              className="venue-dashboard-history-item-icon"
              aria-hidden="true"
            >
              {wasRemoved ? <RemovedIcon /> : <ExpiredIcon />}
            </div>

            <div className="venue-dashboard-history-main">
              <strong>{event.title || "Untitled activity"}</strong>
              <span>{getHistoryEventTiming(event)}</span>
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
                  onClick={(mouseEvent) =>
                    handleRestoreClick(mouseEvent, event, onRestoreEvent)
                  }
                  disabled={isRestoringEvent}
                >
                  <RestoreIcon />

                  {isRestoringEvent ? "Restoring..." : "Restore"}
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function handleHistoryItemKeyDown(
  keyboardEvent: KeyboardEvent<HTMLElement>,
  event: VenueDashboardEvent,
  onOpenEvent: (event: VenueDashboardEvent) => void
) {
  if (keyboardEvent.key !== "Enter" && keyboardEvent.key !== " ") {
    return;
  }

  keyboardEvent.preventDefault();
  onOpenEvent(event);
}

function handleRestoreClick(
  mouseEvent: MouseEvent<HTMLButtonElement>,
  event: VenueDashboardEvent,
  onRestoreEvent: (event: VenueDashboardEvent) => void
) {
  mouseEvent.stopPropagation();
  onRestoreEvent(event);
}

function RemovedIcon() {
  return (
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
  );
}

function ExpiredIcon() {
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
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RestoreIcon() {
  return (
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
  );
}