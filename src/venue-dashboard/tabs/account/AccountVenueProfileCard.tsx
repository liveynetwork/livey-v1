import { LiveyDashboardDropdown } from "./LiveyDashboardDropdown";
import { statusOptions } from "./accountOptions";
import type { OpeningHoursPreviewItem } from "./accountTypes";

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
      <div className="venue-dashboard-premium-card-heading">
        <div>
          <p className="venue-dashboard-eyebrow">Venue profile</p>
          <h2>Profile controls</h2>
        </div>

        <span className="venue-dashboard-card-status-dot">Editable</span>
      </div>

      <div className="venue-dashboard-form venue-dashboard-profile-form">
        <label>
          Description
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Tell people what makes your venue worth visiting."
          />
        </label>

        <label>
          Opening hours
          <div className="venue-dashboard-today-hours-card">
            <div>
              <span>{todayOpeningHours.title}</span>
              <strong>{todayOpeningHours.value}</strong>
            </div>

            <button
              className="venue-dashboard-secondary-button"
              type="button"
              onClick={onOpenOpeningHoursEditor}
            >
              Edit weekly hours
            </button>
          </div>
        </label>

        <label>
          Status override
          <LiveyDashboardDropdown
            value={openStatus}
            options={statusOptions}
            onChange={onStatusChange}
          />
          <small className="venue-dashboard-field-note">
            Use this only for urgent or manual situations. Activity timing should
            normally control what appears live.
          </small>
        </label>

        <button
          className="venue-dashboard-save-button venue-dashboard-profile-save-button"
          type="button"
          onClick={onSaveProfile}
          disabled={isUpdatingVenueProfile}
        >
          {isUpdatingVenueProfile ? "Saving changes..." : "Save changes"}
        </button>
      </div>
    </section>
  );
}