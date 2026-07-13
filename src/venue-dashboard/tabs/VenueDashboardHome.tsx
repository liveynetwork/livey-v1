import type {
  VenueDashboardEvent,
  VenueDashboardVenue,
} from "../venueDashboardService";
import type { DashboardSection } from "../VenueDashboardSidebar";

type VenueDashboardHomeProps = {
  activeVenue: VenueDashboardVenue | null;
  activeEvents: VenueDashboardEvent[];
  liveEventCount: number;
  visibleEventCount: number;
  historyEventCount: number;
  onCreateEvent: () => void;
  onSelectEvent: (event: VenueDashboardEvent) => void;
  onSectionChange: (section: DashboardSection) => void;
};

export function VenueDashboardHome({
  activeVenue,
  activeEvents,
  liveEventCount,
  visibleEventCount,
  onCreateEvent,
  onSelectEvent,
  onSectionChange,
}: VenueDashboardHomeProps) {
  const nextActivity = activeEvents[0] ?? null;

  return (
    <section className="venue-dashboard-home venue-dashboard-home-simple">
      <section className="venue-dashboard-hero-card venue-dashboard-overview-card">
        <div className="venue-dashboard-overview-main">
          <p className="venue-dashboard-eyebrow">
            Venue overview
          </p>

          <h2>{activeVenue?.name || "Your venue"}</h2>

          <div className="venue-dashboard-hero-badges">
            <span>{activeVenue?.category || "Venue"}</span>
            <span>
              {activeVenue?.area ||
                activeVenue?.city ||
                "Cyprus"}
            </span>
            <span>
              {activeVenue?.open_status ||
                "Status not set"}
            </span>
          </div>
        </div>
      </section>

      <section className="venue-dashboard-home-overview-grid">
        <section className="venue-dashboard-card venue-dashboard-now-card">
          <p className="venue-dashboard-eyebrow">
            Activity
          </p>

          {nextActivity ? (
            <button
              className="venue-dashboard-next-activity"
              type="button"
              onClick={() => onSelectEvent(nextActivity)}
            >
              <div>
                <h2>{nextActivity.title}</h2>

                <p>
                  {nextActivity.display_time ||
                    nextActivity.status}
                </p>
              </div>

              <span
                className={
                  nextActivity.is_active === false
                    ? "venue-dashboard-status-pill is-hidden"
                    : "venue-dashboard-status-pill"
                }
              >
                {nextActivity.is_active === false
                  ? "Hidden"
                  : nextActivity.status}
              </span>
            </button>
          ) : (
            <div className="venue-dashboard-empty-overview">
              <h2>No activity live yet</h2>

              <p>
                Create what people should see on Livey.
              </p>

              <button
                className="venue-dashboard-primary-action"
                type="button"
                onClick={onCreateEvent}
              >
                Create activity
              </button>
            </div>
          )}
        </section>

        <section className="venue-dashboard-card venue-dashboard-status-card">
          <p className="venue-dashboard-eyebrow">
            Status
          </p>

          <div className="venue-dashboard-status-list">
            <div>
              <span>Visible</span>
              <strong>{visibleEventCount}</strong>
            </div>

            <div>
              <span>Live now</span>
              <strong>{liveEventCount}</strong>
            </div>

            <div>
              <span>Venue</span>
              <strong>Approved</strong>
            </div>
          </div>

          <button
            className="venue-dashboard-secondary-button"
            type="button"
            onClick={() => onSectionChange("activity")}
          >
            Manage activity
          </button>
        </section>
      </section>
    </section>
  );
}