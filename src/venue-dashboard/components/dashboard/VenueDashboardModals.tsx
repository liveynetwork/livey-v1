import type {
  VenueDashboardEvent,
} from "../../venueDashboardService";
import type {
  EditingEventState,
} from "../../tabs/VenueDashboardActivity";
import {
  LiveyConfirmModal,
} from "../LiveyConfirmModal";

type DiscardChangesConfirmation = {
  title: string;
  description: string;
  confirmLabel: string;
};

type VenueDashboardModalsProps = {
  visibilityEventToConfirm:
    | VenueDashboardEvent
    | null;

  updatingVisibilityEventId:
    | string
    | null;

  onCancelVisibilityChange: () => void;

  onConfirmHideActivity: () => void;

  isRemoveActivityModalOpen: boolean;

  editingEvent:
    | EditingEventState
    | null;

  isDeletingEvent: boolean;

  onCancelDeleteEvent: () => void;

  onConfirmDeleteEvent: () => void;

  isDiscardChangesModalOpen: boolean;

  discardChangesConfirmation:
    DiscardChangesConfirmation;

  onCancelDiscardChanges: () => void;

  onConfirmDiscardChanges: () => void;
};

export function VenueDashboardModals({
  visibilityEventToConfirm,
  updatingVisibilityEventId,
  onCancelVisibilityChange,
  onConfirmHideActivity,
  isRemoveActivityModalOpen,
  editingEvent,
  isDeletingEvent,
  onCancelDeleteEvent,
  onConfirmDeleteEvent,
  isDiscardChangesModalOpen,
  discardChangesConfirmation,
  onCancelDiscardChanges,
  onConfirmDiscardChanges,
}: VenueDashboardModalsProps) {
  return (
    <>
      <LiveyConfirmModal
        isOpen={
          visibilityEventToConfirm !==
          null
        }
        title="Hide this activity?"
        description={
          visibilityEventToConfirm
            ? `“${
                visibilityEventToConfirm.title ||
                "Untitled activity"
              }” will no longer appear to people on Livey. You can show it again at any time from the Publishing Timeline.`
            : "This activity will no longer appear to people on Livey."
        }
        confirmLabel="Hide from Livey"
        cancelLabel="Keep visible"
        tone="warning"
        isProcessing={
          updatingVisibilityEventId !==
          null
        }
        onCancel={
          onCancelVisibilityChange
        }
        onConfirm={
          onConfirmHideActivity
        }
      />

      <LiveyConfirmModal
        isOpen={
          isRemoveActivityModalOpen
        }
        tone="danger"
        title="Remove this activity?"
        description={
          editingEvent
            ? `"${editingEvent.title || "Untitled activity"}" will be removed from Livey and moved to History. Eligible removed activities can be restored later.`
            : "This activity will be removed from Livey and moved to History. Eligible removed activities can be restored later."
        }
        confirmLabel="Remove activity"
        isProcessing={
          isDeletingEvent
        }
        onCancel={
          onCancelDeleteEvent
        }
        onConfirm={
          onConfirmDeleteEvent
        }
      />

      <LiveyConfirmModal
        isOpen={
          isDiscardChangesModalOpen
        }
        title={
          discardChangesConfirmation.title
        }
        description={
          discardChangesConfirmation.description
        }
        confirmLabel={
          discardChangesConfirmation.confirmLabel
        }
        cancelLabel="Continue editing"
        tone="warning"
        onCancel={
          onCancelDiscardChanges
        }
        onConfirm={
          onConfirmDiscardChanges
        }
      />
    </>
  );
}