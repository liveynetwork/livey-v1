import type { KeyboardEvent } from "react";
import type { VenueDashboardEvent } from "../../venueDashboardService";
import {
  getHistoryEventTiming,
  wasHistoryEventRemoved,
} from "./historyUtils";
import "./VenueDashboardHistoryList.css";

type VenueDashboardHistoryListProps = {
  events: VenueDashboardEvent[];
  onOpenEvent: (event: VenueDashboardEvent) => void;
  variant?: "preview" | "archive";
};

export function VenueDashboardHistoryList({
  events,
  onOpenEvent,
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
            className="venue-dashboard-history-item"
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
              <ArchivedIcon />
            </div>

            <div className="venue-dashboard-history-main">
              <strong>{event.title || "Untitled activity"}</strong>

              <span>{getHistoryEventTiming(event)}</span>
            </div>

            <div className="venue-dashboard-history-actions">
              <small className="venue-dashboard-history-status">
                <span aria-hidden="true" />
                {wasRemoved ? "Removed" : "Expired"}
              </small>
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

function ArchivedIcon() {
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