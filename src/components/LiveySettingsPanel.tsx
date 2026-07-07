import { useEffect, useRef, useState, type ReactNode } from "react";
import { LiveyAvatarCropModal } from "./LiveyAvatarCropModal";
import { signOutLiveyUser } from "../services/auth";
import {
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
  updateCurrentUserSettings,
  uploadCurrentUserAvatar,
  type LiveyProfileData,
} from "../services/profile";
import "./LiveySettingsPanel.css";

type LiveySettingsPanelProps = {
  open: boolean;
  onClose: () => void;
};

type SettingsSection = "account" | "livey" | "privacy" | "support" | "venue";

type SettingsSectionButtonProps = {
  label: string;
  section: SettingsSection;
  openSection: SettingsSection | null;
  onToggle: (section: SettingsSection) => void;
};

type SettingsSectionContentProps = {
  section: SettingsSection;
  openSection: SettingsSection | null;
  children: ReactNode;
};

type SettingsToggleRowProps = {
  title: string;
  description: string;
  enabled: boolean;
  disabled: boolean;
  onClick: () => void;
};

const cyprusCities = [
  "Limassol",
  "Nicosia",
  "Larnaca",
  "Paphos",
  "Famagusta",
  "Kyrenia",
];

function SettingsSectionButton({
  label,
  section,
  openSection,
  onToggle,
}: SettingsSectionButtonProps) {
  const isOpen = openSection === section;

  return (
    <button
      className="livey-settings-section-button"
      type="button"
      onClick={() => onToggle(section)}
      aria-expanded={isOpen}
    >
      <span>{label}</span>

      <span
        className={[
          "livey-settings-plus",
          isOpen ? "livey-settings-plus-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      />
    </button>
  );
}

function SettingsSectionContent({
  section,
  openSection,
  children,
}: SettingsSectionContentProps) {
  const isOpen = openSection === section;

  return (
    <div
      className={[
        "livey-settings-section-content",
        isOpen ? "livey-settings-section-content-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!isOpen}
    >
      <div className="livey-settings-section-inner">{children}</div>
    </div>
  );
}

function SettingsToggleRow({
  title,
  description,
  enabled,
  disabled,
  onClick,
}: SettingsToggleRowProps) {
  return (
    <button
      className="livey-settings-row livey-settings-toggle-row"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={enabled}
    >
      <span className="livey-settings-row-copy">
        <span>{title}</span>
        <small>{description}</small>
      </span>

      <span
        className={[
          "livey-settings-switch",
          enabled ? "livey-settings-switch-on" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      >
        <span />
      </span>
    </button>
  );
}

export function LiveySettingsPanel({
  open,
  onClose,
}: LiveySettingsPanelProps) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [openSection, setOpenSection] = useState<SettingsSection | null>(
    "account"
  );
  const [profileData, setProfileData] = useState<LiveyProfileData | null>(null);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [accountDataOpen, setAccountDataOpen] = useState(false);
  const [avatarCropSource, setAvatarCropSource] = useState<string | null>(null);
  const [avatarCropFileName, setAvatarCropFileName] =
    useState("livey-avatar.jpeg");

  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    async function loadSettings() {
      try {
        const data = await fetchCurrentUserProfile();

        if (isMounted) {
          setProfileData(data);
          setDisplayNameDraft(data.profile?.display_name ?? "");
        }
      } catch (error) {
        console.error("Failed to load Livey settings:", error);
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (avatarCropSource) {
        URL.revokeObjectURL(avatarCropSource);
      }
    };
  }, [avatarCropSource]);

  useEffect(() => {
    if (!settingsNotice) return;

    const timeoutId = window.setTimeout(() => {
      setSettingsNotice(null);
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [settingsNotice]);

  function toggleSection(section: SettingsSection) {
    setOpenSection((currentSection) =>
      currentSection === section ? null : section
    );
  }

  function mergeUpdatedSettings(updatedSettings: LiveyProfileData["settings"]) {
    if (!updatedSettings) return;

    setProfileData((currentData) => ({
      userEmail: currentData?.userEmail ?? null,
      profile: currentData?.profile ?? null,
      followedVenues: currentData?.followedVenues ?? [],
      settings: updatedSettings,
    }));
  }

  function mergeUpdatedProfile(updatedProfile: LiveyProfileData["profile"]) {
    if (!updatedProfile) return;

    setProfileData((currentData) => ({
      userEmail: currentData?.userEmail ?? null,
      profile: updatedProfile,
      followedVenues: currentData?.followedVenues ?? [],
      settings: currentData?.settings ?? null,
    }));
  }

  function closeAvatarCropModal() {
    if (avatarCropSource) {
      URL.revokeObjectURL(avatarCropSource);
    }

    setAvatarCropSource(null);
    setAvatarCropFileName("livey-avatar.jpeg");
  }

  async function updateSettings(
    updates: Parameters<typeof updateCurrentUserSettings>[0],
    successMessage?: string
  ) {
    if (settingsBusy) return;

    setSettingsBusy(true);
    setSettingsNotice(null);

    try {
      const updatedSettings = await updateCurrentUserSettings(updates);
      mergeUpdatedSettings(updatedSettings);

      if (successMessage) {
        setSettingsNotice(successMessage);
      }
    } catch (error) {
      console.error("Failed to update Livey settings:", error);
      setSettingsNotice("Could not save this setting.");
    } finally {
      setSettingsBusy(false);
    }
  }

  async function handleToggleLocationAccess() {
    if (settingsBusy) return;

    if (locationEnabled) {
      await updateSettings(
        { location_enabled: false },
        "Location turned off for this account."
      );
      return;
    }

    if (!("geolocation" in navigator)) {
      setSettingsNotice("Location is not supported on this device.");
      return;
    }

    setSettingsBusy(true);
    setSettingsNotice(null);

    try {
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const updatedSettings = await updateCurrentUserSettings({
        location_enabled: true,
      });

      mergeUpdatedSettings(updatedSettings);
      setSettingsNotice("Location enabled for nearby venues.");
    } catch (error) {
      console.error("Failed to enable location:", error);
      setSettingsNotice("Location permission was not enabled.");
    } finally {
      setSettingsBusy(false);
    }
  }

  async function handleSaveDisplayName() {
    if (settingsBusy) return;

    const cleanedDisplayName = displayNameDraft.trim();

    if (!cleanedDisplayName) {
      setSettingsNotice("Display name cannot be empty.");
      return;
    }

    setSettingsBusy(true);
    setSettingsNotice(null);

    try {
      const updatedProfile = await updateCurrentUserProfile({
        display_name: cleanedDisplayName,
      });

      mergeUpdatedProfile(updatedProfile);
      setEditingDisplayName(false);
      setSettingsNotice("Display name saved.");
    } catch (error) {
      console.error("Failed to update display name:", error);
      setSettingsNotice("Could not save display name.");
    } finally {
      setSettingsBusy(false);
    }
  }

  function handleAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file || settingsBusy) return;

    if (!file.type.startsWith("image/")) {
      setSettingsNotice("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSettingsNotice("Profile photo must be 5MB or less.");
      return;
    }

    if (avatarCropSource) {
      URL.revokeObjectURL(avatarCropSource);
    }

    const previewUrl = URL.createObjectURL(file);

    setAvatarCropSource(previewUrl);
    setAvatarCropFileName(file.name || "livey-avatar.jpeg");
    setSettingsNotice(null);
  }

  async function handleSaveCroppedAvatar(croppedFile: File) {
    if (settingsBusy) return;

    setSettingsBusy(true);
    setSettingsNotice(null);

    try {
      const avatarUrl = await uploadCurrentUserAvatar(croppedFile);

      if (!avatarUrl) {
        setSettingsNotice("Could not upload avatar.");
        return;
      }

      const updatedProfile = await updateCurrentUserProfile({
        avatar_url: avatarUrl,
      });

      mergeUpdatedProfile(updatedProfile);
      closeAvatarCropModal();
      setSettingsNotice("Avatar saved.");
    } catch (error) {
      console.error("Failed to update avatar:", error);
      setSettingsNotice(
        error instanceof Error ? error.message : "Could not save avatar."
      );
    } finally {
      setSettingsBusy(false);
    }
  }

  async function handleSignOut() {
    if (settingsBusy) return;

    setSettingsBusy(true);

    try {
      await signOutLiveyUser();
      setProfileData(null);
      setSignOutConfirmOpen(false);
      onClose();
    } catch (error) {
      console.error("Failed to sign out:", error);
      setSettingsNotice("Could not sign out. Try again.");
    } finally {
      setSettingsBusy(false);
    }
  }

  function handleSupportEmail(subject: string) {
    window.location.href = `mailto:support@livey.network?subject=${encodeURIComponent(
      subject
    )}`;
  }

  function handleVenueEmail() {
    window.location.href = `mailto:venues@livey.network?subject=${encodeURIComponent(
      "Livey Venue Access"
    )}`;
  }

  function handlePrivacyPolicy() {
    window.location.href = "https://livey.network/privacy";
  }

  function handleTermsOfUse() {
    window.location.href = "https://livey.network/terms";
  }

  function handleDeleteAccountRequest() {
    window.location.href = `mailto:support@livey.network?subject=${encodeURIComponent(
      "Livey account deletion request"
    )}`;
  }

  const displayName = profileData?.profile?.display_name ?? "Mario";
  const username = profileData?.profile?.username
    ? `@${profileData.profile.username}`
    : "@mario";
  const avatarUrl = profileData?.profile?.avatar_url ?? null;
  const city =
    profileData?.settings?.city ?? profileData?.profile?.city ?? "Limassol";

  const notificationsEnabled =
    profileData?.settings?.notifications_enabled ?? true;
  const locationEnabled = profileData?.settings?.location_enabled ?? true;
  const personalizationEnabled =
    profileData?.settings?.personalization_enabled ?? true;

  return (
    <>
      <div
        className={[
          "livey-settings-backdrop",
          open ? "livey-settings-backdrop-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onClose}
      />

      <aside
        className={[
          "livey-settings-panel",
          open ? "livey-settings-panel-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label="Livey settings"
      >
        <header className="livey-settings-header">
          <div>
            <img
              className="livey-settings-logo"
              src="/Livey-Logo.png"
              alt="Livey"
            />
            <p className="livey-settings-kicker">Account controls</p>
            <h2>Settings</h2>
          </div>

          <button
            className="livey-settings-close"
            type="button"
            aria-label="Close settings"
            onClick={onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6.4 5.15 12 10.75l5.6-5.6 1.25 1.25-5.6 5.6 5.6 5.6-1.25 1.25-5.6-5.6-5.6 5.6-1.25-1.25 5.6-5.6-5.6-5.6 1.25-1.25Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </header>

        <section
          className="livey-settings-account-card"
          aria-label="Signed in account"
        >
          <div className="livey-settings-account-avatar" aria-hidden="true">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : <span />}
          </div>

          <div>
            <strong>{displayName}</strong>
            <span>{username}</span>
            <small>{city}, Cyprus</small>
          </div>
        </section>

        {settingsNotice && (
          <div className="livey-settings-notice" role="status">
            {settingsNotice}
          </div>
        )}

        <input
          ref={avatarInputRef}
          className="livey-settings-hidden-file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleAvatarFileChange}
        />

        {avatarCropSource && (
          <LiveyAvatarCropModal
            imageSrc={avatarCropSource}
            fileName={avatarCropFileName}
            busy={settingsBusy}
            onDiscard={closeAvatarCropModal}
            onSave={handleSaveCroppedAvatar}
          />
        )}

        <div className="livey-settings-accordion">
          <section className="livey-settings-section">
            <SettingsSectionButton
              label="Account"
              section="account"
              openSection={openSection}
              onToggle={toggleSection}
            />

            <SettingsSectionContent
              section="account"
              openSection={openSection}
            >
              <div className="livey-settings-row livey-settings-readonly-row">
                <span className="livey-settings-row-copy">
                  <span>Livey ID</span>
                  <small>{username}</small>
                </span>
              </div>

              <div className="livey-settings-row livey-settings-edit-row">
                <span className="livey-settings-row-copy">
                  <span>Display name</span>

                  {editingDisplayName ? (
                    <input
                      className="livey-settings-name-input"
                      value={displayNameDraft}
                      onChange={(event) =>
                        setDisplayNameDraft(event.target.value)
                      }
                      disabled={settingsBusy}
                      autoFocus
                    />
                  ) : (
                    <small>{displayName}</small>
                  )}
                </span>

                {editingDisplayName ? (
                  <span className="livey-settings-edit-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setDisplayNameDraft(displayName);
                        setEditingDisplayName(false);
                      }}
                      disabled={settingsBusy}
                    >
                      No
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveDisplayName}
                      disabled={settingsBusy}
                    >
                      Save
                    </button>
                  </span>
                ) : (
                  <button
                    className="livey-settings-edit-button"
                    type="button"
                    onClick={() => {
                      setDisplayNameDraft(displayName);
                      setEditingDisplayName(true);
                    }}
                    disabled={settingsBusy}
                  >
                    Edit
                  </button>
                )}
              </div>

              <div className="livey-settings-row livey-settings-edit-row">
                <span className="livey-settings-row-copy">
                  <span>Avatar</span>
                  <small>Change profile image</small>
                </span>

                <button
                  className="livey-settings-edit-button"
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={settingsBusy}
                >
                  Edit
                </button>
              </div>

              <button
                className="livey-settings-row livey-settings-row-danger"
                type="button"
                onClick={() => setSignOutConfirmOpen(true)}
                disabled={settingsBusy}
              >
                <span className="livey-settings-row-copy">
                  <span>Sign out</span>
                  <small>Leave this Livey account</small>
                </span>
              </button>

              <button
                className="livey-settings-row livey-settings-row-danger"
                type="button"
                onClick={handleDeleteAccountRequest}
                disabled={settingsBusy}
              >
                <span className="livey-settings-row-copy">
                  <span>Delete account</span>
                  <small>Request account deletion</small>
                </span>
              </button>
            </SettingsSectionContent>
          </section>

          <section className="livey-settings-section">
            <SettingsSectionButton
              label="Livey"
              section="livey"
              openSection={openSection}
              onToggle={toggleSection}
            />

            <SettingsSectionContent section="livey" openSection={openSection}>
              <label className="livey-settings-row livey-settings-city-row">
                <span className="livey-settings-row-copy">
                  <span>City</span>
                  <small>Used for your Livey area</small>
                </span>

                <select
                  value={city}
                  disabled={settingsBusy}
                  onChange={(event) =>
                    updateSettings(
                      { city: event.target.value },
                      "City saved to your account."
                    )
                  }
                  aria-label="Choose Livey city"
                >
                  {cyprusCities.map((cyprusCity) => (
                    <option value={cyprusCity} key={cyprusCity}>
                      {cyprusCity}
                    </option>
                  ))}
                </select>
              </label>

              <SettingsToggleRow
                title="Notifications"
                description={
                  notificationsEnabled
                    ? "Live moments and venue updates"
                    : "Notifications are off"
                }
                enabled={notificationsEnabled}
                disabled={settingsBusy}
                onClick={() =>
                  updateSettings(
                    { notifications_enabled: !notificationsEnabled },
                    "Notification setting saved."
                  )
                }
              />
            </SettingsSectionContent>
          </section>

          <section className="livey-settings-section">
            <SettingsSectionButton
              label="Privacy"
              section="privacy"
              openSection={openSection}
              onToggle={toggleSection}
            />

            <SettingsSectionContent section="privacy" openSection={openSection}>
              <SettingsToggleRow
                title="Location access"
                description={
                  locationEnabled
                    ? "Used for nearby venues and directions"
                    : "Location features are off"
                }
                enabled={locationEnabled}
                disabled={settingsBusy}
                onClick={handleToggleLocationAccess}
              />

              <SettingsToggleRow
                title="Personalization"
                description={
                  personalizationEnabled
                    ? "Control how Livey learns your preferences"
                    : "Personalization is off"
                }
                enabled={personalizationEnabled}
                disabled={settingsBusy}
                onClick={() =>
                  updateSettings(
                    { personalization_enabled: !personalizationEnabled },
                    "Personalization setting saved."
                  )
                }
              />

              <button
                className="livey-settings-row"
                type="button"
                onClick={() => setAccountDataOpen(true)}
              >
                <span className="livey-settings-row-copy">
                  <span>Account data</span>
                  <small>See what Livey stores</small>
                </span>
              </button>

              <button
                className="livey-settings-row"
                type="button"
                onClick={handlePrivacyPolicy}
              >
                <span className="livey-settings-row-copy">
                  <span>Privacy Policy</span>
                  <small>How Livey handles data</small>
                </span>
              </button>
            </SettingsSectionContent>
          </section>

          <section className="livey-settings-section">
            <SettingsSectionButton
              label="Support"
              section="support"
              openSection={openSection}
              onToggle={toggleSection}
            />

            <SettingsSectionContent section="support" openSection={openSection}>
              <button
                className="livey-settings-row"
                type="button"
                onClick={() => handleSupportEmail("Livey Support")}
              >
                <span className="livey-settings-row-copy">
                  <span>Help & support</span>
                  <small>Contact Livey</small>
                </span>
              </button>

              <button
                className="livey-settings-row"
                type="button"
                onClick={() => handleSupportEmail("Livey Problem Report")}
              >
                <span className="livey-settings-row-copy">
                  <span>Report a problem</span>
                  <small>Tell us what is not working</small>
                </span>
              </button>

              <button
                className="livey-settings-row"
                type="button"
                onClick={handleTermsOfUse}
              >
                <span className="livey-settings-row-copy">
                  <span>Terms of Use</span>
                  <small>Livey rules and conditions</small>
                </span>
              </button>
            </SettingsSectionContent>
          </section>

          <section className="livey-settings-section">
            <SettingsSectionButton
              label="Venue access"
              section="venue"
              openSection={openSection}
              onToggle={toggleSection}
            />

            <SettingsSectionContent section="venue" openSection={openSection}>
              <button
                className="livey-settings-row"
                type="button"
                onClick={handleVenueEmail}
              >
                <span className="livey-settings-row-copy">
                  <span>Venue owner?</span>
                  <small>For approved venues only</small>
                </span>
              </button>
            </SettingsSectionContent>
          </section>
        </div>
      </aside>

      {accountDataOpen && (
        <div className="livey-settings-confirm-backdrop" role="presentation">
          <div
            className="livey-settings-data-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Account data"
          >
            <h3>Account data</h3>

            <p>
              Livey stores only the information needed to make your account work
              across devices.
            </p>

            <div className="livey-settings-data-groups">
              <div>
                <strong>Profile</strong>
                <span>Display name, Livey ID, avatar, and city.</span>
              </div>

              <div>
                <strong>Preferences</strong>
                <span>
                  Notifications, location setting, and personalization setting.
                </span>
              </div>

              <div>
                <strong>Activity</strong>
                <span>Venues you follow.</span>
              </div>
            </div>

            <p className="livey-settings-data-note">
              Full data export and account deletion coming soon.
            </p>

            <button type="button" onClick={() => setAccountDataOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}

      {signOutConfirmOpen && (
        <div className="livey-settings-confirm-backdrop" role="presentation">
          <div
            className="livey-settings-confirm"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm sign out"
          >
            <h3>Are you sure you want to sign out?</h3>

            <div className="livey-settings-confirm-actions">
              <button
                type="button"
                onClick={() => setSignOutConfirmOpen(false)}
                disabled={settingsBusy}
              >
                No
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={settingsBusy}
              >
                {settingsBusy ? "Signing out..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}