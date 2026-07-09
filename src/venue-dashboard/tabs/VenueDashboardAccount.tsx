import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LiveyImageCropper } from "../../components/image-crop/LiveyImageCropper";
import type { DashboardSection } from "../VenueDashboardSidebar";
import type { VenueDashboardVenue } from "../venueDashboardService";
import { LiveyDashboardDropdown } from "./account/LiveyDashboardDropdown";
import type { DayHours } from "./account/accountTypes";
import {
  areaOptions,
  dayStatusOptions,
  statusOptions,
  timeDropdownOptions,
} from "./account/accountOptions";
import {
  buildOpeningHoursDraft,
  formatOpeningHours,
  getOpeningHoursPreview,
} from "./account/accountHoursUtils";

type VenueDashboardAccountProps = {
  currentUser: User | null;
  activeVenue: VenueDashboardVenue | null;
  isRefreshing: boolean;
  isUpdatingVenueProfile: boolean;
  onUpdateVenueProfile: (input: {
    name: string;
    description: string;
    area: string;
    address: string;
    openStatus: string;
    openingHours: string;
    logoFile: File | null;
  }) => void;
  onRefreshDashboard: () => void;
  onSectionChange: (section: DashboardSection) => void;
  onSignOut: () => void;
};

export function VenueDashboardAccount({
  currentUser,
  activeVenue,
  isRefreshing,
  isUpdatingVenueProfile,
  onUpdateVenueProfile,
  onRefreshDashboard,
  onSectionChange,
  onSignOut,
}: VenueDashboardAccountProps) {
  const [name, setName] = useState(activeVenue?.name ?? "");
  const [description, setDescription] = useState(activeVenue?.description ?? "");
  const [area, setArea] = useState(activeVenue?.area ?? "");
  const [address, setAddress] = useState(activeVenue?.address ?? "");
  const [openStatus, setOpenStatus] = useState(
    activeVenue?.open_status ?? "Open now"
  );
  const [openingHours, setOpeningHours] = useState(
    activeVenue?.opening_hours ?? ""
  );

  const [openingHoursDraft, setOpeningHoursDraft] = useState<DayHours[]>(
    buildOpeningHoursDraft(activeVenue?.opening_hours ?? "")
  );
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [isOpeningHoursEditorOpen, setIsOpeningHoursEditorOpen] =
    useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [imageToCropSrc, setImageToCropSrc] = useState<string | null>(null);
  const [imageToCropName, setImageToCropName] = useState("");

  const visibleLogoUrl = logoPreviewUrl || activeVenue?.logo_url || "";

  const filteredAreaOptions = useMemo(() => {
    const cleanArea = area.trim().toLowerCase();

    if (!cleanArea) {
      return areaOptions;
    }

    return areaOptions.filter((option) =>
      option.toLowerCase().includes(cleanArea)
    );
  }, [area]);

  const openingHoursPreview = useMemo(
    () => getOpeningHoursPreview(openingHours),
    [openingHours]
  );

  useEffect(() => {
    const nextOpeningHours = activeVenue?.opening_hours ?? "";

    setName(activeVenue?.name ?? "");
    setDescription(activeVenue?.description ?? "");
    setArea(activeVenue?.area ?? "");
    setAddress(activeVenue?.address ?? "");
    setOpenStatus(activeVenue?.open_status ?? "Open now");
    setOpeningHours(nextOpeningHours);
    setOpeningHoursDraft(buildOpeningHoursDraft(nextOpeningHours));
    setLogoFile(null);

    setLogoPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return null;
    });

    setImageToCropSrc((currentCropUrl) => {
      if (currentCropUrl) {
        URL.revokeObjectURL(currentCropUrl);
      }

      return null;
    });

    setImageToCropName("");
  }, [activeVenue]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }

      if (imageToCropSrc) {
        URL.revokeObjectURL(imageToCropSrc);
      }
    };
  }, [logoPreviewUrl, imageToCropSrc]);

  function handleLogoChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const cropUrl = URL.createObjectURL(file);

    setImageToCropSrc((currentCropUrl) => {
      if (currentCropUrl) {
        URL.revokeObjectURL(currentCropUrl);
      }

      return cropUrl;
    });

    setImageToCropName(file.name);
  }

  function handleCancelCrop() {
    setImageToCropSrc((currentCropUrl) => {
      if (currentCropUrl) {
        URL.revokeObjectURL(currentCropUrl);
      }

      return null;
    });

    setImageToCropName("");
  }

  function handleSaveCrop(file: File, previewUrl: string) {
    setLogoFile(file);

    setLogoPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return previewUrl;
    });

    setImageToCropSrc((currentCropUrl) => {
      if (currentCropUrl) {
        URL.revokeObjectURL(currentCropUrl);
      }

      return null;
    });

    setImageToCropName("");
  }

  function handleStatusChange(nextStatus: string) {
    if (nextStatus === openStatus) return;

    const confirmed = window.confirm(
      `Are you sure you want to change your venue status to "${nextStatus}"? This should only be used for urgent or manual situations.`
    );

    if (!confirmed) return;

    setOpenStatus(nextStatus);
  }

  function updateOpeningHoursDay(
    dayIndex: number,
    updates: Partial<DayHours>
  ) {
    setOpeningHoursDraft((current) =>
      current.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              ...updates,
            }
          : day
      )
    );
  }

  function handleOpenOpeningHoursEditor() {
    setOpeningHoursDraft(buildOpeningHoursDraft(openingHours));
    setIsOpeningHoursEditorOpen(true);
  }

  function handleApplyOpeningHours() {
    setOpeningHours(formatOpeningHours(openingHoursDraft));
    setIsOpeningHoursEditorOpen(false);
  }

  function handleSaveProfile() {
    onUpdateVenueProfile({
      name,
      description,
      area,
      address,
      openStatus,
      openingHours,
      logoFile,
    });
  }

  return (
    <>
      {imageToCropSrc ? (
        <LiveyImageCropper
          imageSrc={imageToCropSrc}
          fileName={imageToCropName || "venue-logo.png"}
          title="Crop venue logo"
          description="Center your venue logo inside the square. This is what people will see on Livey."
          onCancel={handleCancelCrop}
          onSave={handleSaveCrop}
        />
      ) : null}

      <section className="venue-dashboard-account-settings">
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
                    handleLogoChange(event.target.files?.[0] ?? null)
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
                onChange={(event) => setName(event.target.value)}
                placeholder="Venue name"
              />
            </label>

            <label>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Tell people what makes your venue worth visiting."
              />
            </label>

            <label>
              Area
              <div className="venue-dashboard-area-field">
                <input
                  value={area}
                  onFocus={() => setIsAreaDropdownOpen(true)}
                  onChange={(event) => {
                    setArea(event.target.value);
                    setIsAreaDropdownOpen(true);
                  }}
                  onBlur={() =>
                    window.setTimeout(() => setIsAreaDropdownOpen(false), 140)
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
                            setArea(option);
                            setIsAreaDropdownOpen(false);
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
                  onChange={handleStatusChange}
                />
                <small className="venue-dashboard-field-note">
                  Use this only for urgent/manual situations. Activity timing
                  should normally control what appears live.
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
                  onClick={handleOpenOpeningHoursEditor}
                >
                  Edit hours
                </button>
              </label>
            </div>

            <button
              className="venue-dashboard-save-button"
              type="button"
              onClick={handleSaveProfile}
              disabled={isUpdatingVenueProfile}
            >
              {isUpdatingVenueProfile
                ? "Saving venue profile..."
                : "Save venue profile"}
            </button>
          </div>
        </section>

        <aside className="venue-dashboard-account-side">
          <section className="venue-dashboard-card">
            <p className="venue-dashboard-eyebrow">Dashboard controls</p>
            <h2>Useful actions</h2>

            <div className="venue-dashboard-settings-list">
              <button
                type="button"
                onClick={onRefreshDashboard}
                disabled={isRefreshing}
              >
                <span>Refresh dashboard</span>
                <small>
                  {isRefreshing
                    ? "Refreshing your latest venue data..."
                    : "Reload venue, activity, and history data from Livey."}
                </small>
              </button>

              <button type="button" onClick={() => onSectionChange("activity")}>
                <span>Manage activity</span>
                <small>Create, edit, hide, remove, or restore activities.</small>
              </button>

              <a href="mailto:support@livey.network">
                <span>Contact Livey support</span>
                <small>Ask for help with your venue dashboard.</small>
              </a>
            </div>
          </section>

          <section className="venue-dashboard-card">
            <p className="venue-dashboard-eyebrow">Owner account</p>
            <h2>Connected account</h2>

            <div className="venue-dashboard-account-list">
              <div>
                <span>Email</span>
                <strong>{currentUser?.email || "Not available"}</strong>
              </div>

              <div>
                <span>User ID</span>
                <strong>{currentUser?.id || "Not available"}</strong>
              </div>

              <div>
                <span>Connected venue</span>
                <strong>{activeVenue?.name || "No venue connected"}</strong>
              </div>

              <div>
                <span>Venue ID</span>
                <strong>{activeVenue?.id || "Not available"}</strong>
              </div>
            </div>
          </section>

          <section className="venue-dashboard-card venue-dashboard-settings-danger">
            <p className="venue-dashboard-eyebrow">Session</p>
            <h2>Sign out</h2>
            <p>
              Signing out will close the venue dashboard session in this
              browser.
            </p>

            <button
              className="venue-dashboard-danger-button"
              type="button"
              onClick={onSignOut}
            >
              Sign out
            </button>
          </section>
        </aside>
      </section>

      {isOpeningHoursEditorOpen ? (
        <div className="venue-dashboard-hours-editor-backdrop">
          <section className="venue-dashboard-hours-editor-card">
            <div className="venue-dashboard-hours-editor-heading">
              <div>
                <p className="venue-dashboard-eyebrow">Opening hours</p>
                <h2>Edit venue hours</h2>
                <p>
                  Choose whether each day is open or closed, then select opening
                  and closing times.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpeningHoursEditorOpen(false)}
              >
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
                      updateOpeningHoursDay(index, {
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
                      updateOpeningHoursDay(index, {
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
                      updateOpeningHoursDay(index, {
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
                onClick={() => setIsOpeningHoursEditorOpen(false)}
              >
                Cancel
              </button>

              <button
                className="venue-dashboard-save-button"
                type="button"
                onClick={handleApplyOpeningHours}
              >
                Use these hours
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}