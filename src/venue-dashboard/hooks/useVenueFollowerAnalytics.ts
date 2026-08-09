import {
  useEffect,
  useState,
} from "react";
import type {
  DashboardSection,
} from "../VenueDashboardSidebar";
import {
  getVenueFollowerAnalytics,
  type VenueFollowerAnalytics,
} from "../venueDashboardService";

type UseVenueFollowerAnalyticsOptions = {
  activeVenueId: string | null;
  activeSection: DashboardSection;
};

export function useVenueFollowerAnalytics({
  activeVenueId,
  activeSection,
}: UseVenueFollowerAnalyticsOptions) {
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

  useEffect(() => {
    if (!activeVenueId) {
      setFollowerAnalytics(null);
      setFollowerAnalyticsError("");
      setIsFollowerAnalyticsLoading(false);
      return;
    }

    const venueId = activeVenueId;

    if (
      activeSection !== "home" &&
      activeSection !== "analytics"
    ) {
      return;
    }

    let isMounted = true;

    async function loadFollowerAnalytics() {
      try {
        setIsFollowerAnalyticsLoading(true);
        setFollowerAnalyticsError("");

        const data =
  await getVenueFollowerAnalytics(
    venueId
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

    void loadFollowerAnalytics();

    return () => {
      isMounted = false;
    };
  }, [
    activeSection,
    activeVenueId,
  ]);

  async function refreshFollowerAnalytics() {
    if (!activeVenueId) {
      return null;
    }

    try {
      setIsFollowerAnalyticsLoading(true);
      setFollowerAnalyticsError("");

      const data =
        await getVenueFollowerAnalytics(
          activeVenueId
        );

      setFollowerAnalytics(data);

      return data;
    } catch (error) {
      console.error(
        "Failed to refresh venue follower analytics:",
        error
      );

      setFollowerAnalyticsError(
        "Follower analytics could not be refreshed right now."
      );

      return null;
    } finally {
      setIsFollowerAnalyticsLoading(false);
    }
  }

  return {
    followerAnalytics,
    isFollowerAnalyticsLoading,
    followerAnalyticsError,
    refreshFollowerAnalytics,
  };
}