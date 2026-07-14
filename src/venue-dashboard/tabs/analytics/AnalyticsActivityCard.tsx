import type {
  VenueDashboardEvent,
} from "../../venueDashboardService";
import { ActivityEmptyIcon } from "./AnalyticsIcons";
import { formatAnalyticsActivityDate } from "./analyticsFormatters";

type AnalyticsActivityCardProps = {
  eyebrow: string;
  title: string;
  event: VenueDashboardEvent | null;
  emptyTitle: string;
  emptyDescription: string;
};

export function AnalyticsActivityCard({
  eyebrow,
  title,
  event,
  emptyTitle,
  emptyDescription,
}: AnalyticsActivityCardProps) {
  return (
    <article className="venue-dashboard-analytics-card venue-dashboard-analytics-activity-card">
      <header className="venue-dashboard-analytics-activity-heading">
        <p className="venue-dashboard-eyebrow">
          {eyebrow}
        </p>

        <h2>{title}</h2>
      </header>

      {event ? (
        <div className="venue-dashboard-analytics-activity-content">
          <div>
            <strong>{event.title}</strong>

            <p>
              {event.display_time ||
                formatAnalyticsActivityDate(
                  event.starts_at
                )}
            </p>
          </div>

          <span className="venue-dashboard-status-pill">
            {event.status}
          </span>
        </div>
      ) : (
        <div className="venue-dashboard-analytics-activity-empty">
          <ActivityEmptyIcon />

          <div>
            <strong>{emptyTitle}</strong>
            <p>{emptyDescription}</p>
          </div>
        </div>
      )}
    </article>
  );
}