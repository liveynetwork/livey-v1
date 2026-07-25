import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent } from "react";

type VenueDashboardTimeDropdownProps = {
  value: number;
  options: number[];
  ariaLabel: string;
  onChange: (value: number) => void;
};

export function VenueDashboardTimeDropdown({
  value,
  options,
  ariaLabel,
  onChange,
}: VenueDashboardTimeDropdownProps) {
  const listboxId = useId();

  const rootRef =
    useRef<HTMLDivElement | null>(null);

  const triggerRef =
    useRef<HTMLButtonElement | null>(null);

  const optionRefs =
    useRef<Array<HTMLButtonElement | null>>([]);

  const [isOpen, setIsOpen] =
    useState(false);

  const [activeIndex, setActiveIndex] =
    useState(() =>
      Math.max(options.indexOf(value), 0)
    );

  useEffect(() => {
    setActiveIndex(
      Math.max(options.indexOf(value), 0)
    );
  }, [options, value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(
      event: PointerEvent
    ) {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
    };
  }, [isOpen]);

  function focusOption(index: number) {
    if (options.length === 0) {
      return;
    }

    const normalizedIndex =
      (index + options.length) %
      options.length;

    setActiveIndex(normalizedIndex);

    window.requestAnimationFrame(() => {
      optionRefs.current[
        normalizedIndex
      ]?.focus();
    });
  }

  function openMenu() {
    const selectedIndex =
      Math.max(
        options.indexOf(value),
        0
      );

    setActiveIndex(selectedIndex);
    setIsOpen(true);

    window.requestAnimationFrame(() => {
      optionRefs.current[
        selectedIndex
      ]?.focus();

      optionRefs.current[
        selectedIndex
      ]?.scrollIntoView({
        block: "nearest",
      });
    });
  }

  function closeMenu({
    restoreFocus = true,
  } = {}) {
    setIsOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }

  function selectOption(
    option: number
  ) {
    onChange(option);
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
      focusOption(
        options.length - 1
      );
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "Tab") {
      closeMenu({
        restoreFocus: false,
      });
      return;
    }

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      const selectedOption =
        options[index];

      if (
        selectedOption !== undefined
      ) {
        selectOption(
          selectedOption
        );
      }
    }
  }

  return (
    <div
      ref={rootRef}
      className={
        isOpen
          ? "venue-dashboard-time-dropdown is-open"
          : "venue-dashboard-time-dropdown"
      }
    >
      <button
        ref={triggerRef}
        className="venue-dashboard-time-dropdown-trigger"
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => {
          if (isOpen) {
            closeMenu({
              restoreFocus: false,
            });
          } else {
            openMenu();
          }
        }}
        onKeyDown={
          handleTriggerKeyDown
        }
      >
        <span>
          {padNumber(value)}
        </span>

        <svg
          className="venue-dashboard-time-dropdown-chevron"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
        </svg>
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          className="venue-dashboard-time-dropdown-menu"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map(
            (option, index) => {
              const isSelected =
                option === value;

              const isActive =
                index === activeIndex;

              return (
                <button
                  key={option}
                  ref={(element) => {
                    optionRefs.current[
                      index
                    ] = element;
                  }}
                  className={[
                    "venue-dashboard-time-dropdown-option",
                    isSelected
                      ? "is-selected"
                      : "",
                    isActive
                      ? "is-active"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  type="button"
                  role="option"
                  aria-selected={
                    isSelected
                  }
                  tabIndex={
                    isActive ? 0 : -1
                  }
                  onClick={() =>
                    selectOption(
                      option
                    )
                  }
                  onFocus={() =>
                    setActiveIndex(
                      index
                    )
                  }
                  onKeyDown={(
                    event
                  ) =>
                    handleOptionKeyDown(
                      event,
                      index
                    )
                  }
                >
                  <span>
                    {padNumber(
                      option
                    )}
                  </span>

                  {isSelected ? (
                    <svg
                      className="venue-dashboard-time-dropdown-check"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="m4.5 10.5 3.2 3.2 7.8-7.8" />
                    </svg>
                  ) : null}
                </button>
              );
            }
          )}
        </div>
      ) : null}
    </div>
  );
}

function padNumber(
  value: number
) {
  return String(value).padStart(
    2,
    "0"
  );
}