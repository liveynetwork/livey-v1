import type { VenueRequestLiveStatus } from "../../services/venueRequests";
import {
  liveStatuses,
  openingStatusOptions,
  timeOptions,
} from "../venueSignupConfig";
import type {
  UpdateVenueSignupField,
  VenueOpeningHoursDay,
  VenueSignupFormState,
} from "../venueSignupTypes";
import { VenueHoursDropdown } from "./VenueHoursDropdown";

type VenueOpeningInfoSectionProps = {
  form: VenueSignupFormState;
  updateField: UpdateVenueSignupField;
  onUpdateOpeningHoursDay: (
    dayIndex: number,
    updates: Partial<VenueOpeningHoursDay>
  ) => void;
};

export function VenueOpeningInfoSection({
  form,
  updateField,
  onUpdateOpeningHoursDay,
}: VenueOpeningInfoSectionProps) {
  return (
    <section className="livey-venue-signup-section livey-venue-opening-section">
      <div className="livey-venue-signup-section-heading">
        <p className="livey-venue-signup-section-kicker">Step 4</p>

        <h2>Opening hours</h2>

        <p className="livey-venue-signup-section-note">
          Set the weekly schedule people will see on your Livey venue profile.
        </p>
      </div>

      <div className="livey-venue-opening-panel">
        <div className="livey-venue-opening-table-heading">
          <span>Day</span>
          <span>Status</span>
          <span>Opens</span>
          <span>Closes</span>
        </div>

        <div className="livey-venue-opening-list">
          {form.openingHoursSchedule.map((day, index) => (
            <div className="livey-venue-opening-row" key={day.day}>
              <strong className="livey-venue-opening-day">
                {day.day}
              </strong>

              <div className="livey-venue-opening-controls">
                <div className="livey-venue-opening-control">
                  <span>Status</span>

                  <VenueHoursDropdown
                    value={day.isClosed ? "Closed" : "Open"}
                    options={openingStatusOptions}
                    ariaLabel={`${day.day} opening status`}
                    onChange={(status) =>
                      onUpdateOpeningHoursDay(index, {
                        isClosed: status === "Closed",
                      })
                    }
                  />
                </div>

                <div className="livey-venue-opening-control">
                  <span>Opens</span>

                  <VenueHoursDropdown
                    value={day.openTime}
                    options={timeOptions}
                    ariaLabel={`${day.day} opening time`}
                    disabled={day.isClosed}
                    onChange={(openTime) =>
                      onUpdateOpeningHoursDay(index, {
                        openTime,
                      })
                    }
                  />
                </div>

                <div className="livey-venue-opening-control">
                  <span>Closes</span>

                  <VenueHoursDropdown
                    value={day.closeTime}
                    options={timeOptions}
                    ariaLabel={`${day.day} closing time`}
                    disabled={day.isClosed}
                    onChange={(closeTime) =>
                      onUpdateOpeningHoursDay(index, {
                        closeTime,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="livey-venue-contact-method-field">
        <span className="livey-venue-contact-method-label">
          Current status
        </span>

        <VenueHoursDropdown
          value={form.openStatus}
          options={liveStatuses}
          ariaLabel="Current venue status"
          onChange={(status) =>
            updateField(
              "openStatus",
              status as VenueRequestLiveStatus
            )
          }
        />
      </div>
    </section>
  );
}