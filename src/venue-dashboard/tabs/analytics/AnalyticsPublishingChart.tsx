import {
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
} from "react";
import type {
  AnalyticsTrendPoint,
} from "./analyticsInsights";

type AnalyticsPublishingChartProps = {
  points: AnalyticsTrendPoint[];
  ariaLabel: string;
  variant?: "week" | "history";
};

export function AnalyticsPublishingChart({
  points,
  ariaLabel,
  variant = "week",
}: AnalyticsPublishingChartProps) {
  const chartRef =
    useRef<HTMLDivElement | null>(null);

  const [isVisible, setIsVisible] =
    useState(false);

  useEffect(() => {
    const chartElement = chartRef.current;

    if (!chartElement) {
      return;
    }

    const prefersReducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          if (!entry?.isIntersecting) {
            return;
          }

          setIsVisible(true);
          observer.disconnect();
        },
        {
          threshold: 0.22,
        }
      );

    observer.observe(chartElement);

    return () => {
      observer.disconnect();
    };
  }, [points]);

  const highestValue = Math.max(
    ...points.map(
      (point) => point.count
    ),
    1
  );

  const minimumColumnWidth =
    variant === "week" ? 58 : 38;

  const chartStyle = {
    gridTemplateColumns: `repeat(${points.length}, minmax(${minimumColumnWidth}px, 1fr))`,
  } satisfies CSSProperties;

  return (
    <div
      ref={chartRef}
      className={[
        "venue-dashboard-analytics-chart",
        variant === "history"
          ? "venue-dashboard-analytics-chart-history"
          : "venue-dashboard-analytics-chart-week",
        isVisible
          ? "is-visible"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={chartStyle}
      role="img"
      aria-label={ariaLabel}
    >
      <div className="venue-dashboard-analytics-chart-baseline" />

      {points.map((point, index) => {
        const heightPercentage =
          point.count > 0
            ? Math.max(
                (point.count /
                  highestValue) *
                  100,
                14
              )
            : 2;

        const activityLabel =
          point.count === 1
            ? "1 activity published"
            : `${point.count} activities published`;

        const tooltipText =
          `${point.accessibleLabel}: ${activityLabel}`;

        return (
          <div
            className={[
              "venue-dashboard-analytics-chart-column",
              point.isCurrent
                ? "is-current"
                : "",
              point.isFuture
                ? "is-future"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={point.key}
            title={tooltipText}
            aria-label={tooltipText}
            tabIndex={0}
          >
            <div className="venue-dashboard-analytics-chart-value">
              {point.count > 0
                ? point.count
                : ""}
            </div>

            <div className="venue-dashboard-analytics-chart-track">
              <span
                className={
                  point.count > 0
                    ? "is-active"
                    : ""
                }
                style={{
                  height: `${heightPercentage}%`,
                  transitionDelay: `${index * 55}ms`,
                }}
              />
            </div>

            <small>
              {point.label}
            </small>
          </div>
        );
      })}
    </div>
  );
}