type AnalyticsHeroProps = {
  venueName: string;
};

export function AnalyticsHero({
  venueName,
}: AnalyticsHeroProps) {
  return (
    <section className="venue-dashboard-analytics-hero">
      <div className="venue-dashboard-analytics-hero-copy">
        <p className="venue-dashboard-eyebrow">
          Venue performance
        </p>

        <h2>
          A clearer view of how {venueName} is performing.
        </h2>

        <p>
          Review your activity visibility, publishing health,
          upcoming schedule, and venue profile readiness.
        </p>
      </div>

      <div className="venue-dashboard-analytics-hero-status">
        <span>Analytics V1</span>
        <strong>Live</strong>
      </div>
    </section>
  );
}