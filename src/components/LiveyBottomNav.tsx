import "./LiveyBottomNav.css";

export type LiveyTab = "map" | "profile";

type LiveyBottomNavProps = {
  activeTab: LiveyTab;
  onTabChange: (tab: LiveyTab) => void;
  hidden?: boolean;
};

export function LiveyBottomNav({
  activeTab,
  onTabChange,
  hidden = false,
}: LiveyBottomNavProps) {
  return (
<nav
  className={[
    "livey-bottom-nav",
    activeTab === "map"
      ? "livey-bottom-nav-map-active"
      : "livey-bottom-nav-profile-active",
    hidden ? "livey-bottom-nav-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ")}
  aria-label="Livey navigation"
>
      <button
        type="button"
        className={
          activeTab === "map"
            ? "livey-bottom-nav-item livey-bottom-nav-item-active"
            : "livey-bottom-nav-item"
        }
        onClick={() => onTabChange("map")}
      >
        <svg
          className="livey-nav-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M8.15 4.25L3.95 5.96C3.42 6.18 3.08 6.69 3.08 7.26V18.94C3.08 19.72 3.88 20.25 4.6 19.96L8.15 18.51V4.25ZM9.85 4.03V18.29L14.15 19.97V5.71L9.85 4.03ZM15.85 5.49V19.75L20.05 18.04C20.58 17.82 20.92 17.31 20.92 16.74V5.06C20.92 4.28 20.12 3.75 19.4 4.04L15.85 5.49Z"
            fill="currentColor"
          />
        </svg>
        <span>Map</span>
      </button>

      <button
        type="button"
        className={
          activeTab === "profile"
            ? "livey-bottom-nav-item livey-bottom-nav-item-active"
            : "livey-bottom-nav-item"
        }
        onClick={() => onTabChange("profile")}
      >
        <svg
          className="livey-nav-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M12 12.35C9.62 12.35 7.7 10.43 7.7 8.05C7.7 5.67 9.62 3.75 12 3.75C14.38 3.75 16.3 5.67 16.3 8.05C16.3 10.43 14.38 12.35 12 12.35ZM12 14.05C15.9 14.05 19.05 16.28 19.05 19.03C19.05 19.69 18.52 20.22 17.86 20.22H6.14C5.48 20.22 4.95 19.69 4.95 19.03C4.95 16.28 8.1 14.05 12 14.05Z"
            fill="currentColor"
          />
        </svg>
        <span>Profile</span>
      </button>
    </nav>
  );
}