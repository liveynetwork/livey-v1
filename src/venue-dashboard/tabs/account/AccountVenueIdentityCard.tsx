import type { VenueDashboardVenue } from "../../venueDashboardService";
import type {
  RefObject,
} from "react";

type AccountVenueIdentityCardProps = {
  activeVenue: VenueDashboardVenue | null;
  visibleLogoUrl: string;
  venueName: string;
  logoTargetRef:
  RefObject<HTMLDivElement | null>;
  onLogoChange: (file: File | null) => void;
};

export function AccountVenueIdentityCard({
  activeVenue,
  visibleLogoUrl,
  venueName,
  logoTargetRef,
  onLogoChange,
}: AccountVenueIdentityCardProps) {
  const venueInitial = venueName?.charAt(0) || "L";
  const isVerified = activeVenue?.verified === true;

  return (
    <section className="venue-dashboard-card venue-dashboard-identity-card">
      <div className="venue-dashboard-identity-content">
        <div
  ref={logoTargetRef}
  className="venue-dashboard-identity-logo-wrap"
>
          <div className="venue-dashboard-identity-logo-shell">
            <div className="venue-dashboard-identity-logo">
              {visibleLogoUrl ? (
                <img src={visibleLogoUrl} alt={venueName || "Venue logo"} />
              ) : (
                <span>{venueInitial}</span>
              )}
            </div>
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
          <p className="venue-dashboard-eyebrow">Account settings</p>

          <h2>{venueName || "Venue profile"}</h2>
        </div>

        <div className="venue-dashboard-identity-meta">
          <div className="venue-dashboard-identity-meta-item">
            <span>Category</span>
            <strong>{activeVenue?.category || "Not available"}</strong>
          </div>

          <div className="venue-dashboard-identity-meta-item">
            <span>Area</span>
            <strong>{activeVenue?.area || "Not available"}</strong>
          </div>

          <div className="venue-dashboard-identity-meta-item">
            <span>City</span>
            <strong>{activeVenue?.city || "Not available"}</strong>
          </div>

          <div
            className={`venue-dashboard-identity-meta-item venue-dashboard-identity-verification ${
              isVerified ? "is-verified" : ""
            }`}
          >
            <span>Verification</span>

            <strong>
              <span
                className="venue-dashboard-identity-verification-icon"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                >
                  <path
                    d="m7.5 12.5 3 3 6-7"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              {isVerified ? "Verified" : "Not verified"}
            </strong>
          </div>
        </div>

        <div className="venue-dashboard-identity-note">
          <span
            className="venue-dashboard-identity-note-icon"
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

          <p>Manage the details venue guests see on Livey.</p>
        </div>
      </div>
    </section>
  );
}