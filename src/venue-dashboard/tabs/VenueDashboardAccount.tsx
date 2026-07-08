import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LiveyImageCropper } from "../../components/image-crop/LiveyImageCropper";
import type { DashboardSection } from "../VenueDashboardSidebar";
import type { VenueDashboardVenue } from "../venueDashboardService";

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

type DayHours = {
  day: string;
  shortDay: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

type LiveyDropdownOption = {
  label: string;
  value: string;
};

type LiveyDashboardDropdownProps = {
  label?: string;
  value: string;
  options: LiveyDropdownOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

const statusOptions: LiveyDropdownOption[] = [
  { label: "Open now", value: "Open now" },
  { label: "Live now", value: "Live now" },
  { label: "Tonight", value: "Tonight" },
  { label: "Weekend", value: "Weekend" },
  { label: "Closed", value: "Closed" },
];

const dayStatusOptions: LiveyDropdownOption[] = [
  { label: "Open", value: "Open" },
  { label: "Closed", value: "Closed" },
];

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

const timeDropdownOptions: LiveyDropdownOption[] = timeOptions.map((time) => ({
  label: time,
  value: time,
}));

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

function LiveyDashboardDropdown({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: LiveyDashboardDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div
      className={`venue-dashboard-custom-dropdown ${disabled ? "disabled" : ""}`}
    >
      {label ? <span>{label}</span> : null}

      <button
        type="button"
        disabled={disabled}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        onClick={() => setIsOpen((current) => !current)}
      >
        {selectedOption?.label ?? value}
        <small>⌄</small>
      </button>

      {isOpen && !disabled ? (
        <div className="venue-dashboard-custom-dropdown-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === value ? "selected" : ""}
              onMouseDown={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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
      day.isClosed = false;
    });
  }

  if (weekendMatch) {
    draft.slice(5).forEach((day) => {
      day.openTime = weekendMatch[1];
      day.closeTime = weekendMatch[2];
      day.isClosed = false;
    });
  }

  openingHours.split("•").forEach((section) => {
    const cleanSection = section.trim();

    draft.forEach((day) => {
      if (!cleanSection.startsWith(day.shortDay)) return;

      if (cleanSection.toLowerCase().includes("closed")) {
        day.isClosed = true;
        return;
      }

      const timeMatch = cleanSection.match(
        /(\d{2}:\d{2})[–-](\d{2}:\d{2})/
      );

      if (timeMatch) {
        day.openTime = timeMatch[1];
        day.closeTime = timeMatch[2];
        day.isClosed = false;
      }
    });
  });

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

function getOpeningHoursPreview(openingHours: string) {
  const days = buildOpeningHoursDraft(openingHours);

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

  if (openingHours && sameWeekdayHours && sameWeekendHours) {
    return [
      {
        title: "Weekdays",
        value: `${weekdayOpen}–${weekdayClose}`,
      },
      {
        title: "Weekend",
        value: `${weekendOpen}–${weekendClose}`,
      },
    ];
  }

  return days.map((day) => ({
    title: day.shortDay,
    value: day.isClosed ? "Closed" : `${day.openTime}–${day.closeTime}`,
  }));
}

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
              {isUpdatingVenueProfile ? "Saving venue profile..." : "Save venue profile"}
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