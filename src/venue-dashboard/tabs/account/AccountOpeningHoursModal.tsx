import { useEffect, useRef, useState } from "react";
import { LiveyDashboardDropdown } from "./LiveyDashboardDropdown";
import { dayStatusOptions, timeDropdownOptions } from "./accountOptions";
import type { DayHours } from "./accountTypes";

type AccountOpeningHoursModalProps = {
  openingHoursDraft: DayHours[];
  onUpdateOpeningHoursDay: (
    dayIndex: number,
    updates: Partial<DayHours>
  ) => void;
  onClose: () => void;
  onApply: () => void;
};

const MODAL_CLOSE_DURATION = 220;

export function AccountOpeningHoursModal({
  openingHoursDraft,
  onUpdateOpeningHoursDay,
  onClose,
  onApply,
}: AccountOpeningHoursModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleRequestClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  function beginClose(callback: () => void) {
    if (isClosing) return;

    setIsClosing(true);

    closeTimeoutRef.current = window.setTimeout(() => {
      callback();
      closeTimeoutRef.current = null;
    }, MODAL_CLOSE_DURATION);
  }

  function handleRequestClose() {
    beginClose(onClose);
  }

  function handleApplyChanges() {
    beginClose(onApply);
  }

  return (
    <div
      className={`venue-dashboard-hours-editor-backdrop ${
        isClosing ? "is-closing" : ""
      }`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleRequestClose();
        }
      }}
    >
      <section
        className={`venue-dashboard-hours-editor-card ${
          isClosing ? "is-closing" : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="venue-dashboard-hours-editor-title"
      >
        <div className="venue-dashboard-hours-editor-heading">
          <div>
            <p className="venue-dashboard-eyebrow">Opening hours</p>

            <h2 id="venue-dashboard-hours-editor-title">Edit venue hours</h2>

            <p>
              Set your weekly opening schedule. These hours are shown inside
              your Livey venue profile.
            </p>
          </div>

          <button
            className="venue-dashboard-hours-editor-close-button"
            type="button"
            aria-label="Close opening hours editor"
            onClick={handleRequestClose}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="venue-dashboard-hours-editor-panel">
          <div className="venue-dashboard-hours-editor-table-header">
            <span>Days</span>
            <span>Status</span>
            <span>Opens</span>
            <span>Closes</span>
          </div>

          <div className="venue-dashboard-hours-editor-list">
            {openingHoursDraft.map((day, index) => (
              <div className="venue-dashboard-hours-editor-row" key={day.day}>
                <strong className="venue-dashboard-hours-day-name">
                  {day.day}
                </strong>

                <div className="venue-dashboard-hours-controls">
                  <LiveyDashboardDropdown
                    value={day.isClosed ? "Closed" : "Open"}
                    options={dayStatusOptions}
                    onChange={(value) =>
                      onUpdateOpeningHoursDay(index, {
                        isClosed: value === "Closed",
                      })
                    }
                  />

                  <LiveyDashboardDropdown
                    value={day.openTime}
                    options={timeDropdownOptions}
                    disabled={day.isClosed}
                    onChange={(value) =>
                      onUpdateOpeningHoursDay(index, {
                        openTime: value,
                      })
                    }
                  />

                  <LiveyDashboardDropdown
                    value={day.closeTime}
                    options={timeDropdownOptions}
                    disabled={day.isClosed}
                    onChange={(value) =>
                      onUpdateOpeningHoursDay(index, {
                        closeTime: value,
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="venue-dashboard-hours-editor-actions">
          <button
            className="venue-dashboard-save-button"
            type="button"
            onClick={handleApplyChanges}
          >
            Save changes
          </button>
        </div>
      </section>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}