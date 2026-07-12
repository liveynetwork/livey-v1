import { useEffect } from "react";
import type { MouseEvent } from "react";
import type { VenueDashboardEvent } from "../../venueDashboardService";
import {
  formatHistoryDate,
  getHistoryEventState,
  wasHistoryEventRemoved,
} from "./historyUtils";
import "./VenueDashboardHistoryDetailsModal.css";

type VenueDashboardHistoryDetailsModalProps = {
  venueName: string;
  event: VenueDashboardEvent;
  onClose: () => void;
};

export function VenueDashboardHistoryDetailsModal({
  venueName,
  event,
  onClose,
}: VenueDashboardHistoryDetailsModalProps) {
  const wasRemoved = wasHistoryEventRemoved(event);

  useModalBehaviour(onClose);

  return (
    <div
      className="venue-dashboard-history-details-backdrop"
      role="presentation"
      onMouseDown={(mouseEvent) =>
        handleBackdropClick(mouseEvent, onClose)
      }
    >
      <section
        className="venue-dashboard-history-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="venue-dashboard-history-details-title"
      >
        <header className="venue-dashboard-history-details-heading">
          <div
            className="venue-dashboard-history-lock-icon"
            aria-hidden="true"
          >
            <LockIcon />
          </div>

          <p className="venue-dashboard-eyebrow">Archived activity</p>

          <h2 id="venue-dashboard-history-details-title">
            {event.title || "Untitled activity"}
          </h2>
        </header>

        <div className="venue-dashboard-history-details-state-row">
          <span className="venue-dashboard-history-status">
            <span aria-hidden="true" />
            {getHistoryEventState(event)}
          </span>

          <span className="venue-dashboard-history-readonly-pill">
            <LockSmallIcon />
            Read only
          </span>
        </div>

        <div className="venue-dashboard-history-details-grid">
          <DetailItem label="Venue" value={venueName} wide />

          <DetailItem
            label="Description"
            value={event.description || "No description was saved."}
            wide
          />

          <DetailItem
            label="Livey status"
            value={event.status || "No status saved"}
          />

          <DetailItem
            label="Display timing"
            value={event.display_time || "No display timing saved"}
          />

          <DetailItem
            label="Starts"
            value={formatHistoryDate(event.starts_at)}
          />

          <DetailItem
            label="Ends"
            value={formatHistoryDate(event.ends_at)}
          />

          {wasRemoved ? (
            <>
              <DetailItem
                label="Removed"
                value={formatHistoryDate(event.deleted_at)}
              />

              <DetailItem
                label="Removal reason"
                value={event.deleted_reason || "No reason was saved"}
              />
            </>
          ) : null}
        </div>

        <footer className="venue-dashboard-history-details-actions">
          <button
            className="venue-dashboard-secondary-button"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
  wide?: boolean;
};

function DetailItem({ label, value, wide = false }: DetailItemProps) {
  return (
    <article
      className={`venue-dashboard-history-detail-item ${
        wide ? "is-wide" : ""
      }`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function useModalBehaviour(onClose: () => void) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);
}

function handleBackdropClick(
  event: MouseEvent<HTMLDivElement>,
  onClose: () => void
) {
  if (event.target === event.currentTarget) {
    onClose();
  }
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M12 14v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="10"
        width="12"
        height="9"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M9 10V7.5a3 3 0 0 1 6 0V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}