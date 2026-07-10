import { useState } from "react";
import type { LiveyDropdownOption } from "./accountTypes";

type LiveyDashboardDropdownProps = {
  label?: string;
  value: string;
  options: LiveyDropdownOption[];
  disabled?: boolean;
  triggerMode?: "full" | "arrow";
  onChange: (value: string) => void;
};

export function LiveyDashboardDropdown({
  label,
  value,
  options,
  disabled = false,
  triggerMode = "full",
  onChange,
}: LiveyDashboardDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  const selectedLabel = selectedOption?.label ?? value;

  function closeDropdownAfterBlur() {
    window.setTimeout(() => setIsOpen(false), 120);
  }

  return (
    <div
      className={`venue-dashboard-custom-dropdown ${
        disabled ? "disabled" : ""
      } ${triggerMode === "arrow" ? "arrow-only" : ""}`}
    >
      {label ? <span>{label}</span> : null}

      {triggerMode === "arrow" ? (
        <div className="venue-dashboard-custom-dropdown-arrow-trigger">
          <span className="venue-dashboard-custom-dropdown-value">
            {selectedLabel}
          </span>

          <button
            className="venue-dashboard-custom-dropdown-arrow-button"
            type="button"
            disabled={disabled}
            aria-label={isOpen ? "Close status options" : "Open status options"}
            aria-expanded={isOpen}
            onBlur={closeDropdownAfterBlur}
            onClick={() => setIsOpen((current) => !current)}
          >
            <span className="venue-dashboard-custom-dropdown-chevron">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
              >
                <path
                  d="m7 10 5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          aria-expanded={isOpen}
          onBlur={closeDropdownAfterBlur}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="venue-dashboard-custom-dropdown-value">
            {selectedLabel}
          </span>

          <span className="venue-dashboard-custom-dropdown-chevron">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
            >
              <path
                d="m7 10 5 5 5-5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      )}

      {isOpen && !disabled ? (
        <div className="venue-dashboard-custom-dropdown-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === value ? "selected" : ""}
              onMouseDown={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}