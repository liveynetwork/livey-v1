import "./VenueDashboardHomeFollowerSnapshot.css";

type VenueDashboardHomeFollowerSnapshotProps = {
  totalFollowers: number;
  newFollowersLast7Days: number;
  isFollowerAnalyticsLoading: boolean;
  followerAnalyticsError: string | null;
  onOpenAnalytics: () => void;
};

export function VenueDashboardHomeFollowerSnapshot({
  totalFollowers,
  newFollowersLast7Days,
  isFollowerAnalyticsLoading,
  followerAnalyticsError,
  onOpenAnalytics,
}: VenueDashboardHomeFollowerSnapshotProps) {
  const followerValue = isFollowerAnalyticsLoading
    ? "—"
    : followerAnalyticsError
      ? "—"
      : totalFollowers.toLocaleString();

  const followerGrowthLabel = isFollowerAnalyticsLoading
    ? "Loading follower data"
    : followerAnalyticsError
      ? "Follower data unavailable"
      : newFollowersLast7Days > 0
        ? `+${newFollowersLast7Days.toLocaleString()} in the last 7 days`
        : "No new followers in the last 7 days";

  const followerStateClassName =
    followerAnalyticsError
      ? "venue-dashboard-home-follower-summary is-error"
      : isFollowerAnalyticsLoading
        ? "venue-dashboard-home-follower-summary is-loading"
        : "venue-dashboard-home-follower-summary";

  return (
    <article className="venue-dashboard-home-card venue-dashboard-home-followers-card">
      <header className="venue-dashboard-home-card-heading">
        <div>
          <p className="venue-dashboard-eyebrow">
            Audience
          </p>

          <h3>Follower snapshot</h3>
        </div>
      </header>

      <div className={followerStateClassName}>
        <span className="venue-dashboard-home-follower-label">
          Followers
        </span>

        <strong>{followerValue}</strong>

        <p>{followerGrowthLabel}</p>
      </div>

      <button
        className="venue-dashboard-home-secondary-action"
        type="button"
        onClick={onOpenAnalytics}
      >
        View analytics
      </button>
    </article>
  );
}