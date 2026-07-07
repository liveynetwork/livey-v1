import type { User } from "@supabase/supabase-js";
import type { VenueDashboardVenue } from "../venueDashboardService";

type VenueDashboardAccountProps = {
  currentUser: User | null;
  activeVenue: VenueDashboardVenue | null;
  onSignOut: () => void;
};

export function VenueDashboardAccount({
  currentUser,
  activeVenue,
  onSignOut,
}: VenueDashboardAccountProps) {
  return (
    <section className="venue-dashboard-account-grid">
      <section className="venue-dashboard-card">
        <p className="venue-dashboard-eyebrow">Account</p>
        <h2>Owner information</h2>

        <div className="venue-dashboard-account-list">
          <div>
            <span>Email</span>
            <strong>{currentUser?.email || "No email found"}</strong>
          </div>

          <div>
            <span>User ID</span>
            <strong>{currentUser?.id || "No user ID found"}</strong>
          </div>

          <div>
            <span>Connected venue</span>
            <strong>{activeVenue?.name || "No venue connected"}</strong>
          </div>

          <div>
            <span>Venue ID</span>
            <strong>{activeVenue?.id || "No venue ID found"}</strong>
          </div>

          <div>
            <span>Role</span>
            <strong>Owner</strong>
          </div>
        </div>
      </section>

      <section className="venue-dashboard-card">
        <p className="venue-dashboard-eyebrow">Session</p>
        <h2>Sign-in controls</h2>
        <p>
          This account controls the connected venue dashboard. Signing out will
          return this browser to the Livey auth screen.
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