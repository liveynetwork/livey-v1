import type { LiveyVenue } from "./liveyVenues";
import { openDirections } from "../utils/openDirections";

type LiveyVenueDetailsCardProps = {
  venue: LiveyVenue;
  driveTime: string;
  walkTime: string;
  distanceKm?: string;
  onClose: () => void;
};

export function LiveyVenueDetailsCard({
  venue,
  driveTime,
  walkTime,
  distanceKm,
  onClose,
}: LiveyVenueDetailsCardProps) {
  return (
    <div
      className="livey-details-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="livey-details-card"
        role="dialog"
        aria-modal="true"
        aria-label={`${venue.name} details`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="livey-details-header">
          <div className="livey-details-logo-wrap">
            <img src={venue.logoUrl} alt={venue.name} />
          </div>

          <button
            className="livey-details-close"
            type="button"
            aria-label="Close venue details"
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

        <div className="livey-details-title">
          {venue.verified && (
            <span className="livey-details-verified">Verified venue</span>
          )}

          <h2>{venue.name}</h2>

          <p>
            {venue.category} · {venue.area}
          </p>
        </div>

        <div className="livey-details-info-grid">
          <div>
            <span>Status</span>
            <strong>{venue.openStatus}</strong>
          </div>

          <div>
            <span>Hours</span>
            <strong>{venue.openingHours}</strong>
          </div>

          <div>
            <span>Drive</span>
            <strong>{driveTime}</strong>
          </div>

          <div>
            <span>Walk</span>
            <strong>{walkTime}</strong>
          </div>

          {distanceKm && (
            <div className="livey-details-info-wide">
              <span>Distance</span>
              <strong>{distanceKm} away</strong>
            </div>
          )}
        </div>

        <div className="livey-details-moment">
          {venue.status === "Live now" && (
            <span className="livey-status-pill livey-status-pill-live">
              Live now
            </span>
          )}

          <h3>{venue.eventTitle}</h3>
          <p>{venue.description}</p>
        </div>

        <div className="livey-details-actions">
          <button
            type="button"
            className="livey-primary-action"
            onClick={() =>
              openDirections({
                latitude: venue.coordinates[1],
                longitude: venue.coordinates[0],
                label: venue.name,
              })
            }
          >
            Directions
          </button>

          <button
            type="button"
            className="livey-secondary-action"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </section>
    </div>
  );
}