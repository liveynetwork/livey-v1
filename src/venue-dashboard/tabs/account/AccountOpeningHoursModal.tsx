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

export function AccountOpeningHoursModal({
  openingHoursDraft,
  onUpdateOpeningHoursDay,
  onClose,
  onApply,
}: AccountOpeningHoursModalProps) {
  return (
    <div className="venue-dashboard-hours-editor-backdrop">
      <section className="venue-dashboard-hours-editor-card">
        <div className="venue-dashboard-hours-editor-heading">
          <div>
            <p className="venue-dashboard-eyebrow">Opening hours</p>
            <h2>Edit venue hours</h2>
            <p>
              Choose whether each day is open or closed, then select opening and
              closing times.
            </p>
          </div>

          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="venue-dashboard-hours-editor-list">
          {openingHoursDraft.map((day, index) => (
            <div className="venue-dashboard-hours-editor-row" key={day.day}>
              <strong>{day.day}</strong>

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
                label="Opens"
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
                label="Closes"
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
          ))}
        </div>

        <div className="venue-dashboard-hours-editor-actions">
          <button
            className="venue-dashboard-secondary-button"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="venue-dashboard-save-button"
            type="button"
            onClick={onApply}
          >
            Use these hours
          </button>
        </div>
      </section>
    </div>
  );
}