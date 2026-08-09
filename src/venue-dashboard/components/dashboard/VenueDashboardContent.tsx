import type {
  User,
} from "@supabase/supabase-js";
import type {
  DashboardSection,
} from "../../VenueDashboardSidebar";
import type {
  VenueDashboardAnalytics as VenueDashboardAnalyticsData,
  VenueDashboardEvent,
  VenueDashboardVenue,
} from "../../venueDashboardService";
import type {
  EditingEventState,
} from "../../tabs/VenueDashboardActivity";
import type {
  HistoryReuseMode,
} from "../history/VenueDashboardHistoryReuseAction";
import type {
  EditableProfileFocusTarget,
} from "../../tabs/analytics/AnalyticsProfileHealthModal";
import {
  VenueDashboardActivity,
} from "../../tabs/VenueDashboardActivity";
import {
  VenueDashboardAnalytics,
} from "../../tabs/VenueDashboardAnalytics";
import {
  VenueDashboardHistory,
} from "../../tabs/VenueDashboardHistory";
import {
  VenueDashboardHome,
} from "../../tabs/VenueDashboardHome";
import {
  VenueDashboardAccount,
} from "../../tabs/VenueDashboardAccount";
import {
  VenueDashboardActivityCreateCard,
} from "../activity/VenueDashboardActivityCreateCard";

type VenueDashboardContentProps = {
  activeSection: DashboardSection;

  isLoading: boolean;

  hasVenues: boolean;

  activeVenue: VenueDashboardVenue | null;

  currentUser: User | null;

  activeEvents: VenueDashboardEvent[];

  historyEvents: VenueDashboardEvent[];

  allVenueEvents: VenueDashboardEvent[];

  liveEventCount: number;

  visibleEventCount: number;

  analytics: VenueDashboardAnalyticsData | null;

  editingEvent: EditingEventState | null;

  isActivityReusePanelOpen: boolean;

  isSaving: boolean;

  isDeletingEvent: boolean;

  updatingVisibilityEventId: string | null;

  isRefreshing: boolean;

  isUpdatingVenueProfile: boolean;

  accountSettingsFocusTarget:
    | EditableProfileFocusTarget
    | null;

  onCreateEvent: () => void;

  onSelectEvent: (
    event: VenueDashboardEvent
  ) => void;

  onSectionChange: (
    section: DashboardSection
  ) => void;

  onToggleVisibility: (
    event: VenueDashboardEvent
  ) => void;

  onCloseActivityReusePanel: () => void;

  onUsePreviousActivity: (
    event: VenueDashboardEvent
  ) => void;

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
    status: EditingEventState["status"];
    displayTime: string;
  };

  onRefreshDashboard: () => void;

  onOpenAccountSettings: (
    target: EditableProfileFocusTarget
  ) => void;

  onReuseHistoryEvent: (
    event: VenueDashboardEvent,
    mode: HistoryReuseMode
  ) => void;

  onFocusTargetHandled: () => void;

  onUpdateVenueProfile: (
    input: {
      name: string;
      description: string;
      area: string;
      address: string;
      openStatus: string;
      openingHours: string;
      logoFile: File | null;
    }
  ) => Promise<void>;

  onSignOut: () => Promise<void>;
};

export function VenueDashboardContent({
  activeSection,
  isLoading,
  hasVenues,
  activeVenue,
  currentUser,
  activeEvents,
  historyEvents,
  allVenueEvents,
  liveEventCount,
  visibleEventCount,
  analytics,
  editingEvent,
  isActivityReusePanelOpen,
  isSaving,
  isDeletingEvent,
  updatingVisibilityEventId,
  isRefreshing,
  isUpdatingVenueProfile,
  accountSettingsFocusTarget,
  onCreateEvent,
  onSelectEvent,
  onSectionChange,
  onToggleVisibility,
  onCloseActivityReusePanel,
  onUsePreviousActivity,
  onCancelEditing,
  onDeleteEvent,
  onSaveEvent,
  onEditingEventChange,
  getPreviewTiming,
  onRefreshDashboard,
  onOpenAccountSettings,
  onReuseHistoryEvent,
  onFocusTargetHandled,
  onUpdateVenueProfile,
  onSignOut,
}: VenueDashboardContentProps) {
  return (
    <>
      {activeSection === "activity" &&
      !editingEvent &&
      !isActivityReusePanelOpen &&
      !isLoading &&
      hasVenues ? (
        <VenueDashboardActivityCreateCard
          onCreateEvent={
            onCreateEvent
          }
        />
      ) : null}

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
              analytics={analytics}
              onCreateEvent={
                onCreateEvent
              }
              onSelectEvent={
                onSelectEvent
              }
              onSectionChange={
                onSectionChange
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
                updatingVisibilityEventId !==
                null
              }
              updatingVisibilityEventId={
                updatingVisibilityEventId
              }
              onToggleVisibility={
                onToggleVisibility
              }
              onCreateEvent={
                onCreateEvent
              }
              onCloseReusePanel={
                onCloseActivityReusePanel
              }
              onOpenHistory={() =>
                onSectionChange(
                  "history"
                )
              }
              onUsePreviousActivity={
                onUsePreviousActivity
              }
              onCancelEditing={
                onCancelEditing
              }
              onDeleteEvent={
                onDeleteEvent
              }
              onSaveEvent={
                onSaveEvent
              }
              onSelectEvent={
                onSelectEvent
              }
              onEditingEventChange={
                onEditingEventChange
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
                onRefreshDashboard
              }
              onOpenAccountSettings={
                onOpenAccountSettings
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
              onReuseEvent={
                onReuseHistoryEvent
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
              onFocusTargetHandled={
                onFocusTargetHandled
              }
              onRefreshDashboard={
                onRefreshDashboard
              }
              onSectionChange={
                onSectionChange
              }
              onUpdateVenueProfile={
                onUpdateVenueProfile
              }
              onSignOut={onSignOut}
            />
          ) : null}
        </>
      )}
    </>
  );
}