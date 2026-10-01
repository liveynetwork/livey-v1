import "./VenueDashboardNoVenueState.css";

type VenueDashboardNoVenueStateProps = {
  onSignOut: () => void;
};

export function VenueDashboardNoVenueState({
  onSignOut,
}: VenueDashboardNoVenueStateProps) {
  return (
    <main className="venue-dashboard-no-venue-page">
      <div className="venue-dashboard-no-venue-brand">
        <img
          src="/Livey-Logo.png"
          alt="Livey"
        />
      </div>

      <section
        className="venue-dashboard-no-venue-card"
        aria-labelledby="venue-dashboard-no-venue-title"
      >
        <div className="venue-dashboard-no-venue-icon">
          <VenueIcon />
        </div>

        <div className="venue-dashboard-no-venue-copy">
          <span className="venue-dashboard-no-venue-eyebrow">
            Venue connection required
          </span>

          <h1 id="venue-dashboard-no-venue-title">
            Your venue isn&apos;t connected yet.
          </h1>

          <p className="venue-dashboard-no-venue-description">
            This dashboard account is active, but it
            isn&apos;t currently connected to an approved
            Livey venue.
          </p>

          <p className="venue-dashboard-no-venue-secondary-copy">
            If you already received a Livey venue claim
            code, sign out and create your venue account
            using that code.
          </p>
        </div>

        <div className="venue-dashboard-no-venue-actions">
          <button
            type="button"
            className="venue-dashboard-no-venue-primary"
            onClick={onSignOut}
          >
            Sign out and connect venue
          </button>

          <a
            className="venue-dashboard-no-venue-support"
            href="mailto:support@livey.network"
          >
            Contact Livey support
          </a>
        </div>

        <div className="venue-dashboard-no-venue-footnote">
          <span />

          <p>
            Only approved venues with a valid Livey claim
            code can be connected to a dashboard account.
          </p>

          <span />
        </div>
      </section>
    </main>
  );
}

function VenueIcon() {
  return (
    <svg
      width="31"
      height="31"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 9.25V20h14V9.25"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M4 9.25 5.35 4h13.3L20 9.25"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M4 9.25c0 1.24 1.01 2.25 2.25 2.25S8.5 10.49 8.5 9.25c0 1.24 1.01 2.25 2.25 2.25S13 10.49 13 9.25c0 1.24 1.01 2.25 2.25 2.25s2.25-1.01 2.25-2.25c0 1.24 1.01 2.25 2.25 2.25S22 10.49 22 9.25"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(-1)"
      />

      <path
        d="M9 20v-5.25h6V20"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}