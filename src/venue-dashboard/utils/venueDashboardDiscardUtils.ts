import type {
  DashboardSection,
} from "../VenueDashboardSidebar";
import type {
  VenueDashboardEvent,
} from "../venueDashboardService";
import type {
  HistoryReuseMode,
} from "../components/history/VenueDashboardHistoryReuseAction";

export type PendingActivityAction =
  | {
      type: "cancel";
    }
  | {
      type: "create";
    }
  | {
      type: "create-live-now";
    }
  | {
      type: "select";
      event: VenueDashboardEvent;
    }
  | {
      type: "section";
      section: DashboardSection;
    }
  | {
      type: "refresh";
    }
  | {
      type: "history-reuse";
      event: VenueDashboardEvent;
      mode: HistoryReuseMode;
    };

export function getDiscardChangesConfirmation(
  pendingAction: PendingActivityAction | null
) {
  const fallbackConfirmation = {
    title: "Discard your changes?",
    description:
      "Your unsaved activity changes will be lost. Continue editing to keep them, or discard them and leave the editor.",
    confirmLabel: "Discard changes",
  };

  if (!pendingAction) {
    return fallbackConfirmation;
  }

  if (pendingAction.type === "cancel") {
    return {
      title: "Discard this activity draft?",
      description:
        "Your unsaved activity changes will be lost. Continue editing to keep them, or discard them and close the editor.",
      confirmLabel: "Discard draft",
    };
  }

  if (pendingAction.type === "create") {
    return {
      title: "Create a different activity?",
      description:
        "Your current unsaved activity changes will be lost. Continue editing to keep them, or discard them and start a new activity.",
      confirmLabel: "Discard and create",
    };
  }

  if (
    pendingAction.type ===
    "create-live-now"
  ) {
    return {
      title: "Start a new live activity?",
      description:
        "Your current unsaved activity changes will be lost. Continue editing to keep them, or discard them and prepare a new activity starting now.",
      confirmLabel: "Discard and start",
    };
  }

  if (pendingAction.type === "select") {
    const nextActivityTitle =
      pendingAction.event.title?.trim() ||
      "the selected activity";

    return {
      title: "Edit another activity?",
      description:
        `Your current unsaved changes will be lost. Continue editing to keep them, or discard them and open “${nextActivityTitle}”.`,
      confirmLabel: "Discard and open",
    };
  }

  if (pendingAction.type === "refresh") {
    return {
      title: "Refresh the dashboard?",
      description:
        "Refreshing will discard your unsaved activity changes and reload the latest venue data. Continue editing to keep your changes.",
      confirmLabel:
        "Discard and refresh",
    };
  }

  if (
    pendingAction.type ===
    "history-reuse"
  ) {
    const activityTitle =
      pendingAction.event.title?.trim() ||
      "this activity";

    const isRestoreMode =
      pendingAction.mode === "restore";

    return {
      title: isRestoreMode
        ? "Open this removed activity as a new draft?"
        : "Use this activity again?",
      description: isRestoreMode
        ? `Your current unsaved changes will be lost. Continue editing to keep them, or discard them and create a new draft from “${activityTitle}”. The archived activity will remain unchanged.`
        : `Your current unsaved changes will be lost. Continue editing to keep them, or discard them and create a new draft from “${activityTitle}”.`,
      confirmLabel: isRestoreMode
        ? "Discard and restore"
        : "Discard and use again",
    };
  }

  return getSectionDiscardConfirmation(
    pendingAction.section
  );
}

function getSectionDiscardConfirmation(
  section: DashboardSection
) {
  if (section === "home") {
    return {
      title:
        "Return to the Control Center?",
      description:
        "Your unsaved activity changes will be lost. Continue editing to keep them, or discard them and return to the Control Center.",
      confirmLabel:
        "Discard and leave",
    };
  }

  if (section === "analytics") {
    return {
      title: "Open Analytics?",
      description:
        "Your unsaved activity changes will be lost. Continue editing to keep them, or discard them and open Analytics.",
      confirmLabel:
        "Discard and open",
    };
  }

  if (section === "history") {
    return {
      title:
        "Open Activity History?",
      description:
        "Your unsaved activity changes will be lost. Continue editing to keep them, or discard them and open History.",
      confirmLabel:
        "Discard and open",
    };
  }

  if (section === "account") {
    return {
      title:
        "Open Account Settings?",
      description:
        "Your unsaved activity changes will be lost. Continue editing to keep them, or discard them and open Account Settings.",
      confirmLabel:
        "Discard and open",
    };
  }

  return {
    title:
      "Leave the activity editor?",
    description:
      "Your unsaved activity changes will be lost. Continue editing to keep them, or discard them and leave the editor.",
    confirmLabel:
      "Discard and leave",
  };
}