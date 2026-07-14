import type {
  VenueDashboardAnalytics as VenueDashboardAnalyticsData,
  VenueDashboardEvent,
  VenueDashboardVenue,
} from "../venueDashboardService";
import { AnalyticsActivityCard } from "./analytics/AnalyticsActivityCard";
import { AnalyticsActivityHealth } from "./analytics/AnalyticsActivityHealth";
import { AnalyticsAudienceState } from "./analytics/AnalyticsAudienceState";
import { AnalyticsHero } from "./analytics/AnalyticsHero";
import { AnalyticsNextActivity } from "./analytics/AnalyticsNextActivity";
import { AnalyticsProfileHealth } from "./analytics/AnalyticsProfileHealth";
import { AnalyticsProfileRecommendations } from "./analytics/AnalyticsProfileRecommendations";
import { AnalyticsPublishingSummary } from "./analytics/AnalyticsPublishingSummary";
import { AnalyticsPublishingTrend } from "./analytics/AnalyticsPublishingTrend";
import { AnalyticsSummaryGrid } from "./analytics/AnalyticsSummaryGrid";
import { calculateAnalyticsPercentage } from "./analytics/analyticsFormatters";
import { AnalyticsFollowerGrowth } from "./analytics/AnalyticsFollowerGrowth";

type VenueDashboardAnalyticsProps = {
  venueName: string;
  venue: VenueDashboardVenue;
  events: VenueDashboardEvent[];
  analytics: VenueDashboardAnalyticsData;
  onRefreshAnalytics?: () => void;
};

export function VenueDashboardAnalytics({
  venueName,
  venue,
  events,
  analytics,
  onRefreshAnalytics,
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

<AnalyticsFollowerGrowth
  analytics={analytics}
  onRefresh={onRefreshAnalytics}
/>

      <section className="venue-dashboard-analytics-main-grid">
        <AnalyticsActivityHealth
          analytics={analytics}
          activityCoverage={activityCoverage}
          upcomingShare={upcomingShare}
          historyShare={historyShare}
        />

        <AnalyticsProfileHealth
          analytics={analytics}
        />
      </section>

      <section className="venue-dashboard-analytics-insights-grid">
        <AnalyticsPublishingTrend
          events={events}
        />

        <AnalyticsPublishingSummary
          events={events}
        />
      </section>

      <AnalyticsNextActivity
        currentLiveActivity={
          analytics.currentLiveActivity
        }
        nextActivity={analytics.nextActivity}
      />

      <AnalyticsProfileRecommendations
        venue={venue}
      />

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