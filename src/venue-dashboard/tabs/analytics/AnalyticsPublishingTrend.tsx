import {
  useMemo,
  useState,
} from "react";
import type {
  VenueDashboardEvent,
} from "../../venueDashboardService";
import { AnalyticsSectionHeading } from "./AnalyticsSectionHeading";
import { AnalyticsPublishingChart } from "./AnalyticsPublishingChart";
import { AnalyticsPublishingHistoryModal } from "./AnalyticsPublishingHistoryModal";
import { buildCurrentWeekPublishingTrend } from "./analyticsInsights";

type AnalyticsPublishingTrendProps = {
  events: VenueDashboardEvent[];
};

export function AnalyticsPublishingTrend({
  events,
}: AnalyticsPublishingTrendProps) {
  const [
    isHistoryModalOpen,
    setIsHistoryModalOpen,
  ] = useState(false);

  const trend = useMemo(() => {
    return buildCurrentWeekPublishingTrend(
      events
    );
  }, [events]);

  const totalPublished = trend.reduce(
    (total, point) =>
      total + point.count,
    0
  );

  const activePublishingDays =
    trend.filter(
      (point) => point.count > 0
    ).length;

  return (
    <>
      <section className="venue-dashboard-analytics-card venue-dashboard-analytics-trend-card">
        <AnalyticsSectionHeading
          eyebrow="Publishing trend"
          title="This week"
          description="See how consistently new activity has been published this week."
        />

        <div className="venue-dashboard-analytics-trend-summary">
          <div>
            <span>
              Activities published
            </span>

            <strong>
              {totalPublished}
            </strong>
          </div>

          <small>
            {activePublishingDays === 1
              ? "Across 1 publishing day this week"
              : `Across ${activePublishingDays} publishing days this week`}
          </small>
        </div>

        <AnalyticsPublishingChart
          points={trend}
          ariaLabel={`${totalPublished} activities published during the current week`}
        />

        {totalPublished === 0 ? (
          <div className="venue-dashboard-analytics-trend-empty">
            <strong>
              No activity published this
              week
            </strong>

            <span>
              New activity published this
              week will appear here.
            </span>
          </div>
        ) : null}

        <div className="venue-dashboard-analytics-trend-actions">
          <button
            type="button"
            onClick={() =>
              setIsHistoryModalOpen(true)
            }
          >
            View more
          </button>
        </div>
      </section>

      {isHistoryModalOpen ? (
        <AnalyticsPublishingHistoryModal
          events={events}
          onClose={() =>
            setIsHistoryModalOpen(false)
          }
        />
      ) : null}
    </>
  );
}