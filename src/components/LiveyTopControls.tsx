import type { LiveyVenueCategory } from "./liveyVenues";

const categoryFilters: LiveyVenueCategory[] = [
  "Cafes",
  "Restaurants",
  "Bars",
  "Clubs",
  "Activities",
  "Shopping",
  "Beauty",
  "Events",
];

type MapMode = "live" | "all";

type LiveyTopControlsProps = {
  searchValue: string;
  selectedCategory: LiveyVenueCategory | "All";
  mapMode: MapMode;
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: LiveyVenueCategory | "All") => void;
  onMapModeChange: (mode: MapMode) => void;
};

export function LiveyTopControls({
  searchValue,
  selectedCategory,
  mapMode,
  onSearchChange,
  onCategoryChange,
  onMapModeChange,
}: LiveyTopControlsProps) {
  return (
    <header className="livey-map-header">
      <div className="livey-search-bar">
        <div className="livey-search-left">
          <svg
            className="livey-search-icon"
            width="19"
            height="19"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M10.9 18.1C6.92 18.1 3.7 14.88 3.7 10.9C3.7 6.92 6.92 3.7 10.9 3.7C14.88 3.7 18.1 6.92 18.1 10.9C18.1 12.64 17.48 14.24 16.45 15.48L20.05 19.08C20.38 19.41 20.38 19.95 20.05 20.28C19.72 20.61 19.18 20.61 18.85 20.28L15.25 16.68C14.04 17.57 12.54 18.1 10.9 18.1ZM10.9 16.4C13.94 16.4 16.4 13.94 16.4 10.9C16.4 7.86 13.94 5.4 10.9 5.4C7.86 5.4 5.4 7.86 5.4 10.9C5.4 13.94 7.86 16.4 10.9 16.4Z"
              fill="currentColor"
            />
          </svg>

          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            type="text"
            placeholder="Search"
            aria-label="Search"
            className="livey-search-input"
          />
        </div>

        <img
          src="/Livey-Logo.png"
          alt="Livey"
          className="livey-search-logo"
        />
      </div>

      <nav className="livey-category-row" aria-label="Venue categories">
        <button
          type="button"
          className={
            selectedCategory === "All"
              ? "livey-category-pill livey-category-pill-active"
              : "livey-category-pill"
          }
          onClick={() => onCategoryChange("All")}
        >
          All
        </button>

        {categoryFilters.map((category) => (
          <button
            key={category}
            type="button"
            className={
              selectedCategory === category
                ? "livey-category-pill livey-category-pill-active"
                : "livey-category-pill"
            }
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </nav>

      <div className="livey-mode-switch" aria-label="Map mode">
        <button
          type="button"
          className={
            mapMode === "live"
              ? "livey-mode-option livey-mode-option-active"
              : "livey-mode-option"
          }
          onClick={() => onMapModeChange("live")}
        >
          Live
        </button>

        <button
          type="button"
          className={
            mapMode === "all"
              ? "livey-mode-option livey-mode-option-active"
              : "livey-mode-option"
          }
          onClick={() => onMapModeChange("all")}
        >
          All
        </button>
      </div>
    </header>
  );
}