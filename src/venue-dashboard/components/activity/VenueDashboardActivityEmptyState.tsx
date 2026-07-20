type VenueDashboardActivityEmptyStateProps = {
  onCreateEvent: () => void;
};

export function VenueDashboardActivityEmptyState({
  onCreateEvent,
}: VenueDashboardActivityEmptyStateProps) {
  return (
    <section className="venue-dashboard-activity-empty-state">
      <div
        className="venue-dashboard-activity-empty-state-icon"
        aria-hidden="true"
      >
        <ActivityIcon />
      </div>

      <div className="venue-dashboard-activity-empty-state-copy">
        <span className="venue-dashboard-activity-section-label">
          No current activity
        </span>

        <h3>Nothing is live right now</h3>

        <p>
          Create an activity to appear on the Livey map and let people know
          what is happening at your venue.
        </p>
      </div>

      <div className="venue-dashboard-activity-empty-state-details">
        <div>
          <span>Livey visibility</span>
          <strong>Not currently visible</strong>
        </div>

        <div>
          <span>Next scheduled activity</span>
          <strong>Nothing scheduled</strong>
        </div>
      </div>

      <button
        className="venue-dashboard-primary-action venue-dashboard-activity-empty-state-action"
        type="button"
        onClick={onCreateEvent}
      >
        Create activity
      </button>
    </section>
  );
}

function ActivityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 7.8v8.4M7.8 12h8.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M5.9 5.9 4.6 4.6M18.1 5.9l1.3-1.3M5.9 18.1l-1.3 1.3M18.1 18.1l1.3 1.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}