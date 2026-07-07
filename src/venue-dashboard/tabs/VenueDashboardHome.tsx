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
  isCreatingEvent: boolean;
  onCreateEvent: () => void;
  onSelectEvent: (event: VenueDashboardEvent) => void;
  onSectionChange: (section: DashboardSection) => void;
};

export function VenueDashboardHome({
  activeVenue,
  activeEvents,
  liveEventCount,
  visibleEventCount,
  historyEventCount,
  isCreatingEvent,
  onCreateEvent,
  onSelectEvent,
  onSectionChange,
}: VenueDashboardHomeProps) {
  return (
    <section className="venue-dashboard-home">
      <section className="venue-dashboard-hero-card">
        <div>
          <p className="venue-dashboard-eyebrow">Approved venue</p>
          <h2>{activeVenue?.name}</h2>
          <p>
            {activeVenue?.description ||
              "Your Livey venue is connected and ready to manage."}
          </p>
        </div>

        <div className="venue-dashboard-hero-badges">
          <span>{activeVenue?.category || "Venue"}</span>
          <span>{activeVenue?.area || activeVenue?.city || "Cyprus"}</span>
          <span>{activeVenue?.open_status || "Open status not set"}</span>
        </div>
      </section>

      <section className="venue-dashboard-stats-grid">
        <div className="venue-dashboard-stat-card">
          <span>Upcoming / active</span>
          <strong>{activeEvents.length}</strong>
        </div>

        <div className="venue-dashboard-stat-card">
          <span>Visible on Livey</span>
          <strong>{visibleEventCount}</strong>
        </div>

        <div className="venue-dashboard-stat-card">
          <span>Live now</span>
          <strong>{liveEventCount}</strong>
        </div>

        <div className="venue-dashboard-stat-card">
          <span>History</span>
          <strong>{historyEventCount}</strong>
        </div>
      </section>

      <section className="venue-dashboard-card">
        <div className="venue-dashboard-section-heading">
          <p className="venue-dashboard-eyebrow">Quick actions</p>
          <h2>Control what people see in Livey</h2>
        </div>

        <div className="venue-dashboard-quick-actions">
          <button type="button" onClick={() => onSectionChange("activity")}>
            Edit activity
          </button>

          <button type="button" onClick={onCreateEvent} disabled={isCreatingEvent}>
            {isCreatingEvent ? "Creating..." : "Create activity"}
          </button>

          <button type="button" onClick={() => onSectionChange("history")}>
            View history
          </button>
        </div>
      </section>

      <section className="venue-dashboard-card">
        <div className="venue-dashboard-section-heading">
          <p className="venue-dashboard-eyebrow">Recent activity</p>
          <h2>Upcoming and active events</h2>
        </div>

        {activeEvents.length === 0 ? (
          <p className="venue-dashboard-muted">
            No upcoming or active activity exists for this venue.
          </p>
        ) : (
          <div className="venue-dashboard-event-table">
            {activeEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onSelectEvent(event)}
              >
                <span>{event.title}</span>

                <small
                  className={
                    event.is_active === false
                      ? "venue-dashboard-status-pill is-hidden"
                      : "venue-dashboard-status-pill"
                  }
                >
                  {event.is_active === false ? "Hidden" : event.status}
                </small>
              </button>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}