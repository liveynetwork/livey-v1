import {
  useEffect,
  useMemo,
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
  setActiveSection("account");
}

  function handleCreateEvent() {
    setStatusMessage("");
    setErrorMessage("");
    setEditingEvent(
      createEmptyEditingEvent()
    );
    setActiveSection("activity");
  }

  function handleCancelEditing() {
    setStatusMessage("");
    setErrorMessage("");
    setEditingEvent(null);
  }

  function handleSelectEvent(
    event: VenueDashboardEvent
  ) {
    if (isEventInHistory(event)) {
      return;
    }

    setStatusMessage("");
    setErrorMessage("");
    setEditingEvent(
      mapEventToEditingState(event)
    );
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
      setEditingEvent(
        mapEventToEditingState(
          selectedEvent
        )
      );
    }
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

        setEditingEvent(null);

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

        setEditingEvent(null);

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

      setEditingEvent(null);

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

      setEditingEvent(
        mapEventToEditingState(
          restoredEvent
        )
      );

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
          setActiveSection
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
                  handleCreateEvent
                }
                onSelectEvent={
                  handleSelectEvent
                }
                onSectionChange={
                  setActiveSection
                }
              />
            ) : null}

            {activeSection === "activity" ? (
              <VenueDashboardActivity
                activeEvents={activeEvents}
                editingEvent={editingEvent}
                isSaving={isSaving}
                isDeletingEvent={
                  isDeletingEvent
                }
                onCreateEvent={
                  handleCreateEvent
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
                  handleSelectEvent
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
    handleRefreshDashboard
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
                  handleRestoreEvent
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
                  handleRefreshDashboard
                }
                onSectionChange={
                  setActiveSection
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
          isRemoveActivityModalOpen
        }
        tone="danger"
        title="Remove this activity?"
        description={
          editingEvent
            ? `"${editingEvent.title || "Untitled activity"}" will be removed from Livey. Removed activities cannot be restored.`
            : "This activity will be removed from Livey. Removed activities cannot be restored."
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
    </main>
  );
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