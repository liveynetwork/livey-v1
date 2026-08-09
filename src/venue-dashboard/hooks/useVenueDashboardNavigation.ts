import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Dispatch,
  SetStateAction,
} from "react";
import type {
  DashboardSection,
} from "../VenueDashboardSidebar";
import type {
  VenueDashboardEvent,
} from "../venueDashboardService";
import type {
  EditingEventState,
} from "../tabs/VenueDashboardActivity";
import type {
  HistoryReuseMode,
} from "../components/history/VenueDashboardHistoryReuseAction";
import {
  getDiscardChangesConfirmation,
  type PendingActivityAction,
} from "../utils/venueDashboardDiscardUtils";

type UseVenueDashboardNavigationOptions = {
  activeSection: DashboardSection;

  setActiveSection: Dispatch<
    SetStateAction<DashboardSection>
  >;

  editingEvent: EditingEventState | null;

  hasUnsavedActivityChanges: boolean;

  onCloseActivityEditor: () => void;

  onCloseActivityReusePanel: () => void;

  onCreateEvent: () => void;

  onCreateLiveNowEvent: () => void;

  onSelectEvent: (
    event: VenueDashboardEvent
  ) => void;

  onRefreshDashboard: () => void;

  onHistoryReuse: (
    event: VenueDashboardEvent,
    mode: HistoryReuseMode
  ) => void;
};

export function useVenueDashboardNavigation({
  activeSection,
  setActiveSection,
  editingEvent,
  hasUnsavedActivityChanges,
  onCloseActivityEditor,
  onCloseActivityReusePanel,
  onCreateEvent,
  onCreateLiveNowEvent,
  onSelectEvent,
  onRefreshDashboard,
  onHistoryReuse,
}: UseVenueDashboardNavigationOptions) {
  const [
    pendingActivityAction,
    setPendingActivityAction,
  ] = useState<PendingActivityAction | null>(
    null
  );

  const [
    isDiscardChangesModalOpen,
    setIsDiscardChangesModalOpen,
  ] = useState(false);

  const discardChangesConfirmation =
    useMemo(() => {
      return getDiscardChangesConfirmation(
        pendingActivityAction
      );
    }, [pendingActivityAction]);

  useEffect(() => {
    if (!hasUnsavedActivityChanges) {
      return;
    }

    function handleBeforeUnload(
      event: BeforeUnloadEvent
    ) {
      event.preventDefault();

      event.returnValue = "";
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [hasUnsavedActivityChanges]);

  function requestCreateEvent() {
    if (hasUnsavedActivityChanges) {
      setPendingActivityAction({
        type: "create",
      });

      setIsDiscardChangesModalOpen(
        true
      );

      return;
    }

    onCreateEvent();
  }

  function requestCreateLiveNowEvent() {
    if (hasUnsavedActivityChanges) {
      setPendingActivityAction({
        type: "create-live-now",
      });

      setIsDiscardChangesModalOpen(
        true
      );

      return;
    }

    onCreateLiveNowEvent();
  }

  function requestSelectEvent(
    event: VenueDashboardEvent
  ) {
    if (
      editingEvent?.id === event.id &&
      editingEvent.mode === "edit"
    ) {
      return;
    }

    if (hasUnsavedActivityChanges) {
      setPendingActivityAction({
        type: "select",
        event,
      });

      setIsDiscardChangesModalOpen(
        true
      );

      return;
    }

    onSelectEvent(event);
  }

  function requestSectionChange(
    section: DashboardSection
  ) {
    if (section === activeSection) {
      return;
    }

    if (hasUnsavedActivityChanges) {
      setPendingActivityAction({
        type: "section",
        section,
      });

      setIsDiscardChangesModalOpen(
        true
      );

      return;
    }

    if (
      activeSection === "activity" &&
      editingEvent
    ) {
      onCloseActivityEditor();
    }

    if (section !== "activity") {
      onCloseActivityReusePanel();
    }

    setActiveSection(section);
  }

  function requestRefreshDashboard() {
    if (hasUnsavedActivityChanges) {
      setPendingActivityAction({
        type: "refresh",
      });

      setIsDiscardChangesModalOpen(
        true
      );

      return;
    }

    onRefreshDashboard();
  }

  function requestHistoryReuse(
    event: VenueDashboardEvent,
    mode: HistoryReuseMode
  ) {
    if (hasUnsavedActivityChanges) {
      setPendingActivityAction({
        type: "history-reuse",
        event,
        mode,
      });

      setIsDiscardChangesModalOpen(
        true
      );

      return;
    }

    onHistoryReuse(
      event,
      mode
    );
  }

  function requestCancelEditing() {
    if (hasUnsavedActivityChanges) {
      setPendingActivityAction({
        type: "cancel",
      });

      setIsDiscardChangesModalOpen(
        true
      );

      return;
    }

    onCloseActivityEditor();
  }

  function handleCancelDiscardActivityChanges() {
    setPendingActivityAction(null);

    setIsDiscardChangesModalOpen(
      false
    );
  }

  function handleConfirmDiscardActivityChanges() {
    const pendingAction =
      pendingActivityAction;

    setPendingActivityAction(null);

    setIsDiscardChangesModalOpen(
      false
    );

    onCloseActivityEditor();

    if (!pendingAction) {
      return;
    }

    if (
      pendingAction.type === "cancel"
    ) {
      return;
    }

    if (
      pendingAction.type === "create"
    ) {
      onCreateEvent();
      return;
    }

    if (
      pendingAction.type ===
      "create-live-now"
    ) {
      onCreateLiveNowEvent();
      return;
    }

    if (
      pendingAction.type === "select"
    ) {
      onSelectEvent(
        pendingAction.event
      );

      return;
    }

    if (
      pendingAction.type === "refresh"
    ) {
      onRefreshDashboard();
      return;
    }

    if (
      pendingAction.type ===
      "history-reuse"
    ) {
      onHistoryReuse(
        pendingAction.event,
        pendingAction.mode
      );

      return;
    }

    if (
      pendingAction.section !==
      "activity"
    ) {
      onCloseActivityReusePanel();
    }

    setActiveSection(
      pendingAction.section
    );
  }

  return {
    pendingActivityAction,

    isDiscardChangesModalOpen,

    discardChangesConfirmation,

    requestCreateEvent,

    requestCreateLiveNowEvent,

    requestSelectEvent,

    requestSectionChange,

    requestRefreshDashboard,

    requestHistoryReuse,

    requestCancelEditing,

    handleCancelDiscardActivityChanges,

    handleConfirmDiscardActivityChanges,
  };
}