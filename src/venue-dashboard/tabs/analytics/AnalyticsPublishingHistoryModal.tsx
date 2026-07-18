import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  MouseEvent,
} from "react";
import type {
  VenueDashboardEvent,
} from "../../venueDashboardService";
import {
  buildPublishingHistoryTrend,
  type AnalyticsPublishingRange,
} from "./analyticsInsights";
import { AnalyticsPublishingChart } from "./AnalyticsPublishingChart";

type AnalyticsPublishingHistoryModalProps = {
  events: VenueDashboardEvent[];
  onClose: () => void;
};

const publishingRanges: Array<{
  value: AnalyticsPublishingRange;
  label: string;
}> = [
  {
    value: "14-days",
    label: "14 days",
  },
  {
    value: "last-month",
    label: "Last month",
  },
  {
    value: "6-months",
    label: "6 months",
  },
  {
    value: "12-months",
    label: "12 months",
  },
];

export function AnalyticsPublishingHistoryModal({
  events,
  onClose,
}: AnalyticsPublishingHistoryModalProps) {
  const [selectedRange, setSelectedRange] =
    useState<AnalyticsPublishingRange>(
      "14-days"
    );

  useModalBehaviour(onClose);

  const trend = useMemo(() => {
    return buildPublishingHistoryTrend(
      events,
      selectedRange
    );
  }, [events, selectedRange]);

  const totalPublished = trend.reduce(
    (total, point) =>
      total + point.count,
    0
  );

  const activePublishingPeriods =
    trend.filter(
      (point) => point.count > 0
    ).length;

  const selectedRangeLabel =
    publishingRanges.find(
      (range) =>
        range.value === selectedRange
    )?.label ?? "Selected period";

  const selectedRangeDescription =
    selectedRange === "last-month"
      ? "during the previous calendar month"
      : `during the last ${selectedRangeLabel.toLowerCase()}`;

  return (
    <div
      className="venue-dashboard-analytics-publishing-modal-backdrop"
      role="presentation"
      onMouseDown={(event) =>
        handleBackdropClick(
          event,
          onClose
        )
      }
    >
      <section
        className="venue-dashboard-analytics-publishing-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="venue-dashboard-analytics-publishing-modal-title"
      >
        <header className="venue-dashboard-analytics-publishing-modal-heading">
          <div>
            <p className="venue-dashboard-eyebrow">
              Publishing history
            </p>

            <h2 id="venue-dashboard-analytics-publishing-modal-title">
              Activity over time
            </h2>

            <p>
              Review how consistently your
              venue has published new
              activity.
            </p>
          </div>

          <button
            className="venue-dashboard-analytics-publishing-modal-close"
            type="button"
            aria-label="Close publishing history"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>

        <div
          className="venue-dashboard-analytics-publishing-range-selector"
          role="group"
          aria-label="Publishing history range"
        >
          {publishingRanges.map(
            (range) => (
              <button
                className={
                  selectedRange ===
                  range.value
                    ? "is-active"
                    : ""
                }
                type="button"
                key={range.value}
                aria-pressed={
                  selectedRange ===
                  range.value
                }
                onClick={() =>
                  setSelectedRange(
                    range.value
                  )
                }
              >
                {range.label}
              </button>
            )
          )}
        </div>

        <div className="venue-dashboard-analytics-publishing-modal-summary">
          <div>
            <span>
              Activities published
            </span>

            <strong>
              {totalPublished}
            </strong>
          </div>

          <small>
            {activePublishingPeriods === 1
              ? `Across 1 active period ${selectedRangeDescription}`
              : `Across ${activePublishingPeriods} active periods ${selectedRangeDescription}`}
          </small>
        </div>

        <div className="venue-dashboard-analytics-publishing-modal-chart-scroll">
          <AnalyticsPublishingChart
            key={selectedRange}
            points={trend}
            variant="history"
            ariaLabel={`${totalPublished} activities published ${selectedRangeDescription}`}
          />
        </div>

        {totalPublished === 0 ? (
          <div className="venue-dashboard-analytics-trend-empty">
            <strong>
              No activity published
            </strong>

            <span>
              New activity published during
              this period will appear here.
            </span>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function useModalBehaviour(
  onClose: () => void
) {
  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event: globalThis.KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);
}

function handleBackdropClick(
  event: MouseEvent<HTMLDivElement>,
  onClose: () => void
) {
  if (
    event.target ===
    event.currentTarget
  ) {
    onClose();
  }
}