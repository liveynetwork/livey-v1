import type { VenueDashboardEvent } from "../../venueDashboardService";
import "./VenueDashboardHomeCurrentActivity.css";

type VenueDashboardHomeCurrentActivityProps = {
  currentActivity: VenueDashboardEvent | null;
  onCreateEvent: () => void;
  onSelectEvent: (event: VenueDashboardEvent) => void;
  onManageActivity: () => void;
};

export function VenueDashboardHomeCurrentActivity({
  currentActivity,
  onCreateEvent,
  onSelectEvent,
  onManageActivity,
}: VenueDashboardHomeCurrentActivityProps) {
  const activityDisplayTime =
    currentActivity?.display_time ||
    currentActivity?.status ||
    "Scheduled";

  const activityStatus =
    currentActivity?.is_active === false
      ? "Hidden"
      : currentActivity?.status || "Visible";

  return (
    <article className="venue-dashboard-home-card venue-dashboard-home-current-card">
      <header className="venue-dashboard-home-card-heading">
        <div>
          <p className="venue-dashboard-eyebrow">
            Current activity
          </p>

          <h3>
            {currentActivity
              ? "What people can see"
              : "Nothing live right now"}
          </h3>
        </div>

        <button
          className="venue-dashboard-home-text-action"
          type="button"
          onClick={onManageActivity}
        >
          Manage activity
        </button>
      </header>

      {currentActivity ? (
        <button
          className="venue-dashboard-home-current-activity"
          type="button"
          onClick={() =>
            onSelectEvent(currentActivity)
          }
        >
          <div className="venue-dashboard-home-current-activity-copy">
            <span className="venue-dashboard-home-current-label">
              Activity
            </span>

            <h4>{currentActivity.title}</h4>

            <p>{activityDisplayTime}</p>
          </div>

          <span
            className={
              currentActivity.is_active === false
                ? "venue-dashboard-home-activity-status is-hidden"
                : "venue-dashboard-home-activity-status"
            }
          >
            {activityStatus}
          </span>
        </button>
      ) : (
        <div className="venue-dashboard-home-current-empty">
          <div>
            <h4>
              Create your next Livey activity
            </h4>

            <p>
              Publish what is happening at your venue
              so people can discover it on Livey.
            </p>
          </div>

          <button
            className="venue-dashboard-primary-action"
            type="button"
            onClick={onCreateEvent}
          >
            Create activity
          </button>
        </div>
      )}
    </article>
  );
}