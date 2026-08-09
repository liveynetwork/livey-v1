import "./VenueDashboardHomeHistorySnapshot.css";

type VenueDashboardHomeHistorySnapshotProps = {
  historyEventCount: number;
  onOpenHistory: () => void;
};

export function VenueDashboardHomeHistorySnapshot({
  historyEventCount,
  onOpenHistory,
}: VenueDashboardHomeHistorySnapshotProps) {
  const historyDescription =
    historyEventCount === 0
      ? "Your archive will build as activities expire or are removed."
      : historyEventCount === 1
        ? "1 activity is stored in your venue archive."
        : `${historyEventCount} activities are stored in your venue archive.`;

  return (
    <article className="venue-dashboard-home-card venue-dashboard-home-history-card">
      <header className="venue-dashboard-home-card-heading">
        <div>
          <p className="venue-dashboard-eyebrow">
            Archive
          </p>

          <h3>Activity history</h3>
        </div>
      </header>

      <div className="venue-dashboard-home-history-summary">
        <span>Past activities</span>

        <strong>{historyEventCount}</strong>

        <p>{historyDescription}</p>
      </div>

      <button
        className="venue-dashboard-home-secondary-action"
        type="button"
        onClick={onOpenHistory}
      >
        View history
      </button>
    </article>
  );
}