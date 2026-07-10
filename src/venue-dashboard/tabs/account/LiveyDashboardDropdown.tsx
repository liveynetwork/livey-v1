import { useState } from "react";
import type { LiveyDropdownOption } from "./accountTypes";

type LiveyDashboardDropdownProps = {
  label?: string;
  value: string;
  options: LiveyDropdownOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function LiveyDashboardDropdown({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: LiveyDashboardDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div
      className={`venue-dashboard-custom-dropdown ${disabled ? "disabled" : ""}`}
    >
      {label ? <span>{label}</span> : null}

      <button
        type="button"
        disabled={disabled}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="venue-dashboard-custom-dropdown-value">
          {selectedOption?.label ?? value}
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