import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent } from "react";

type VenueHoursDropdownProps = {
  value: string;
  options: string[];
  ariaLabel: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function VenueHoursDropdown({
  value,
  options,
  ariaLabel,
  disabled = false,
  onChange,
}: VenueHoursDropdownProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(options.indexOf(value), 0)
  );

  useEffect(() => {
    setActiveIndex(Math.max(options.indexOf(value), 0));
  }, [options, value]);

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

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  function focusOption(index: number) {
    if (options.length === 0) {
      return;
    }

    const normalizedIndex =
      (index + options.length) % options.length;

    setActiveIndex(normalizedIndex);

    window.requestAnimationFrame(() => {
      optionRefs.current[normalizedIndex]?.focus();
    });
  }

  function openMenu() {
    if (disabled) {
      return;
    }

    const selectedIndex = Math.max(options.indexOf(value), 0);

    setActiveIndex(selectedIndex);
    setIsOpen(true);

    window.requestAnimationFrame(() => {
      optionRefs.current[selectedIndex]?.focus();
    });
  }

  function closeMenu({ restoreFocus = true } = {}) {
    setIsOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }

  function selectOption(option: string) {
    onChange(option);
    closeMenu();
  }

  function handleTriggerKeyDown(
    event: KeyboardEvent<HTMLButtonElement>
  ) {
    if (disabled) {
      return;
    }

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
      focusOption(options.length - 1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "Tab") {
      closeMenu({ restoreFocus: false });
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      const selectedOption = options[index];

      if (selectedOption) {
        selectOption(selectedOption);
      }
    }
  }

  return (
    <div
      ref={rootRef}
      className={`livey-venue-hours-dropdown ${
        isOpen ? "is-open" : ""
      } ${disabled ? "is-disabled" : ""}`}
    >
      <button
        ref={triggerRef}
        className="livey-venue-hours-trigger"
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => {
          if (isOpen) {
            closeMenu({ restoreFocus: false });
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
          className="livey-venue-hours-chevron"
        >
          <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
        </svg>
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          className="livey-venue-hours-menu"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option, index) => {
            const isSelected = option === value;
            const isActive = index === activeIndex;

            return (
              <button
                key={option}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                className={`livey-venue-hours-option ${
                  isSelected ? "is-selected" : ""
                } ${isActive ? "is-active" : ""}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectOption(option)}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) =>
                  handleOptionKeyDown(event, index)
                }
              >
                <span>{option}</span>

                {isSelected ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="livey-venue-hours-check"
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