import type {
  VenueDashboardEvent,
} from "../../venueDashboardService";
import {
  getLiveActivityTiming,
  getTimeUntilActivity,
} from "./analyticsInsights";
import { AnalyticsSectionHeading } from "./AnalyticsSectionHeading";
import { formatAnalyticsActivityDate } from "./analyticsFormatters";

type AnalyticsNextActivityProps = {
  currentLiveActivity: VenueDashboardEvent | null;
  nextActivity: VenueDashboardEvent | null;
};

export function AnalyticsNextActivity({
  currentLiveActivity,
  nextActivity,
}: AnalyticsNextActivityProps) {
  const liveTiming = currentLiveActivity
    ? getLiveActivityTiming(
        currentLiveActivity
      )
    : null;

  const nextActivityCountdown =
    getTimeUntilActivity(
      nextActivity?.starts_at ?? null
    );

  return (
    <section className="venue-dashboard-analytics-card venue-dashboard-analytics-timing-card">
      <AnalyticsSectionHeading
        eyebrow="Activity timing"
        title="What happens next"
        description="Understand the timing of your current and upcoming Livey activity."
      />

      <div className="venue-dashboard-analytics-timing-grid">
        <article>
          <span>Live now</span>

          {currentLiveActivity ? (
            <>
              <strong>
                {currentLiveActivity.title}
              </strong>

              <p>
                {currentLiveActivity.display_time ||
                  "Currently visible on Livey"}
              </p>

              {liveTiming ? (
                <div className="venue-dashboard-analytics-duration-grid">
                  <small>
                    <span>Running</span>
                    <strong>
                      {liveTiming.elapsed}
                    </strong>
                  </small>

                  <small>
                    <span>Remaining</span>
                    <strong>
                      {liveTiming.remaining}
                    </strong>
                  </small>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <strong>No live activity</strong>
              <p>
                Nothing is currently running.
              </p>
            </>
          )}
        </article>

        <article>
          <span>Next start</span>

          {nextActivity ? (
            <>
              <strong>{nextActivity.title}</strong>

              <p>
                {nextActivity.display_time ||
                  formatAnalyticsActivityDate(
                    nextActivity.starts_at
                  )}
              </p>

              <div className="venue-dashboard-analytics-countdown">
                <span>Starts in</span>
                <strong>
                  {nextActivityCountdown ||
                    "Time not set"}
                </strong>
              </div>
            </>
          ) : (
            <>
              <strong>
                No upcoming activity
              </strong>

              <p>
                Schedule activity to create a future
                countdown.
              </p>
            </>
          )}
        </article>
      </div>
    </section>
  );
}