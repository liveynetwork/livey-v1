type VenueDashboardActivityQuickActionsProps = {
  onCreateEvent: () => void;
  onCreateLiveNowEvent: () => void;
  onOpenReusePanel: () => void;
};

export function VenueDashboardActivityQuickActions({
  onCreateEvent,
  onCreateLiveNowEvent,
  onOpenReusePanel,
}: VenueDashboardActivityQuickActionsProps) {
  return (
    <section className="venue-dashboard-activity-quick-actions">
      <div className="venue-dashboard-activity-section-heading">
        <div>
          <span className="venue-dashboard-activity-section-label">
            Quick actions
          </span>

          <h3>Choose how you want to publish</h3>

          <p>
            Start something happening now, schedule a one-time activity, or
            reuse something your venue published before.
          </p>
        </div>
      </div>

      <div className="venue-dashboard-activity-quick-actions-grid">
        <button
          className="venue-dashboard-activity-quick-action is-primary"
          type="button"
          onClick={onCreateLiveNowEvent}
        >
          <span
            className="venue-dashboard-activity-quick-action-icon"
            aria-hidden="true"
          >
            <LiveNowIcon />
          </span>

          <span className="venue-dashboard-activity-quick-action-copy">
            <strong>Start something live</strong>

            <small>
              Open the editor with a schedule beginning now and ending three
              hours later.
            </small>
          </span>

          <span
            className="venue-dashboard-activity-quick-action-arrow"
            aria-hidden="true"
          >
            <PremiumArrowIcon />
          </span>
        </button>

        <button
          className="venue-dashboard-activity-quick-action"
          type="button"
          onClick={onCreateEvent}
        >
          <span
            className="venue-dashboard-activity-quick-action-icon"
            aria-hidden="true"
          >
            <CalendarIcon />
          </span>

          <span className="venue-dashboard-activity-quick-action-copy">
            <strong>Create one-time activity</strong>

            <small>
              Publish something for today, tomorrow, the weekend, or another
              date.
            </small>
          </span>

          <span
            className="venue-dashboard-activity-quick-action-arrow"
            aria-hidden="true"
          >
            <PremiumArrowIcon />
          </span>
        </button>

        <div className="venue-dashboard-activity-quick-action is-disabled">
          <span
            className="venue-dashboard-activity-quick-action-icon"
            aria-hidden="true"
          >
            <RepeatIcon />
          </span>

          <span className="venue-dashboard-activity-quick-action-copy">
            <strong>Create recurring activity</strong>

            <small>
              Automatically repeat activities on selected days and times.
            </small>
          </span>

          <span className="venue-dashboard-activity-coming-soon">
            Coming later
          </span>
        </div>

        <button
          className="venue-dashboard-activity-quick-action"
          type="button"
          onClick={onOpenReusePanel}
        >
          <span
            className="venue-dashboard-activity-quick-action-icon"
            aria-hidden="true"
          >
            <DuplicateIcon />
          </span>

          <span className="venue-dashboard-activity-quick-action-copy">
            <strong>Reuse previous activity</strong>

            <small>
              Copy an earlier activity and prepare it with a fresh schedule.
            </small>
          </span>

          <span
            className="venue-dashboard-activity-quick-action-arrow"
            aria-hidden="true"
          >
            <PremiumArrowIcon />
          </span>
        </button>
      </div>
    </section>
  );
}

function LiveNowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" />

      <path
        d="M7.8 7.8a5.94 5.94 0 0 0 0 8.4M16.2 7.8a5.94 5.94 0 0 1 0 8.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M4.7 4.7a10.3 10.3 0 0 0 0 14.6M19.3 4.7a10.3 10.3 0 0 1 0 14.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
    >
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 3.8v3.4M16 3.8v3.4M4 9.5h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M8 13h3M13 13h3M8 16h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
    >
      <path
        d="M7 7h9.5L14 4.5M17 17H7.5L10 19.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M18.5 8.5A5 5 0 0 1 19 10.7M5.5 15.5A5 5 0 0 1 5 13.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
    >
      <rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PremiumArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
    >
      <path
        d="M7.5 12h8.25"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="m12.75 8.75 3.25 3.25-3.25 3.25"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}