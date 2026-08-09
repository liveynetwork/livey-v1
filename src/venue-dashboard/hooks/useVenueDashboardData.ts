import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  User,
} from "@supabase/supabase-js";
import {
  buildVenueDashboardAnalytics,
  getVenueDashboardData,
  type VenueDashboardData,
} from "../venueDashboardService";
import {
  dashboardSupabase,
} from "../../lib/dashboardSupabase";
import {
  isEventInHistory,
} from "../utils/venueDashboardEventUtils";

type UseVenueDashboardDataOptions = {
  onReady?: () => void;

  recoverVenueClaim: (
    user: User
  ) => Promise<boolean>;

  onErrorMessage: (
    message: string
  ) => void;
};

export function useVenueDashboardData({
  onReady,
  recoverVenueClaim,
  onErrorMessage,
}: UseVenueDashboardDataOptions) {
  const [
    dashboardData,
    setDashboardData,
  ] = useState<VenueDashboardData[]>(
    []
  );

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(
    null
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const hasVenues =
    dashboardData.length > 0;

  const activeVenue = useMemo(() => {
    return (
      dashboardData[0]?.venue ??
      null
    );
  }, [dashboardData]);

  const activeVenueId =
    activeVenue?.id ?? null;

  const allVenueEvents = useMemo(() => {
    return (
      dashboardData[0]?.events ??
      []
    );
  }, [dashboardData]);

  const activeEvents = useMemo(() => {
    return allVenueEvents.filter(
      (event) =>
        !isEventInHistory(event)
    );
  }, [allVenueEvents]);

  const historyEvents = useMemo(() => {
    return allVenueEvents.filter(
      (event) =>
        isEventInHistory(event)
    );
  }, [allVenueEvents]);

  const liveEventCount = useMemo(() => {
    return activeEvents.filter(
      (event) =>
        event.status === "Live now" &&
        event.is_active !== false
    ).length;
  }, [activeEvents]);

  const visibleEventCount = useMemo(() => {
    return activeEvents.filter(
      (event) =>
        event.is_active !== false
    ).length;
  }, [activeEvents]);

  const baseAnalytics = useMemo(() => {
    if (!activeVenue) {
      return null;
    }

    return buildVenueDashboardAnalytics(
      activeVenue,
      allVenueEvents
    );
  }, [
    activeVenue,
    allVenueEvents,
  ]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        onErrorMessage("");

        const {
          data: { user },
          error: userError,
        } =
          await dashboardSupabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!isMounted) {
          return;
        }

        setCurrentUser(user);

        let data =
          await getVenueDashboardData();

        if (
          data.length === 0 &&
          user
        ) {
          const didRecoverClaim =
            await recoverVenueClaim(
              user
            );

          if (didRecoverClaim) {
            data =
              await getVenueDashboardData();
          }
        }

        if (!isMounted) {
          return;
        }

        setDashboardData(data);
      } catch (error) {
        console.error(
          "Failed to load venue dashboard:",
          error
        );

        if (!isMounted) {
          return;
        }

        onErrorMessage(
          "We could not load your venue dashboard. Please try again."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
          onReady?.();
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [
    onReady,
    recoverVenueClaim,
    onErrorMessage,
  ]);

  async function refreshDashboardData() {
    const freshData =
      await getVenueDashboardData();

    setDashboardData(
      freshData
    );

    return freshData;
  }

  return {
    dashboardData,

    currentUser,

    isLoading,

    hasVenues,

    activeVenue,

    activeVenueId,

    allVenueEvents,

    activeEvents,

    historyEvents,

    liveEventCount,

    visibleEventCount,

    baseAnalytics,

    refreshDashboardData,
  };
}