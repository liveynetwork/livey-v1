import type {
  VenueDashboardEvent,
} from "../../venueDashboardService";
import { AnalyticsSectionHeading } from "./AnalyticsSectionHeading";
import { buildPublishingTrend } from "./analyticsInsights";

type AnalyticsPublishingTrendProps = {
  events: VenueDashboardEvent[];
};

export function AnalyticsPublishingTrend({
  events,
}: AnalyticsPublishingTrendProps) {
  const trend = buildPublishingTrend(events, 14);

  const highestValue = Math.max(
    ...trend.map((point) => point.count),
    1
  );

  const totalPublished = trend.reduce(
    (total, point) => total + point.count,
    0
  );

  return (
    <section className="venue-dashboard-analytics-card venue-dashboard-analytics-trend-card">
      <AnalyticsSectionHeading
        eyebrow="Publishing trend"
        title="Your last 14 days"
        description="See how consistently new activity has been published for your venue."
      />

      <div className="venue-dashboard-analytics-trend-summary">
        <span>Activities published</span>
        <strong>{totalPublished}</strong>
      </div>

      <div
        className="venue-dashboard-analytics-chart"
        aria-label={`Activities published over the last 14 days: ${totalPublished}`}
      >
        {trend.map((point) => {
          const heightPercentage =
            point.count > 0
              ? Math.max(
                  (point.count / highestValue) * 100,
                  12
                )
              : 3;

          return (
            <div
              className="venue-dashboard-analytics-chart-column"
              key={point.key}
              title={`${point.label}: ${point.count}`}
            >
              <div className="venue-dashboard-analytics-chart-value">
                {point.count > 0
                  ? point.count
                  : ""}
              </div>

              <div className="venue-dashboard-analytics-chart-track">
                <span
                  className={
                    point.count > 0
                      ? "is-active"
                      : ""
                  }
                  style={{
                    height: `${heightPercentage}%`,
                  }}
                />
              </div>

              <small>{point.label}</small>
            </div>
          );
        })}
      </div>

      {totalPublished === 0 ? (
        <p className="venue-dashboard-analytics-trend-empty">
          No new activity was published during this
          period.
        </p>
      ) : null}
    </section>
  );
}