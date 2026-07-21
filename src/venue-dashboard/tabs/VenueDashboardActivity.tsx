import type {
  VenueActivityStatus,
  VenueDashboardEvent,
} from "../venueDashboardService";
import { VenueDashboardActiveList } from "../components/activity/VenueDashboardActiveList";
import { VenueDashboardActivityEditor } from "../components/activity/VenueDashboardActivityEditor";
import { VenueDashboardActivityEmptyState } from "../components/activity/VenueDashboardActivityEmptyState";
import { VenueDashboardActivityOverview } from "../components/activity/VenueDashboardActivityOverview";
import { VenueDashboardActivityReusePanel } from "../components/activity/VenueDashboardActivityReusePanel";

export type EditingEventState = {
  id: string | null;
  mode: "create" | "edit";
  title: string;
  description: string;
  status: VenueActivityStatus;
  displayTime: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

type VenueDashboardActivityProps = {
  activeEvents: VenueDashboardEvent[];
  historyEvents: VenueDashboardEvent[];
  editingEvent: EditingEventState | null;
  isReusePanelOpen: boolean;
  isSaving: boolean;
  isDeletingEvent: boolean;
  isUpdatingVisibility: boolean;
updatingVisibilityEventId: string | null;
onToggleVisibility: (
  event: VenueDashboardEvent
) => void;
  onCreateEvent: () => void;
  onCloseReusePanel: () => void;
  onOpenHistory: () => void;
  onUsePreviousActivity: (
    event: VenueDashboardEvent
  ) => void;
  onCancelEditing: () => void;
  onDeleteEvent: () => void;
  onSaveEvent: () => void;
  onSelectEvent: (
    event: VenueDashboardEvent
  ) => void;
  onEditingEventChange: (
    updater: (
      current: EditingEventState | null
    ) => EditingEventState | null
  ) => void;
  getPreviewTiming: (
    startsAtValue: string,
    endsAtValue: string
  ) => {
    status: VenueActivityStatus;
    displayTime: string;
  };
};

export function VenueDashboardActivity({
  activeEvents,
  historyEvents,
  editingEvent,
  isReusePanelOpen,
  isSaving,
  isDeletingEvent,
  isUpdatingVisibility,
updatingVisibilityEventId,
onToggleVisibility,
  onCreateEvent,
  onCloseReusePanel,
  onOpenHistory,
  onUsePreviousActivity,
  onCancelEditing,
  onDeleteEvent,
  onSaveEvent,
  onSelectEvent,
  onEditingEventChange,
  getPreviewTiming,
}: VenueDashboardActivityProps) {
  const hasSavedActivities =
    activeEvents.length > 0;

  return (
    <section className="venue-dashboard-activity-layout">
      {editingEvent ? (
        <VenueDashboardActivityEditor
          editingEvent={editingEvent}
          activeEvents={activeEvents}
          isSaving={isSaving}
          isDeletingEvent={
            isDeletingEvent
          }
          onCancelEditing={
            onCancelEditing
          }
          onDeleteEvent={
            onDeleteEvent
          }
          onSaveEvent={
            onSaveEvent
          }
          onEditingEventChange={
            onEditingEventChange
          }
          getPreviewTiming={
            getPreviewTiming
          }
        />
      ) : isReusePanelOpen ? (
        <VenueDashboardActivityReusePanel
          events={historyEvents}
          onClose={
            onCloseReusePanel
          }
          onUseAgain={
            onUsePreviousActivity
          }
          onOpenHistory={
            onOpenHistory
          }
        />
      ) : (
        <>
          <VenueDashboardActivityOverview
            events={activeEvents}
            onCreateEvent={
              onCreateEvent
            }
            onSelectEvent={
              onSelectEvent
            }
          />

          {hasSavedActivities ? (
            <section className="venue-dashboard-card venue-dashboard-activity-saved-card">
              <div className="venue-dashboard-activity-section-heading venue-dashboard-activity-saved-heading">
                <div>
                  <span className="venue-dashboard-activity-section-label">
                    Publishing timeline
                  </span>

                  <h2>
                    Your upcoming schedule
                  </h2>

                  <p>
                    Review what is live, starting
                    next, scheduled later, or hidden
                    from people on Livey.
                  </p>

                  <button
                    className="venue-dashboard-primary-action venue-dashboard-activity-timeline-create"
                    type="button"
                    onClick={onCreateEvent}
                  >
                    Create activity
                  </button>
                </div>

                <span
                  className="venue-dashboard-activity-count"
                  aria-label={`${activeEvents.length} scheduled ${
                    activeEvents.length === 1
                      ? "activity"
                      : "activities"
                  }`}
                >
                  {activeEvents.length}
                </span>
              </div>

              <VenueDashboardActiveList
  events={activeEvents}
  isUpdatingVisibility={
    isUpdatingVisibility
  }
  updatingVisibilityEventId={
    updatingVisibilityEventId
  }
  onSelectEvent={
    onSelectEvent
  }
  onToggleVisibility={
    onToggleVisibility
  }
/>
            </section>
          ) : (
            <VenueDashboardActivityEmptyState
              onCreateEvent={
                onCreateEvent
              }
            />
          )}
        </>
      )}
    </section>
  );
}