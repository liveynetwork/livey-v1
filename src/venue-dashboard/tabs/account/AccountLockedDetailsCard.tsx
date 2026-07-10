import type { VenueDashboardVenue } from "../../venueDashboardService";

type AccountLockedDetailsCardProps = {
  activeVenue: VenueDashboardVenue | null;
  venueName: string;
  area: string;
  address: string;
};

export function AccountLockedDetailsCard({
  activeVenue,
  venueName,
  area,
  address,
}: AccountLockedDetailsCardProps) {
  const isVerified = activeVenue?.verified === true;

  return (
    <section className="venue-dashboard-card venue-dashboard-locked-details-card">
      <div className="venue-dashboard-premium-card-heading venue-dashboard-locked-details-heading">
        <div>
          <p className="venue-dashboard-eyebrow">Locked Livey details</p>
          <h2>Protected details</h2>
        </div>
      </div>

      <div className="venue-dashboard-locked-details-list">
        <div className="venue-dashboard-locked-detail-tile venue-dashboard-locked-detail-tile-wide">
          <span>Venue name</span>
          <strong>{venueName || "Not available"}</strong>
        </div>

        <div className="venue-dashboard-locked-detail-tile">
          <span>Address</span>
          <strong>{address || "Not available"}</strong>
        </div>

        <div className="venue-dashboard-locked-detail-tile">
          <span>Area</span>
          <strong>{area || "Not available"}</strong>
        </div>

        <div className="venue-dashboard-locked-detail-tile">
          <span>City</span>
          <strong>{activeVenue?.city || "Not available"}</strong>
        </div>

        <div className="venue-dashboard-locked-detail-tile">
          <span>Category</span>
          <strong>{activeVenue?.category || "Not available"}</strong>
        </div>

        <div
          className={`venue-dashboard-locked-detail-tile venue-dashboard-locked-detail-tile-wide venue-dashboard-locked-detail-verification ${
            isVerified ? "is-verified" : ""
          }`}
        >
          <span>Verification</span>

          <strong>
            <span className="venue-dashboard-verification-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
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

            {isVerified ? "Verified by Livey" : "Not verified"}
          </strong>
        </div>
      </div>

      <p className="venue-dashboard-locked-details-note">
        THESE DETAILS APPEAR ON LIVEY AND CAN ONLY BE UPDATED WITH HELP FROM
        LIVEY SUPPORT.
      </p>
    </section>
  );
}