import "./VenueDashboardActivityCreateCard.css";

type VenueDashboardActivityCreateCardProps = {
  onCreateEvent: () => void;
};

export function VenueDashboardActivityCreateCard({
  onCreateEvent,
}: VenueDashboardActivityCreateCardProps) {
  return (
    <section className="venue-dashboard-activity-create-card">
      <div className="venue-dashboard-activity-create-card-copy">
        <p className="venue-dashboard-eyebrow">
  Create activity
</p>

        <h2>Create a Livey activity</h2>

        <p>
          Share what is happening at your venue and make it visible to
          people on Livey.
        </p>
      </div>

      <button
        className="venue-dashboard-activity-create-card-action"
        type="button"
        onClick={onCreateEvent}
      >
        Create activity
      </button>

      <div className="venue-dashboard-activity-create-card-benefits">
        <span>Appears on the Livey map</span>
        <span aria-hidden="true">•</span>
        <span>Editable anytime</span>
        <span aria-hidden="true">•</span>
        <span>Hide whenever needed</span>
      </div>

      <span
        className="venue-dashboard-activity-create-card-accent"
        aria-hidden="true"
      />
    </section>
  );
}