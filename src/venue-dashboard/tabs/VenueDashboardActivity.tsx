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
  activeEvents,
  editingEvent,
  isCreatingEvent,
  isSaving,
  isDeletingEvent,
  statusMessage,
  errorMessage,
  onCreateEvent,
  onDeleteEvent,
  onSaveEvent,
  onSelectEvent,
  onEditingEventChange,
  getPreviewTiming,
}: VenueDashboardActivityProps) {
  return (
    <section className="venue-dashboard-grid venue-dashboard-activity-layout">
      <aside className="venue-dashboard-card venue-dashboard-activity-list-card">
        <div className="venue-dashboard-section-heading">
          <p className="venue-dashboard-eyebrow">Activities</p>
          <h2>Livey activity</h2>
        </div>

        {activeEvents.length === 0 ? (
          <div className="venue-dashboard-empty-activity venue-dashboard-activity-empty-state">
            <h3>No activity yet</h3>
            <p>Create what people should see on Livey.</p>

            <button
              className="venue-dashboard-primary-action"
              type="button"
              onClick={onCreateEvent}
              disabled={isCreatingEvent}
            >
              {isCreatingEvent ? "Creating..." : "Create activity"}
            </button>
          </div>
        ) : (
          <>
            <div className="venue-dashboard-event-list">
              {activeEvents.map((event) => (
                <button
                  key={event.id}
                  className={
                    editingEvent?.id === event.id
                      ? "venue-dashboard-event-button is-active"
                      : "venue-dashboard-event-button"
                  }
                  type="button"
                  onClick={() => onSelectEvent(event)}
                >
                  <div>
                    <strong>{event.title}</strong>
                    <span>{event.display_time || event.status}</span>
                  </div>

                  <small
                    className={
                      event.is_active === false
                        ? "venue-dashboard-status-pill is-hidden"
                        : "venue-dashboard-status-pill"
                    }
                  >
                    {event.is_active === false ? "Hidden" : event.status}
                  </small>
                </button>
              ))}
            </div>

            <button
              className="venue-dashboard-secondary-button"
              type="button"
              onClick={onCreateEvent}
              disabled={isCreatingEvent}
            >
              {isCreatingEvent ? "Creating..." : "Add activity"}
            </button>
          </>
        )}
      </aside>

      <section className="venue-dashboard-card venue-dashboard-editor-card venue-dashboard-activity-editor-card">
        <div className="venue-dashboard-section-heading">
          <p className="venue-dashboard-eyebrow">Editor</p>
          <h2>{editingEvent ? "Edit Livey display" : "Activity editor"}</h2>
        </div>

        {editingEvent ? (
          <div className="venue-dashboard-form venue-dashboard-activity-form">
            <section className="venue-dashboard-visibility-card">
              <div>
                <strong>
                  {editingEvent.isActive ? "Visible on Livey" : "Hidden"}
                </strong>
                <span>
                  {editingEvent.isActive
                    ? "People can see this activity in the Livey app."
                    : "This activity is saved but not shown to users."}
                </span>
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
                      ? { ...current, isActive: !current.isActive }
                      : current
                  )
                }
                aria-pressed={editingEvent.isActive}
              >
                <span />
              </button>
            </section>

            <div className="venue-dashboard-form-row">
              <label>
                Activity title
                <input
                  value={editingEvent.title}
                  onChange={(event) =>
                    onEditingEventChange((current) =>
                      current
                        ? { ...current, title: event.target.value }
                        : current
                    )
                  }
                  placeholder="Tonight at the venue"
                />
              </label>

              <div className="venue-dashboard-derived-timing">
                <span>Livey shows</span>
                <strong>{editingEvent.status}</strong>
                <small>{editingEvent.displayTime}</small>
              </div>
            </div>

            <label>
              Description
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

            <div className="venue-dashboard-form-row">
              <label>
                Starts
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

              <label>
                Ends
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
                {isDeletingEvent ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        ) : (
          <div className="venue-dashboard-empty-editor">
            <h2>Create or select activity</h2>
            <p>
              Activities control what people see for this venue inside Livey.
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