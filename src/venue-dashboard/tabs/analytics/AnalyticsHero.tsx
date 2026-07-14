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
  {venueName}&apos;s Overview
</h2>

<p>
  See how your activity, audience, and profile are performing across Livey.
</p>
      </div>
    </section>
  );
}