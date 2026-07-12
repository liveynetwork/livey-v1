import type {
  VenueActivityStatus,
  VenueDashboardEvent,
} from "../venueDashboardService";

export type EditingEventState = {
  id: string;
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
  isCreatingEvent: boolean;
  isSaving: boolean;
  isDeletingEvent: boolean;
  statusMessage: string;
  errorMessage: string;
  onCreateEvent: () => void;
  onDeleteEvent: () => void;
  onSaveEvent: () => void;
  onSelectEvent: (event: VenueDashboardEvent) => void;
  onEditingEventChange: (
    updater: (current: EditingEventState | null) => EditingEventState | null
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
  editingEvent,
  isCreatingEvent,
  isSaving,
  isDeletingEvent,
  statusMessage,
  errorMessage,
  onCreateEvent,
  onDeleteEvent,
  onSaveEvent,
  onEditingEventChange,
  getPreviewTiming,
}: VenueDashboardActivityProps) {
  return (
    <section className="venue-dashboard-activity-layout">
      <section className="venue-dashboard-card venue-dashboard-editor-card venue-dashboard-activity-editor-card">
        <div className="venue-dashboard-activity-editor-heading">
          <div>
            <p className="venue-dashboard-eyebrow">Editor</p>

            <h2>
              {editingEvent ? "Edit Livey display" : "Activity editor"}
            </h2>

            <p>
              Control the activity title, visibility, timing, and description.
            </p>
          </div>
        </div>

        {editingEvent ? (
          <div className="venue-dashboard-form venue-dashboard-activity-form">
            <section className="venue-dashboard-visibility-card">
              <div className="venue-dashboard-visibility-copy">
                <div>
                  <strong>
                    {editingEvent.isActive ? "Visible on Livey" : "Hidden"}
                  </strong>

                  <span>
                    {editingEvent.isActive
                      ? "People can currently discover this activity in Livey."
                      : "This activity remains saved but is hidden from users."}
                  </span>
                </div>
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

            <div className="venue-dashboard-activity-fields-panel">
              <div className="venue-dashboard-form-row venue-dashboard-activity-title-row">
                <label className="venue-dashboard-activity-field">
                  <span>Activity title</span>

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
                    placeholder="New Livey activity"
                  />
                </label>

                <div className="venue-dashboard-derived-timing">
                  <span>Livey timing preview</span>
                  <strong>{editingEvent.status}</strong>
                  <small>{editingEvent.displayTime}</small>
                </div>
              </div>

              <label className="venue-dashboard-activity-field venue-dashboard-activity-description-field">
                <span>Description</span>

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

              <div className="venue-dashboard-form-row venue-dashboard-activity-date-row">
                <label className="venue-dashboard-activity-field">
                  <span>Starts</span>

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

                <label className="venue-dashboard-activity-field">
                  <span>Ends</span>

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
              </div>
            </div>

            {errorMessage ? (
              <p className="venue-dashboard-error">{errorMessage}</p>
            ) : null}

            {statusMessage ? (
              <p className="venue-dashboard-success">{statusMessage}</p>
            ) : null}

            <div className="venue-dashboard-editor-actions">
              <button
                className="venue-dashboard-save-button"
                type="button"
                onClick={onSaveEvent}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save activity"}
              </button>

              <button
                className="venue-dashboard-remove-button"
                type="button"
                onClick={onDeleteEvent}
                disabled={isDeletingEvent}
              >
                {isDeletingEvent ? "Removing..." : "Remove activity"}
              </button>
            </div>
          </div>
        ) : (
          <div className="venue-dashboard-empty-editor">
            <div
              className="venue-dashboard-empty-editor-icon"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
              >
                <path
                  d="M3.5 12s3.15-5.25 8.5-5.25S20.5 12 20.5 12 17.35 17.25 12 17.25 3.5 12 3.5 12Z"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <circle
                  cx="12"
                  cy="12"
                  r="2.85"
                  stroke="currentColor"
                  strokeWidth="1.9"
                />

                <circle
                  cx="12"
                  cy="12"
                  r="1.15"
                  fill="currentColor"
                />
              </svg>
            </div>

            <h2>Create your Livey activity</h2>

            <p>
              Create the activity people should discover for this venue inside
              Livey.
            </p>

            <button
              className="venue-dashboard-primary-action"
              type="button"
              onClick={onCreateEvent}
              disabled={isCreatingEvent}
            >
              {isCreatingEvent ? "Creating..." : "Create activity"}
            </button>
          </div>
        )}
      </section>
    </section>
  );
}