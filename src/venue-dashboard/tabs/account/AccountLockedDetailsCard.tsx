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
  return (
    <section className="venue-dashboard-card venue-dashboard-locked-details-card">
      <div className="venue-dashboard-premium-card-heading">
        <div>
          <p className="venue-dashboard-eyebrow">Locked Livey details</p>
          <h2>Protected details</h2>
        </div>

        <span className="venue-dashboard-card-status-dot">Locked</span>
      </div>

      <div className="venue-dashboard-locked-details-list">
        <div>
          <span>Venue name</span>
          <strong>{venueName || "Not available"}</strong>
        </div>

        <div>
          <span>Address</span>
          <strong>{address || "Not available"}</strong>
        </div>

        <div>
          <span>Area</span>
          <strong>{area || "Not available"}</strong>
        </div>

        <div>
          <span>City</span>
          <strong>{activeVenue?.city || "Not available"}</strong>
        </div>

        <div>
          <span>Category</span>
          <strong>{activeVenue?.category || "Not available"}</strong>
        </div>

        <div>
          <span>Verified</span>
          <strong>{activeVenue?.verified ? "Verified" : "Not verified"}</strong>
        </div>
      </div>

      <p className="venue-dashboard-locked-details-note">
        These details are visible on Livey and require Livey support to change.
      </p>
    </section>
  );
}