import type { VenueDashboardVenue } from "../../venueDashboardService";
import "./VenueDashboardHomeHero.css";

type VenueDashboardHomeHeroProps = {
  activeVenue: VenueDashboardVenue | null;
};

export function VenueDashboardHomeHero({
  activeVenue,
}: VenueDashboardHomeHeroProps) {
  const locationLabel =
    activeVenue?.area ||
    activeVenue?.city ||
    "Cyprus";

  const venueStatus =
    activeVenue?.open_status ||
    "Status not set";

  return (
    <section className="venue-dashboard-home-hero">
      <div className="venue-dashboard-home-hero-copy">
        <p className="venue-dashboard-eyebrow">
          Venue overview
        </p>

        <h2>
          {activeVenue?.name || "Your venue"}
        </h2>

        <p className="venue-dashboard-home-hero-description">
          Your venue at a glance. Keep track of
          activity, followers, visibility and
          publishing from one place.
        </p>

        <div className="venue-dashboard-home-hero-badges">
          <span>
            {activeVenue?.category || "Venue"}
          </span>

          <span>{locationLabel}</span>

          <span>{venueStatus}</span>
        </div>
      </div>
    </section>
  );
}