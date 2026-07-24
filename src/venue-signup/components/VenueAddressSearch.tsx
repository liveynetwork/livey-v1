import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  KeyboardEvent,
} from "react";
import {
  searchVenueAddresses,
  type VenueAddressSuggestion,
} from "../../services/mapboxAddressSearch";
import type { VenueRequestCity } from "../../services/venueRequests";

type VenueAddressSearchProps = {
  value: string;
  city: VenueRequestCity;
  onValueChange: (value: string) => void;
  onSelect: (suggestion: VenueAddressSuggestion) => void;
};

export function VenueAddressSearch({
  value,
  city,
  onValueChange,
  onSelect,
}: VenueAddressSearchProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [suggestions, setSuggestions] = useState<
    VenueAddressSuggestion[]
  >([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSelectedResult, setHasSelectedResult] = useState(false);

  const trimmedValue = value.trim();
  const canSearch = trimmedValue.length >= 3;

  const shouldShowMenu =
    isFocused &&
    !hasSelectedResult &&
    (canSearch || isSearching || Boolean(searchError));

  useEffect(() => {
    if (!isFocused || hasSelectedResult || !canSearch) {
      setSuggestions([]);
      setActiveIndex(-1);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const results = await searchVenueAddresses({
          query: trimmedValue,
          city,
          signal: controller.signal,
        });

        setSuggestions(results);
        setActiveIndex(results.length > 0 ? 0 : -1);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.warn("Livey address search failed:", error);
        setSuggestions([]);
        setActiveIndex(-1);
        setSearchError(
          "Address search is temporarily unavailable. You can still type the address manually."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    canSearch,
    city,
    hasSelectedResult,
    isFocused,
    trimmedValue,
  ]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setHasSelectedResult(false);
    setSearchError(null);
    onValueChange(event.target.value);
  }

  function selectSuggestion(suggestion: VenueAddressSuggestion) {
    setHasSelectedResult(true);
    setSuggestions([]);
    setActiveIndex(-1);
    setSearchError(null);

    onSelect(suggestion);

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function focusOption(index: number) {
    if (suggestions.length === 0) {
      return;
    }

    const normalizedIndex =
      (index + suggestions.length) % suggestions.length;

    setActiveIndex(normalizedIndex);

    window.requestAnimationFrame(() => {
      optionRefs.current[normalizedIndex]?.focus();
    });
  }

  function handleInputKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "ArrowDown" &&
      suggestions.length > 0
    ) {
      event.preventDefault();
      focusOption(activeIndex >= 0 ? activeIndex : 0);
      return;
    }

    if (
      event.key === "Enter" &&
      activeIndex >= 0 &&
      suggestions[activeIndex]
    ) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setIsFocused(false);
      setSuggestions([]);
      setActiveIndex(-1);
    }
  }

  function handleOptionKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(index + 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (index === 0) {
        inputRef.current?.focus();
        setActiveIndex(0);
      } else {
        focusOption(index - 1);
      }

      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusOption(suggestions.length - 1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsFocused(false);
      setSuggestions([]);
      setActiveIndex(-1);
      inputRef.current?.focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      const suggestion = suggestions[index];

      if (suggestion) {
        selectSuggestion(suggestion);
      }
    }
  }

  return (
    <div
      ref={rootRef}
      className={`livey-venue-address-search ${
        shouldShowMenu ? "is-open" : ""
      }`}
    >
      <div className="livey-venue-address-input-shell">
        <svg
          className="livey-venue-address-search-icon"
          aria-hidden="true"
          viewBox="0 0 20 20"
        >
          <circle cx="8.6" cy="8.6" r="5.35" />
          <path d="m12.6 12.6 4 4" />
        </svg>

        <input
          ref={inputRef}
          value={value}
          type="text"
          placeholder="Search street, number or full address"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={shouldShowMenu}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);

            if (hasSelectedResult) {
              setHasSelectedResult(false);
            }
          }}
          onKeyDown={handleInputKeyDown}
        />

        {isSearching ? (
          <span
            className="livey-venue-address-spinner"
            aria-label="Searching addresses"
          />
        ) : null}
      </div>

      {shouldShowMenu ? (
        <div
          id={listboxId}
          className="livey-venue-address-menu"
          role="listbox"
          aria-label="Address suggestions"
        >
          {isSearching && suggestions.length === 0 ? (
            <div className="livey-venue-address-state">
              <span>Searching addresses…</span>
            </div>
          ) : null}

          {!isSearching &&
          !searchError &&
          canSearch &&
          suggestions.length === 0 ? (
            <div className="livey-venue-address-state">
              <strong>No address found</strong>
              <span>
                Try adding the street number or a nearby area.
              </span>
            </div>
          ) : null}

          {searchError ? (
            <div className="livey-venue-address-state is-error">
              <strong>Search unavailable</strong>
              <span>{searchError}</span>
            </div>
          ) : null}

          {suggestions.map((suggestion, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={suggestion.id}
                id={`${listboxId}-option-${index}`}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                className={`livey-venue-address-option ${
                  isActive ? "is-active" : ""
                }`}
                type="button"
                role="option"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => selectSuggestion(suggestion)}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) =>
                  handleOptionKeyDown(event, index)
                }
              >
                <svg
                  className="livey-venue-address-pin"
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 17s5-4.65 5-9a5 5 0 1 0-10 0c0 4.35 5 9 5 9Z" />
                  <circle cx="10" cy="8" r="1.65" />
                </svg>

                <span className="livey-venue-address-option-copy">
                  <strong>{suggestion.title}</strong>
                  <span>{suggestion.subtitle}</span>
                </span>
              </button>
            );
          })}

          <div className="livey-venue-address-attribution">
            Search results by Mapbox
          </div>
        </div>
      ) : null}
    </div>
  );
}