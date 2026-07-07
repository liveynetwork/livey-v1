import type { DashboardSection } from "../VenueDashboardSidebar";
import type { VenueDashboardVenue } from "../venueDashboardService";

type VenueDashboardSettingsProps = {
  activeVenue: VenueDashboardVenue | null;
  isRefreshing: boolean;
  onRefreshDashboard: () => void;
  onSectionChange: (section: DashboardSection) => void;
  onSignOut: () => void;
};

export function VenueDashboardSettings({
  activeVenue,
  isRefreshing,
  onRefreshDashboard,
  onSectionChange,
  onSignOut,
}: VenueDashboardSettingsProps) {
  return (
    <section className="venue-dashboard-settings-grid">
      <section className="venue-dashboard-card">
        <p className="venue-dashboard-eyebrow">Settings</p>
        <h2>Venue dashboard controls</h2>
        <p>
          Manage your venue console, refresh your data, and access account
          controls.
        </p>

        <div className="venue-dashboard-settings-list">
          <button type="button" onClick={onRefreshDashboard} disabled={isRefreshing}>
            <span>Refresh dashboard</span>
            <small>
              {isRefreshing
                ? "Refreshing your latest venue data..."
                : "Reload venue, activity, and history data from Livey."}
            </small>
          </button>

          <button type="button" onClick={() => onSectionChange("activity")}>
            <span>Manage activity</span>
            <small>Create, edit, hide, remove, or restore activities.</small>
          </button>

          <button type="button" onClick={() => onSectionChange("account")}>
            <span>Account information</span>
            <small>View owner account, user ID, and connected venue.</small>
          </button>

          <a href="mailto:support@livey.network">
            <span>Contact Livey support</span>
            <small>Ask for help with your venue dashboard.</small>
          </a>
        </div>
      </section>

      <section className="venue-dashboard-card">
        <p className="venue-dashboard-eyebrow">Connected venue</p>
        <h2>{activeVenue?.name || "No venue connected"}</h2>

        <div className="venue-dashboard-settings-meta">
          <div>
            <span>Category</span>
            <strong>{activeVenue?.category || "Not set"}</strong>
          </div>

          <div>
            <span>Area</span>
            <strong>{activeVenue?.area || activeVenue?.city || "Not set"}</strong>
          </div>

          <div>
            <span>Open status</span>
            <strong>{activeVenue?.open_status || "Not set"}</strong>
          </div>
        </div>

        <p className="venue-dashboard-muted">
          Venue profile editing will be added later with safe approval rules.
        </p>
      </section>

      <section className="venue-dashboard-card venue-dashboard-settings-danger">
        <p className="venue-dashboard-eyebrow">Session</p>
        <h2>Sign out</h2>
        <p>
          Signing out will close the venue dashboard session in this browser.
        </p>

        <button
          className="venue-dashboard-danger-button"
          type="button"
          onClick={onSignOut}
        >
          Sign out
        </button>
      </section>
    </section>
  );
}