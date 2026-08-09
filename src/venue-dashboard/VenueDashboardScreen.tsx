import {
  useCallback,
  useMemo,
  useState,
} from "react";
import type {
  User,
} from "@supabase/supabase-js";
import {
  updateVenueProfile,
} from "./venueDashboardService";
import {
  dashboardSupabase,
} from "../lib/dashboardSupabase";
import {
  VenueDashboardSidebar,
  type DashboardSection,
} from "./VenueDashboardSidebar";
import {
  getPreviewTiming,
} from "./utils/venueDashboardTimingUtils";
import {
  useVenueDashboardData,
} from "./hooks/useVenueDashboardData";
import {
  useVenueFollowerAnalytics,
} from "./hooks/useVenueFollowerAnalytics";
import {
  useVenueActivityEditor,
} from "./hooks/useVenueActivityEditor";
import {
  useVenueDashboardNavigation,
} from "./hooks/useVenueDashboardNavigation";
import {
  VenueDashboardContent,
} from "./components/dashboard/VenueDashboardContent";
import {
  VenueDashboardModals,
} from "./components/dashboard/VenueDashboardModals";
import {
  LiveyToast,
} from "./components/LiveyToast";
import type {
  EditableProfileFocusTarget,
} from "./tabs/analytics/AnalyticsProfileHealthModal";
import "./VenueDashboardScreen.css";

type VenueDashboardScreenProps = {
  onReady?: () => void;
};

export function VenueDashboardScreen({
  onReady,
}: VenueDashboardScreenProps) {
  const [
    activeSection,
    setActiveSection,
  ] = useState<DashboardSection>(
    "home"
  );

  const [
    accountSettingsFocusTarget,
    setAccountSettingsFocusTarget,
  ] = useState<
    EditableProfileFocusTarget | null
  >(null);

  const [
    isUpdatingVenueProfile,
    setIsUpdatingVenueProfile,
  ] = useState(false);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    statusMessage,
    setStatusMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const recoverVenueClaim =
    useCallback(
      async (user: User) => {
        const metadataClaimCode =
          typeof user.user_metadata
            ?.pending_venue_claim_code ===
          "string"
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
      },
      []
    );

  const dashboard =
    useVenueDashboardData({
      onReady,
      recoverVenueClaim,
      onErrorMessage:
        setErrorMessage,
    });

  const followerAnalyticsState =
    useVenueFollowerAnalytics({
      activeVenueId:
        dashboard.activeVenueId,
      activeSection,
    });

  const analytics = useMemo(() => {
    if (!dashboard.baseAnalytics) {
      return null;
    }

    const followerAnalytics =
      followerAnalyticsState
        .followerAnalytics;

    return {
      ...dashboard.baseAnalytics,

      totalFollowers:
        followerAnalytics
          ?.totalFollowers ?? 0,

      newFollowersLast7Days:
        followerAnalytics
          ?.newFollowersLast7Days ?? 0,

      newFollowersLast30Days:
        followerAnalytics
          ?.newFollowersLast30Days ?? 0,

      followerGrowthLast30Days:
        followerAnalytics
          ?.followerGrowthLast30Days ??
        [],

      followerGrowthRanges:
        followerAnalytics
          ?.followerGrowthRanges ?? {
          last14Days: [],
          lastMonth: [],
          last6Months: [],
          lastYear: [],
        },

      followerActivityRanges:
        followerAnalytics
          ?.followerActivityRanges ?? {
          today: [],
          last14Days: [],
          lastMonth: [],
          last6Months: [],
          lastYear: [],
        },

      followerAnalyticsGeneratedAt:
        followerAnalytics
          ?.generatedAt ?? null,

      isFollowerAnalyticsLoading:
        followerAnalyticsState
          .isFollowerAnalyticsLoading,

      followerAnalyticsError:
        followerAnalyticsState
          .followerAnalyticsError,
    };
  }, [
    dashboard.baseAnalytics,
    followerAnalyticsState
      .followerAnalytics,
    followerAnalyticsState
      .isFollowerAnalyticsLoading,
    followerAnalyticsState
      .followerAnalyticsError,
  ]);

  const activityEditor =
    useVenueActivityEditor({
      activeVenue:
        dashboard.activeVenue,

      refreshDashboardData:
        dashboard.refreshDashboardData,

      onOpenActivitySection: () => {
        setActiveSection(
          "activity"
        );
      },

      onStatusMessage:
        setStatusMessage,

      onErrorMessage:
        setErrorMessage,
    });

  async function handleRefreshDashboard() {
    try {
      setIsRefreshing(true);
      setStatusMessage("");
      setErrorMessage("");

      const freshData =
        await dashboard
          .refreshDashboardData();

      activityEditor
        .restoreEditingEventFromData(
          freshData
        );

      if (
        (activeSection === "home" ||
          activeSection ===
            "analytics") &&
        dashboard.activeVenueId
      ) {
        await followerAnalyticsState
          .refreshFollowerAnalytics();
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

  const navigation =
    useVenueDashboardNavigation({
      activeSection,
      setActiveSection,

      editingEvent:
        activityEditor.editingEvent,

      hasUnsavedActivityChanges:
        activityEditor
          .hasUnsavedActivityChanges,

      onCloseActivityEditor:
        activityEditor
          .closeActivityEditor,

      onCloseActivityReusePanel:
        activityEditor
          .closeActivityReusePanel,

      onCreateEvent:
        activityEditor
          .handleCreateEvent,

      onCreateLiveNowEvent:
        activityEditor
          .handleCreateLiveNowEvent,

      onSelectEvent:
        activityEditor
          .handleSelectEvent,

      onRefreshDashboard: () => {
        void handleRefreshDashboard();
      },

      onHistoryReuse:
        activityEditor
          .handleHistoryReuse,
    });

  function handleDismissToast() {
    setStatusMessage("");
    setErrorMessage("");
  }

  function handleOpenAccountSettings(
    target: EditableProfileFocusTarget
  ) {
    setAccountSettingsFocusTarget(
      target
    );

    navigation.requestSectionChange(
      "account"
    );
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
    if (!dashboard.activeVenue) {
      return;
    }

    try {
      setIsUpdatingVenueProfile(
        true
      );

      setStatusMessage("");
      setErrorMessage("");

      await updateVenueProfile({
        venueId:
          dashboard.activeVenue.id,
        name:
          input.name,
        description:
          input.description,
        area:
          input.area,
        address:
          input.address,
        openStatus:
          input.openStatus,
        openingHours:
          input.openingHours,
        logoFile:
          input.logoFile,
      });

      await dashboard
        .refreshDashboardData();

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
      setIsUpdatingVenueProfile(
        false
      );
    }
  }

  async function handleSignOut() {
    try {
      await dashboardSupabase
        .auth
        .signOut();

      window.dispatchEvent(
        new Event(
          "livey:auth-changed"
        )
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
          dashboard.activeVenue?.name ||
          "Venue owner"
        }
        venueLogoUrl={
          dashboard.activeVenue
            ?.logo_url || null
        }
        onSectionChange={
          navigation
            .requestSectionChange
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

        <VenueDashboardContent
          activeSection={
            activeSection
          }
          isLoading={
            dashboard.isLoading
          }
          hasVenues={
            dashboard.hasVenues
          }
          activeVenue={
            dashboard.activeVenue
          }
          currentUser={
            dashboard.currentUser
          }
          activeEvents={
            dashboard.activeEvents
          }
          historyEvents={
            dashboard.historyEvents
          }
          allVenueEvents={
            dashboard.allVenueEvents
          }
          liveEventCount={
            dashboard.liveEventCount
          }
          visibleEventCount={
            dashboard.visibleEventCount
          }
          analytics={analytics}
          editingEvent={
            activityEditor.editingEvent
          }
          isActivityReusePanelOpen={
            activityEditor
              .isActivityReusePanelOpen
          }
          isSaving={
            activityEditor.isSaving
          }
          isDeletingEvent={
            activityEditor
              .isDeletingEvent
          }
          updatingVisibilityEventId={
            activityEditor
              .updatingVisibilityEventId
          }
          isRefreshing={
            isRefreshing
          }
          isUpdatingVenueProfile={
            isUpdatingVenueProfile
          }
          accountSettingsFocusTarget={
            accountSettingsFocusTarget
          }
          onCreateEvent={
            navigation
              .requestCreateEvent
          }
          onSelectEvent={
            navigation
              .requestSelectEvent
          }
          onSectionChange={
            navigation
              .requestSectionChange
          }
          onToggleVisibility={
            activityEditor
              .requestToggleEventVisibility
          }
          onCloseActivityReusePanel={
            activityEditor
              .closeActivityReusePanel
          }
          onUsePreviousActivity={
            activityEditor
              .handleUsePreviousActivity
          }
          onCancelEditing={
            navigation
              .requestCancelEditing
          }
          onDeleteEvent={
            activityEditor
              .handleDeleteEvent
          }
          onSaveEvent={
            activityEditor
              .handleSaveEvent
          }
          onEditingEventChange={
            activityEditor
              .setEditingEvent
          }
          getPreviewTiming={
            getPreviewTiming
          }
          onRefreshDashboard={
            navigation
              .requestRefreshDashboard
          }
          onOpenAccountSettings={
            handleOpenAccountSettings
          }
          onReuseHistoryEvent={
            navigation
              .requestHistoryReuse
          }
          onFocusTargetHandled={() =>
            setAccountSettingsFocusTarget(
              null
            )
          }
          onUpdateVenueProfile={
            handleUpdateVenueProfile
          }
          onSignOut={
            handleSignOut
          }
        />
      </section>

      {errorMessage ? (
        <LiveyToast
          key={`error-${errorMessage}`}
          tone="error"
          message={errorMessage}
          onDismiss={
            handleDismissToast
          }
        />
      ) : statusMessage ? (
        <LiveyToast
          key={`success-${statusMessage}`}
          tone="success"
          message={statusMessage}
          onDismiss={
            handleDismissToast
          }
        />
      ) : null}

      <VenueDashboardModals
        visibilityEventToConfirm={
          activityEditor
            .visibilityEventToConfirm
        }
        updatingVisibilityEventId={
          activityEditor
            .updatingVisibilityEventId
        }
        onCancelVisibilityChange={
          activityEditor
            .handleCancelVisibilityChange
        }
        onConfirmHideActivity={
          activityEditor
            .handleConfirmHideActivity
        }
        isRemoveActivityModalOpen={
          activityEditor
            .isRemoveActivityModalOpen
        }
        editingEvent={
          activityEditor.editingEvent
        }
        isDeletingEvent={
          activityEditor
            .isDeletingEvent
        }
        onCancelDeleteEvent={
          activityEditor
            .handleCancelDeleteEvent
        }
        onConfirmDeleteEvent={
          activityEditor
            .handleConfirmDeleteEvent
        }
        isDiscardChangesModalOpen={
          navigation
            .isDiscardChangesModalOpen
        }
        discardChangesConfirmation={
          navigation
            .discardChangesConfirmation
        }
        onCancelDiscardChanges={
          navigation
            .handleCancelDiscardActivityChanges
        }
        onConfirmDiscardChanges={
          navigation
            .handleConfirmDiscardActivityChanges
        }
      />
    </main>
  );
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