import type {
  VenueDashboardEvent,
} from "../../venueDashboardService";
import { AnalyticsSectionHeading } from "./AnalyticsSectionHeading";
import { buildPublishingSummary } from "./analyticsInsights";

type AnalyticsPublishingSummaryProps = {
  events: VenueDashboardEvent[];
};

export function AnalyticsPublishingSummary({
  events,
}: AnalyticsPublishingSummaryProps) {
  const summary =
    buildPublishingSummary(events);

  return (
    <section className="venue-dashboard-analytics-card venue-dashboard-analytics-publishing-summary-card">
      <AnalyticsSectionHeading
        eyebrow="Publishing pace"
        title="This month compared"
        description="Compare how much venue activity has been created this month and last month."
      />

      <div className="venue-dashboard-analytics-month-grid">
        <div>
          <span>This month</span>
          <strong>{summary.thisMonth}</strong>
          <small>Activities created</small>
        </div>

        <div>
          <span>Last month</span>
          <strong>{summary.lastMonth}</strong>
          <small>Activities created</small>
        </div>
      </div>

      <div
        className={`venue-dashboard-analytics-month-change is-${summary.direction}`}
      >
        <span>
          {getDirectionLabel(summary.direction)}
        </span>

        <strong>
          {formatDifference(summary.difference)}
        </strong>

        <small>
          {formatPercentageChange(
            summary.percentageChange,
            summary.lastMonth
          )}
        </small>
      </div>
    </section>
  );
}

function getDirectionLabel(
  direction: "up" | "down" | "same"
) {
  if (direction === "up") {
    return "Publishing increased";
  }

  if (direction === "down") {
    return "Publishing decreased";
  }

  return "Publishing is unchanged";
}

function formatDifference(difference: number) {
  if (difference > 0) {
    return `+${difference}`;
  }

  return String(difference);
}

function formatPercentageChange(
  percentage: number | null,
  lastMonth: number
) {
  if (percentage === null) {
    return lastMonth === 0
      ? "No previous-month baseline"
      : "Change unavailable";
  }

  if (percentage > 0) {
    return `${percentage}% more than last month`;
  }

  if (percentage < 0) {
    return `${Math.abs(
      percentage
    )}% fewer than last month`;
  }

  return "Same as last month";
}