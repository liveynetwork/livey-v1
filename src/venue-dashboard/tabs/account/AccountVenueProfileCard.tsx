import { LiveyDashboardDropdown } from "./LiveyDashboardDropdown";
import { statusOptions } from "./accountOptions";
import type { OpeningHoursPreviewItem } from "./accountTypes";

const DESCRIPTION_MAX_LENGTH = 100;

type AccountVenueProfileCardProps = {
  description: string;
  openStatus: string;
  todayOpeningHours: OpeningHoursPreviewItem;
  isUpdatingVenueProfile: boolean;
  onDescriptionChange: (value: string) => void;
  onStatusChange: (nextStatus: string) => void;
  onOpenOpeningHoursEditor: () => void;
  onSaveProfile: () => void;
};

export function AccountVenueProfileCard({
  description,
  openStatus,
  todayOpeningHours,
  isUpdatingVenueProfile,
  onDescriptionChange,
  onStatusChange,
  onOpenOpeningHoursEditor,
  onSaveProfile,
}: AccountVenueProfileCardProps) {
  return (
    <section className="venue-dashboard-card venue-dashboard-profile-card">
      <div className="venue-dashboard-premium-card-heading venue-dashboard-profile-card-heading">
        <div>
          <p className="venue-dashboard-eyebrow">Venue profile</p>
          <h2>Profile controls</h2>
        </div>
      </div>

      <div className="venue-dashboard-profile-controls-panel">
        <label className="venue-dashboard-profile-control-tile venue-dashboard-description-field">
          <span className="venue-dashboard-profile-control-label">
            Description
          </span>

          <textarea
            value={description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Tell people what makes your venue worth visiting."
          />

          <small className="venue-dashboard-description-count">
            {description.length}/{DESCRIPTION_MAX_LENGTH}
          </small>
        </label>

        <div className="venue-dashboard-profile-control-tile venue-dashboard-opening-hours-field">
          <span className="venue-dashboard-profile-control-label">
            Today’s hours
          </span>

          <div className="venue-dashboard-today-hours-card">
            <span>{todayOpeningHours.title}</span>

            <strong>{todayOpeningHours.value}</strong>

            <button
              className="venue-dashboard-hours-edit-icon-button"
              type="button"
              onClick={onOpenOpeningHoursEditor}
              aria-label="Edit weekly hours"
              title="Edit weekly hours"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
              >
                <path
                  d="M4 20h4.4L19.3 9.1a2.1 2.1 0 0 0 0-3L17.9 4.7a2.1 2.1 0 0 0-3 0L4 15.6V20Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="m13.5 6.1 4.4 4.4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="venue-dashboard-profile-control-tile venue-dashboard-status-override-field">
          <p className="venue-dashboard-profile-control-label">
            Status override
          </p>

          <LiveyDashboardDropdown
            value={openStatus}
            options={statusOptions}
            triggerMode="arrow"
            onChange={onStatusChange}
          />
        </div>

        <div className="venue-dashboard-status-advisory">
          <span
            className="venue-dashboard-status-advisory-icon"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 10.5v5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="7.5" r="1.1" fill="currentColor" />
            </svg>
          </span>

          <small className="venue-dashboard-field-note venue-dashboard-status-override-note">
            STATUS OVERRIDE SHOULD ONLY BE USED FOR URGENT MANUAL CHANGES. YOUR
            ACTIVITY AND OPENING HOURS SHOULD NORMALLY CONTROL WHAT APPEARS ON
            LIVEY. TO RETURN THE VENUE TO ITS AUTOMATIC STATE, SELECT DEFAULT.
          </small>
        </div>
      </div>

      <button
        className="venue-dashboard-save-button venue-dashboard-profile-save-button"
        type="button"
        onClick={onSaveProfile}
        disabled={isUpdatingVenueProfile}
      >
        {isUpdatingVenueProfile ? "Saving changes..." : "Save changes"}
      </button>
    </section>
  );
}