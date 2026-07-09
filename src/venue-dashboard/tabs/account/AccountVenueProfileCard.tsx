import { LiveyDashboardDropdown } from "./LiveyDashboardDropdown";
import { statusOptions } from "./accountOptions";
import type { OpeningHoursPreviewItem } from "./accountTypes";

type AccountVenueProfileCardProps = {
  name: string;
  description: string;
  area: string;
  address: string;
  openStatus: string;
  visibleLogoUrl: string;
  filteredAreaOptions: string[];
  openingHoursPreview: OpeningHoursPreviewItem[];
  isAreaDropdownOpen: boolean;
  isUpdatingVenueProfile: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onAreaDropdownOpenChange: (isOpen: boolean) => void;
  onLogoChange: (file: File | null) => void;
  onStatusChange: (nextStatus: string) => void;
  onOpenOpeningHoursEditor: () => void;
  onSaveProfile: () => void;
};

export function AccountVenueProfileCard({
  name,
  description,
  area,
  address,
  openStatus,
  visibleLogoUrl,
  filteredAreaOptions,
  openingHoursPreview,
  isAreaDropdownOpen,
  isUpdatingVenueProfile,
  onNameChange,
  onDescriptionChange,
  onAreaChange,
  onAreaDropdownOpenChange,
  onLogoChange,
  onStatusChange,
  onOpenOpeningHoursEditor,
  onSaveProfile,
}: AccountVenueProfileCardProps) {
  return (
    <section className="venue-dashboard-card venue-dashboard-profile-card">
      <div className="venue-dashboard-account-heading">
        <div>
          <p className="venue-dashboard-eyebrow">Account Settings</p>
          <h2>Public venue profile</h2>
          <p>
            Control how your venue appears inside Livey. These updates go
            through the secure dashboard bridge and update the main Livey app
            venue profile.
          </p>
        </div>

        <div className="venue-dashboard-logo-editor">
          <div className="venue-dashboard-logo-preview">
            {visibleLogoUrl ? (
              <img src={visibleLogoUrl} alt={name || "Venue logo"} />
            ) : (
              <span>{name?.charAt(0) || "L"}</span>
            )}
          </div>

          <label className="venue-dashboard-logo-upload">
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                onLogoChange(event.target.files?.[0] ?? null)
              }
            />
            Change logo
          </label>
        </div>
      </div>

      <div className="venue-dashboard-form venue-dashboard-profile-form">
        <label>
          Venue name
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Venue name"
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Tell people what makes your venue worth visiting."
          />
        </label>

        <label>
          Area
          <div className="venue-dashboard-area-field">
            <input
              value={area}
              onFocus={() => onAreaDropdownOpenChange(true)}
              onChange={(event) => {
                onAreaChange(event.target.value);
                onAreaDropdownOpenChange(true);
              }}
              onBlur={() =>
                window.setTimeout(() => onAreaDropdownOpenChange(false), 140)
              }
              placeholder="Search area"
            />

            {isAreaDropdownOpen ? (
              <div className="venue-dashboard-area-menu">
                {filteredAreaOptions.length > 0 ? (
                  filteredAreaOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onMouseDown={() => {
                        onAreaChange(option);
                        onAreaDropdownOpenChange(false);
                      }}
                    >
                      {option}
                    </button>
                  ))
                ) : (
                  <span>No matching area</span>
                )}
              </div>
            ) : null}
          </div>
        </label>

        <label>
          Address
          <input value={address} readOnly />
          <small className="venue-dashboard-field-note">
            Address is locked to protect location accuracy. Later, address
            changes should use a new Google Maps verification flow.
          </small>
        </label>

        <div className="venue-dashboard-profile-row">
          <label>
            Status override
            <LiveyDashboardDropdown
              value={openStatus}
              options={statusOptions}
              onChange={onStatusChange}
            />
            <small className="venue-dashboard-field-note">
              Use this only for urgent/manual situations. Activity timing should
              normally control what appears live.
            </small>
          </label>

          <label>
            Opening hours
            <div className="venue-dashboard-hours-summary">
              {openingHoursPreview.map((item) => (
                <div key={`${item.title}-${item.value}`}>
                  <span>{item.title}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <button
              className="venue-dashboard-secondary-button"
              type="button"
              onClick={onOpenOpeningHoursEditor}
            >
              Edit hours
            </button>
          </label>
        </div>

        <button
          className="venue-dashboard-save-button"
          type="button"
          onClick={onSaveProfile}
          disabled={isUpdatingVenueProfile}
        >
          {isUpdatingVenueProfile
            ? "Saving venue profile..."
            : "Save venue profile"}
        </button>
      </div>
    </section>
  );
}