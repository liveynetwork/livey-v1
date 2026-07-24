import type {
  VenueRequestDay,
  VenueRequestLiveStatus,
} from "../../services/venueRequests";
import {
  days,
  liveStatuses,
  timeOptions,
} from "../venueSignupConfig";
import type {
  UpdateVenueSignupField,
  VenueSignupFormState,
} from "../venueSignupTypes";

type VenueOpeningInfoSectionProps = {
  form: VenueSignupFormState;
  updateField: UpdateVenueSignupField;
  onToggleClosedDay: (day: VenueRequestDay) => void;
};

export function VenueOpeningInfoSection({
  form,
  updateField,
  onToggleClosedDay,
}: VenueOpeningInfoSectionProps) {
  return (
    <section className="livey-venue-signup-section">
      <div>
        <p className="livey-venue-signup-section-kicker">Step 4</p>
        <h2>Opening info</h2>

        <p className="livey-venue-signup-section-note">
          Choose your usual opening times. You can mark closed days separately.
        </p>
      </div>

      <div className="livey-venue-time-grid">
        <label>
          Weekday opens
          <select
            value={form.weekdayOpenTime}
            onChange={(event) =>
              updateField("weekdayOpenTime", event.target.value)
            }
          >
            {timeOptions.map((time) => (
              <option
                key={`weekday-open-${time}`}
                value={time === "Closed" ? "" : time}
              >
                {time}
              </option>
            ))}
          </select>
        </label>

        <label>
          Weekday closes
          <select
            value={form.weekdayCloseTime}
            onChange={(event) =>
              updateField("weekdayCloseTime", event.target.value)
            }
          >
            {timeOptions.map((time) => (
              <option
                key={`weekday-close-${time}`}
                value={time === "Closed" ? "" : time}
              >
                {time}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="livey-venue-time-grid">
        <label>
          Weekend opens
          <select
            value={form.weekendOpenTime}
            onChange={(event) =>
              updateField("weekendOpenTime", event.target.value)
            }
          >
            {timeOptions.map((time) => (
              <option
                key={`weekend-open-${time}`}
                value={time === "Closed" ? "" : time}
              >
                {time}
              </option>
            ))}
          </select>
        </label>

        <label>
          Weekend closes
          <select
            value={form.weekendCloseTime}
            onChange={(event) =>
              updateField("weekendCloseTime", event.target.value)
            }
          >
            {timeOptions.map((time) => (
              <option
                key={`weekend-close-${time}`}
                value={time === "Closed" ? "" : time}
              >
                {time}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="livey-venue-closed-days">
        <p>Closed days</p>

        <div className="livey-venue-closed-day-grid">
          {days.map((day) => {
            const isSelected = form.closedDays.includes(day);

            return (
              <button
                className={`livey-venue-closed-day ${
                  isSelected ? "selected" : ""
                }`}
                key={day}
                type="button"
                onClick={() => onToggleClosedDay(day)}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      <label>
        Current status
        <select
          value={form.openStatus}
          onChange={(event) =>
            updateField(
              "openStatus",
              event.target.value as VenueRequestLiveStatus
            )
          }
        >
          {liveStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}