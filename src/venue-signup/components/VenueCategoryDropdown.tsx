import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent } from "react";
import type { VenueRequestCategory } from "../../services/venueRequests";
import { categories } from "../venueSignupConfig";

type VenueCategoryDropdownProps = {
  value: VenueRequestCategory;
  onChange: (category: VenueRequestCategory) => void;
};

export function VenueCategoryDropdown({
  value,
  onChange,
}: VenueCategoryDropdownProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(categories.indexOf(value), 0)
  );

  useEffect(() => {
    setActiveIndex(Math.max(categories.indexOf(value), 0));
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  function focusOption(index: number) {
    const normalizedIndex =
      (index + categories.length) % categories.length;

    setActiveIndex(normalizedIndex);

    window.requestAnimationFrame(() => {
      optionRefs.current[normalizedIndex]?.focus();
    });
  }

  function openMenu() {
    const selectedIndex = Math.max(categories.indexOf(value), 0);

    setActiveIndex(selectedIndex);
    setIsOpen(true);

    window.requestAnimationFrame(() => {
      optionRefs.current[selectedIndex]?.focus();
    });
  }

  function closeMenu() {
    setIsOpen(false);

    window.requestAnimationFrame(() => {
      rootRef.current
        ?.querySelector<HTMLButtonElement>(
          ".livey-venue-category-trigger"
        )
        ?.focus();
    });
  }

  function selectCategory(category: VenueRequestCategory) {
    onChange(category);
    closeMenu();
  }

  function handleTriggerKeyDown(
    event: KeyboardEvent<HTMLButtonElement>
  ) {
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      openMenu();
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
      focusOption(index - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusOption(categories.length - 1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectCategory(categories[index]);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`livey-venue-category-dropdown ${
        isOpen ? "is-open" : ""
      }`}
    >
      <button
        className="livey-venue-category-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{value}</span>

        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="livey-venue-category-chevron"
        >
          <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
        </svg>
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          className="livey-venue-category-menu"
          role="listbox"
          aria-label="Venue category"
        >
          {categories.map((category, index) => {
            const isSelected = category === value;
            const isActive = index === activeIndex;

            return (
              <button
                key={category}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                className={`livey-venue-category-option ${
                  isSelected ? "is-selected" : ""
                } ${isActive ? "is-active" : ""}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectCategory(category)}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) =>
                  handleOptionKeyDown(event, index)
                }
              >
                <span>{category}</span>

                {isSelected ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="livey-venue-category-check"
                  >
                    <path d="m4.5 10.5 3.2 3.2 7.8-7.8" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}