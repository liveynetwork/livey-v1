import type {
  VenueDashboardEvent,
} from "../../venueDashboardService";
import type {
  HistoryReuseMode,
} from "./VenueDashboardHistoryReuseAction";
import "./VenueDashboardHistoryRowActions.css";

type VenueDashboardHistoryRowActionsProps = {
  event: VenueDashboardEvent;
  mode: HistoryReuseMode;
  onOpenEvent: (
    event: VenueDashboardEvent
  ) => void;
  onReuseEvent: (
    event: VenueDashboardEvent,
    mode: HistoryReuseMode
  ) => void;
};

export function VenueDashboardHistoryRowActions({
  event,
  mode,
  onOpenEvent,
  onReuseEvent,
}: VenueDashboardHistoryRowActionsProps) {
  const reuseLabel =
    mode === "restore"
      ? "Restore activity"
      : "Use again";

  return (
    <div className="venue-dashboard-history-row-actions">
      <button
        className="venue-dashboard-history-row-action"
        type="button"
        onClick={() =>
          onOpenEvent(event)
        }
      >
        View details
      </button>

      <button
        className="venue-dashboard-history-row-action is-primary"
        type="button"
        onClick={() =>
          onReuseEvent(
            event,
            mode
          )
        }
      >
        {reuseLabel}
      </button>
    </div>
  );
}