import type {
  VenueActivityStatus,
  VenueDashboardEvent,
} from "../../venueDashboardService";
import type {
  EditingEventState,
} from "../VenueDashboardActivity";

const DEFAULT_REUSED_STATUS: VenueActivityStatus =
  "Scheduled";

export function createActivityDraftFromHistory(
  event: VenueDashboardEvent
): EditingEventState {
  return {
    id: null,
    mode: "create",
    title: event.title || "",
    description: event.description || "",
    status: getReusableActivityStatus(
      event.status
    ),
    displayTime:
      event.display_time || "",
    startsAt: "",
    endsAt: "",
    isActive: true,
  };
}

function getReusableActivityStatus(
  status: VenueActivityStatus
): VenueActivityStatus {
  if (
    status === "Live now" ||
    status === "Open now"
  ) {
    return DEFAULT_REUSED_STATUS;
  }

  return status;
}