import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LiveyImageCropper } from "../../components/image-crop/LiveyImageCropper";
import type { VenueDashboardVenue } from "../venueDashboardService";

type VenueDashboardAccountProps = {
  currentUser: User | null;
  activeVenue: VenueDashboardVenue | null;
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
  onSignOut: () => void;
};

type DayHours = {
  day: string;
  shortDay: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

const areaOptions = [
  "Limassol",
  "Kolonakiou",
  "Germasogeia",
  "Potamos Germasogeias",
  "Old Town",
  "Limassol Marina",
  "Molos",
  "Enaerios",
  "Neapolis",
  "Agios Athanasios",
  "Mesa Geitonia",
  "Zakaki",
  "Ypsonas",
  "Agios Tychonas",
  "Amathus",
  "Nicosia",
  "Strovolos",
  "Engomi",
  "Lakatamia",
  "Aglantzia",
  "Larnaca",
  "Finikoudes",
  "Mackenzie",
  "Paphos",
  "Kato Paphos",
  "Chloraka",
  "Coral Bay",
  "Famagusta",
  "Ayia Napa",
  "Protaras",
];

const timeOptions = [
  "00:00",
  "00:30",
  "01:00",
  "01:30",
  "02:00",
  "02:30",
  "03:00",
  "03:30",
  "04:00",
  "04:30",
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
];

const defaultOpeningHours: DayHours[] = [
  {
    day: "Monday",
    shortDay: "Mon",
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: false,
  },
  {
    day: "Tuesday",
    shortDay: "Tue",
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: false,
  },
  {
    day: "Wednesday",
    shortDay: "Wed",
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: false,
  },
  {
    day: "Thursday",
    shortDay: "Thu",
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: false,
  },
  {
    day: "Friday",
    shortDay: "Fri",
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: false,
  },
  {
    day: "Saturday",
    shortDay: "Sat",
    openTime: "10:00",
    closeTime: "22:00",
    isClosed: false,
  },
  {
    day: "Sunday",
    shortDay: "Sun",
    openTime: "10:00",
    closeTime: "22:00",
    isClosed: false,
  },
];

function buildOpeningHoursDraft(openingHours: string): DayHours[] {
  const draft = defaultOpeningHours.map((day) => ({ ...day }));

  const weekdayMatch = openingHours.match(
    /Weekdays\s+(\d{2}:\d{2})[–-](\d{2}:\d{2})/i
  );
  const weekendMatch = openingHours.match(
    /Weekends\s+(\d{2}:\d{2})[–-](\d{2}:\d{2})/i
  );

  if (weekdayMatch) {
    draft.slice(0, 5).forEach((day) => {
      day.openTime = weekdayMatch[1];
      day.closeTime = weekdayMatch[2];
    });
  }

  if (weekendMatch) {
    draft.slice(5).forEach((day) => {
      day.openTime = weekendMatch[1];
      day.closeTime = weekendMatch[2];
    });
  }

  return draft;
}

function formatOpeningHours(days: DayHours[]) {
  const weekdayDays = days.slice(0, 5);
  const weekendDays = days.slice(5);

  const weekdayOpen = weekdayDays[0]?.openTime ?? "09:00";
  const weekdayClose = weekdayDays[0]?.closeTime ?? "18:00";
  const weekendOpen = weekendDays[0]?.openTime ?? "10:00";
  const weekendClose = weekendDays[0]?.closeTime ?? "22:00";

  const sameWeekdayHours = weekdayDays.every(
    (day) =>
      !day.isClosed &&
      day.openTime === weekdayOpen &&
      day.closeTime === weekdayClose
  );

  const sameWeekendHours = weekendDays.every(
    (day) =>
      !day.isClosed &&
      day.openTime === weekendOpen &&
      day.closeTime === weekendClose
  );

  if (sameWeekdayHours && sameWeekendHours) {
    return `Weekdays ${weekdayOpen}–${weekdayClose} • Weekends ${weekendOpen}–${weekendClose}`;
  }

  return days
    .map((day) =>
      day.isClosed
        ? `${day.shortDay} Closed`
        : `${day.shortDay} ${day.openTime}–${day.closeTime}`
    )
    .join(" • ");
}

export function VenueDashboardAccount({
  currentUser,
  activeVenue,
  isUpdatingVenueProfile,
  onUpdateVenueProfile,
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
          fileName={imageToCropName || "venue-logo"}
          title="Crop venue logo"
          description="Move and zoom the image until the venue logo looks clean and centered."
          onCancel={handleCancelCrop}
          onSave={handleSaveCrop}
        />
      ) : null}

      {isOpeningHoursEditorOpen ? (
        <div
          className="venue-dashboard-hours-editor-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <section className="venue-dashboard-hours-editor-card">
            <div className="venue-dashboard-hours-editor-header">
              <div>
                <p className="venue-dashboard-eyebrow">Opening hours</p>
                <h2>Edit weekly hours</h2>
                <span>
                  Use dropdowns for each day. These hours update the public
                  venue profile after saving.
                </span>
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

                  <label>
                    Status
                    <select
                      value={day.isClosed ? "Closed" : "Open"}
                      onChange={(event) =>
                        updateOpeningHoursDay(index, {
                          isClosed: event.target.value === "Closed",
                        })
                      }
                    >
                      <option value="Open">Open</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </label>

                  <label>
                    Opens
                    <select
                      value={day.openTime}
                      disabled={day.isClosed}
                      onChange={(event) =>
                        updateOpeningHoursDay(index, {
                          openTime: event.target.value,
                        })
                      }
                    >
                      {timeOptions.map((time) => (
                        <option key={`${day.day}-open-${time}`} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Closes
                    <select
                      value={day.closeTime}
                      disabled={day.isClosed}
                      onChange={(event) =>
                        updateOpeningHoursDay(index, {
                          closeTime: event.target.value,
                        })
                      }
                    >
                      {timeOptions.map((time) => (
                        <option key={`${day.day}-close-${time}`} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>

            <div className="venue-dashboard-hours-editor-actions">
              <button
                type="button"
                onClick={() => setIsOpeningHoursEditorOpen(false)}
              >
                Cancel
              </button>

              <button type="button" onClick={handleApplyOpeningHours}>
                Apply hours
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <section className="venue-dashboard-account-page">
        <section className="venue-dashboard-card venue-dashboard-profile-card">
          <div className="venue-dashboard-section-heading">
            <p className="venue-dashboard-eyebrow">Venue profile</p>
            <h2>Public Livey profile</h2>
            <p>
              Changes here update the venue profile shown inside the Livey app.
            </p>
          </div>

          <div className="venue-dashboard-logo-editor">
            <div className="venue-dashboard-logo-preview">
              {visibleLogoUrl ? (
                <img src={visibleLogoUrl} alt={activeVenue?.name || "Venue"} />
              ) : (
                <span>{activeVenue?.name?.slice(0, 1) || "L"}</span>
              )}
            </div>

            <div>
              <h3>Venue logo</h3>
              <p>
                Upload a PNG, JPG, or WebP. Crop it before saving so it looks
                clean inside Livey.
              </p>

              <label className="venue-dashboard-logo-upload-button">
                {logoFile ? "Change cropped image" : "Upload and crop logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    handleLogoChange(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />
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
                placeholder="Describe your venue."
              />
            </label>

            <div className="venue-dashboard-form-row">
              <label className="venue-dashboard-searchable-field">
                Area
                <input
                  value={area}
                  onBlur={() =>
                    window.setTimeout(() => setIsAreaDropdownOpen(false), 120)
                  }
                  onChange={(event) => {
                    setArea(event.target.value);
                    setIsAreaDropdownOpen(true);
                  }}
                  onFocus={() => setIsAreaDropdownOpen(true)}
                  placeholder="Search area"
                />

                {isAreaDropdownOpen ? (
                  <div className="venue-dashboard-area-dropdown">
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
                      <span>No matching areas</span>
                    )}
                  </div>
                ) : null}
              </label>

              <label>
                Status
                <select
                  value={openStatus}
                  onChange={(event) => setOpenStatus(event.target.value)}
                >
                  <option value="Open now">Open now</option>
                  <option value="Live now">Live now</option>
                  <option value="Tonight">Tonight</option>
                  <option value="Weekend">Weekend</option>
                  <option value="Closed">Closed</option>
                </select>
                <span className="venue-dashboard-field-note">
                  Used only for urgent/manual cases. Normal status will become
                  automatic later.
                </span>
              </label>
            </div>

            <label>
              Address
              <input
                value={address}
                readOnly
                placeholder="Venue address"
              />
              <span className="venue-dashboard-field-note">
                Address is locked because location changes need verification.
              </span>
            </label>

            <div className="venue-dashboard-opening-hours-summary">
              <div>
                <span>Opening hours</span>
                <strong>{openingHours || "No opening hours added yet"}</strong>
              </div>

              <button type="button" onClick={handleOpenOpeningHoursEditor}>
                Edit hours
              </button>
            </div>

            <button
              className="venue-dashboard-save-button"
              type="button"
              onClick={handleSaveProfile}
              disabled={isUpdatingVenueProfile || !activeVenue}
            >
              {isUpdatingVenueProfile ? "Saving..." : "Save venue profile"}
            </button>
          </div>
        </section>

        <section className="venue-dashboard-card venue-dashboard-owner-card">
          <p className="venue-dashboard-eyebrow">Account</p>
          <h2>Owner information</h2>

          <div className="venue-dashboard-account-list">
            <div>
              <span>Email</span>
              <strong>{currentUser?.email || "No email found"}</strong>
            </div>

            <div>
              <span>Connected venue</span>
              <strong>{activeVenue?.name || "No venue connected"}</strong>
            </div>

            <div>
              <span>Venue ID</span>
              <strong>{activeVenue?.id || "No venue ID found"}</strong>
            </div>

            <div>
              <span>Role</span>
              <strong>Owner</strong>
            </div>
          </div>

          <div className="venue-dashboard-session-box">
            <p className="venue-dashboard-eyebrow">Session</p>
            <h2>Sign out</h2>
            <p>
              Signing out will return this browser to the Livey dashboard auth
              screen.
            </p>

            <button
              className="venue-dashboard-danger-button"
              type="button"
              onClick={onSignOut}
            >
              Sign out
            </button>
          </div>
        </section>
      </section>
    </>
  );
}