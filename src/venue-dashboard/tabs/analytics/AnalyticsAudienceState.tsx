import { AudienceMetricIcon } from "./AnalyticsIcons";

export function AnalyticsAudienceState() {
  return (
    <section className="venue-dashboard-analytics-card venue-dashboard-analytics-audience-card">
      <div className="venue-dashboard-analytics-audience-icon">
        <AudienceMetricIcon />
      </div>

      <div className="venue-dashboard-analytics-audience-copy">
        <p className="venue-dashboard-eyebrow">
          Audience insights
        </p>

        <h2>
          More customer signals are being prepared.
        </h2>

        <p>
          Followers, map impressions, venue opens,
          activity taps, and directions requests will
          appear here soon.
        </p>
      </div>

      <div className="venue-dashboard-analytics-audience-status">
        <span />
        Collecting soon
      </div>
    </section>
  );
}