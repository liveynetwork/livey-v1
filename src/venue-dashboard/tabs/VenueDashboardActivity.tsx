import type { VenueActivityStatus, VenueDashboardEvent } from "../venueDashboardService";

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
    <section className="venue-dashboard-grid">
      <aside className="venue-dashboard-card">
        <div className="venue-dashboard-section-heading">
          <p className="venue-dashboard-eyebrow">Activities</p>
          <h2>Livey display</h2>
        </div>

        {activeEvents.length === 0 ? (
          <div className="venue-dashboard-empty-activity">
            <p className="venue-dashboard-muted">
              No upcoming or active activity exists for this venue.
            </p>

            <button
              className="venue-dashboard-secondary-button"
              type="button"
              onClick={onCreateEvent}
              disabled={isCreatingEvent}
            >
              {isCreatingEvent ? "Creating..." : "Create first activity"}
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
                  <strong>{event.title}</strong>
                  <span>
                    {event.is_active === false
                      ? "Hidden from Livey"
                      : event.status}
                  </span>
                </button>
              ))}
            </div>

            <button
              className="venue-dashboard-secondary-button"
              type="button"
              onClick={onCreateEvent}
              disabled={isCreatingEvent}
            >
              {isCreatingEvent ? "Creating..." : "Add another activity"}
            </button>
          </>
        )}
      </aside>

      <section className="venue-dashboard-card venue-dashboard-editor-card">
        <div className="venue-dashboard-section-heading">
          <p className="venue-dashboard-eyebrow">Edit activity</p>
          <h2>What appears in the Livey app</h2>
        </div>

        {editingEvent ? (
          <div className="venue-dashboard-form">
            <section className="venue-dashboard-visibility-card">
              <div>
                <strong>
                  {editingEvent.isActive ? "Visible on Livey" : "Hidden from Livey"}
                </strong>
                <span>
                  Hidden activities stay saved, but they should not be shown to
                  users.
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
                    current ? { ...current, isActive: !current.isActive } : current
                  )
                }
                aria-pressed={editingEvent.isActive}
              >
                <span />
              </button>
            </section>

            <label>
              Activity title
              <input
                value={editingEvent.title}
                onChange={(event) =>
                  onEditingEventChange((current) =>
                    current ? { ...current, title: event.target.value } : current
                  )
                }
                placeholder="Tonight at the venue"
              />
            </label>

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

            <div className="venue-dashboard-derived-timing">
              <span>Livey will display</span>
              <strong>{editingEvent.status}</strong>
              <small>{editingEvent.displayTime}</small>
            </div>

            <label>
              Activity starts
              <input
                type="datetime-local"
                value={editingEvent.startsAt}
                onChange={(event) =>
                  onEditingEventChange((current) =>
                    current
                      ? {
                          ...current,
                          startsAt: event.target.value,
                          ...getPreviewTiming(event.target.value, current.endsAt),
                        }
                      : current
                  )
                }
              />
            </label>

            <label>
              Activity ends
              <input
                type="datetime-local"
                value={editingEvent.endsAt}
                onChange={(event) =>
                  onEditingEventChange((current) =>
                    current
                      ? {
                          ...current,
                          endsAt: event.target.value,
                          ...getPreviewTiming(current.startsAt, event.target.value),
                        }
                      : current
                  )
                }
              />
            </label>

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
          <p className="venue-dashboard-muted">Select an activity to edit.</p>
        )}
      </section>
    </section>
  );
}