import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent } from "react";
import type { VenueRequestContactMethod } from "../../services/venueRequests";
import { contactMethods } from "../venueSignupConfig";

type VenueContactMethodDropdownProps = {
  value: VenueRequestContactMethod;
  onChange: (method: VenueRequestContactMethod) => void;
};

export function VenueContactMethodDropdown({
  value,
  onChange,
}: VenueContactMethodDropdownProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(contactMethods.indexOf(value), 0)
  );

  useEffect(() => {
    setActiveIndex(Math.max(contactMethods.indexOf(value), 0));
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
      (index + contactMethods.length) % contactMethods.length;

    setActiveIndex(normalizedIndex);

    window.requestAnimationFrame(() => {
      optionRefs.current[normalizedIndex]?.focus();
    });
  }

  function openMenu() {
    const selectedIndex = Math.max(
      contactMethods.indexOf(value),
      0
    );

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
          ".livey-venue-contact-method-trigger"
        )
        ?.focus();
    });
  }

  function selectMethod(method: VenueRequestContactMethod) {
    onChange(method);
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
      focusOption(contactMethods.length - 1);
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
      selectMethod(contactMethods[index]);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`livey-venue-contact-method-dropdown ${
        isOpen ? "is-open" : ""
      }`}
    >
      <button
        className="livey-venue-contact-method-trigger"
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
          className="livey-venue-contact-method-chevron"
        >
          <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
        </svg>
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          className="livey-venue-contact-method-menu"
          role="listbox"
          aria-label="Best contact method"
        >
          {contactMethods.map((method, index) => {
            const isSelected = method === value;
            const isActive = index === activeIndex;

            return (
              <button
                key={method}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                className={`livey-venue-contact-method-option ${
                  isSelected ? "is-selected" : ""
                } ${isActive ? "is-active" : ""}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectMethod(method)}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) =>
                  handleOptionKeyDown(event, index)
                }
              >
                <span>{method}</span>

                {isSelected ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="livey-venue-contact-method-check"
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