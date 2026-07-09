import type { VenueDashboardVenue } from "../../venueDashboardService";

type AccountVenueIdentityCardProps = {
  activeVenue: VenueDashboardVenue | null;
  visibleLogoUrl: string;
  venueName: string;
  onLogoChange: (file: File | null) => void;
};

export function AccountVenueIdentityCard({
  activeVenue,
  visibleLogoUrl,
  venueName,
  onLogoChange,
}: AccountVenueIdentityCardProps) {
  const venueInitial = venueName?.charAt(0) || "L";

  return (
    <section className="venue-dashboard-card venue-dashboard-identity-card">
      <div className="venue-dashboard-identity-logo-wrap">
        <div className="venue-dashboard-identity-logo">
          {visibleLogoUrl ? (
            <img src={visibleLogoUrl} alt={venueName || "Venue logo"} />
          ) : (
            <span>{venueInitial}</span>
          )}
        </div>

        <label className="venue-dashboard-logo-upload venue-dashboard-identity-logo-upload">
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

      <div className="venue-dashboard-identity-copy">
        <p className="venue-dashboard-eyebrow">Account Settings</p>
        <h2>{venueName || "Venue profile"}</h2>

        <div className="venue-dashboard-identity-meta">
          <span>{activeVenue?.category || "Category not available"}</span>
          <span>{activeVenue?.area || "Area not available"}</span>
          <span>{activeVenue?.city || "City not available"}</span>
          <strong>{activeVenue?.verified ? "Verified" : "Not verified"}</strong>
        </div>

        <p className="venue-dashboard-identity-note">
          Manage the details venue guests see on Livey.
        </p>
      </div>
    </section>
  );
}