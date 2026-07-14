type AnalyticsSectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function AnalyticsSectionHeading({
  eyebrow,
  title,
  description,
}: AnalyticsSectionHeadingProps) {
  return (
    <header className="venue-dashboard-analytics-section-heading">
      <p className="venue-dashboard-eyebrow">
        {eyebrow}
      </p>

      <h2>{title}</h2>

      <p>{description}</p>
    </header>
  );
}