import type { User } from "@supabase/supabase-js";
import type { DashboardSection } from "../../VenueDashboardSidebar";
import type { VenueDashboardVenue } from "../../venueDashboardService";

type AccountSideCardsProps = {
  currentUser: User | null;
  activeVenue: VenueDashboardVenue | null;
  isRefreshing: boolean;
  onRefreshDashboard: () => void;
  onSectionChange: (section: DashboardSection) => void;
  onSignOut: () => void;
};

export function AccountSideCards({
  currentUser,
  activeVenue,
  isRefreshing,
  onRefreshDashboard,
  onSectionChange,
  onSignOut,
}: AccountSideCardsProps) {
  return (
    <aside className="venue-dashboard-account-side">
      <section className="venue-dashboard-card">
        <p className="venue-dashboard-eyebrow">Dashboard controls</p>
        <h2>Useful actions</h2>

        <div className="venue-dashboard-settings-list">
          <button
            type="button"
            onClick={onRefreshDashboard}
            disabled={isRefreshing}
          >
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

          <a href="mailto:support@livey.network">
            <span>Contact Livey support</span>
            <small>Ask for help with your venue dashboard.</small>
          </a>
        </div>
      </section>

      <section className="venue-dashboard-card">
        <p className="venue-dashboard-eyebrow">Owner account</p>
        <h2>Connected account</h2>

        <div className="venue-dashboard-account-list">
          <div>
            <span>Email</span>
            <strong>{currentUser?.email || "Not available"}</strong>
          </div>

          <div>
            <span>User ID</span>
            <strong>{currentUser?.id || "Not available"}</strong>
          </div>

          <div>
            <span>Connected venue</span>
            <strong>{activeVenue?.name || "No venue connected"}</strong>
          </div>

          <div>
            <span>Venue ID</span>
            <strong>{activeVenue?.id || "Not available"}</strong>
          </div>
        </div>
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
    </aside>
  );
}