import type {
  VenueDashboardAnalytics as VenueDashboardAnalyticsData,
} from "../venueDashboardService";
import { AnalyticsActivityCard } from "./analytics/AnalyticsActivityCard";
import { AnalyticsActivityHealth } from "./analytics/AnalyticsActivityHealth";
import { AnalyticsAudienceState } from "./analytics/AnalyticsAudienceState";
import { AnalyticsHero } from "./analytics/AnalyticsHero";
import { AnalyticsProfileHealth } from "./analytics/AnalyticsProfileHealth";
import { AnalyticsSummaryGrid } from "./analytics/AnalyticsSummaryGrid";
import { calculateAnalyticsPercentage } from "./analytics/analyticsFormatters";

type VenueDashboardAnalyticsProps = {
  venueName: string;
  analytics: VenueDashboardAnalyticsData;
};

export function VenueDashboardAnalytics({
  venueName,
  analytics,
}: VenueDashboardAnalyticsProps) {
  const activityCoverage =
    calculateAnalyticsPercentage(
      analytics.visibleActivities,
      analytics.totalActivities
    );

  const upcomingShare =
    calculateAnalyticsPercentage(
      analytics.upcomingActivities,
      analytics.totalActivities
    );

  const historyShare =
    calculateAnalyticsPercentage(
      analytics.historyActivities,
      analytics.totalActivities
    );

  return (
    <section className="venue-dashboard-analytics">
      <AnalyticsHero venueName={venueName} />

      <AnalyticsSummaryGrid analytics={analytics} />

      <section className="venue-dashboard-analytics-main-grid">
        <AnalyticsActivityHealth
          analytics={analytics}
          activityCoverage={activityCoverage}
          upcomingShare={upcomingShare}
          historyShare={historyShare}
        />

        <AnalyticsProfileHealth analytics={analytics} />
      </section>

      <section className="venue-dashboard-analytics-schedule-grid">
        <AnalyticsActivityCard
          eyebrow="Live activity"
          title="Happening now"
          event={analytics.currentLiveActivity}
          emptyTitle="Nothing is live right now"
          emptyDescription="When an activity is currently running, it will appear here."
        />

        <AnalyticsActivityCard
          eyebrow="Next activity"
          title="Coming up"
          event={analytics.nextActivity}
          emptyTitle="No upcoming activity"
          emptyDescription="Create or schedule activity to build your upcoming venue calendar."
        />
      </section>

      <AnalyticsAudienceState />
    </section>
  );
}