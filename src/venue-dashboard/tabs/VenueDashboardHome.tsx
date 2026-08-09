import type {
  VenueDashboardAnalytics,
  VenueDashboardEvent,
  VenueDashboardVenue,
} from "../venueDashboardService";
import type { DashboardSection } from "../VenueDashboardSidebar";
import { VenueDashboardHomeHero } from "./home/VenueDashboardHomeHero";
import { VenueDashboardHomeMetrics } from "./home/VenueDashboardHomeMetrics";
import { VenueDashboardHomeCurrentActivity } from "./home/VenueDashboardHomeCurrentActivity";
import { VenueDashboardHomeFollowerSnapshot } from "./home/VenueDashboardHomeFollowerSnapshot";
import { VenueDashboardHomeQuickActions } from "./home/VenueDashboardHomeQuickActions";
import { VenueDashboardHomeStatus } from "./home/VenueDashboardHomeStatus";
import { VenueDashboardHomeHistorySnapshot } from "./home/VenueDashboardHomeHistorySnapshot";

type VenueDashboardHomeProps = {
  activeVenue: VenueDashboardVenue | null;
  activeEvents: VenueDashboardEvent[];
  liveEventCount: number;
  visibleEventCount: number;
  historyEventCount: number;
  analytics: VenueDashboardAnalytics | null;
  onCreateEvent: () => void;
  onSelectEvent: (event: VenueDashboardEvent) => void;
  onSectionChange: (section: DashboardSection) => void;
};

export function VenueDashboardHome({
  activeVenue,
  activeEvents,
  liveEventCount,
  visibleEventCount,
  historyEventCount,
  analytics,
  onCreateEvent,
  onSelectEvent,
  onSectionChange,
}: VenueDashboardHomeProps) {
  const currentActivity =
    analytics?.currentLiveActivity ??
    analytics?.nextActivity ??
    activeEvents[0] ??
    null;

  const resolvedLiveEventCount =
    analytics?.liveNowActivities ??
    liveEventCount;

  const resolvedVisibleEventCount =
    analytics?.visibleActivities ??
    visibleEventCount;

  const resolvedHistoryEventCount =
    analytics?.historyActivities ??
    historyEventCount;

  const totalFollowers =
    analytics?.totalFollowers ?? 0;

  const newFollowersLast7Days =
    analytics?.newFollowersLast7Days ?? 0;

  const profileCompleteness =
    analytics?.profileCompleteness ?? 0;

  const isFollowerAnalyticsLoading =
    analytics?.isFollowerAnalyticsLoading === true;

  const followerAnalyticsError =
    analytics?.followerAnalyticsError || null;

  return (
    <section className="venue-dashboard-home">
      <VenueDashboardHomeHero
        activeVenue={activeVenue}
      />

      <VenueDashboardHomeMetrics
        totalFollowers={totalFollowers}
        newFollowersLast7Days={
          newFollowersLast7Days
        }
        liveEventCount={
          resolvedLiveEventCount
        }
        visibleEventCount={
          resolvedVisibleEventCount
        }
        historyEventCount={
          resolvedHistoryEventCount
        }
        isFollowerAnalyticsLoading={
          isFollowerAnalyticsLoading
        }
        followerAnalyticsError={
          followerAnalyticsError
        }
        onSectionChange={onSectionChange}
      />

      <section className="venue-dashboard-home-primary-grid">
        <VenueDashboardHomeCurrentActivity
          currentActivity={currentActivity}
          onCreateEvent={onCreateEvent}
          onSelectEvent={onSelectEvent}
          onManageActivity={() =>
            onSectionChange("activity")
          }
        />

        <VenueDashboardHomeFollowerSnapshot
          totalFollowers={totalFollowers}
          newFollowersLast7Days={
            newFollowersLast7Days
          }
          isFollowerAnalyticsLoading={
            isFollowerAnalyticsLoading
          }
          followerAnalyticsError={
            followerAnalyticsError
          }
          onOpenAnalytics={() =>
            onSectionChange("analytics")
          }
        />
      </section>

      <VenueDashboardHomeQuickActions
        onCreateEvent={onCreateEvent}
        onSectionChange={onSectionChange}
      />

      <section className="venue-dashboard-home-secondary-grid">
        <VenueDashboardHomeStatus
          profileCompleteness={
            profileCompleteness
          }
          visibleEventCount={
            resolvedVisibleEventCount
          }
          liveEventCount={
            resolvedLiveEventCount
          }
          onManageActivity={() =>
            onSectionChange("activity")
          }
        />

        <VenueDashboardHomeHistorySnapshot
          historyEventCount={
            resolvedHistoryEventCount
          }
          onOpenHistory={() =>
            onSectionChange("history")
          }
        />
      </section>
    </section>
  );
}