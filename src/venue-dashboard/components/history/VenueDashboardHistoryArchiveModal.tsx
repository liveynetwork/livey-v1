import { useEffect } from "react";
import type { MouseEvent } from "react";
import type { VenueDashboardEvent } from "../../venueDashboardService";
import { VenueDashboardHistoryList } from "./VenueDashboardHistoryList";
import "./VenueDashboardHistoryArchiveModal.css";

type VenueDashboardHistoryArchiveModalProps = {
  historyEvents: VenueDashboardEvent[];
  onClose: () => void;
  onOpenEvent: (
    event: VenueDashboardEvent
  ) => void;
};

export function VenueDashboardHistoryArchiveModal({
  historyEvents,
  onClose,
  onOpenEvent,
}: VenueDashboardHistoryArchiveModalProps) {
  useModalBehaviour(onClose);

  return (
    <div
      className="venue-dashboard-history-modal-backdrop"
      role="presentation"
      onMouseDown={(event) =>
        handleBackdropClick(
          event,
          onClose
        )
      }
    >
      <section
        className="venue-dashboard-history-archive-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="venue-dashboard-history-archive-title"
      >
        <header className="venue-dashboard-history-modal-heading">
          <div>
            <p className="venue-dashboard-eyebrow">
              Full archive
            </p>

            <h2 id="venue-dashboard-history-archive-title">
              All past activity
            </h2>

            <p>
              Review every activity that
              expired naturally or was
              removed from Livey.
            </p>
          </div>

          <button
            className="venue-dashboard-history-modal-close"
            type="button"
            aria-label="Close activity archive"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="venue-dashboard-history-archive-summary">
          <span>
            {historyEvents.length}{" "}
            {historyEvents.length === 1
              ? "activity"
              : "activities"}
          </span>
        </div>

        <div className="venue-dashboard-history-archive-scroll">
          <VenueDashboardHistoryList
            events={historyEvents}
            onOpenEvent={onOpenEvent}
            variant="archive"
          />
        </div>
      </section>
    </div>
  );
}

function useModalBehaviour(
  onClose: () => void
) {
  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

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
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);
}

function handleBackdropClick(
  event: MouseEvent<HTMLDivElement>,
  onClose: () => void
) {
  if (
    event.target === event.currentTarget
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