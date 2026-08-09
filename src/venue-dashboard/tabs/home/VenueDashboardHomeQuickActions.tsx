import type { DashboardSection } from "../../VenueDashboardSidebar";
import "./VenueDashboardHomeQuickActions.css";

type VenueDashboardHomeQuickActionsProps = {
  onCreateEvent: () => void;
  onSectionChange: (section: DashboardSection) => void;
};

export function VenueDashboardHomeQuickActions({
  onCreateEvent,
  onSectionChange,
}: VenueDashboardHomeQuickActionsProps) {
  return (
    <section className="venue-dashboard-home-card venue-dashboard-home-quick-actions-card">
      <header className="venue-dashboard-home-card-heading">
        <div>
          <p className="venue-dashboard-eyebrow">
            Quick actions
          </p>

          <h3>Run your venue</h3>
        </div>

        <p className="venue-dashboard-home-quick-actions-description">
          Jump straight into the parts of the dashboard
          you use most.
        </p>
      </header>

      <div className="venue-dashboard-home-quick-actions">
        <button
          type="button"
          onClick={onCreateEvent}
        >
          <span>Create</span>

          <strong>Create activity</strong>

          <small>
            Publish something new on Livey
          </small>
        </button>

        <button
          type="button"
          onClick={() =>
            onSectionChange("activity")
          }
        >
          <span>Activity</span>

          <strong>Manage activity</strong>

          <small>
            Review what is live or scheduled
          </small>
        </button>

        <button
          type="button"
          onClick={() =>
            onSectionChange("analytics")
          }
        >
          <span>Analytics</span>

          <strong>View performance</strong>

          <small>
            Follow audience and publishing signals
          </small>
        </button>

        <button
          type="button"
          onClick={() =>
            onSectionChange("history")
          }
        >
          <span>History</span>

          <strong>Open archive</strong>

          <small>
            Review previous venue activity
          </small>
        </button>
      </div>
    </section>
  );
}