import type { ReactNode } from "react";
import type {
  VenueDashboardAnalytics,
} from "../../venueDashboardService";
import {
  ActivityMetricIcon,
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
  return (
    <section
      className="venue-dashboard-analytics-summary-grid"
      aria-label="Venue analytics summary"
    >
      <AnalyticsMetricCard
        label="Total activity"
        value={analytics.totalActivities}
        description="All activity created for this venue."
        icon={<ActivityMetricIcon />}
      />

      <AnalyticsMetricCard
        label="Visible now"
        value={analytics.visibleActivities}
        description="Current or upcoming activity visible on Livey."
        icon={<VisibilityMetricIcon />}
        emphasized
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
}: {
  label: string;
  value: number | string;
  description: string;
  icon: ReactNode;
  emphasized?: boolean;
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
    </article>
  );
}