import type { VenueDashboardEvent } from "../../venueDashboardService";

export function sortHistoryEventsNewestFirst(
  historyEvents: VenueDashboardEvent[]
) {
  return historyEvents.slice().sort((firstEvent, secondEvent) => {
    return (
      getHistoryEventTimestamp(secondEvent) -
      getHistoryEventTimestamp(firstEvent)
    );
  });
}

export function getHistoryEventTimestamp(event: VenueDashboardEvent) {
  const preferredDate =
    event.deleted_at || event.ends_at || event.starts_at || "";

  const timestamp = new Date(preferredDate).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function wasHistoryEventRemoved(event: VenueDashboardEvent) {
  return Boolean(event.deleted_at);
}

export function getHistoryEventState(event: VenueDashboardEvent) {
  return wasHistoryEventRemoved(event) ? "Removed" : "Expired";
}

export function formatHistoryDate(
  isoValue: string | null,
  fallback = "No date saved"
) {
  if (!isoValue) return fallback;

  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getHistoryEventTiming(event: VenueDashboardEvent) {
  return (
    event.display_time ||
    formatHistoryDate(event.starts_at, "No timing information saved")
  );
}

export function getHistoryVisibilityLabel(event: VenueDashboardEvent) {
  return event.is_active === false ? "Hidden" : "Visible";
}

export function getHistoryLiveStateLabel(event: VenueDashboardEvent) {
  return event.is_live === true ? "Was live" : "Not live";
}