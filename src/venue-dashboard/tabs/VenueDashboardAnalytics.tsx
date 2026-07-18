import type {
  VenueDashboardAnalytics as VenueDashboardAnalyticsData,
  VenueDashboardEvent,
} from "../venueDashboardService";
import { AnalyticsActivityHealth } from "./analytics/AnalyticsActivityHealth";
import { AnalyticsAudienceState } from "./analytics/AnalyticsAudienceState";
import { AnalyticsHero } from "./analytics/AnalyticsHero";
import { AnalyticsNextActivity } from "./analytics/AnalyticsNextActivity";
import { AnalyticsProfileHealth } from "./analytics/AnalyticsProfileHealth";
import { AnalyticsPublishingSummary } from "./analytics/AnalyticsPublishingSummary";
import { AnalyticsPublishingTrend } from "./analytics/AnalyticsPublishingTrend";
import { calculateAnalyticsPercentage } from "./analytics/analyticsFormatters";
import { AnalyticsFollowerGrowth } from "./analytics/AnalyticsFollowerGrowth";
import type {
  EditableProfileFocusTarget,
} from "./analytics/AnalyticsProfileHealthModal";

type VenueDashboardAnalyticsProps = {
  venueName: string;
  events: VenueDashboardEvent[];
  analytics: VenueDashboardAnalyticsData;
  onRefreshAnalytics?: () => void;
  onOpenAccountSettings: (
  target: EditableProfileFocusTarget
) => void;
};

export function VenueDashboardAnalytics({
  venueName,
  events,
  analytics,
  onRefreshAnalytics,
  onOpenAccountSettings,
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

<AnalyticsNextActivity
  currentLiveActivity={
    analytics.currentLiveActivity
  }
  nextActivity={analytics.nextActivity}
/>

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
  onOpenAccountSettings={
    onOpenAccountSettings
  }
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

      <AnalyticsAudienceState />
    </section>
  );
}