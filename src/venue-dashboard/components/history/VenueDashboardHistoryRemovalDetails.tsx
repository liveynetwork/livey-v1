import type {
  VenueDashboardEvent,
} from "../../venueDashboardService";
import {
  formatHistoryDate,
} from "./historyUtils";
import "./VenueDashboardHistoryRemovalDetails.css";

type VenueDashboardHistoryRemovalDetailsProps = {
  event: VenueDashboardEvent;
};

export function VenueDashboardHistoryRemovalDetails({
  event,
}: VenueDashboardHistoryRemovalDetailsProps) {
  const endedEarly =
    getEndedEarlyState(event);

  return (
    <section className="venue-dashboard-history-removal-details">
      <header className="venue-dashboard-history-removal-details-heading">
        <p className="venue-dashboard-eyebrow">
          Removal information
        </p>

        <h3>
          How this activity ended
        </h3>

        <p>
          Review when this activity was removed and whether it ended before its original schedule.
        </p>
      </header>

      <div className="venue-dashboard-history-removal-details-grid">
        <RemovalDetailItem
          label="Removed"
          value={formatHistoryDate(
            event.deleted_at
          )}
        />

        <RemovalDetailItem
          label="Removal reason"
          value={
            event.deleted_reason ||
            "No reason was saved"
          }
        />

        <RemovalDetailItem
          label="Original scheduled end"
          value={formatHistoryDate(
            event.ends_at
          )}
        />

        <RemovalDetailItem
          label="Ended early"
          value={
            endedEarly === null
              ? "Unknown"
              : endedEarly
                ? "Yes"
                : "No"
          }
        />
      </div>
    </section>
  );
}

type RemovalDetailItemProps = {
  label: string;
  value: string;
};

function RemovalDetailItem({
  label,
  value,
}: RemovalDetailItemProps) {
  return (
    <article className="venue-dashboard-history-removal-detail-item">
      <span>{label}</span>

      <strong>{value}</strong>
    </article>
  );
}

function getEndedEarlyState(
  event: VenueDashboardEvent
): boolean | null {
  if (
    !event.deleted_at ||
    !event.ends_at
  ) {
    return null;
  }

  const removedTimestamp =
    new Date(
      event.deleted_at
    ).getTime();

  const scheduledEndTimestamp =
    new Date(
      event.ends_at
    ).getTime();

  if (
    Number.isNaN(
      removedTimestamp
    ) ||
    Number.isNaN(
      scheduledEndTimestamp
    )
  ) {
    return null;
  }

  return (
    removedTimestamp <
    scheduledEndTimestamp
  );
}