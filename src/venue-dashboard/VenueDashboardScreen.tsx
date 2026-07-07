import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  createVenueEvent,
  deleteVenueEvent,
  getVenueDashboardData,
  restoreVenueEvent,
  updateVenueEvent,
  updateVenueProfile,
  type VenueActivityStatus,
  type VenueDashboardData,
  type VenueDashboardEvent,
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
import { VenueDashboardComingSoon } from "./tabs/VenueDashboardComingSoon";
import { VenueDashboardHistory } from "./tabs/VenueDashboardHistory";
import { VenueDashboardHome } from "./tabs/VenueDashboardHome";
import { VenueDashboardSettings } from "./tabs/VenueDashboardSettings";
import "./VenueDashboardScreen.css";

export function VenueDashboardScreen() {
  const [dashboardData, setDashboardData] = useState<VenueDashboardData[]>([]);
  const [activeSection, setActiveSection] = useState<DashboardSection>("home");
  const [editingEvent, setEditingEvent] = useState<EditingEventState | null>(
    null
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [isRestoringEvent, setIsRestoringEvent] = useState(false);
  const [isUpdatingVenueProfile, setIsUpdatingVenueProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const hasVenues = dashboardData.length > 0;

  const activeVenue = useMemo(() => {
    return dashboardData[0]?.venue ?? null;
  }, [dashboardData]);

  const allVenueEvents = useMemo(() => {
    return dashboardData[0]?.events ?? [];
  }, [dashboardData]);

  const activeEvents = useMemo(() => {
    return allVenueEvents.filter((event) => !isEventInHistory(event));
  }, [allVenueEvents]);

  const historyEvents = useMemo(() => {
    return allVenueEvents.filter((event) => isEventInHistory(event));
  }, [allVenueEvents]);

  const liveEventCount = useMemo(() => {
    return activeEvents.filter(
      (event) => event.status === "Live now" && event.is_active !== false
    ).length;
  }, [activeEvents]);

  const visibleEventCount = useMemo(() => {
    return activeEvents.filter((event) => event.is_active !== false).length;
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
        } = await dashboardSupabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        setCurrentUser(user);

        let data = await getVenueDashboardData();

        if (data.length === 0 && user) {
          const didRecoverClaim = await tryRecoverVenueClaim(user);

          if (didRecoverClaim) {
            data = await getVenueDashboardData();
          }
        }

        if (!isMounted) return;

        setDashboardData(data);

        const firstEvent = data[0]?.events?.find(
          (event) => !isEventInHistory(event)
        );

        setEditingEvent(firstEvent ? mapEventToEditingState(firstEvent) : null);
      } catch (error) {
        console.error("Failed to load venue dashboard:", error);

        if (!isMounted) return;

        setErrorMessage(
          "We could not load your venue dashboard. Please try again."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  async function tryRecoverVenueClaim(user: User) {
    const metadataClaimCode =
      typeof user.user_metadata?.pending_venue_claim_code === "string"
        ? user.user_metadata.pending_venue_claim_code
        : "";

    const pendingClaimCode =
      window.localStorage.getItem("livey:pendingVenueClaimCode") || "";

    const codeToClaim = pendingClaimCode || metadataClaimCode || "";

    if (!codeToClaim.trim()) {
      return false;
    }

    const { error } = await dashboardSupabase.functions.invoke(
      "dashboard-complete-venue-claim",
      {
        body: {
          claim_code: codeToClaim.trim(),
        },
      }
    );

    if (error) {
      const message = error.message.toLowerCase();

      if (
        message.includes("already been claimed") ||
        message.includes("already has an owner")
      ) {
        window.localStorage.removeItem("livey:pendingVenueClaimCode");
        return true;
      }

      console.error("Failed to recover venue claim:", error);
      setErrorMessage(
        "We found your Livey venue code, but could not connect this account to the venue. Please contact Livey support."
      );
      return false;
    }

    window.localStorage.removeItem("livey:pendingVenueClaimCode");
    setStatusMessage("Venue connected successfully.");
    return true;
  }

  function handleSelectEvent(event: VenueDashboardEvent) {
    setStatusMessage("");
    setErrorMessage("");
    setEditingEvent(mapEventToEditingState(event));
    setActiveSection("activity");
  }

  async function refreshDashboard(selectedEventId?: string) {
    const freshData = await getVenueDashboardData();
    setDashboardData(freshData);

    if (!selectedEventId) return;

    const selectedEvent = freshData
      .flatMap((item) => item.events)
      .find((event) => event.id === selectedEventId);

    if (selectedEvent && !isEventInHistory(selectedEvent)) {
      setEditingEvent(mapEventToEditingState(selectedEvent));
    }
  }

  async function handleRefreshDashboard() {
    try {
      setIsRefreshing(true);
      setStatusMessage("");
      setErrorMessage("");

      await refreshDashboard(editingEvent?.id);

      setStatusMessage("Dashboard refreshed.");
    } catch (error) {
      console.error("Failed to refresh venue dashboard:", error);
      setErrorMessage("We could not refresh your dashboard. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleCreateEvent() {
    if (!activeVenue) return;

    try {
      setIsCreatingEvent(true);
      setStatusMessage("");
      setErrorMessage("");

      const newEvent = await createVenueEvent({
        venueId: activeVenue.id,
      });

      await refreshDashboard(newEvent.id);

      setEditingEvent(mapEventToEditingState(newEvent));
      setActiveSection("activity");
      setStatusMessage("New activity created. You can edit it now.");
    } catch (error) {
      console.error("Failed to create venue activity:", error);
      setErrorMessage("We could not create a new activity. Please try again.");
    } finally {
      setIsCreatingEvent(false);
    }
  }

  async function handleSaveEvent() {
    if (!editingEvent) return;

    if (!editingEvent.title.trim()) {
      setErrorMessage("Activity title is required.");
      return;
    }

    if (!editingEvent.startsAt || !editingEvent.endsAt) {
      setErrorMessage("Activity start and end time are required.");
      return;
    }

    const startsAtDate = new Date(editingEvent.startsAt);
    const endsAtDate = new Date(editingEvent.endsAt);

    if (endsAtDate <= startsAtDate) {
      setErrorMessage("Activity end time must be after the start time.");
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage("");
      setErrorMessage("");

      await updateVenueEvent({
        eventId: editingEvent.id,
        title: editingEvent.title,
        description: editingEvent.description,
        startsAt: startsAtDate.toISOString(),
        endsAt: endsAtDate.toISOString(),
        isActive: editingEvent.isActive,
      });

      await refreshDashboard(editingEvent.id);

      setStatusMessage("Activity updated successfully.");
    } catch (error) {
      console.error("Failed to update venue activity:", error);
      setErrorMessage("We could not save this activity. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteEvent() {
    if (!editingEvent) return;

    const shouldDelete = window.confirm(
      "Remove this activity from Livey? It will be saved in History."
    );

    if (!shouldDelete) return;

    try {
      setIsDeletingEvent(true);
      setStatusMessage("");
      setErrorMessage("");

      await deleteVenueEvent({
        eventId: editingEvent.id,
        reason: "Removed by venue owner",
      });

      const freshData = await getVenueDashboardData();
      setDashboardData(freshData);

      const nextActiveEvent = freshData
        .flatMap((item) => item.events)
        .find((event) => !isEventInHistory(event));

      setEditingEvent(
        nextActiveEvent ? mapEventToEditingState(nextActiveEvent) : null
      );

      setStatusMessage("Activity removed and moved to History.");
    } catch (error) {
      console.error("Failed to remove venue activity:", error);
      setErrorMessage("We could not remove this activity. Please try again.");
    } finally {
      setIsDeletingEvent(false);
    }
  }

  async function handleRestoreEvent(event: VenueDashboardEvent) {
    try {
      setIsRestoringEvent(true);
      setStatusMessage("");
      setErrorMessage("");

      const restoredEvent = await restoreVenueEvent({
        eventId: event.id,
      });

      await refreshDashboard(restoredEvent.id);

      setEditingEvent(mapEventToEditingState(restoredEvent));
      setActiveSection("activity");
      setStatusMessage("Activity restored successfully.");
    } catch (error) {
      console.error("Failed to restore venue activity:", error);
      setErrorMessage("We could not restore this activity. Please try again.");
    } finally {
      setIsRestoringEvent(false);
    }
  }
  
  async function handleUpdateVenueProfile(input: {
  name: string;
  description: string;
  area: string;
  address: string;
  openStatus: string;
  openingHours: string;
  logoFile: File | null;
}) {
  if (!activeVenue) return;

  try {
    setIsUpdatingVenueProfile(true);
    setStatusMessage("");
    setErrorMessage("");

    await updateVenueProfile({
      venueId: activeVenue.id,
      name: input.name,
      description: input.description,
      area: input.area,
      address: input.address,
      openStatus: input.openStatus,
      openingHours: input.openingHours,
      logoFile: input.logoFile,
    });

    await refreshDashboard();

    setStatusMessage("Venue profile updated successfully.");
  } catch (error) {
    console.error("Failed to update venue profile:", error);
    setErrorMessage("We could not update your venue profile. Please try again.");
  } finally {
    setIsUpdatingVenueProfile(false);
  }
}

  async function handleSignOut() {
    const shouldSignOut = window.confirm(
      "Are you sure you want to sign out of the Livey venue dashboard?"
    );

    if (!shouldSignOut) return;

    try {
      await dashboardSupabase.auth.signOut();
      window.dispatchEvent(new Event("livey:auth-changed"));
    } catch (error) {
      console.error("Failed to sign out venue owner:", error);
      setErrorMessage("We could not sign out. Please try again.");
    }
  }

  return (
    <main className="venue-dashboard-page">
      <VenueDashboardSidebar
        activeSection={activeSection}
        venueName={activeVenue?.name || "Venue owner"}
        onSectionChange={setActiveSection}
      />

      <section className="venue-dashboard-main">
        <header className="venue-dashboard-topbar">
          <div>
            <img
  className="venue-dashboard-topbar-logo"
  src="/Livey-Logo.png"
  alt="Livey"
/>

<h1>{getSectionTitle(activeSection)}</h1>
          </div>

          <button
            className="venue-dashboard-primary-action"
            type="button"
            onClick={handleCreateEvent}
            disabled={!activeVenue || isCreatingEvent}
          >
            {isCreatingEvent ? "Creating..." : "New activity"}
          </button>
        </header>

        {isLoading ? (
          <section className="venue-dashboard-card">
            <p className="venue-dashboard-muted">Loading your dashboard...</p>
          </section>
        ) : !hasVenues ? (
          <section className="venue-dashboard-card">
            <h2>No venue connected yet</h2>
            <p>
              This account is signed in, but it is not connected to an approved
              Livey venue yet.
            </p>

            {errorMessage ? (
              <p className="venue-dashboard-error">{errorMessage}</p>
            ) : null}

            <p className="venue-dashboard-muted">
              If you already received a Livey venue code, sign out and create
              your venue account using that code. If this keeps happening,
              contact Livey support.
            </p>
          </section>
        ) : (
          <>
            {statusMessage ? (
              <p className="venue-dashboard-success">{statusMessage}</p>
            ) : null}

            {errorMessage ? (
              <p className="venue-dashboard-error">{errorMessage}</p>
            ) : null}

            {activeSection === "home" ? (
              <VenueDashboardHome
                activeVenue={activeVenue}
                activeEvents={activeEvents}
                liveEventCount={liveEventCount}
                visibleEventCount={visibleEventCount}
                historyEventCount={historyEvents.length}
                isCreatingEvent={isCreatingEvent}
                onCreateEvent={handleCreateEvent}
                onSelectEvent={handleSelectEvent}
                onSectionChange={setActiveSection}
              />
            ) : null}

            {activeSection === "activity" ? (
              <VenueDashboardActivity
                activeEvents={activeEvents}
                editingEvent={editingEvent}
                isCreatingEvent={isCreatingEvent}
                isSaving={isSaving}
                isDeletingEvent={isDeletingEvent}
                statusMessage={statusMessage}
                errorMessage={errorMessage}
                onCreateEvent={handleCreateEvent}
                onDeleteEvent={handleDeleteEvent}
                onSaveEvent={handleSaveEvent}
                onSelectEvent={handleSelectEvent}
                onEditingEventChange={setEditingEvent}
                getPreviewTiming={getPreviewTiming}
              />
            ) : null}

            {activeSection === "analytics" ? (
              <VenueDashboardComingSoon
                title="Analytics"
                description="Later this will show profile views, activity taps, map impressions, and venue performance."
              />
            ) : null}

            {activeSection === "history" ? (
              <VenueDashboardHistory
                historyEvents={historyEvents}
                isRestoringEvent={isRestoringEvent}
                onRestoreEvent={handleRestoreEvent}
              />
            ) : null}

            {activeSection === "settings" ? (
              <VenueDashboardSettings
                activeVenue={activeVenue}
                isRefreshing={isRefreshing}
                onRefreshDashboard={handleRefreshDashboard}
                onSectionChange={setActiveSection}
                onSignOut={handleSignOut}
              />
            ) : null}

            {activeSection === "account" ? (
              <VenueDashboardAccount
  currentUser={currentUser}
  activeVenue={activeVenue}
  isUpdatingVenueProfile={isUpdatingVenueProfile}
  onUpdateVenueProfile={handleUpdateVenueProfile}
  onSignOut={handleSignOut}
/>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

function getSectionTitle(section: DashboardSection) {
  if (section === "home") return "Control Center";
  if (section === "activity") return "Activity";
  if (section === "analytics") return "Analytics";
  if (section === "history") return "History";
  if (section === "settings") return "Settings";
  return "Account";
}

function mapEventToEditingState(
  event: VenueDashboardEvent
): EditingEventState {
  return {
    id: event.id,
    title: event.title || "",
    description: event.description || "",
    status: event.status,
    displayTime: event.display_time || "",
    startsAt: toDateTimeLocalValue(event.starts_at),
    endsAt: toDateTimeLocalValue(event.ends_at),
    isActive: event.is_active !== false,
  };
}

function isEventInHistory(event: VenueDashboardEvent) {
  if (event.deleted_at) return true;

  if (!event.ends_at) return false;

  return new Date(event.ends_at).getTime() < Date.now();
}

function toDateTimeLocalValue(isoValue: string | null) {
  if (!isoValue) return "";

  const date = new Date(isoValue);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - timezoneOffsetMs);

  return localDate.toISOString().slice(0, 16);
}

function getPreviewTiming(startsAtValue: string, endsAtValue: string) {
  if (!startsAtValue || !endsAtValue) {
    return {
      status: "Scheduled" as VenueActivityStatus,
      displayTime: "Choose start and end time",
    };
  }

  const startsAt = new Date(startsAtValue);
  const endsAt = new Date(endsAtValue);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return {
      status: "Scheduled" as VenueActivityStatus,
      displayTime: "Choose start and end time",
    };
  }

  if (endsAt <= startsAt) {
    return {
      status: "Scheduled" as VenueActivityStatus,
      displayTime: "End time must be after start time",
    };
  }

  const now = new Date();
  const isLive = now >= startsAt && now <= endsAt;

  if (isLive) {
    return {
      status: "Live now" as VenueActivityStatus,
      displayTime: `Live now · until ${formatTime(endsAt)}`,
    };
  }

  if (isSameDay(startsAt, now)) {
    if (startsAt.getHours() >= 17) {
      return {
        status: "Tonight" as VenueActivityStatus,
        displayTime: `Tonight · ${formatTime(startsAt)}–${formatTime(endsAt)}`,
      };
    }

    return {
      status: "Open now" as VenueActivityStatus,
      displayTime: `Today · ${formatTime(startsAt)}–${formatTime(endsAt)}`,
    };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (isSameDay(startsAt, tomorrow)) {
    return {
      status: "Tomorrow" as VenueActivityStatus,
      displayTime: `Tomorrow · ${formatTime(startsAt)}–${formatTime(endsAt)}`,
    };
  }

  if (isWeekend(startsAt)) {
    return {
      status: "Weekend" as VenueActivityStatus,
      displayTime: `${formatWeekday(startsAt)} · ${formatTime(
        startsAt
      )}–${formatTime(endsAt)}`,
    };
  }

  return {
    status: "Scheduled" as VenueActivityStatus,
    displayTime: `${formatShortDate(startsAt)} · ${formatTime(
      startsAt
    )}–${formatTime(endsAt)}`,
  };
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
}