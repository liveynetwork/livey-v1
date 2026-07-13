import type {
  VenueActivityStatus,
  VenueDashboardEvent,
} from "../venueDashboardService";
import { VenueDashboardActiveList } from "../components/activity/VenueDashboardActiveList";

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
  statusMessage: string;
  errorMessage: string;
  onCreateEvent: () => void;
  onCancelEditing: () => void;
  onDeleteEvent: () => void;
  onSaveEvent: () => void;
  onSelectEvent: (event: VenueDashboardEvent) => void;
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
  statusMessage,
  errorMessage,
  onCreateEvent,
  onCancelEditing,
  onDeleteEvent,
  onSaveEvent,
  onSelectEvent,
  onEditingEventChange,
  getPreviewTiming,
}: VenueDashboardActivityProps) {
  const isCreateMode = editingEvent?.mode === "create";
  const hasSavedActivities = activeEvents.length > 0;

  return (
    <section className="venue-dashboard-activity-layout">
      <section className="venue-dashboard-card venue-dashboard-activity-primary-card">
        <div className="venue-dashboard-activity-card-heading">
          <div className="venue-dashboard-activity-heading-copy">
            <p className="venue-dashboard-eyebrow venue-dashboard-activity-heading-eyebrow">
              {editingEvent
                ? isCreateMode
                  ? "Create activity"
                  : "Edit activity"
                : "Livey activity"}
            </p>

            <h2>
              {editingEvent
                ? isCreateMode
                  ? "Create your activity"
                  : "Update your activity"
                : "Create an activity"}
            </h2>

            <p className="venue-dashboard-activity-heading-description">
              {editingEvent
                ? isCreateMode
                  ? "Add what people should discover at your venue."
                  : "Update the details currently shown to people on Livey."
                : "Show people what is happening at your venue, now or later."}
            </p>

          </div>
        </div>

        {editingEvent ? (
          <div className="venue-dashboard-activity-controls-panel">
            <section className="venue-dashboard-activity-control-tile venue-dashboard-activity-visibility-tile">
              <div className="venue-dashboard-activity-visibility-copy">
                <span className="venue-dashboard-activity-control-label">
                  Visibility
                </span>

                <strong>
                  {editingEvent.isActive
                    ? "Visible on Livey"
                    : "Hidden from Livey"}
                </strong>

                <small>
                  {editingEvent.isActive
                    ? "People can discover this activity while it is active."
                    : "The activity remains saved but will not appear to users."}
                </small>
              </div>

              <button
                className={
                  editingEvent.isActive
                    ? "venue-dashboard-toggle is-on"
                    : "venue-dashboard-toggle"
                }
                type="button"
                onClick={() =>
                  onEditingEventChange((current) =>
                    current
                      ? {
                          ...current,
                          isActive: !current.isActive,
                        }
                      : current
                  )
                }
                aria-label={
                  editingEvent.isActive
                    ? "Hide activity from Livey"
                    : "Show activity on Livey"
                }
                aria-pressed={editingEvent.isActive}
              >
                <span />
              </button>
            </section>

            <label className="venue-dashboard-activity-control-tile venue-dashboard-activity-title-field">
              <span className="venue-dashboard-activity-control-label">
                Activity title
              </span>

              <input
                value={editingEvent.title}
                onChange={(event) =>
                  onEditingEventChange((current) =>
                    current
                      ? {
                          ...current,
                          title: event.target.value,
                        }
                      : current
                  )
                }
                placeholder="Give your activity a clear title"
              />
            </label>

            <section className="venue-dashboard-activity-control-tile venue-dashboard-activity-timing-preview">
              <span className="venue-dashboard-activity-control-label">
                Livey timing
              </span>

              <strong>{editingEvent.status}</strong>

              <small>{editingEvent.displayTime}</small>
            </section>

            <label className="venue-dashboard-activity-control-tile venue-dashboard-activity-description-field">
              <span className="venue-dashboard-activity-control-label">
                Description
              </span>

              <textarea
                value={editingEvent.description}
                onChange={(event) =>
                  onEditingEventChange((current) =>
                    current
                      ? {
                          ...current,
                          description: event.target.value,
                        }
                      : current
                  )
                }
                placeholder="Tell people what is happening."
              />
            </label>

            <label className="venue-dashboard-activity-control-tile venue-dashboard-activity-date-field">
              <span className="venue-dashboard-activity-control-label">
                Starts
              </span>

              <input
                type="datetime-local"
                value={editingEvent.startsAt}
                onChange={(event) =>
                  onEditingEventChange((current) =>
                    current
                      ? {
                          ...current,
                          startsAt: event.target.value,
                          ...getPreviewTiming(
                            event.target.value,
                            current.endsAt
                          ),
                        }
                      : current
                  )
                }
              />
            </label>

            <label className="venue-dashboard-activity-control-tile venue-dashboard-activity-date-field">
              <span className="venue-dashboard-activity-control-label">
                Ends
              </span>

              <input
                type="datetime-local"
                value={editingEvent.endsAt}
                onChange={(event) =>
                  onEditingEventChange((current) =>
                    current
                      ? {
                          ...current,
                          endsAt: event.target.value,
                          ...getPreviewTiming(
                            current.startsAt,
                            event.target.value
                          ),
                        }
                      : current
                  )
                }
              />
            </label>

            <section className="venue-dashboard-activity-advisory">
              <span
                className="venue-dashboard-activity-advisory-icon"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="2"
                  />

                  <path
                    d="M12 10.5v5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  <circle
                    cx="12"
                    cy="7.5"
                    r="1.1"
                    fill="currentColor"
                  />
                </svg>
              </span>

              <small>
                THE ACTIVITY WILL ONLY BE CREATED AFTER YOU PRESS SAVE. ONCE ITS
                END TIME PASSES, IT WILL AUTOMATICALLY MOVE TO HISTORY.
              </small>
            </section>
          </div>
        ) : (
          <div className="venue-dashboard-activity-create-panel">
            <div
              className="venue-dashboard-activity-create-icon"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                width="28"
                height="28"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="8.5"
                  stroke="currentColor"
                  strokeWidth="1.9"
                />

                <path
                  d="M12 8v8M8 12h8"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <strong>Ready to show what is happening?</strong>

            <p>
              Add a live, upcoming, or scheduled activity for people to
              discover on Livey.
            </p>

            <button
              className="venue-dashboard-primary-action venue-dashboard-activity-create-button"
              type="button"
              onClick={onCreateEvent}
            >
              Create activity
            </button>
          </div>
        )}

        {errorMessage ? (
          <p className="venue-dashboard-error venue-dashboard-activity-message">
            {errorMessage}
          </p>
        ) : null}

        {statusMessage ? (
          <p className="venue-dashboard-success venue-dashboard-activity-message">
            {statusMessage}
          </p>
        ) : null}

        {editingEvent ? (
          <div className="venue-dashboard-activity-editor-actions">
            <button
              className="venue-dashboard-save-button"
              type="button"
              onClick={onSaveEvent}
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : isCreateMode
                  ? "Save activity"
                  : "Save changes"}
            </button>

            <button
              className="venue-dashboard-activity-cancel-button"
              type="button"
              onClick={onCancelEditing}
              disabled={isSaving || isDeletingEvent}
            >
              Cancel
            </button>

            {!isCreateMode ? (
              <button
                className="venue-dashboard-remove-button"
                type="button"
                onClick={onDeleteEvent}
                disabled={isDeletingEvent || isSaving}
              >
                {isDeletingEvent
                  ? "Removing..."
                  : "Remove activity"}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {hasSavedActivities ? (
        <section className="venue-dashboard-card venue-dashboard-activity-saved-card">
          <div className="venue-dashboard-activity-card-heading venue-dashboard-activity-card-heading-with-count">
            <div className="venue-dashboard-activity-heading-copy">
              <p className="venue-dashboard-eyebrow venue-dashboard-activity-heading-eyebrow">
                Your activities
              </p>

              <h2>Active and upcoming</h2>

              <p className="venue-dashboard-activity-heading-description">
                Select an activity to view or update its details.
              </p>

              <span
                className="venue-dashboard-activity-heading-accent"
                aria-hidden="true"
              />
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
      ) : null}
    </section>
  );
}