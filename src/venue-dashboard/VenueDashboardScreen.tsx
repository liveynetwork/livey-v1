import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  buildVenueDashboardAnalytics,
  createVenueEvent,
  deleteVenueEvent,
  getVenueDashboardData,
  getVenueFollowerAnalytics,
  restoreVenueEvent,
  updateVenueEvent,
  updateVenueProfile,
  type VenueActivityStatus,
  type VenueDashboardData,
  type VenueDashboardEvent,
  type VenueFollowerAnalytics,
} from "./venueDashboardService";
import { dashboardSupabase } from "../lib/dashboardSupabase";
import {
  VenueDashboardSidebar,
  type DashboardSection,
} from "./VenueDashboardSidebar";
import {
  VenueDashboardActivity,
  type EditingEventState,
} from "./tabs/VenueDashboardActivity";
import { VenueDashboardAccount } from "./tabs/VenueDashboardAccount";
import { VenueDashboardAnalytics } from "./tabs/VenueDashboardAnalytics";
import { VenueDashboardHistory } from "./tabs/VenueDashboardHistory";
import { VenueDashboardHome } from "./tabs/VenueDashboardHome";
import "./VenueDashboardScreen.css";
import { LiveyConfirmModal } from "./components/LiveyConfirmModal";
import { LiveyToast } from "./components/LiveyToast";
import type {
  EditableProfileFocusTarget,
} from "./tabs/analytics/AnalyticsProfileHealthModal";

type PendingActivityAction =
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
      type: "restore";
      event: VenueDashboardEvent;
    };
    
type VenueDashboardScreenProps = {
  onReady?: () => void;
};

export function VenueDashboardScreen({
  onReady,
}: VenueDashboardScreenProps) {
  const [dashboardData, setDashboardData] = useState<
    VenueDashboardData[]
  >([]);

  const [activeSection, setActiveSection] =
    useState<DashboardSection>("home");

    const [
  accountSettingsFocusTarget,
  setAccountSettingsFocusTarget,
] =
  useState<EditableProfileFocusTarget | null>(
    null
  );

  const [editingEvent, setEditingEvent] =
    useState<EditingEventState | null>(null);

    const [
  isActivityReusePanelOpen,
  setIsActivityReusePanelOpen,
] = useState(false);

  const originalEditingEventRef =
  useRef<EditingEventState | null>(null);

const [
  pendingActivityAction,
  setPendingActivityAction,
] = useState<PendingActivityAction | null>(
  null
);

const [
  isDiscardChangesModalOpen,
  setIsDiscardChangesModalOpen,
] = useState(false);

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isDeletingEvent, setIsDeletingEvent] =
    useState(false);

  const [isRestoringEvent, setIsRestoringEvent] =
    useState(false);

  const [
    isUpdatingVenueProfile,
    setIsUpdatingVenueProfile,
  ] = useState(false);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [statusMessage, setStatusMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [
    followerAnalytics,
    setFollowerAnalytics,
  ] = useState<VenueFollowerAnalytics | null>(
    null
  );

  const [
  visibilityEventToConfirm,
  setVisibilityEventToConfirm,
] = useState<VenueDashboardEvent | null>(
  null
);

const [
  updatingVisibilityEventId,
  setUpdatingVisibilityEventId,
] = useState<string | null>(null);

  const [
    isFollowerAnalyticsLoading,
    setIsFollowerAnalyticsLoading,
  ] = useState(false);

  const [
    followerAnalyticsError,
    setFollowerAnalyticsError,
  ] = useState("");

  const [
    isRemoveActivityModalOpen,
    setIsRemoveActivityModalOpen,
  ] = useState(false);

  const hasVenues =
    dashboardData.length > 0;

  const activeVenue = useMemo(() => {
    return dashboardData[0]?.venue ?? null;
  }, [dashboardData]);

  const activeVenueId =
    activeVenue?.id ?? null;

  const allVenueEvents = useMemo(() => {
    return dashboardData[0]?.events ?? [];
  }, [dashboardData]);

  const activeEvents = useMemo(() => {
    return allVenueEvents.filter(
      (event) => !isEventInHistory(event)
    );
  }, [allVenueEvents]);

  const historyEvents = useMemo(() => {
    return allVenueEvents.filter((event) =>
      isEventInHistory(event)
    );
  }, [allVenueEvents]);

  const analytics = useMemo(() => {
    if (!activeVenue) {
      return null;
    }

    const baseAnalytics =
      buildVenueDashboardAnalytics(
        activeVenue,
        allVenueEvents
      );

    return {
      ...baseAnalytics,
      totalFollowers:
        followerAnalytics?.totalFollowers ?? 0,
      newFollowersLast7Days:
        followerAnalytics
          ?.newFollowersLast7Days ?? 0,
      newFollowersLast30Days:
  followerAnalytics
    ?.newFollowersLast30Days ?? 0,

followerGrowthLast30Days:
  followerAnalytics
    ?.followerGrowthLast30Days ?? [],

followerGrowthRanges:
  followerAnalytics?.followerGrowthRanges ?? {
    last14Days: [],
    lastMonth: [],
    last6Months: [],
    lastYear: [],
  },

followerActivityRanges:
  followerAnalytics?.followerActivityRanges ?? {
    today: [],
    last14Days: [],
    lastMonth: [],
    last6Months: [],
    lastYear: [],
  },

followerAnalyticsGeneratedAt:
  followerAnalytics?.generatedAt ?? null,
      isFollowerAnalyticsLoading,
      followerAnalyticsError,
    };
  }, [
    activeVenue,
    allVenueEvents,
    followerAnalytics,
    isFollowerAnalyticsLoading,
    followerAnalyticsError,
  ]);

  const liveEventCount = useMemo(() => {
    return activeEvents.filter(
      (event) =>
        event.status === "Live now" &&
        event.is_active !== false
    ).length;
  }, [activeEvents]);

  const visibleEventCount = useMemo(() => {
    return activeEvents.filter(
      (event) => event.is_active !== false
    ).length;
  }, [activeEvents]);

  const hasUnsavedActivityChanges = useMemo(() => {
  return areEditingEventsDifferent(
    editingEvent,
    originalEditingEventRef.current
  );
}, [editingEvent]);

const discardChangesConfirmation = useMemo(() => {
  return getDiscardChangesConfirmation(
    pendingActivityAction
  );
}, [pendingActivityAction]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setStatusMessage("");
        setErrorMessage("");

        const {
          data: { user },
          error: userError,
        } =
          await dashboardSupabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        setCurrentUser(user);

        let data =
          await getVenueDashboardData();

        if (data.length === 0 && user) {
          const didRecoverClaim =
            await tryRecoverVenueClaim(user);

          if (didRecoverClaim) {
            data =
              await getVenueDashboardData();
          }
        }

        if (!isMounted) {
          return;
        }

        setDashboardData(data);
setEditingEvent(null);
originalEditingEventRef.current = null;
      } catch (error) {
        console.error(
          "Failed to load venue dashboard:",
          error
        );

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          "We could not load your venue dashboard. Please try again."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
          onReady?.();
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [onReady]);

  useEffect(() => {
    if (!activeVenueId) {
      setFollowerAnalytics(null);
      setFollowerAnalyticsError("");
      setIsFollowerAnalyticsLoading(false);
      return;
    }

    if (activeSection !== "analytics") {
      return;
    }

    let isMounted = true;

    async function loadFollowerAnalytics() {
      try {
        setIsFollowerAnalyticsLoading(true);
        setFollowerAnalyticsError("");

        const data =
          await getVenueFollowerAnalytics(
            activeVenueId
          );

        if (!isMounted) {
          return;
        }

        setFollowerAnalytics(data);
      } catch (error) {
        console.error(
          "Failed to load venue follower analytics:",
          error
        );

        if (!isMounted) {
          return;
        }

        setFollowerAnalytics(null);
        setFollowerAnalyticsError(
          "Follower analytics could not be loaded right now."
        );
      } finally {
        if (isMounted) {
          setIsFollowerAnalyticsLoading(false);
        }
      }
    }

    loadFollowerAnalytics();

    return () => {
      isMounted = false;
    };
  }, [activeSection, activeVenueId]);

  useEffect(() => {
  if (!hasUnsavedActivityChanges) {
    return;
  }

  function handleBeforeUnload(
    event: BeforeUnloadEvent
  ) {
    event.preventDefault();

    event.returnValue = "";
  }

  window.addEventListener(
    "beforeunload",
    handleBeforeUnload
  );

  return () => {
    window.removeEventListener(
      "beforeunload",
      handleBeforeUnload
    );
  };
}, [hasUnsavedActivityChanges]);

  function handleDismissToast() {
    setStatusMessage("");
    setErrorMessage("");
  }

  async function tryRecoverVenueClaim(
    user: User
  ) {
    const metadataClaimCode =
      typeof user.user_metadata
        ?.pending_venue_claim_code === "string"
        ? user.user_metadata
            .pending_venue_claim_code
        : "";

    const pendingClaimCode =
      window.localStorage.getItem(
        "livey:pendingVenueClaimCode"
      ) || "";

    const codeToClaim =
      pendingClaimCode ||
      metadataClaimCode ||
      "";

    if (!codeToClaim.trim()) {
      return false;
    }

    const { error } =
      await dashboardSupabase.functions.invoke(
        "dashboard-complete-venue-claim",
        {
          body: {
            claim_code:
              codeToClaim.trim(),
          },
        }
      );

    if (error) {
      const message =
        error.message.toLowerCase();

      if (
        message.includes(
          "already been claimed"
        ) ||
        message.includes(
          "already has an owner"
        )
      ) {
        window.localStorage.removeItem(
          "livey:pendingVenueClaimCode"
        );

        return true;
      }

      console.error(
        "Failed to recover venue claim:",
        error
      );

      setErrorMessage(
        "We found your Livey venue code, but could not connect this account to the venue. Please contact Livey support."
      );

      return false;
    }

    window.localStorage.removeItem(
      "livey:pendingVenueClaimCode"
    );

    setStatusMessage(
      "Venue connected successfully."
    );

    return true;
  }

  function handleOpenAccountSettings(
  target: EditableProfileFocusTarget
) {
  setAccountSettingsFocusTarget(target);
  requestSectionChange("account");
}

function handleCloseActivityReusePanel() {
  setIsActivityReusePanelOpen(false);
}

function handleUsePreviousActivity(
  event: VenueDashboardEvent
) {
  setStatusMessage("");
  setErrorMessage("");
  setIsActivityReusePanelOpen(false);

  const nextEditingEvent =
    createEditingEventFromPrevious(
      event
    );

  originalEditingEventRef.current =
    nextEditingEvent;

  setEditingEvent(nextEditingEvent);
  setActiveSection("activity");
}

  function handleCreateEvent() {
  setStatusMessage("");
  setErrorMessage("");
  setIsActivityReusePanelOpen(false);

  const nextEditingEvent =
    createEmptyEditingEvent();

  originalEditingEventRef.current =
    nextEditingEvent;

  setEditingEvent(nextEditingEvent);
  setActiveSection("activity");
}

  function handleCreateLiveNowEvent() {
  setStatusMessage("");
  setErrorMessage("");
  setIsActivityReusePanelOpen(false);

  const nextEditingEvent =
    createLiveNowEditingEvent();

  originalEditingEventRef.current =
    nextEditingEvent;

  setEditingEvent(nextEditingEvent);
  setActiveSection("activity");
}

  function handleCancelEditing() {
  setStatusMessage("");
  setErrorMessage("");

  if (hasUnsavedActivityChanges) {
    setPendingActivityAction({
      type: "cancel",
    });

    setIsDiscardChangesModalOpen(true);
    return;
  }

  closeActivityEditor();
}

function closeActivityEditor() {
  setEditingEvent(null);
  originalEditingEventRef.current = null;
}

function requestCreateEvent() {
  if (hasUnsavedActivityChanges) {
    setPendingActivityAction({
      type: "create",
    });

    setIsDiscardChangesModalOpen(true);
    return;
  }

  handleCreateEvent();
}

function requestSelectEvent(
  event: VenueDashboardEvent
) {
  if (
    editingEvent?.id === event.id &&
    editingEvent.mode === "edit"
  ) {
    return;
  }

  if (hasUnsavedActivityChanges) {
    setPendingActivityAction({
      type: "select",
      event,
    });

    setIsDiscardChangesModalOpen(true);
    return;
  }

  handleSelectEvent(event);
}

function requestSectionChange(
  section: DashboardSection
) {
  if (section === activeSection) {
    return;
  }

  if (hasUnsavedActivityChanges) {
    setPendingActivityAction({
      type: "section",
      section,
    });

    setIsDiscardChangesModalOpen(true);
    return;
  }

  if (
    activeSection === "activity" &&
    editingEvent
  ) {
    closeActivityEditor();
  }

  if (section !== "activity") {
  setIsActivityReusePanelOpen(false);
}

  setActiveSection(section);
}

  function handleSelectEvent(
  event: VenueDashboardEvent
) {
  if (isEventInHistory(event)) {
    return;
  }

  setStatusMessage("");
  setErrorMessage("");
  setIsActivityReusePanelOpen(false);

  const nextEditingEvent =
    mapEventToEditingState(event);

  originalEditingEventRef.current =
    nextEditingEvent;

  setEditingEvent(nextEditingEvent);
  setActiveSection("activity");
}

  async function refreshDashboard(
    selectedEventId?: string | null
  ) {
    const freshData =
      await getVenueDashboardData();

    setDashboardData(freshData);

    if (!selectedEventId) {
      return;
    }

    const selectedEvent = freshData
      .flatMap((item) => item.events)
      .find(
        (event) =>
          event.id === selectedEventId
      );

    if (
  selectedEvent &&
  !isEventInHistory(selectedEvent)
) {
  const nextEditingEvent =
    mapEventToEditingState(
      selectedEvent
    );

  originalEditingEventRef.current =
    nextEditingEvent;

  setEditingEvent(nextEditingEvent);
}
  }

  function requestRefreshDashboard() {
  if (hasUnsavedActivityChanges) {
    setPendingActivityAction({
      type: "refresh",
    });

    setIsDiscardChangesModalOpen(true);
    return;
  }

  void handleRefreshDashboard();
}

  async function handleRefreshDashboard() {
    try {
      setIsRefreshing(true);
      setStatusMessage("");
      setErrorMessage("");

      await refreshDashboard(
        editingEvent?.mode === "edit"
          ? editingEvent.id
          : null
      );

      if (
        activeSection === "analytics" &&
        activeVenueId
      ) {
        try {
          setIsFollowerAnalyticsLoading(
            true
          );

          setFollowerAnalyticsError("");

          const data =
            await getVenueFollowerAnalytics(
              activeVenueId
            );

          setFollowerAnalytics(data);
        } catch (error) {
          console.error(
            "Failed to refresh venue follower analytics:",
            error
          );

          setFollowerAnalyticsError(
            "Follower analytics could not be refreshed right now."
          );
        } finally {
          setIsFollowerAnalyticsLoading(
            false
          );
        }
      }

      setStatusMessage(
        "Dashboard refreshed."
      );
    } catch (error) {
      console.error(
        "Failed to refresh venue dashboard:",
        error
      );

      setErrorMessage(
        "We could not refresh your dashboard. Please try again."
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  function requestToggleEventVisibility(
  event: VenueDashboardEvent
) {
  if (event.is_active !== false) {
    setVisibilityEventToConfirm(event);
    return;
  }

  void handleToggleEventVisibility(
    event,
    true
  );
}

async function handleToggleEventVisibility(
  event: VenueDashboardEvent,
  nextIsActive: boolean
) {
  if (
    !event.starts_at ||
    !event.ends_at
  ) {
    setErrorMessage(
      "This activity does not have a valid schedule and cannot be updated."
    );

    return;
  }

  try {
    setUpdatingVisibilityEventId(
      event.id
    );

    setStatusMessage("");
    setErrorMessage("");

    await updateVenueEvent({
      eventId: event.id,
      title: event.title || "",
      description:
        event.description || "",
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      isActive: nextIsActive,
    });

    await refreshDashboard();

    setVisibilityEventToConfirm(null);

    setStatusMessage(
      nextIsActive
        ? "Activity is now visible on Livey."
        : "Activity hidden from Livey."
    );
  } catch (error) {
    console.error(
      "Failed to update activity visibility:",
      error
    );

    setErrorMessage(
      nextIsActive
        ? "We could not show this activity on Livey. Please try again."
        : "We could not hide this activity from Livey. Please try again."
    );
  } finally {
    setUpdatingVisibilityEventId(
      null
    );
  }
}

function handleCancelVisibilityChange() {
  if (updatingVisibilityEventId) {
    return;
  }

  setVisibilityEventToConfirm(null);
}

function handleConfirmHideActivity() {
  if (!visibilityEventToConfirm) {
    return;
  }

  void handleToggleEventVisibility(
    visibilityEventToConfirm,
    false
  );
}

  async function handleSaveEvent() {
    if (!editingEvent || !activeVenue) {
      return;
    }

    if (!editingEvent.title.trim()) {
      setErrorMessage(
        "Activity title is required."
      );

      return;
    }

    if (
      !editingEvent.startsAt ||
      !editingEvent.endsAt
    ) {
      setErrorMessage(
        "Activity start and end time are required."
      );

      return;
    }

    const startsAtDate = new Date(
      editingEvent.startsAt
    );

    const endsAtDate = new Date(
      editingEvent.endsAt
    );

    if (
      Number.isNaN(
        startsAtDate.getTime()
      ) ||
      Number.isNaN(
        endsAtDate.getTime()
      )
    ) {
      setErrorMessage(
        "Activity start and end time are invalid."
      );

      return;
    }

    if (endsAtDate <= startsAtDate) {
      setErrorMessage(
        "Activity end time must be after the start time."
      );

      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage("");
      setErrorMessage("");

      if (
        editingEvent.mode === "create"
      ) {
        await createVenueEvent({
          venueId: activeVenue.id,
          title: editingEvent.title,
          description:
            editingEvent.description,
          startsAt:
            startsAtDate.toISOString(),
          endsAt:
            endsAtDate.toISOString(),
          isActive:
            editingEvent.isActive,
        });

        await refreshDashboard();

        closeActivityEditor();

        setStatusMessage(
          "Activity created successfully."
        );
      } else {
        if (!editingEvent.id) {
          throw new Error(
            "The selected activity has no ID."
          );
        }

        await updateVenueEvent({
          eventId: editingEvent.id,
          title: editingEvent.title,
          description:
            editingEvent.description,
          startsAt:
            startsAtDate.toISOString(),
          endsAt:
            endsAtDate.toISOString(),
          isActive:
            editingEvent.isActive,
        });

        await refreshDashboard();

        closeActivityEditor();

        setStatusMessage(
          "Activity updated successfully."
        );
      }
    } catch (error) {
      console.error(
        "Failed to save venue activity:",
        error
      );

      setErrorMessage(
        editingEvent.mode === "create"
          ? "We could not create this activity. Please try again."
          : "We could not save this activity. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleDeleteEvent() {
    if (
      !editingEvent ||
      editingEvent.mode !== "edit" ||
      !editingEvent.id
    ) {
      return;
    }

    setIsRemoveActivityModalOpen(true);
  }

  function handleCancelDeleteEvent() {
    if (isDeletingEvent) {
      return;
    }

    setIsRemoveActivityModalOpen(false);
  }

  function handleCancelDiscardActivityChanges() {
  setPendingActivityAction(null);
  setIsDiscardChangesModalOpen(false);
}

function handleConfirmDiscardActivityChanges() {
  const pendingAction =
    pendingActivityAction;

  setPendingActivityAction(null);
  setIsDiscardChangesModalOpen(false);

  closeActivityEditor();

  if (!pendingAction) {
    return;
  }

  if (pendingAction.type === "cancel") {
    return;
  }

  if (pendingAction.type === "create") {
    handleCreateEvent();
    return;
  }

  if (
    pendingAction.type ===
    "create-live-now"
  ) {
    handleCreateLiveNowEvent();
    return;
  }

  if (pendingAction.type === "select") {
    handleSelectEvent(
      pendingAction.event
    );
    return;
  }

  if (pendingAction.type === "refresh") {
    void handleRefreshDashboard();
    return;
  }

  if (pendingAction.type === "restore") {
    void handleRestoreEvent(
      pendingAction.event
    );
    return;
  }

  if (
    pendingAction.section !== "activity"
  ) {
    setIsActivityReusePanelOpen(false);
  }

  setActiveSection(
    pendingAction.section
  );
}

  async function handleConfirmDeleteEvent() {
    if (
      !editingEvent ||
      editingEvent.mode !== "edit" ||
      !editingEvent.id
    ) {
      setIsRemoveActivityModalOpen(false);
      return;
    }

    try {
      setIsDeletingEvent(true);
      setStatusMessage("");
      setErrorMessage("");

      await deleteVenueEvent({
        eventId: editingEvent.id,
        reason:
          "Removed by venue owner",
      });

      await refreshDashboard();

      closeActivityEditor();

      setIsRemoveActivityModalOpen(
        false
      );

      setStatusMessage(
        "Activity removed and moved to History."
      );
    } catch (error) {
      console.error(
        "Failed to remove venue activity:",
        error
      );

      setErrorMessage(
        "We could not remove this activity. Please try again."
      );
    } finally {
      setIsDeletingEvent(false);
    }
  }

  function requestRestoreEvent(
  event: VenueDashboardEvent
) {
  if (hasUnsavedActivityChanges) {
    setPendingActivityAction({
      type: "restore",
      event,
    });

    setIsDiscardChangesModalOpen(true);
    return;
  }

  void handleRestoreEvent(event);
}

  async function handleRestoreEvent(
    event: VenueDashboardEvent
  ) {
    try {
      setIsRestoringEvent(true);
      setStatusMessage("");
      setErrorMessage("");

      const restoredEvent =
        await restoreVenueEvent({
          eventId: event.id,
        });

      await refreshDashboard();

      const nextEditingEvent =
  mapEventToEditingState(
    restoredEvent
  );

originalEditingEventRef.current =
  nextEditingEvent;

setEditingEvent(nextEditingEvent);
setActiveSection("activity");

      setStatusMessage(
        "Activity restored successfully."
      );
    } catch (error) {
      console.error(
        "Failed to restore venue activity:",
        error
      );

      setErrorMessage(
        "We could not restore this activity. Please try again."
      );
    } finally {
      setIsRestoringEvent(false);
    }
  }

  async function handleUpdateVenueProfile(
    input: {
      name: string;
      description: string;
      area: string;
      address: string;
      openStatus: string;
      openingHours: string;
      logoFile: File | null;
    }
  ) {
    if (!activeVenue) {
      return;
    }

    try {
      setIsUpdatingVenueProfile(true);
      setStatusMessage("");
      setErrorMessage("");

      await updateVenueProfile({
        venueId: activeVenue.id,
        name: input.name,
        description:
          input.description,
        area: input.area,
        address: input.address,
        openStatus:
          input.openStatus,
        openingHours:
          input.openingHours,
        logoFile: input.logoFile,
      });

      await refreshDashboard();

      setStatusMessage(
        "Venue profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Failed to update venue profile:",
        error
      );

      setErrorMessage(
        "We could not update your venue profile. Please try again."
      );
    } finally {
      setIsUpdatingVenueProfile(false);
    }
  }

  async function handleSignOut() {
    try {
      await dashboardSupabase.auth.signOut();

      window.dispatchEvent(
        new Event("livey:auth-changed")
      );
    } catch (error) {
      console.error(
        "Failed to sign out venue owner:",
        error
      );

      setErrorMessage(
        "We could not sign out. Please try again."
      );
    }
  }

  return (
    <main className="venue-dashboard-page">
      <VenueDashboardSidebar
  activeSection={activeSection}
  venueName={
    activeVenue?.name ||
    "Venue owner"
  }
  venueLogoUrl={
    activeVenue?.logo_url || null
  }
  onSectionChange={
    requestSectionChange
  }
/>

      <section className="venue-dashboard-main">
        <header className="venue-dashboard-topbar">
          <div>
            <img
              className="venue-dashboard-topbar-logo"
              src="/Livey-Logo.png"
              alt="Livey"
            />

            <h1>
              {getSectionTitle(
                activeSection
              )}
            </h1>
          </div>
        </header>

        {isLoading ? (
          <section className="venue-dashboard-card">
            <p className="venue-dashboard-muted">
              Loading your dashboard...
            </p>
          </section>
        ) : !hasVenues ? (
          <section className="venue-dashboard-card">
            <h2>
              No venue connected yet
            </h2>

            <p>
              This account is signed in,
              but it is not connected to an
              approved Livey venue yet.
            </p>

            <p className="venue-dashboard-muted">
              If you already received a
              Livey venue code, sign out and
              create your venue account using
              that code. If this keeps
              happening, contact Livey
              support.
            </p>
          </section>
        ) : (
          <>
            {activeSection === "home" ? (
              <VenueDashboardHome
                activeVenue={activeVenue}
                activeEvents={activeEvents}
                liveEventCount={
                  liveEventCount
                }
                visibleEventCount={
                  visibleEventCount
                }
                historyEventCount={
                  historyEvents.length
                }
                onCreateEvent={
  requestCreateEvent
}
onSelectEvent={
  requestSelectEvent
}
onSectionChange={
  requestSectionChange
}
              />
            ) : null}

            {activeSection === "activity" ? (
              <VenueDashboardActivity
  activeEvents={activeEvents}
  historyEvents={historyEvents}
  editingEvent={editingEvent}
  isReusePanelOpen={
    isActivityReusePanelOpen
  }
  isSaving={isSaving}
  isDeletingEvent={
    isDeletingEvent
  }
  isUpdatingVisibility={
  updatingVisibilityEventId !== null
}
updatingVisibilityEventId={
  updatingVisibilityEventId
}
onToggleVisibility={
  requestToggleEventVisibility
}
  onCreateEvent={
    requestCreateEvent
  }
  onCloseReusePanel={
    handleCloseActivityReusePanel
  }
  onOpenHistory={() =>
    requestSectionChange("history")
  }
  onUsePreviousActivity={
    handleUsePreviousActivity
  }
  onCancelEditing={
    handleCancelEditing
  }
  onDeleteEvent={
    handleDeleteEvent
  }
  onSaveEvent={
    handleSaveEvent
  }
  onSelectEvent={
    requestSelectEvent
  }
  onEditingEventChange={
    setEditingEvent
  }
  getPreviewTiming={
    getPreviewTiming
  }
/>
            ) : null}

            {activeSection ===
              "analytics" &&
            analytics &&
            activeVenue ? (
              <VenueDashboardAnalytics
  venueName={
    activeVenue.name ||
    "Your venue"
  }
  events={allVenueEvents}
  analytics={analytics}
  onRefreshAnalytics={
  requestRefreshDashboard
}
  onOpenAccountSettings={
  handleOpenAccountSettings
}
/>
            ) : null}

            {activeSection ===
            "history" ? (
              <VenueDashboardHistory
                venueName={
                  activeVenue?.name ||
                  "Your venue"
                }
                historyEvents={
                  historyEvents
                }
                isRestoringEvent={
                  isRestoringEvent
                }
                onRestoreEvent={
  requestRestoreEvent
}
              />
            ) : null}

            {activeSection ===
            "account" ? (
              <VenueDashboardAccount
                currentUser={currentUser}
                activeVenue={activeVenue}
                isRefreshing={
                  isRefreshing
                }
                isUpdatingVenueProfile={
                  isUpdatingVenueProfile
                }
                focusTarget={
  accountSettingsFocusTarget
}
onFocusTargetHandled={() =>
  setAccountSettingsFocusTarget(null)
}
                onRefreshDashboard={
  requestRefreshDashboard
}
                onSectionChange={
  requestSectionChange
}
                onUpdateVenueProfile={
                  handleUpdateVenueProfile
                }
                onSignOut={handleSignOut}
              />
            ) : null}
          </>
        )}
      </section>

      {errorMessage ? (
        <LiveyToast
          key={`error-${errorMessage}`}
          tone="error"
          message={errorMessage}
          onDismiss={handleDismissToast}
        />
      ) : statusMessage ? (
        <LiveyToast
          key={`success-${statusMessage}`}
          tone="success"
          message={statusMessage}
          onDismiss={handleDismissToast}
        />
      ) : null}

       <LiveyConfirmModal
  isOpen={
    visibilityEventToConfirm !== null
  }
  title="Hide this activity?"
  description={
    visibilityEventToConfirm
      ? `“${
          visibilityEventToConfirm.title ||
          "Untitled activity"
        }” will no longer appear to people on Livey. You can show it again at any time from the Publishing Timeline.`
      : "This activity will no longer appear to people on Livey."
  }
  confirmLabel="Hide from Livey"
  cancelLabel="Keep visible"
  tone="warning"
  isProcessing={
    updatingVisibilityEventId !== null
  }
  onCancel={
    handleCancelVisibilityChange
  }
  onConfirm={
    handleConfirmHideActivity
  }
/>

      <LiveyConfirmModal
        isOpen={
          isRemoveActivityModalOpen
        }
        tone="danger"
        title="Remove this activity?"
        description={
  editingEvent
    ? `"${editingEvent.title || "Untitled activity"}" will be removed from Livey and moved to History. Eligible removed activities can be restored later.`
    : "This activity will be removed from Livey and moved to History. Eligible removed activities can be restored later."
}
        confirmLabel="Remove activity"
        isProcessing={isDeletingEvent}
        onCancel={
          handleCancelDeleteEvent
        }
        onConfirm={
          handleConfirmDeleteEvent
        }
      />
      <LiveyConfirmModal
  isOpen={
    isDiscardChangesModalOpen
  }
  title={
    discardChangesConfirmation.title
  }
  description={
    discardChangesConfirmation.description
  }
  confirmLabel={
    discardChangesConfirmation.confirmLabel
  }
  cancelLabel="Continue editing"
  tone="warning"
  onCancel={
    handleCancelDiscardActivityChanges
  }
  onConfirm={
    handleConfirmDiscardActivityChanges
  }
/>
    </main>
  );
}

function getDiscardChangesConfirmation(
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
      confirmLabel: "Discard and refresh",
    };
  }

  if (pendingAction.type === "restore") {
    const restoredActivityTitle =
      pendingAction.event.title?.trim() ||
      "this activity";

    return {
      title: "Restore this activity?",
      description:
        `Your current unsaved changes will be lost. Continue editing to keep them, or discard them and restore “${restoredActivityTitle}”.`,
      confirmLabel: "Discard and restore",
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
      title: "Return to the Control Center?",
      description:
        "Your unsaved activity changes will be lost. Continue editing to keep them, or discard them and return to the Control Center.",
      confirmLabel: "Discard and leave",
    };
  }

  if (section === "analytics") {
    return {
      title: "Open Analytics?",
      description:
        "Your unsaved activity changes will be lost. Continue editing to keep them, or discard them and open Analytics.",
      confirmLabel: "Discard and open",
    };
  }

  if (section === "history") {
    return {
      title: "Open Activity History?",
      description:
        "Your unsaved activity changes will be lost. Continue editing to keep them, or discard them and open History.",
      confirmLabel: "Discard and open",
    };
  }

  if (section === "account") {
    return {
      title: "Open Account Settings?",
      description:
        "Your unsaved activity changes will be lost. Continue editing to keep them, or discard them and open Account Settings.",
      confirmLabel: "Discard and open",
    };
  }

  return {
    title: "Leave the activity editor?",
    description:
      "Your unsaved activity changes will be lost. Continue editing to keep them, or discard them and leave the editor.",
    confirmLabel: "Discard and leave",
  };
}

function areEditingEventsDifferent(
  currentEvent: EditingEventState | null,
  originalEvent: EditingEventState | null
) {
  if (!currentEvent) {
    return false;
  }

  if (!originalEvent) {
    return true;
  }

  return (
    currentEvent.id !== originalEvent.id ||
    currentEvent.mode !== originalEvent.mode ||
    currentEvent.title !== originalEvent.title ||
    currentEvent.description !==
      originalEvent.description ||
    currentEvent.status !== originalEvent.status ||
    currentEvent.displayTime !==
      originalEvent.displayTime ||
    currentEvent.startsAt !==
      originalEvent.startsAt ||
    currentEvent.endsAt !==
      originalEvent.endsAt ||
    currentEvent.isActive !==
      originalEvent.isActive
  );
}

function createEditingEventFromPrevious(
  event: VenueDashboardEvent
): EditingEventState {
  const now = new Date();

  const startsAt = new Date(
    now.getTime() +
      60 * 60 * 1000
  );

  const previousDurationMs =
    getPreviousActivityDurationMs(
      event
    );

  const endsAt = new Date(
    startsAt.getTime() +
      previousDurationMs
  );

  const startsAtValue =
    toDateTimeLocalValue(
      startsAt.toISOString()
    );

  const endsAtValue =
    toDateTimeLocalValue(
      endsAt.toISOString()
    );

  const preview = getPreviewTiming(
    startsAtValue,
    endsAtValue
  );

  return {
    id: null,
    mode: "create",
    title: event.title || "",
    description:
      event.description || "",
    status: preview.status,
    displayTime:
      preview.displayTime,
    startsAt: startsAtValue,
    endsAt: endsAtValue,
    isActive:
      event.is_active !== false,
  };
}

function getPreviousActivityDurationMs(
  event: VenueDashboardEvent
) {
  const fallbackDurationMs =
    3 * 60 * 60 * 1000;

  if (
    !event.starts_at ||
    !event.ends_at
  ) {
    return fallbackDurationMs;
  }

  const previousStartsAt =
    new Date(
      event.starts_at
    ).getTime();

  const previousEndsAt =
    new Date(
      event.ends_at
    ).getTime();

  if (
    Number.isNaN(
      previousStartsAt
    ) ||
    Number.isNaN(
      previousEndsAt
    )
  ) {
    return fallbackDurationMs;
  }

  const durationMs =
    previousEndsAt -
    previousStartsAt;

  return durationMs > 0
    ? durationMs
    : fallbackDurationMs;
}

function createLiveNowEditingEvent(): EditingEventState {
  const startsAt = new Date();

  const endsAt = new Date(
    startsAt.getTime() +
      3 * 60 * 60 * 1000
  );

  const startsAtValue =
    toDateTimeLocalValue(
      startsAt.toISOString()
    );

  const endsAtValue =
    toDateTimeLocalValue(
      endsAt.toISOString()
    );

  const preview = getPreviewTiming(
    startsAtValue,
    endsAtValue
  );

  return {
    id: null,
    mode: "create",
    title: "",
    description: "",
    status: preview.status,
    displayTime: preview.displayTime,
    startsAt: startsAtValue,
    endsAt: endsAtValue,
    isActive: true,
  };
}

function createEmptyEditingEvent(): EditingEventState {
  const now = new Date();

  const startsAt = new Date(
    now.getTime() + 60 * 60 * 1000
  );

  const endsAt = new Date(
    now.getTime() +
      3 * 60 * 60 * 1000
  );

  const preview = getPreviewTiming(
    toDateTimeLocalValue(
      startsAt.toISOString()
    ),
    toDateTimeLocalValue(
      endsAt.toISOString()
    )
  );

  return {
    id: null,
    mode: "create",
    title: "",
    description: "",
    status: preview.status,
    displayTime: preview.displayTime,
    startsAt: toDateTimeLocalValue(
      startsAt.toISOString()
    ),
    endsAt: toDateTimeLocalValue(
      endsAt.toISOString()
    ),
    isActive: true,
  };
}

function getSectionTitle(
  section: DashboardSection
) {
  if (section === "home") {
    return "Control Center";
  }

  if (section === "activity") {
    return "Activity";
  }

  if (section === "analytics") {
    return "Analytics";
  }

  if (section === "history") {
    return "History";
  }

  return "Account Settings";
}

function mapEventToEditingState(
  event: VenueDashboardEvent
): EditingEventState {
  return {
    id: event.id,
    mode: "edit",
    title: event.title || "",
    description:
      event.description || "",
    status: event.status,
    displayTime:
      event.display_time || "",
    startsAt: toDateTimeLocalValue(
      event.starts_at
    ),
    endsAt: toDateTimeLocalValue(
      event.ends_at
    ),
    isActive:
      event.is_active !== false,
  };
}

function isEventInHistory(
  event: VenueDashboardEvent
) {
  if (event.deleted_at) {
    return true;
  }

  if (!event.ends_at) {
    return false;
  }

  return (
    new Date(
      event.ends_at
    ).getTime() < Date.now()
  );
}

function toDateTimeLocalValue(
  isoValue: string | null
) {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);

  const timezoneOffsetMs =
    date.getTimezoneOffset() *
    60 *
    1000;

  const localDate = new Date(
    date.getTime() -
      timezoneOffsetMs
  );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function getPreviewTiming(
  startsAtValue: string,
  endsAtValue: string
) {
  if (
    !startsAtValue ||
    !endsAtValue
  ) {
    return {
      status:
        "Scheduled" as VenueActivityStatus,
      displayTime:
        "Choose start and end time",
    };
  }

  const startsAt =
    new Date(startsAtValue);

  const endsAt =
    new Date(endsAtValue);

  if (
    Number.isNaN(
      startsAt.getTime()
    ) ||
    Number.isNaN(
      endsAt.getTime()
    )
  ) {
    return {
      status:
        "Scheduled" as VenueActivityStatus,
      displayTime:
        "Choose start and end time",
    };
  }

  if (endsAt <= startsAt) {
    return {
      status:
        "Scheduled" as VenueActivityStatus,
      displayTime:
        "End time must be after start time",
    };
  }

  const now = new Date();

  const isLive =
    now >= startsAt &&
    now <= endsAt;

  if (isLive) {
    return {
      status:
        "Live now" as VenueActivityStatus,
      displayTime:
        `Live now · until ${formatTime(
          endsAt
        )}`,
    };
  }

  if (isSameDay(startsAt, now)) {
    if (startsAt.getHours() >= 17) {
      return {
        status:
          "Tonight" as VenueActivityStatus,
        displayTime:
          `Tonight · ${formatTime(
            startsAt
          )}–${formatTime(
            endsAt
          )}`,
      };
    }

    return {
      status:
        "Open now" as VenueActivityStatus,
      displayTime:
        `Today · ${formatTime(
          startsAt
        )}–${formatTime(
          endsAt
        )}`,
    };
  }

  const tomorrow = new Date(now);

  tomorrow.setDate(
    now.getDate() + 1
  );

  if (
    isSameDay(
      startsAt,
      tomorrow
    )
  ) {
    return {
      status:
        "Tomorrow" as VenueActivityStatus,
      displayTime:
        `Tomorrow · ${formatTime(
          startsAt
        )}–${formatTime(
          endsAt
        )}`,
    };
  }

  if (isWeekend(startsAt)) {
    return {
      status:
        "Weekend" as VenueActivityStatus,
      displayTime:
        `${formatWeekday(
          startsAt
        )} · ${formatTime(
          startsAt
        )}–${formatTime(
          endsAt
        )}`,
    };
  }

  return {
    status:
      "Scheduled" as VenueActivityStatus,
    displayTime:
      `${formatShortDate(
        startsAt
      )} · ${formatTime(
        startsAt
      )}–${formatTime(
        endsAt
      )}`,
  };
}

function isSameDay(
  firstDate: Date,
  secondDate: Date
) {
  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth() &&
    firstDate.getDate() ===
      secondDate.getDate()
  );
}

function isWeekend(date: Date) {
  const day = date.getDay();

  return day === 0 || day === 6;
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "long",
    }
  ).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
    }
  ).format(date);
}