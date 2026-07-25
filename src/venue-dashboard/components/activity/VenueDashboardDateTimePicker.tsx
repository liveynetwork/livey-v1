import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { VenueDashboardTimeDropdown } from "./VenueDashboardTimeDropdown";
import "./VenueDashboardDateTimePicker.css";

type VenueDashboardDateTimePickerProps = {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const WEEKDAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const HOUR_OPTIONS = Array.from(
  { length: 24 },
  (_, index) => index
);

const MINUTE_OPTIONS = Array.from(
  { length: 60 },
  (_, index) => index
);

export function VenueDashboardDateTimePicker({
  label,
  value,
  disabled = false,
  onChange,
}: VenueDashboardDateTimePickerProps) {
  const pickerId = useId();
  const rootRef = useRef<HTMLDivElement | null>(
    null
  );
  const triggerRef =
    useRef<HTMLButtonElement | null>(null);

  const parsedValue = useMemo(
    () => parseLocalDateTimeValue(value),
    [value]
  );

  const selectedDate = useMemo(
    () =>
      parsedValue
        ? partsToDate(parsedValue)
        : null,
    [parsedValue]
  );

  const [isOpen, setIsOpen] =
    useState(false);

  const [visibleMonth, setVisibleMonth] =
    useState(() =>
      getMonthStart(selectedDate ?? new Date())
    );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setVisibleMonth(
      getMonthStart(selectedDate ?? new Date())
    );
  }, [isOpen, selectedDate]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (
      event: PointerEvent
    ) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen]);

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth),
    [visibleMonth]
  );

  const triggerText = selectedDate
    ? formatTriggerDate(selectedDate)
    : "Select date and time";

  const selectedHour =
    parsedValue?.hour ?? getDefaultTime().hour;

  const selectedMinute =
    parsedValue?.minute ??
    getDefaultTime().minute;

  const handleTriggerClick = () => {
    if (disabled) {
      return;
    }

    setIsOpen((current) => !current);
  };

  const handleDaySelect = (
    selectedDay: Date
  ) => {
    const currentParts =
      parsedValue ?? getDefaultParts(selectedDay);

    const nextValue =
      formatLocalDateTimeValue({
        year: selectedDay.getFullYear(),
        month: selectedDay.getMonth() + 1,
        day: selectedDay.getDate(),
        hour: currentParts.hour,
        minute: currentParts.minute,
      });

    onChange(nextValue);

    setVisibleMonth(
      getMonthStart(selectedDay)
    );
  };

  const handleTimeChange = (
    nextHour: number,
    nextMinute: number
  ) => {
    const baseDate =
      selectedDate ?? new Date();

    onChange(
      formatLocalDateTimeValue({
        year: baseDate.getFullYear(),
        month: baseDate.getMonth() + 1,
        day: baseDate.getDate(),
        hour: nextHour,
        minute: nextMinute,
      })
    );
  };

  const handleToday = () => {
    const now = new Date();

    const currentParts =
      parsedValue ?? getDefaultParts(now);

    onChange(
      formatLocalDateTimeValue({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: currentParts.hour,
        minute: currentParts.minute,
      })
    );

    setVisibleMonth(getMonthStart(now));
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      className={
        isOpen
          ? "venue-dashboard-date-time-picker is-open"
          : "venue-dashboard-date-time-picker"
      }
      ref={rootRef}
    >
      <span
        className="venue-dashboard-date-time-picker-label"
        id={`${pickerId}-label`}
      >
        {label}
      </span>

      <button
        ref={triggerRef}
        className="venue-dashboard-date-time-picker-trigger"
        type="button"
        aria-labelledby={`${pickerId}-label`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={`${pickerId}-panel`}
        disabled={disabled}
        onClick={handleTriggerClick}
      >
        <span
          className={
            selectedDate
              ? "venue-dashboard-date-time-picker-value"
              : "venue-dashboard-date-time-picker-value is-placeholder"
          }
        >
          {triggerText}
        </span>

        <CalendarIcon />
      </button>

      {isOpen ? (
        <div
          className="venue-dashboard-date-time-picker-panel"
          id={`${pickerId}-panel`}
          role="dialog"
          aria-modal="false"
          aria-label={`${label} date and time`}
        >
          <div className="venue-dashboard-date-time-picker-header">
            <button
              className="venue-dashboard-date-time-picker-navigation"
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setVisibleMonth((current) =>
                  addMonths(current, -1)
                )
              }
            >
              <ChevronLeftIcon />
            </button>

            <strong>
              {formatMonthHeading(
                visibleMonth
              )}
            </strong>

            <button
              className="venue-dashboard-date-time-picker-navigation"
              type="button"
              aria-label="Next month"
              onClick={() =>
                setVisibleMonth((current) =>
                  addMonths(current, 1)
                )
              }
            >
              <ChevronRightIcon />
            </button>
          </div>

          <div
            className="venue-dashboard-date-time-picker-weekdays"
            aria-hidden="true"
          >
            {WEEKDAY_LABELS.map(
              (weekday) => (
                <span key={weekday}>
                  {weekday}
                </span>
              )
            )}
          </div>

          <div
            className="venue-dashboard-date-time-picker-calendar"
            role="grid"
            aria-label={formatMonthHeading(
              visibleMonth
            )}
          >
            {calendarDays.map((day) => {
              const isCurrentMonth =
                day.getMonth() ===
                visibleMonth.getMonth();

              const isSelected =
                selectedDate !== null &&
                isSameCalendarDay(
                  day,
                  selectedDate
                );

              const isToday =
                isSameCalendarDay(
                  day,
                  new Date()
                );

              const classNames = [
                "venue-dashboard-date-time-picker-day",
                !isCurrentMonth
                  ? "is-outside"
                  : "",
                isSelected
                  ? "is-selected"
                  : "",
                isToday
                  ? "is-today"
                  : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  className={classNames}
                  type="button"
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-label={formatDayLabel(
                    day
                  )}
                  key={toCalendarKey(day)}
                  onClick={() =>
                    handleDaySelect(day)
                  }
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="venue-dashboard-date-time-picker-time-section">
            <div className="venue-dashboard-date-time-picker-time-heading">
              <ClockIcon />

              <span>Time</span>
            </div>

            <div className="venue-dashboard-date-time-picker-time-controls">
  <label>
    <span>Hour</span>

    <VenueDashboardTimeDropdown
      value={selectedHour}
      options={HOUR_OPTIONS}
      ariaLabel={`${label} hour`}
      onChange={(nextHour) =>
        handleTimeChange(
          nextHour,
          selectedMinute
        )
      }
    />
  </label>

  <span
    className="venue-dashboard-date-time-picker-time-separator"
    aria-hidden="true"
  >
    :
  </span>

  <label>
    <span>Minute</span>

    <VenueDashboardTimeDropdown
      value={selectedMinute}
      options={MINUTE_OPTIONS}
      ariaLabel={`${label} minute`}
      onChange={(nextMinute) =>
        handleTimeChange(
          selectedHour,
          nextMinute
        )
      }
    />
  </label>
</div>
          </div>

          <div className="venue-dashboard-date-time-picker-footer">
            <button
              className="venue-dashboard-date-time-picker-clear"
              type="button"
              onClick={handleClear}
              disabled={!value}
            >
              Clear
            </button>

            <button
              className="venue-dashboard-date-time-picker-today"
              type="button"
              onClick={handleToday}
            >
              Today
            </button>

            <button
              className="venue-dashboard-date-time-picker-done"
              type="button"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function parseLocalDateTimeValue(
  value: string
): LocalDateTimeParts | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(
      value
    );

  if (!match) {
    return null;
  }

  const parts: LocalDateTimeParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };

  const date = partsToDate(parts);

  if (
    date.getFullYear() !== parts.year ||
    date.getMonth() !== parts.month - 1 ||
    date.getDate() !== parts.day ||
    date.getHours() !== parts.hour ||
    date.getMinutes() !== parts.minute
  ) {
    return null;
  }

  return parts;
}

function partsToDate(
  parts: LocalDateTimeParts
) {
  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    0,
    0
  );
}

function formatLocalDateTimeValue(
  parts: LocalDateTimeParts
) {
  return [
    `${parts.year}-${padNumber(
      parts.month
    )}-${padNumber(parts.day)}`,
    `${padNumber(parts.hour)}:${padNumber(
      parts.minute
    )}`,
  ].join("T");
}

function getDefaultParts(
  date: Date
): LocalDateTimeParts {
  const time = getDefaultTime();

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: time.hour,
    minute: time.minute,
  };
}

function getDefaultTime() {
  const now = new Date();
  const minuteStep = 5;

  const roundedMinutes =
    Math.ceil(
      now.getMinutes() / minuteStep
    ) * minuteStep;

  const roundedDate = new Date(now);

  roundedDate.setSeconds(0, 0);
  roundedDate.setMinutes(roundedMinutes);

  return {
    hour: roundedDate.getHours(),
    minute: roundedDate.getMinutes(),
  };
}

function getMonthStart(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function addMonths(
  date: Date,
  amount: number
) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1
  );
}

function buildCalendarDays(
  monthStart: Date
) {
  const firstDayIndex =
    (monthStart.getDay() + 6) % 7;

  const gridStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    1 - firstDayIndex
  );

  return Array.from(
    { length: 42 },
    (_, index) =>
      new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + index
      )
  );
}

function isSameCalendarDay(
  firstDate: Date,
  secondDate: Date
) {
  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth() &&
    firstDate.getDate() ===
      secondDate.getDate()
  );
}

function formatTriggerDate(date: Date) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(date);
}

function formatMonthHeading(date: Date) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function toCalendarKey(date: Date) {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join("-");
}

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 3.5v4M16 3.5v4M4 10h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 7.5v5l3.2 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m14.5 6.5-5 5.5 5 5.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m9.5 6.5 5 5.5-5 5.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}