import { useEffect } from "react";
import type { MouseEvent } from "react";
import type { VenueDashboardEvent } from "../../venueDashboardService";
import { VenueDashboardHistoryRemovalDetails } from "./VenueDashboardHistoryRemovalDetails";
import {
  VenueDashboardHistoryReuseAction,
  type HistoryReuseMode,
} from "./VenueDashboardHistoryReuseAction";
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
  onReuseEvent: (
    event: VenueDashboardEvent,
    mode: HistoryReuseMode
  ) => void;
};

export function VenueDashboardHistoryDetailsModal({
  venueName,
  event,
  onClose,
  onReuseEvent,
}: VenueDashboardHistoryDetailsModalProps) {
  const wasRemoved =
    wasHistoryEventRemoved(event);

  const historyState =
    getHistoryEventState(event);

  const reuseMode: HistoryReuseMode =
    wasRemoved
      ? "restore"
      : "reuse";

  useModalBehaviour(onClose);

  function handleReuseActivity() {
    onReuseEvent(
      event,
      reuseMode
    );
  }

  return (
    <div
      className="venue-dashboard-history-details-backdrop"
      role="presentation"
      onMouseDown={(mouseEvent) =>
        handleBackdropClick(
          mouseEvent,
          onClose
        )
      }
    >
      <section
        className="venue-dashboard-history-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="venue-dashboard-history-details-title"
      >
        <button
          className="venue-dashboard-history-details-close"
          type="button"
          aria-label="Close archived activity details"
          onClick={onClose}
        >
          <CloseIcon />
        </button>

        <div className="venue-dashboard-history-details-scroll">
          <header className="venue-dashboard-history-details-heading">
            <div
              className="venue-dashboard-history-lock-icon"
              aria-hidden="true"
            >
              <LockIcon />
            </div>

            <p className="venue-dashboard-eyebrow">
              Archived activity
            </p>

            <h2 id="venue-dashboard-history-details-title">
              {event.title ||
                "Untitled activity"}
            </h2>
          </header>

          <div className="venue-dashboard-history-details-state-row">
            <span
              className={[
                "venue-dashboard-history-status",
                wasRemoved
                  ? "is-removed"
                  : "is-expired",
              ].join(" ")}
            >
              <span aria-hidden="true" />

              {historyState}
            </span>

            <span className="venue-dashboard-history-readonly-pill">
              <LockSmallIcon />

              Read only
            </span>
          </div>

          <div className="venue-dashboard-history-details-grid">
            <DetailItem
              label="Venue"
              value={venueName}
              wide
            />

            <DetailItem
              label="Description"
              value={
                event.description ||
                "No description was saved."
              }
              wide
            />

            <DetailItem
              label="Livey status"
              value={
                event.status ||
                "No status saved"
              }
            />

            <DetailItem
              label="Display timing"
              value={
                event.display_time ||
                "No display timing saved"
              }
            />

            <DetailItem
              label="Starts"
              value={formatHistoryDate(
                event.starts_at
              )}
            />

            <DetailItem
              label="Ends"
              value={formatHistoryDate(
                event.ends_at
              )}
            />
          </div>

          {wasRemoved ? (
            <VenueDashboardHistoryRemovalDetails
              event={event}
            />
          ) : null}

          <VenueDashboardHistoryReuseAction
            mode={reuseMode}
            onUseActivity={
              handleReuseActivity
            }
          />
        </div>
      </section>
    </div>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
  wide?: boolean;
};

function DetailItem({
  label,
  value,
  wide = false,
}: DetailItemProps) {
  return (
    <article
      className={[
        "venue-dashboard-history-detail-item",
        wide ? "is-wide" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span>{label}</span>

      <strong>{value}</strong>
    </article>
  );
}

function useModalBehaviour(
  onClose: () => void
) {
  useEffect(() => {
    const body = document.body;

    const currentLockCount = Number(
      body.dataset
        .liveyModalScrollLockCount ?? "0"
    );

    if (currentLockCount === 0) {
      body.dataset
        .liveyPreviousBodyOverflow =
        body.style.overflow;

      body.style.overflow = "hidden";
    }

    body.dataset
      .liveyModalScrollLockCount = String(
      currentLockCount + 1
    );

    function handleKeyDown(
      event: globalThis.KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      const activeLockCount = Number(
        body.dataset
          .liveyModalScrollLockCount ?? "1"
      );

      const remainingLockCount = Math.max(
        0,
        activeLockCount - 1
      );

      if (remainingLockCount > 0) {
        body.dataset
          .liveyModalScrollLockCount =
          String(remainingLockCount);

        return;
      }

      body.style.overflow =
        body.dataset
          .liveyPreviousBodyOverflow ?? "";

      delete body.dataset
        .liveyModalScrollLockCount;

      delete body.dataset
        .liveyPreviousBodyOverflow;
    };
  }, [onClose]);
}

function handleBackdropClick(
  event: MouseEvent<HTMLDivElement>,
  onClose: () => void
) {
  if (
    event.target ===
    event.currentTarget
  ) {
    onClose();
  }
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      aria-hidden="true"
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