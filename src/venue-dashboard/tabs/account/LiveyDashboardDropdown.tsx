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
        {selectedOption?.label ?? value}
        <small>⌄</small>
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