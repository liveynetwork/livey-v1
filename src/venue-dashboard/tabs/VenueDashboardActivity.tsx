import type {
  VenueActivityStatus,
  VenueDashboardEvent,
} from "../venueDashboardService";
import { VenueDashboardActiveList } from "../components/activity/VenueDashboardActiveList";
import { VenueDashboardActivityEditor } from "../components/activity/VenueDashboardActivityEditor";
import { VenueDashboardActivityEmptyState } from "../components/activity/VenueDashboardActivityEmptyState";
import { VenueDashboardActivityOverview } from "../components/activity/VenueDashboardActivityOverview";
import { VenueDashboardActivityQuickActions } from "../components/activity/VenueDashboardActivityQuickActions";

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
  editingEvent: EditingEventState | null;
  isSaving: boolean;
  isDeletingEvent: boolean;
  onCreateEvent: () => void;
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
  editingEvent,
  isSaving,
  isDeletingEvent,
  onCreateEvent,
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
      {!editingEvent ? (
        <>
          <VenueDashboardActivityOverview
            events={activeEvents}
            onCreateEvent={onCreateEvent}
            onSelectEvent={onSelectEvent}
          />

          <VenueDashboardActivityQuickActions
            onCreateEvent={onCreateEvent}
          />

          {hasSavedActivities ? (
            <section className="venue-dashboard-card venue-dashboard-activity-saved-card">
              <div className="venue-dashboard-activity-section-heading venue-dashboard-activity-saved-heading">
                <div>
                  <span className="venue-dashboard-activity-section-label">
                    Current schedule
                  </span>

                  <h2>
                    Active and upcoming
                  </h2>

                  <p>
                    Review what is currently
                    visible, hidden, or scheduled
                    for your venue.
                  </p>
                </div>

                <span
                  className="venue-dashboard-activity-count"
                  aria-label={`${activeEvents.length} current ${
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
                onSelectEvent={onSelectEvent}
              />
            </section>
          ) : (
            <VenueDashboardActivityEmptyState
              onCreateEvent={onCreateEvent}
            />
          )}
        </>
      ) : (
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
          onDeleteEvent={onDeleteEvent}
          onSaveEvent={onSaveEvent}
          onEditingEventChange={
            onEditingEventChange
          }
          getPreviewTiming={
            getPreviewTiming
          }
        />
      )}
    </section>
  );
}