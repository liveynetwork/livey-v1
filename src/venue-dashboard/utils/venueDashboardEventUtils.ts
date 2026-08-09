import type {
  VenueDashboardEvent,
} from "../venueDashboardService";
import type {
  EditingEventState,
} from "../tabs/VenueDashboardActivity";
import {
  getPreviewTiming,
  toDateTimeLocalValue,
} from "./venueDashboardTimingUtils";

export function isEventInHistory(
  event: VenueDashboardEvent
) {
  if (event.deleted_at) {
    return true;
  }

  if (!event.ends_at) {
    return false;
  }

  return (
    new Date(
      event.ends_at
    ).getTime() < Date.now()
  );
}

export function areEditingEventsDifferent(
  currentEvent: EditingEventState | null,
  originalEvent: EditingEventState | null
) {
  if (!currentEvent) {
    return false;
  }

  if (!originalEvent) {
    return true;
  }

  return (
    currentEvent.id !== originalEvent.id ||
    currentEvent.mode !== originalEvent.mode ||
    currentEvent.title !== originalEvent.title ||
    currentEvent.description !==
      originalEvent.description ||
    currentEvent.status !== originalEvent.status ||
    currentEvent.displayTime !==
      originalEvent.displayTime ||
    currentEvent.startsAt !==
      originalEvent.startsAt ||
    currentEvent.endsAt !==
      originalEvent.endsAt ||
    currentEvent.isActive !==
      originalEvent.isActive
  );
}

export function createEditingEventFromPrevious(
  event: VenueDashboardEvent
): EditingEventState {
  const now = new Date();

  const startsAt = new Date(
    now.getTime() +
      60 * 60 * 1000
  );

  const previousDurationMs =
    getPreviousActivityDurationMs(
      event
    );

  const endsAt = new Date(
    startsAt.getTime() +
      previousDurationMs
  );

  const startsAtValue =
    toDateTimeLocalValue(
      startsAt.toISOString()
    );

  const endsAtValue =
    toDateTimeLocalValue(
      endsAt.toISOString()
    );

  const preview = getPreviewTiming(
    startsAtValue,
    endsAtValue
  );

  return {
    id: null,
    mode: "create",
    title: event.title || "",
    description:
      event.description || "",
    status: preview.status,
    displayTime:
      preview.displayTime,
    startsAt: startsAtValue,
    endsAt: endsAtValue,
    isActive:
      event.is_active !== false,
  };
}

export function createLiveNowEditingEvent(): EditingEventState {
  const startsAt = new Date();

  const endsAt = new Date(
    startsAt.getTime() +
      3 * 60 * 60 * 1000
  );

  const startsAtValue =
    toDateTimeLocalValue(
      startsAt.toISOString()
    );

  const endsAtValue =
    toDateTimeLocalValue(
      endsAt.toISOString()
    );

  const preview = getPreviewTiming(
    startsAtValue,
    endsAtValue
  );

  return {
    id: null,
    mode: "create",
    title: "",
    description: "",
    status: preview.status,
    displayTime: preview.displayTime,
    startsAt: startsAtValue,
    endsAt: endsAtValue,
    isActive: true,
  };
}

export function createEmptyEditingEvent(): EditingEventState {
  const now = new Date();

  const startsAt = new Date(
    now.getTime() +
      60 * 60 * 1000
  );

  const endsAt = new Date(
    now.getTime() +
      3 * 60 * 60 * 1000
  );

  const startsAtValue =
    toDateTimeLocalValue(
      startsAt.toISOString()
    );

  const endsAtValue =
    toDateTimeLocalValue(
      endsAt.toISOString()
    );

  const preview = getPreviewTiming(
    startsAtValue,
    endsAtValue
  );

  return {
    id: null,
    mode: "create",
    title: "",
    description: "",
    status: preview.status,
    displayTime:
      preview.displayTime,
    startsAt: startsAtValue,
    endsAt: endsAtValue,
    isActive: true,
  };
}

export function mapEventToEditingState(
  event: VenueDashboardEvent
): EditingEventState {
  return {
    id: event.id,
    mode: "edit",
    title: event.title || "",
    description:
      event.description || "",
    status: event.status,
    displayTime:
      event.display_time || "",
    startsAt:
      toDateTimeLocalValue(
        event.starts_at
      ),
    endsAt:
      toDateTimeLocalValue(
        event.ends_at
      ),
    isActive:
      event.is_active !== false,
  };
}

function getPreviousActivityDurationMs(
  event: VenueDashboardEvent
) {
  const fallbackDurationMs =
    3 * 60 * 60 * 1000;

  if (
    !event.starts_at ||
    !event.ends_at
  ) {
    return fallbackDurationMs;
  }

  const previousStartsAt =
    new Date(
      event.starts_at
    ).getTime();

  const previousEndsAt =
    new Date(
      event.ends_at
    ).getTime();

  if (
    Number.isNaN(
      previousStartsAt
    ) ||
    Number.isNaN(
      previousEndsAt
    )
  ) {
    return fallbackDurationMs;
  }

  const durationMs =
    previousEndsAt -
    previousStartsAt;

  return durationMs > 0
    ? durationMs
    : fallbackDurationMs;
}