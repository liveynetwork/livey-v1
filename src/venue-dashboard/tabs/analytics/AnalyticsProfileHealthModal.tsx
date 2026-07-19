import {
  useEffect,
  useMemo,
} from "react";
import type {
  MouseEvent,
} from "react";
import { AnalyticsCompletionRing } from "./AnalyticsCompletionRing";

export type EditableProfileFocusTarget =
  | "logo"
  | "description"
  | "opening-hours"
  | "open-status";

type AnalyticsProfileHealthModalProps = {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
  onClose: () => void;
  onFixField: (
    target: EditableProfileFocusTarget
  ) => void;
};

type EditableProfileField = {
  label: string;
  target: EditableProfileFocusTarget;
  isComplete: boolean;
};

const editableProfileFieldDefinitions: Array<{
  label: string;
  target: EditableProfileFocusTarget;
}> = [
  {
    label: "Venue logo",
    target: "logo",
  },
  {
    label: "Description",
    target: "description",
  },
  {
    label: "Opening hours",
    target: "opening-hours",
  },
  {
    label: "Open status",
    target: "open-status",
  },
];

export function AnalyticsProfileHealthModal({
  percentage,
  completedFields,
  missingFields,
  onClose,
  onFixField,
}: AnalyticsProfileHealthModalProps) {
  useModalBehaviour(onClose);

  const editableFields =
    useMemo<EditableProfileField[]>(
      () =>
        editableProfileFieldDefinitions.map(
          (field) => ({
            ...field,
            isComplete:
              completedFields.includes(
                field.label
              ),
          })
        ),
      [completedFields]
    );

  const completedFieldCount =
    editableFields.filter(
      (field) => field.isComplete
    ).length;

  function handleFixField(
    target: EditableProfileFocusTarget
  ) {
    onClose();
    onFixField(target);
  }

  return (
    <div
      className="venue-dashboard-analytics-profile-modal-backdrop"
      role="presentation"
      onMouseDown={(event) =>
        handleBackdropClick(
          event,
          onClose
        )
      }
    >
      <section
        className="venue-dashboard-analytics-profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="venue-dashboard-profile-health-modal-title"
      >
        <div className="venue-dashboard-analytics-profile-modal-scroll">
          <header className="venue-dashboard-analytics-profile-modal-heading">
            <div>
              <p className="venue-dashboard-eyebrow">
                Venue health
              </p>

              <h2 id="venue-dashboard-profile-health-modal-title">
                Your venue profile
              </h2>

              <p>
                Review your editable venue
                details and see what still
                needs attention.
              </p>
            </div>

            <button
              className="venue-dashboard-analytics-profile-modal-close"
              type="button"
              aria-label="Close venue profile details"
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </header>

          <div className="venue-dashboard-analytics-profile-modal-overview">
            <AnalyticsCompletionRing
              percentage={percentage}
              animateWhenVisible={false}
              animationKey="profile-modal"
              size="large"
              ariaLabel={`${percentage}% editable venue profile completeness`}
            />

            <div className="venue-dashboard-analytics-profile-modal-overview-copy">
              <span>
                Editable profile completion
              </span>

              <strong>
                {percentage}% complete
              </strong>

              <p>
                Complete these details to
                improve how your venue appears
                and communicates on Livey.
              </p>
            </div>
          </div>

          <section className="venue-dashboard-analytics-profile-fields-card">
            <header className="venue-dashboard-analytics-profile-fields-heading">
              <div>
                <span>
                  Editable details
                </span>

                <p>
                  {completedFieldCount} of{" "}
                  {editableFields.length} complete
                </p>
              </div>

              <strong>
                {completedFieldCount}/
                {editableFields.length}
              </strong>
            </header>

            <div className="venue-dashboard-analytics-profile-fields-list">
              {editableFields.map(
                (field) => (
                  <div
                    className={
                      field.isComplete
                        ? "is-complete"
                        : "is-missing"
                    }
                    key={field.target}
                  >
                    <span
                      className="venue-dashboard-analytics-profile-field-status-icon"
                      aria-hidden="true"
                    >
                      {field.isComplete ? (
                        <CheckIcon />
                      ) : (
                        <MissingIcon />
                      )}
                    </span>

                    <div className="venue-dashboard-analytics-profile-field-copy">
                      <strong>
                        {field.label}
                      </strong>

                      <span>
                        {field.isComplete
                          ? "Complete"
                          : "Needs attention"}
                      </span>
                    </div>

                    {!field.isComplete ? (
                      <button
                        className="venue-dashboard-analytics-profile-field-fix"
                        type="button"
                        onClick={() =>
                          handleFixField(
                            field.target
                          )
                        }
                        aria-label={`Fix ${field.label}`}
                      >
                        <span>
                          Fix
                        </span>

                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M5 12h13" />
                          <path d="m14 7 5 5-5 5" />
                        </svg>
                      </button>
                    ) : (
                      <span className="venue-dashboard-analytics-profile-field-complete-label">
                        Ready
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </section>

          {missingFields.length === 0 ? (
            <div className="venue-dashboard-analytics-profile-modal-complete">
              <strong>
                Your editable venue profile is
                complete.
              </strong>

              <span>
                All profile details you can
                manage are currently available.
              </span>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m7 12.5 3.2 3.2L17.5 8.5" />
    </svg>
  );
}

function MissingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m8 8 8 8" />
      <path d="m16 8-8 8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function useModalBehaviour(
  onClose: () => void
) {
  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event: globalThis.KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);
}

function handleBackdropClick(
  event: MouseEvent<HTMLDivElement>,
  onClose: () => void
) {
  if (
    event.target ===
    event.currentTarget
  ) {
    onClose();
  }
}