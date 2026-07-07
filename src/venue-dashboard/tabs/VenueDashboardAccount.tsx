import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const visibleLogoUrl = logoPreviewUrl || activeVenue?.logo_url || "";

  useEffect(() => {
    setName(activeVenue?.name ?? "");
    setDescription(activeVenue?.description ?? "");
    setArea(activeVenue?.area ?? "");
    setAddress(activeVenue?.address ?? "");
    setOpenStatus(activeVenue?.open_status ?? "Open now");
    setOpeningHours(activeVenue?.opening_hours ?? "");
    setLogoFile(null);

    setLogoPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return null;
    });
  }, [activeVenue]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  function handleLogoChange(file: File | null) {
    setLogoFile(null);

    setLogoPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return null;
    });

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
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
              Upload a square PNG, JPG, or WebP. This is the logo people see on
              Livey.
            </p>

            <label className="venue-dashboard-logo-upload-button">
              {logoFile ? "Change image" : "Upload logo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  handleLogoChange(event.target.files?.[0] ?? null)
                }
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
            <label>
              Area
              <input
                value={area}
                onChange={(event) => setArea(event.target.value)}
                placeholder="Area"
              />
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
            </label>
          </div>

          <label>
            Address
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Venue address"
            />
          </label>

          <label>
            Opening hours
            <input
              value={openingHours}
              onChange={(event) => setOpeningHours(event.target.value)}
              placeholder="Example: Mon–Fri 09:00–18:00"
            />
          </label>

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
  );
}