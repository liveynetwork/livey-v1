import type {
  VenueDashboardAnalytics,
} from "../../venueDashboardService";
import { AnalyticsSectionHeading } from "./AnalyticsSectionHeading";
import { clampAnalyticsPercentage } from "./analyticsFormatters";

type AnalyticsActivityHealthProps = {
  analytics: VenueDashboardAnalytics;
  activityCoverage: number;
  upcomingShare: number;
  historyShare: number;
};

export function AnalyticsActivityHealth({
  analytics,
  activityCoverage,
  upcomingShare,
  historyShare,
}: AnalyticsActivityHealthProps) {
  return (
    <section className="venue-dashboard-analytics-card venue-dashboard-analytics-health-card">
      <AnalyticsSectionHeading
        eyebrow="Activity health"
        title="Your Livey activity overview"
        description="A truthful breakdown based on the activity currently stored for your venue."
      />

      <div className="venue-dashboard-analytics-health-list">
        <AnalyticsProgressRow
          label="Visible activity"
          value={analytics.visibleActivities}
          total={analytics.totalActivities}
          percentage={activityCoverage}
          tone="orange"
        />

        <AnalyticsProgressRow
          label="Upcoming activity"
          value={analytics.upcomingActivities}
          total={analytics.totalActivities}
          percentage={upcomingShare}
          tone="cream"
        />

        <AnalyticsProgressRow
          label="History"
          value={analytics.historyActivities}
          total={analytics.totalActivities}
          percentage={historyShare}
          tone="muted"
        />
      </div>

      <div className="venue-dashboard-analytics-health-summary">
        <AnalyticsHealthValue
          label="Live now"
          value={analytics.liveNowActivities}
        />

        <AnalyticsHealthValue
          label="Hidden"
          value={analytics.hiddenActivities}
        />

        <AnalyticsHealthValue
          label="Expired"
          value={analytics.expiredActivities}
        />

        <AnalyticsHealthValue
          label="Removed"
          value={analytics.removedActivities}
        />
      </div>
    </section>
  );
}

function AnalyticsProgressRow({
  label,
  value,
  total,
  percentage,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  percentage: number;
  tone: "orange" | "cream" | "muted";
}) {
  return (
    <div className="venue-dashboard-analytics-progress-row">
      <div className="venue-dashboard-analytics-progress-copy">
        <span>{label}</span>

        <strong>
          {value}
          <small> / {total}</small>
        </strong>
      </div>

      <div
        className="venue-dashboard-analytics-progress-track"
        aria-hidden="true"
      >
        <span
          className={`is-${tone}`}
          style={{
            width: `${clampAnalyticsPercentage(
              percentage
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function AnalyticsHealthValue({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}