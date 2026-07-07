import { useEffect, useState } from "react";
import { LiveySettingsPanel } from "../components/LiveySettingsPanel";
import {
  fetchCurrentUserProfile,
  type LiveyProfileData,
} from "../services/profile";
import "./ProfileScreen.css";

type ProfileScreenProps = {
  onOpenVenue?: (venueId: string) => void;
};

export function ProfileScreen({ onOpenVenue }: ProfileScreenProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileData, setProfileData] = useState<LiveyProfileData | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const data = await fetchCurrentUserProfile();

        if (isMounted) {
          setProfileData(data);
        }
      } catch (error) {
        console.error("Failed to load Livey profile:", error);
      }
    }

    function handleVenueFollowsChanged() {
      loadProfile();
    }

    function handleUserProfileChanged() {
      loadProfile();
    }

    loadProfile();

    window.addEventListener(
      "livey:venue-follows-changed",
      handleVenueFollowsChanged
    );

    window.addEventListener(
      "livey:user-profile-changed",
      handleUserProfileChanged
    );

    return () => {
      isMounted = false;

      window.removeEventListener(
        "livey:venue-follows-changed",
        handleVenueFollowsChanged
      );

      window.removeEventListener(
        "livey:user-profile-changed",
        handleUserProfileChanged
      );
    };
  }, []);

  const profile = profileData?.profile;
  const settings = profileData?.settings;
  const followedVenues = profileData?.followedVenues ?? [];

  const displayName = profile?.display_name ?? "Mario";
  const username = profile?.username ? `@${profile.username}` : "@mario";
  const city = settings?.city ?? profile?.city ?? "Limassol";
  const avatarUrl = profile?.avatar_url ?? null;
  const friendsCount = profile?.friends_count ?? 0;
  const followingCount = followedVenues.length;

  return (
    <main className="livey-profile-screen">
      <div className="livey-profile-shell">
        <header className="livey-profile-header">
          <div className="livey-profile-brand">
            <img
              className="livey-profile-header-logo"
              src="/Livey-Logo.png"
              alt="Livey"
            />
          </div>

          <button
            className="livey-profile-settings-button"
            type="button"
            aria-label="Open settings"
            onClick={() => setSettingsOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 8.25A3.75 3.75 0 1 0 12 15.75A3.75 3.75 0 0 0 12 8.25ZM4.85 13.05a7.62 7.62 0 0 1 0-2.1L3.1 9.58a.72.72 0 0 1-.17-.91l1.65-2.86a.72.72 0 0 1 .85-.32l2.05.82a7.5 7.5 0 0 1 1.78-1.04l.31-2.17A.72.72 0 0 1 10.28 2.5h3.44a.72.72 0 0 1 .71.6l.31 2.17c.63.26 1.23.61 1.78 1.04l2.05-.82a.72.72 0 0 1 .85.32l1.65 2.86a.72.72 0 0 1-.17.91l-1.75 1.37a7.62 7.62 0 0 1 0 2.1l1.75 1.37a.72.72 0 0 1 .17.91l-1.65 2.86a.72.72 0 0 1-.85.32l-2.05-.82a7.5 7.5 0 0 1-1.78 1.04l-.31 2.17a.72.72 0 0 1-.71.6h-3.44a.72.72 0 0 1-.71-.6l-.31-2.17a7.5 7.5 0 0 1-1.78-1.04l-2.05.82a.72.72 0 0 1-.85-.32l-1.65-2.86a.72.72 0 0 1 .17-.91l1.75-1.37Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </header>

        <section className="livey-profile-hero" aria-label="Profile identity">
          <div className="livey-profile-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <span className="livey-profile-avatar-dot" />
            )}
          </div>

          <div className="livey-profile-identity-copy">
            <p className="livey-profile-kicker">Your profile</p>
            <h2>{displayName}</h2>
            <p className="livey-profile-username">{username}</p>

            <div className="livey-profile-city-pill">
              <span aria-hidden="true">●</span>
              {city}, Cyprus
            </div>
          </div>
        </section>

        <section className="livey-profile-stats" aria-label="Profile stats">
          <div className="livey-profile-stat">
            <strong>{friendsCount}</strong>
            <span>Friends</span>
          </div>

          <div className="livey-profile-stat">
            <strong>{followingCount}</strong>
            <span>Following</span>
          </div>
        </section>

        <section className="livey-profile-card">
          <div className="livey-profile-card-top">
            <div>
              <p className="livey-profile-card-kicker">Your places</p>
              <h3>Followed venues</h3>
            </div>

            <span className="livey-profile-count">{followingCount}</span>
          </div>

          {followedVenues.length > 0 ? (
            <div className="livey-followed-venues-list">
              {followedVenues.slice(0, 3).map((followedVenue) => {
                if (!followedVenue.venue) {
                  return null;
                }

                return (
                  <div
  className="livey-followed-venue-row"
  key={followedVenue.follow_id}
  role={followedVenue.venue ? "button" : undefined}
  tabIndex={followedVenue.venue ? 0 : -1}
  onClick={() => {
    if (!followedVenue.venue) return;

    onOpenVenue?.(followedVenue.venue.id);
  }}
  onKeyDown={(event) => {
    if (!followedVenue.venue) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenVenue?.(followedVenue.venue.id);
    }
  }}
>
                    <div className="livey-followed-venue-main">
                      <strong>{followedVenue.venue.name}</strong>
                      <span>
                        {followedVenue.venue.category} ·{" "}
                        {followedVenue.venue.area}
                      </span>
                    </div>

                    {followedVenue.venue.verified && <small>Verified</small>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="livey-profile-empty">
              <div className="livey-profile-empty-icon" aria-hidden="true" />

              <strong>No followed venues yet.</strong>
              <p>
                Follow venues to keep up with the latest updates, offers, and
                live moments around you.
              </p>
            </div>
          )}
        </section>

        <section className="livey-profile-card livey-profile-personality-card">
          <p className="livey-profile-card-kicker">Personality</p>
          <h3>Coming soon</h3>
        </section>
      </div>

      <LiveySettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </main>
  );
}