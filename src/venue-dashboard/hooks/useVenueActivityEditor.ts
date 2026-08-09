import {
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createVenueEvent,
  deleteVenueEvent,
  updateVenueEvent,
  type VenueDashboardData,
  type VenueDashboardEvent,
  type VenueDashboardVenue,
} from "../venueDashboardService";
import type {
  EditingEventState,
} from "../tabs/VenueDashboardActivity";
import {
  createActivityDraftFromHistory,
} from "../tabs/activity/activityDraftUtils";
import type {
  HistoryReuseMode,
} from "../components/history/VenueDashboardHistoryReuseAction";
import {
  areEditingEventsDifferent,
  createEditingEventFromPrevious,
  createEmptyEditingEvent,
  createLiveNowEditingEvent,
  isEventInHistory,
  mapEventToEditingState,
} from "../utils/venueDashboardEventUtils";

type UseVenueActivityEditorOptions = {
  activeVenue: VenueDashboardVenue | null;

  refreshDashboardData: () => Promise<
    VenueDashboardData[]
  >;

  onOpenActivitySection: () => void;

  onStatusMessage: (
    message: string
  ) => void;

  onErrorMessage: (
    message: string
  ) => void;
};

export function useVenueActivityEditor({
  activeVenue,
  refreshDashboardData,
  onOpenActivitySection,
  onStatusMessage,
  onErrorMessage,
}: UseVenueActivityEditorOptions) {
  const [
    editingEvent,
    setEditingEvent,
  ] = useState<EditingEventState | null>(
    null
  );

  const originalEditingEventRef =
    useRef<EditingEventState | null>(
      null
    );

  const [
    isActivityReusePanelOpen,
    setIsActivityReusePanelOpen,
  ] = useState(false);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    isDeletingEvent,
    setIsDeletingEvent,
  ] = useState(false);

  const [
    isRemoveActivityModalOpen,
    setIsRemoveActivityModalOpen,
  ] = useState(false);

  const [
    visibilityEventToConfirm,
    setVisibilityEventToConfirm,
  ] = useState<VenueDashboardEvent | null>(
    null
  );

  const [
    updatingVisibilityEventId,
    setUpdatingVisibilityEventId,
  ] = useState<string | null>(
    null
  );

  const hasUnsavedActivityChanges =
    useMemo(() => {
      return areEditingEventsDifferent(
        editingEvent,
        originalEditingEventRef.current
      );
    }, [editingEvent]);

  function closeActivityEditor() {
    setEditingEvent(null);
    originalEditingEventRef.current =
      null;
  }

  function closeActivityReusePanel() {
    setIsActivityReusePanelOpen(false);
  }

  function handleUsePreviousActivity(
    event: VenueDashboardEvent
  ) {
    onStatusMessage("");
    onErrorMessage("");

    setIsActivityReusePanelOpen(false);

    const nextEditingEvent =
      createEditingEventFromPrevious(
        event
      );

    originalEditingEventRef.current =
      nextEditingEvent;

    setEditingEvent(
      nextEditingEvent
    );

    onOpenActivitySection();
  }

  function handleCreateEvent() {
    onStatusMessage("");
    onErrorMessage("");

    setIsActivityReusePanelOpen(false);

    const nextEditingEvent =
      createEmptyEditingEvent();

    originalEditingEventRef.current =
      nextEditingEvent;

    setEditingEvent(
      nextEditingEvent
    );

    onOpenActivitySection();
  }

  function handleCreateLiveNowEvent() {
    onStatusMessage("");
    onErrorMessage("");

    setIsActivityReusePanelOpen(false);

    const nextEditingEvent =
      createLiveNowEditingEvent();

    originalEditingEventRef.current =
      nextEditingEvent;

    setEditingEvent(
      nextEditingEvent
    );

    onOpenActivitySection();
  }

  function handleSelectEvent(
    event: VenueDashboardEvent
  ) {
    if (isEventInHistory(event)) {
      return;
    }

    onStatusMessage("");
    onErrorMessage("");

    setIsActivityReusePanelOpen(false);

    const nextEditingEvent =
      mapEventToEditingState(event);

    originalEditingEventRef.current =
      nextEditingEvent;

    setEditingEvent(
      nextEditingEvent
    );

    onOpenActivitySection();
  }

  function handleCancelEditing() {
    onStatusMessage("");
    onErrorMessage("");

    closeActivityEditor();
  }

  function handleHistoryReuse(
    event: VenueDashboardEvent,
    mode: HistoryReuseMode
  ) {
    onStatusMessage("");
    onErrorMessage("");

    setIsActivityReusePanelOpen(false);

    const nextEditingEvent =
      createActivityDraftFromHistory(
        event
      );

    originalEditingEventRef.current =
      nextEditingEvent;

    setEditingEvent(
      nextEditingEvent
    );

    onOpenActivitySection();

    onStatusMessage(
      mode === "restore"
        ? "Removed activity opened as a new draft."
        : "Previous activity opened as a new draft."
    );
  }

  async function handleSaveEvent() {
    if (
      !editingEvent ||
      !activeVenue
    ) {
      return;
    }

    if (
      !editingEvent.title.trim()
    ) {
      onErrorMessage(
        "Activity title is required."
      );

      return;
    }

    if (
      !editingEvent.startsAt ||
      !editingEvent.endsAt
    ) {
      onErrorMessage(
        "Activity start and end time are required."
      );

      return;
    }

    const startsAtDate =
      new Date(
        editingEvent.startsAt
      );

    const endsAtDate =
      new Date(
        editingEvent.endsAt
      );

    if (
      Number.isNaN(
        startsAtDate.getTime()
      ) ||
      Number.isNaN(
        endsAtDate.getTime()
      )
    ) {
      onErrorMessage(
        "Activity start and end time are invalid."
      );

      return;
    }

    if (
      endsAtDate <=
      startsAtDate
    ) {
      onErrorMessage(
        "Activity end time must be after the start time."
      );

      return;
    }

    try {
      setIsSaving(true);

      onStatusMessage("");
      onErrorMessage("");

      if (
        editingEvent.mode ===
        "create"
      ) {
        await createVenueEvent({
          venueId:
            activeVenue.id,
          title:
            editingEvent.title,
          description:
            editingEvent.description,
          startsAt:
            startsAtDate.toISOString(),
          endsAt:
            endsAtDate.toISOString(),
          isActive:
            editingEvent.isActive,
        });

        await refreshDashboardData();

        closeActivityEditor();

        onStatusMessage(
          "Activity created successfully."
        );

        return;
      }

      if (!editingEvent.id) {
        throw new Error(
          "The selected activity has no ID."
        );
      }

      await updateVenueEvent({
        eventId:
          editingEvent.id,
        title:
          editingEvent.title,
        description:
          editingEvent.description,
        startsAt:
          startsAtDate.toISOString(),
        endsAt:
          endsAtDate.toISOString(),
        isActive:
          editingEvent.isActive,
      });

      await refreshDashboardData();

      closeActivityEditor();

      onStatusMessage(
        "Activity updated successfully."
      );
    } catch (error) {
      console.error(
        "Failed to save venue activity:",
        error
      );

      onErrorMessage(
        editingEvent.mode ===
          "create"
          ? "We could not create this activity. Please try again."
          : "We could not save this activity. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleDeleteEvent() {
    if (
      !editingEvent ||
      editingEvent.mode !== "edit" ||
      !editingEvent.id
    ) {
      return;
    }

    setIsRemoveActivityModalOpen(
      true
    );
  }

  function handleCancelDeleteEvent() {
    if (isDeletingEvent) {
      return;
    }

    setIsRemoveActivityModalOpen(
      false
    );
  }

  async function handleConfirmDeleteEvent() {
    if (
      !editingEvent ||
      editingEvent.mode !== "edit" ||
      !editingEvent.id
    ) {
      setIsRemoveActivityModalOpen(
        false
      );

      return;
    }

    try {
      setIsDeletingEvent(true);

      onStatusMessage("");
      onErrorMessage("");

      await deleteVenueEvent({
        eventId:
          editingEvent.id,
        reason:
          "Removed by venue owner",
      });

      await refreshDashboardData();

      closeActivityEditor();

      setIsRemoveActivityModalOpen(
        false
      );

      onStatusMessage(
        "Activity removed and moved to History."
      );
    } catch (error) {
      console.error(
        "Failed to remove venue activity:",
        error
      );

      onErrorMessage(
        "We could not remove this activity. Please try again."
      );
    } finally {
      setIsDeletingEvent(false);
    }
  }

  function requestToggleEventVisibility(
    event: VenueDashboardEvent
  ) {
    if (
      event.is_active !== false
    ) {
      setVisibilityEventToConfirm(
        event
      );

      return;
    }

    void handleToggleEventVisibility(
      event,
      true
    );
  }

  async function handleToggleEventVisibility(
    event: VenueDashboardEvent,
    nextIsActive: boolean
  ) {
    if (
      !event.starts_at ||
      !event.ends_at
    ) {
      onErrorMessage(
        "This activity does not have a valid schedule and cannot be updated."
      );

      return;
    }

    try {
      setUpdatingVisibilityEventId(
        event.id
      );

      onStatusMessage("");
      onErrorMessage("");

      await updateVenueEvent({
        eventId:
          event.id,
        title:
          event.title || "",
        description:
          event.description || "",
        startsAt:
          event.starts_at,
        endsAt:
          event.ends_at,
        isActive:
          nextIsActive,
      });

      await refreshDashboardData();

      setVisibilityEventToConfirm(
        null
      );

      onStatusMessage(
        nextIsActive
          ? "Activity is now visible on Livey."
          : "Activity hidden from Livey."
      );
    } catch (error) {
      console.error(
        "Failed to update activity visibility:",
        error
      );

      onErrorMessage(
        nextIsActive
          ? "We could not show this activity on Livey. Please try again."
          : "We could not hide this activity from Livey. Please try again."
      );
    } finally {
      setUpdatingVisibilityEventId(
        null
      );
    }
  }

  function handleCancelVisibilityChange() {
    if (
      updatingVisibilityEventId
    ) {
      return;
    }

    setVisibilityEventToConfirm(
      null
    );
  }

  function handleConfirmHideActivity() {
    if (
      !visibilityEventToConfirm
    ) {
      return;
    }

    void handleToggleEventVisibility(
      visibilityEventToConfirm,
      false
    );
  }

  function restoreEditingEventFromData(
    freshData: VenueDashboardData[]
  ) {
    if (
      !editingEvent ||
      editingEvent.mode !== "edit" ||
      !editingEvent.id
    ) {
      return;
    }

    const selectedEvent =
      freshData
        .flatMap(
          (item) =>
            item.events
        )
        .find(
          (event) =>
            event.id ===
            editingEvent.id
        );

    if (
      !selectedEvent ||
      isEventInHistory(
        selectedEvent
      )
    ) {
      return;
    }

    const nextEditingEvent =
      mapEventToEditingState(
        selectedEvent
      );

    originalEditingEventRef.current =
      nextEditingEvent;

    setEditingEvent(
      nextEditingEvent
    );
  }

  return {
    editingEvent,
    setEditingEvent,

    hasUnsavedActivityChanges,

    isActivityReusePanelOpen,
    setIsActivityReusePanelOpen,
    closeActivityReusePanel,

    isSaving,
    isDeletingEvent,

    isRemoveActivityModalOpen,

    visibilityEventToConfirm,

    updatingVisibilityEventId,

    closeActivityEditor,

    handleUsePreviousActivity,
    handleCreateEvent,
    handleCreateLiveNowEvent,
    handleSelectEvent,
    handleCancelEditing,

    handleHistoryReuse,

    handleSaveEvent,

    handleDeleteEvent,
    handleCancelDeleteEvent,
    handleConfirmDeleteEvent,

    requestToggleEventVisibility,
    handleCancelVisibilityChange,
    handleConfirmHideActivity,

    restoreEditingEventFromData,
  };
}