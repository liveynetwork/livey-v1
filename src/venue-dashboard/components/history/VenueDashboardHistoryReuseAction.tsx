import "./VenueDashboardHistoryReuseAction.css";

export type HistoryReuseMode =
  | "reuse"
  | "restore";

type VenueDashboardHistoryReuseActionProps = {
  mode: HistoryReuseMode;
  onUseActivity: () => void;
};

export function VenueDashboardHistoryReuseAction({
  mode,
  onUseActivity,
}: VenueDashboardHistoryReuseActionProps) {
  const isRestoreMode =
    mode === "restore";

  const title = isRestoreMode
    ? "Bring this activity back"
    : "Publish something similar";

  const description = isRestoreMode
    ? "Create a new editable draft from this removed activity. The archived record will remain unchanged."
    : "Create a new editable draft from this activity. You will choose and review a new schedule before publishing.";

  const buttonLabel = isRestoreMode
    ? "Restore activity"
    : "Use again";

  return (
    <section className="venue-dashboard-history-reuse-action">
      <div className="venue-dashboard-history-reuse-action-copy">
        <p className="venue-dashboard-eyebrow">
          Publish again
        </p>

        <h3>{title}</h3>

        <p>{description}</p>
      </div>

      <button
        className="venue-dashboard-history-reuse-button"
        type="button"
        onClick={onUseActivity}
      >
        <ReuseIcon />

        <span>{buttonLabel}</span>
      </button>
    </section>
  );
}

function ReuseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M19 8V4m0 0h-4m4 0-4.1 4.1A7 7 0 1 0 17.7 17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}