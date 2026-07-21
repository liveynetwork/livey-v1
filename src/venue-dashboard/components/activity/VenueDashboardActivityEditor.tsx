import type {
  VenueActivityStatus,
  VenueDashboardEvent,
} from "../../venueDashboardService";
import type {
  EditingEventState,
} from "../../tabs/VenueDashboardActivity";

type VenueDashboardActivityEditorProps = {
  editingEvent: EditingEventState;
  activeEvents: VenueDashboardEvent[];
  isSaving: boolean;
  isDeletingEvent: boolean;
  onCancelEditing: () => void;
  onDeleteEvent: () => void;
  onSaveEvent: () => void;
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

export function VenueDashboardActivityEditor({
  editingEvent,
  activeEvents,
  isSaving,
  isDeletingEvent,
  onCancelEditing,
  onDeleteEvent,
  onSaveEvent,
  onEditingEventChange,
  getPreviewTiming,
}: VenueDashboardActivityEditorProps) {
  const isCreateMode =
    editingEvent.mode === "create";

  const readiness = getPublishingReadiness(
    editingEvent
  );

  const warnings = getScheduleWarnings(
    editingEvent,
    activeEvents
  );

  return (
    <section className="venue-dashboard-activity-editor">
      <div className="venue-dashboard-activity-editor-heading">
        <div>
          <span className="venue-dashboard-activity-section-label">
            {isCreateMode
              ? "Create activity"
              : "Edit activity"}
          </span>

          <h2>
            {isCreateMode
              ? "Prepare what people will discover"
              : "Update what people see on Livey"}
          </h2>

          <p>
            Add the activity details, choose its schedule, and preview how it
            will appear to people on Livey.
          </p>
        </div>

        <div
          className={
            readiness.isReady
              ? "venue-dashboard-activity-readiness-badge is-ready"
              : "venue-dashboard-activity-readiness-badge"
          }
        >
          <span aria-hidden="true" />

          {readiness.isReady
            ? "Ready to publish"
            : `${readiness.completedCount}/${readiness.totalCount} ready`}
        </div>
      </div>

      <div className="venue-dashboard-activity-editor-layout">
        <div className="venue-dashboard-activity-editor-main">
          <section className="venue-dashboard-activity-editor-section">
            <div className="venue-dashboard-activity-editor-section-heading">
              <span className="venue-dashboard-activity-editor-section-number">
                01
              </span>

              <div>
                <h3>Activity details</h3>

                <p>
                  Use a clear title and a short description that explains what
                  is happening.
                </p>
              </div>
            </div>

            <div className="venue-dashboard-activity-editor-fields">
              <label className="venue-dashboard-activity-editor-field">
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
                  placeholder="For example, Friday Night DJ"
                />
              </label>

              <label className="venue-dashboard-activity-editor-field">
                <span>Description</span>

                <textarea
                  value={editingEvent.description}
                  onChange={(event) =>
                    onEditingEventChange((current) =>
                      current
                        ? {
                            ...current,
                            description:
                              event.target.value,
                          }
                        : current
                    )
                  }
                  placeholder="Tell people what they can expect."
                />
              </label>
            </div>
          </section>

          <section className="venue-dashboard-activity-editor-section">
            <div className="venue-dashboard-activity-editor-section-heading">
              <span className="venue-dashboard-activity-editor-section-number">
                02
              </span>

              <div>
                <h3>Schedule</h3>

                <p>
                  Choose when the activity begins and ends. Livey will derive
                  the consumer-facing timing automatically.
                </p>
              </div>
            </div>

            <div className="venue-dashboard-activity-schedule-presets">
              <button
                type="button"
                onClick={() =>
                  applySchedulePreset(
                    "live-now",
                    onEditingEventChange,
                    getPreviewTiming
                  )
                }
              >
                Live now
              </button>

              <button
                type="button"
                onClick={() =>
                  applySchedulePreset(
                    "tonight",
                    onEditingEventChange,
                    getPreviewTiming
                  )
                }
              >
                Tonight
              </button>

              <button
                type="button"
                onClick={() =>
                  applySchedulePreset(
                    "tomorrow",
                    onEditingEventChange,
                    getPreviewTiming
                  )
                }
              >
                Tomorrow
              </button>

              <button
                type="button"
                onClick={() =>
                  applySchedulePreset(
                    "weekend",
                    onEditingEventChange,
                    getPreviewTiming
                  )
                }
              >
                This weekend
              </button>
            </div>

            <div className="venue-dashboard-activity-editor-date-grid">
              <label className="venue-dashboard-activity-editor-field">
                <span>Starts</span>

                <input
                  type="datetime-local"
                  value={editingEvent.startsAt}
                  onChange={(event) =>
                    onEditingEventChange((current) =>
                      current
                        ? {
                            ...current,
                            startsAt:
                              event.target.value,
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

              <label className="venue-dashboard-activity-editor-field">
                <span>Ends</span>

                <input
                  type="datetime-local"
                  value={editingEvent.endsAt}
                  onChange={(event) =>
                    onEditingEventChange((current) =>
                      current
                        ? {
                            ...current,
                            endsAt:
                              event.target.value,
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

            <div className="venue-dashboard-activity-timing-feedback">
              <div
                className="venue-dashboard-activity-timing-feedback-icon"
                aria-hidden="true"
              >
                <TimingIcon />
              </div>

              <div>
                <span>Livey timing</span>
                <strong>{editingEvent.status}</strong>
                <p>{editingEvent.displayTime}</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="venue-dashboard-activity-editor-sidebar">
          <section className="venue-dashboard-activity-readiness">
            <div className="venue-dashboard-activity-sidebar-heading">
              <span className="venue-dashboard-activity-section-label">
                Publishing readiness
              </span>

              <h3>
                {readiness.isReady
                  ? "Everything looks ready"
                  : "Complete the essentials"}
              </h3>
            </div>

            <div className="venue-dashboard-activity-readiness-list">
              {readiness.items.map((item) => (
                <div
                  className={
                    item.isComplete
                      ? "venue-dashboard-activity-readiness-item is-complete"
                      : "venue-dashboard-activity-readiness-item"
                  }
                  key={item.label}
                >
                  <span aria-hidden="true">
                    {item.isComplete ? "✓" : ""}
                  </span>

                  <strong>{item.label}</strong>
                </div>
              ))}
            </div>

            {!readiness.isReady ? (
              <p className="venue-dashboard-activity-readiness-message">
                {readiness.message}
              </p>
            ) : null}
          </section>

          <section className="venue-dashboard-activity-preview">
            <div className="venue-dashboard-activity-sidebar-heading">
              <span className="venue-dashboard-activity-section-label">
                Preview on Livey
              </span>

              <h3>Consumer activity card</h3>
            </div>

            <div className="venue-dashboard-activity-preview-card">
              <div className="venue-dashboard-activity-preview-top">
                <span
                  className={
                    editingEvent.isActive
                      ? "venue-dashboard-activity-preview-state"
                      : "venue-dashboard-activity-preview-state is-hidden"
                  }
                >
                  {editingEvent.isActive
                    ? editingEvent.status
                    : "Hidden"}
                </span>
              </div>

              <strong>
                {editingEvent.title.trim() ||
                  "Your activity title"}
              </strong>

              <p>
                {editingEvent.description.trim() ||
                  "Your activity description will appear here."}
              </p>

              <small>
                {editingEvent.displayTime ||
                  "Choose a start and end time"}
              </small>
            </div>
          </section>

          {warnings.length > 0 ? (
            <section className="venue-dashboard-activity-warnings">
              <div className="venue-dashboard-activity-sidebar-heading">
                <span className="venue-dashboard-activity-section-label">
                  Schedule checks
                </span>

                <h3>Review before saving</h3>
              </div>

              <div className="venue-dashboard-activity-warning-list">
                {warnings.map((warning) => (
                  <div
                    className={
                      warning.tone === "danger"
                        ? "venue-dashboard-activity-warning is-danger"
                        : "venue-dashboard-activity-warning"
                    }
                    key={warning.message}
                  >
                    <span aria-hidden="true">
                      <WarningIcon />
                    </span>

                    <p>{warning.message}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      <div className="venue-dashboard-activity-editor-actions">
        <button
          className="venue-dashboard-save-button"
          type="button"
          onClick={onSaveEvent}
          disabled={
            isSaving ||
            !readiness.canSave
          }
        >
          {isSaving
            ? "Saving..."
            : isCreateMode
              ? "Publish activity"
              : "Save changes"}
        </button>

        <button
          className="venue-dashboard-activity-cancel-button"
          type="button"
          onClick={onCancelEditing}
          disabled={
            isSaving ||
            isDeletingEvent
          }
        >
          Cancel
        </button>

        {!isCreateMode ? (
          <button
            className="venue-dashboard-remove-button"
            type="button"
            onClick={onDeleteEvent}
            disabled={
              isDeletingEvent ||
              isSaving
            }
          >
            {isDeletingEvent
              ? "Removing..."
              : "Remove activity"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

type SchedulePreset =
  | "live-now"
  | "tonight"
  | "tomorrow"
  | "weekend";

type ReadinessItem = {
  label: string;
  isComplete: boolean;
};

type ScheduleWarning = {
  message: string;
  tone: "info" | "danger";
};

function getPublishingReadiness(
  editingEvent: EditingEventState
) {
  const startsAt =
    parseLocalDate(editingEvent.startsAt);

  const endsAt =
    parseLocalDate(editingEvent.endsAt);

  const hasValidSchedule =
    startsAt !== null &&
    endsAt !== null &&
    endsAt > startsAt;

  const items: ReadinessItem[] = [
    {
      label: "Title added",
      isComplete:
        editingEvent.title.trim().length > 0,
    },
    {
      label: "Description added",
      isComplete:
        editingEvent.description.trim().length > 0,
    },
    {
      label: "Start selected",
      isComplete:
        startsAt !== null,
    },
    {
      label: "End selected",
      isComplete:
        endsAt !== null,
    },
    {
      label: "Valid schedule",
      isComplete:
        hasValidSchedule,
    },
  ];

  const completedCount =
    items.filter(
      (item) => item.isComplete
    ).length;

  const canSave =
    editingEvent.title.trim().length > 0 &&
    startsAt !== null &&
    endsAt !== null &&
    hasValidSchedule;

  let message =
    "Add a title and valid schedule before publishing.";

  if (!editingEvent.title.trim()) {
    message =
      "Add an activity title before publishing.";
  } else if (!startsAt || !endsAt) {
    message =
      "Choose both a start and end time.";
  } else if (!hasValidSchedule) {
    message =
      "The end time must be after the start time.";
  } else if (
    !editingEvent.description.trim()
  ) {
    message =
      "The activity can be published, but adding a description will help people understand it.";
  }

  return {
    items,
    completedCount,
    totalCount: items.length,
    isReady:
      completedCount === items.length,
    canSave,
    message,
  };
}

function getScheduleWarnings(
  editingEvent: EditingEventState,
  activeEvents: VenueDashboardEvent[]
): ScheduleWarning[] {
  const warnings: ScheduleWarning[] = [];

  const startsAt =
    parseLocalDate(editingEvent.startsAt);

  const endsAt =
    parseLocalDate(editingEvent.endsAt);

  if (!editingEvent.isActive) {
    warnings.push({
      message:
        "This activity is hidden and will not appear publicly on Livey.",
      tone: "info",
    });
  }

  if (!startsAt || !endsAt) {
    return warnings;
  }

  if (endsAt <= startsAt) {
    warnings.push({
      message:
        "The activity end time must be after its start time.",
      tone: "danger",
    });

    return warnings;
  }

  const now = new Date();

  if (endsAt <= now) {
    warnings.push({
      message:
        "This schedule has already ended and cannot be published as an active activity.",
      tone: "danger",
    });
  } else if (startsAt < now) {
    warnings.push({
      message:
        "This activity has already started. It will appear as Live now after saving if it is visible.",
      tone: "info",
    });
  }

  const durationHours =
    (endsAt.getTime() -
      startsAt.getTime()) /
    (60 * 60 * 1000);

  if (durationHours > 18) {
    warnings.push({
      message:
        "This activity lasts longer than 18 hours. Review the schedule to make sure it is intentional.",
      tone: "info",
    });
  }

  const overlappingEvent =
    activeEvents.find((event) => {
      if (
        editingEvent.id &&
        event.id === editingEvent.id
      ) {
        return false;
      }

      if (
        event.deleted_at ||
        !event.starts_at ||
        !event.ends_at
      ) {
        return false;
      }

      const eventStartsAt =
        new Date(event.starts_at);

      const eventEndsAt =
        new Date(event.ends_at);

      if (
        Number.isNaN(
          eventStartsAt.getTime()
        ) ||
        Number.isNaN(
          eventEndsAt.getTime()
        )
      ) {
        return false;
      }

      return (
        startsAt < eventEndsAt &&
        endsAt > eventStartsAt
      );
    });

  if (overlappingEvent) {
    warnings.push({
      message: `This schedule overlaps with "${overlappingEvent.title || "another activity"}".`,
      tone: "info",
    });
  }

  return warnings;
}

function applySchedulePreset(
  preset: SchedulePreset,
  onEditingEventChange: VenueDashboardActivityEditorProps["onEditingEventChange"],
  getPreviewTiming: VenueDashboardActivityEditorProps["getPreviewTiming"]
) {
  const now = new Date();

  let startsAt: Date;
  let endsAt: Date;

  if (preset === "live-now") {
    startsAt = new Date(now);
    endsAt = new Date(
      now.getTime() +
        3 * 60 * 60 * 1000
    );
  } else if (preset === "tonight") {
    startsAt = new Date(now);
    startsAt.setHours(20, 0, 0, 0);

    if (startsAt <= now) {
      startsAt.setDate(
        startsAt.getDate() + 1
      );
    }

    endsAt = new Date(startsAt);
    endsAt.setHours(23, 0, 0, 0);
  } else if (preset === "tomorrow") {
    startsAt = new Date(now);
    startsAt.setDate(
      startsAt.getDate() + 1
    );
    startsAt.setHours(19, 0, 0, 0);

    endsAt = new Date(startsAt);
    endsAt.setHours(22, 0, 0, 0);
  } else {
    startsAt =
      getNextSaturday(now);
    startsAt.setHours(20, 0, 0, 0);

    endsAt = new Date(startsAt);
    endsAt.setHours(23, 0, 0, 0);
  }

  const startsAtValue =
    toDateTimeLocalValue(startsAt);

  const endsAtValue =
    toDateTimeLocalValue(endsAt);

  onEditingEventChange((current) =>
    current
      ? {
          ...current,
          startsAt:
            startsAtValue,
          endsAt:
            endsAtValue,
          ...getPreviewTiming(
            startsAtValue,
            endsAtValue
          ),
        }
      : current
  );
}

function parseLocalDate(
  value: string
): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function toDateTimeLocalValue(
  date: Date
) {
  const timezoneOffsetMs =
    date.getTimezoneOffset() *
    60 *
    1000;

  return new Date(
    date.getTime() -
      timezoneOffsetMs
  )
    .toISOString()
    .slice(0, 16);
}

function getNextSaturday(
  fromDate: Date
) {
  const date = new Date(fromDate);

  const daysUntilSaturday =
    (6 - date.getDay() + 7) % 7;

  date.setDate(
    date.getDate() +
      (daysUntilSaturday === 0
        ? 7
        : daysUntilSaturday)
  );

  return date;
}

function TimingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 7.5v4.8l3.2 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
    >
      <path
        d="M12 4.5 20 18.5H4L12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M12 9v4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="16"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}