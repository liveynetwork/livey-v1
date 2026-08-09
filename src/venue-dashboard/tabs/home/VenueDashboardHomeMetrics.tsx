import type { DashboardSection } from "../../VenueDashboardSidebar";
import "./VenueDashboardHomeMetrics.css";

type VenueDashboardHomeMetricsProps = {
  totalFollowers: number;
  newFollowersLast7Days: number;
  liveEventCount: number;
  visibleEventCount: number;
  historyEventCount: number;
  isFollowerAnalyticsLoading: boolean;
  followerAnalyticsError: string | null;
  onSectionChange: (section: DashboardSection) => void;
};

export function VenueDashboardHomeMetrics({
  totalFollowers,
  newFollowersLast7Days,
  liveEventCount,
  visibleEventCount,
  historyEventCount,
  isFollowerAnalyticsLoading,
  followerAnalyticsError,
  onSectionChange,
}: VenueDashboardHomeMetricsProps) {
  const followerValue = isFollowerAnalyticsLoading
    ? "—"
    : followerAnalyticsError
      ? "—"
      : totalFollowers.toLocaleString();

  const followerDescription = isFollowerAnalyticsLoading
    ? "Loading follower data"
    : followerAnalyticsError
      ? "Follower data unavailable"
      : newFollowersLast7Days > 0
        ? `+${newFollowersLast7Days.toLocaleString()} in the last 7 days`
        : "No new followers in the last 7 days";

  return (
    <section
      className="venue-dashboard-home-metrics"
      aria-label="Venue statistics"
    >
      <article className="venue-dashboard-home-metric-card">
        <div className="venue-dashboard-home-metric-heading">
          <span>Followers</span>

          <button
            type="button"
            onClick={() =>
              onSectionChange("analytics")
            }
          >
            Analytics
          </button>
        </div>

        <strong>{followerValue}</strong>

        <p>{followerDescription}</p>
      </article>

      <article className="venue-dashboard-home-metric-card">
        <div className="venue-dashboard-home-metric-heading">
          <span>Live now</span>
        </div>

        <strong>{liveEventCount}</strong>

        <p>
          {liveEventCount === 1
            ? "1 activity is live"
            : `${liveEventCount} activities are live`}
        </p>
      </article>

      <article className="venue-dashboard-home-metric-card">
        <div className="venue-dashboard-home-metric-heading">
          <span>Visible</span>
        </div>

        <strong>{visibleEventCount}</strong>

        <p>
          {visibleEventCount === 1
            ? "1 activity is visible"
            : `${visibleEventCount} activities are visible`}
        </p>
      </article>

      <article className="venue-dashboard-home-metric-card">
        <div className="venue-dashboard-home-metric-heading">
          <span>Past activity</span>

          <button
            type="button"
            onClick={() =>
              onSectionChange("history")
            }
          >
            History
          </button>
        </div>

        <strong>{historyEventCount}</strong>

        <p>
          {historyEventCount === 1
            ? "1 activity in your archive"
            : `${historyEventCount} activities in your archive`}
        </p>
      </article>
    </section>
  );
}