type VenueDashboardComingSoonProps = {
  title: string;
  description: string;
};

export function VenueDashboardComingSoon({
  title,
  description,
}: VenueDashboardComingSoonProps) {
  return (
    <section className="venue-dashboard-card venue-dashboard-coming-soon">
      <p className="venue-dashboard-eyebrow">Coming soon</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}