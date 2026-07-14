import type { ReactNode } from "react";
import type {
  VenueDashboardAnalytics,
} from "../../venueDashboardService";
import {
  AudienceMetricIcon,
  CalendarMetricIcon,
  ProfileMetricIcon,
  VisibilityMetricIcon,
} from "./AnalyticsIcons";

type AnalyticsSummaryGridProps = {
  analytics: VenueDashboardAnalytics;
};

export function AnalyticsSummaryGrid({
  analytics,
}: AnalyticsSummaryGridProps) {
  const followerValue =
    analytics.isFollowerAnalyticsLoading
      ? "—"
      : analytics.followerAnalyticsError
        ? "—"
        : analytics.totalFollowers ?? 0;

  return (
    <section
      className="venue-dashboard-analytics-summary-grid"
      aria-label="Venue analytics summary"
    >
      <AnalyticsMetricCard
        label="Followers"
        value={followerValue}
        description={getFollowerDescription(
          analytics
        )}
        icon={<AudienceMetricIcon />}
        emphasized
      >
        <FollowerGrowth
          analytics={analytics}
        />
      </AnalyticsMetricCard>

      <AnalyticsMetricCard
        label="Visible now"
        value={analytics.visibleActivities}
        description="Current or upcoming activity visible on Livey."
        icon={<VisibilityMetricIcon />}
      />

      <AnalyticsMetricCard
        label="Upcoming"
        value={analytics.upcomingActivities}
        description="Scheduled activity that has not started yet."
        icon={<CalendarMetricIcon />}
      />

      <AnalyticsMetricCard
        label="Profile ready"
        value={`${analytics.profileCompleteness}%`}
        description="How complete your public venue profile is."
        icon={<ProfileMetricIcon />}
      />
    </section>
  );
}

function AnalyticsMetricCard({
  label,
  value,
  description,
  icon,
  emphasized = false,
  children,
}: {
  label: string;
  value: number | string;
  description: string;
  icon: ReactNode;
  emphasized?: boolean;
  children?: ReactNode;
}) {
  return (
    <article
      className={
        emphasized
          ? "venue-dashboard-analytics-metric-card is-emphasized"
          : "venue-dashboard-analytics-metric-card"
      }
    >
      <div className="venue-dashboard-analytics-metric-icon">
        {icon}
      </div>

      <span>{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>

      {children}
    </article>
  );
}

function FollowerGrowth({
  analytics,
}: {
  analytics: VenueDashboardAnalytics;
}) {
  if (analytics.isFollowerAnalyticsLoading) {
    return (
      <div className="venue-dashboard-analytics-follower-state">
        Loading follower totals...
      </div>
    );
  }

  if (analytics.followerAnalyticsError) {
    return (
      <div className="venue-dashboard-analytics-follower-state is-error">
        Follower data unavailable
      </div>
    );
  }

  return (
    <div className="venue-dashboard-analytics-follower-growth">
      <div>
        <span>Last 7 days</span>

        <strong>
          +{analytics.newFollowersLast7Days ?? 0}
        </strong>
      </div>

      <div>
        <span>Last 30 days</span>

        <strong>
          +{analytics.newFollowersLast30Days ?? 0}
        </strong>
      </div>
    </div>
  );
}

function getFollowerDescription(
  analytics: VenueDashboardAnalytics
) {
  if (analytics.isFollowerAnalyticsLoading) {
    return "Loading your current Livey audience.";
  }

  if (analytics.followerAnalyticsError) {
    return "Follower totals could not be loaded right now.";
  }

  return "People currently following this venue on Livey.";
}