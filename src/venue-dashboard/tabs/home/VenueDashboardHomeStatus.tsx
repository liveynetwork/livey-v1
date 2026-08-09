import "./VenueDashboardHomeStatus.css";

type VenueDashboardHomeStatusProps = {
  profileCompleteness: number;
  visibleEventCount: number;
  liveEventCount: number;
  onManageActivity: () => void;
};

export function VenueDashboardHomeStatus({
  profileCompleteness,
  visibleEventCount,
  liveEventCount,
  onManageActivity,
}: VenueDashboardHomeStatusProps) {
  const profileStatusLabel =
    profileCompleteness >= 100
      ? "Complete"
      : `${profileCompleteness}% complete`;

  return (
    <article className="venue-dashboard-home-card venue-dashboard-home-status-card">
      <header className="venue-dashboard-home-card-heading">
        <div>
          <p className="venue-dashboard-eyebrow">
            Publishing
          </p>

          <h3>Venue status</h3>
        </div>
      </header>

      <div className="venue-dashboard-home-status-list">
        <div>
          <span>Venue</span>
          <strong>Approved</strong>
        </div>

        <div>
          <span>Profile</span>
          <strong>{profileStatusLabel}</strong>
        </div>

        <div>
          <span>Visible activity</span>
          <strong>{visibleEventCount}</strong>
        </div>

        <div>
          <span>Live now</span>
          <strong>{liveEventCount}</strong>
        </div>
      </div>

      <button
        className="venue-dashboard-home-secondary-action"
        type="button"
        onClick={onManageActivity}
      >
        Manage publishing
      </button>
    </article>
  );
}