import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { LiveyDashboardLoader } from "./venue-dashboard/components/LiveyDashboardLoader";
import type { User } from "@supabase/supabase-js";
import { LiveyBottomNav, type LiveyTab } from "./components/LiveyBottomNav";
import { MapScreen } from "./screens/MapScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { AuthScreen } from "./screens/AuthScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { VenueSignupScreen } from "./venue-signup/VenueSignupScreen";
import { VenueDashboardAuthScreen } from "./venue-dashboard/VenueDashboardAuthScreen";
import { VenueDashboardScreen } from "./venue-dashboard/VenueDashboardScreen";
import { supabase } from "./lib/supabase";
import { dashboardSupabase } from "./lib/dashboardSupabase";
import { fetchCurrentUserProfile } from "./services/profile";

function App() {
  const [activeTab, setActiveTab] = useState<LiveyTab>("map");
  const [isVenueSheetOpen, setIsVenueSheetOpen] = useState(false);
  const [venueToOpenId, setVenueToOpenId] = useState<string | null>(null);

  const [pathname, setPathname] = useState(() => window.location.pathname);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [dashboardUser, setDashboardUser] = useState<User | null>(null);
  const [dashboardAuthLoading, setDashboardAuthLoading] = useState(true);

  const [dashboardReady, setDashboardReady] =
  useState(false);

  const handleDashboardReady = useCallback(() => {
  setDashboardReady(true);
}, []);

  const [profileLoading, setProfileLoading] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    function handleRouteChange() {
      setPathname(window.location.pathname);
    }

    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Failed to load Livey user:", error);
      }

      if (isMounted) {
        setUser(currentUser);
        setAuthLoading(false);

        if (!currentUser) {
          setOnboardingCompleted(null);
        }
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      setOnboardingCompleted(null);

      if (!session?.user) {
        setActiveTab("map");
        setIsVenueSheetOpen(false);
        setVenueToOpenId(null);
      }
    });

    function handleAuthChanged() {
      loadUser();
    }

    window.addEventListener("livey:auth-changed", handleAuthChanged);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("livey:auth-changed", handleAuthChanged);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardUser() {
      const {
        data: { user: currentDashboardUser },
        error,
      } = await dashboardSupabase.auth.getUser();

      if (error) {
        console.error("Failed to load Livey dashboard user:", error);
      }

      if (isMounted) {
        setDashboardUser(currentDashboardUser);
        setDashboardAuthLoading(false);
      }
    }

    loadDashboardUser();

    const {
      data: { subscription },
    } = dashboardSupabase.auth.onAuthStateChange(
  (event, session) => {
    const nextDashboardUser =
      session?.user ?? null;

    setDashboardUser(nextDashboardUser);
    setDashboardAuthLoading(false);

    if (
      event === "SIGNED_IN" ||
      !nextDashboardUser
    ) {
      setDashboardReady(false);
    }
  }
);

    function handleDashboardAuthChanged() {
  loadDashboardUser();
}

    window.addEventListener("livey:auth-changed", handleDashboardAuthChanged);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener(
        "livey:auth-changed",
        handleDashboardAuthChanged
      );
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      setOnboardingCompleted(null);
      return;
    }

    let isMounted = true;

    async function loadProfileState() {
      setProfileLoading(true);

      try {
        const data = await fetchCurrentUserProfile();

        if (isMounted) {
          setOnboardingCompleted(Boolean(data.profile?.onboarding_completed));
        }
      } catch (error) {
        console.error("Failed to load Livey profile state:", error);

        if (isMounted) {
          setOnboardingCompleted(false);
        }
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    }

    function handleOnboardingCompleted() {
      setOnboardingCompleted(true);
    }

    loadProfileState();

    window.addEventListener(
      "livey:onboarding-completed",
      handleOnboardingCompleted
    );

    return () => {
      isMounted = false;

      window.removeEventListener(
        "livey:onboarding-completed",
        handleOnboardingCompleted
      );
    };
  }, [user]);

  if (pathname === "/venues" || pathname === "/livey-for-venues") {
    return <VenueSignupScreen />;
  }

  if (pathname === "/venue-dashboard") {
    if (dashboardAuthLoading) {
      return (
        <main className="venue-dashboard-auth-page">
          <section
            className="venue-dashboard-auth-card"
            aria-label="Loading Livey venue dashboard"
          >
            <div className="venue-dashboard-auth-logo-wrap">
              <img src="/Livey-Logo.png" alt="Livey" />
            </div>

            <div className="venue-dashboard-auth-copy">
              <p>Livey for venues</p>
              <h1>Loading your dashboard.</h1>
            </div>
          </section>
        </main>
      );
    }

    if (!dashboardUser) {
      return <VenueDashboardAuthScreen />;
    }

    return (
  <>
    <VenueDashboardScreen
      onReady={handleDashboardReady}
    />

    <LiveyDashboardLoader
      isReady={dashboardReady}
    />
  </>
);
  }

  if (authLoading || (user && (profileLoading || onboardingCompleted === null))) {
    return (
      <main className="livey-auth-screen">
        <section className="livey-auth-card" aria-label="Loading Livey">
          <img className="livey-auth-logo" src="/Livey-Logo.png" alt="Livey" />

          <div className="livey-auth-copy">
            <h1>Loading your Livey.</h1>
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!onboardingCompleted) {
    return (
      <OnboardingScreen
        onComplete={() => {
          setOnboardingCompleted(true);
        }}
      />
    );
  }

  return (
    <>
      {activeTab === "map" ? (
        <MapScreen
          onVenueSheetOpenChange={setIsVenueSheetOpen}
          venueToOpenId={venueToOpenId}
          onVenueOpened={() => setVenueToOpenId(null)}
        />
      ) : (
        <ProfileScreen
          onOpenVenue={(venueId) => {
            setVenueToOpenId(venueId);
            setActiveTab("map");
          }}
        />
      )}

      <LiveyBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hidden={activeTab === "map" && isVenueSheetOpen}
      />
    </>
  );
}

export default App;