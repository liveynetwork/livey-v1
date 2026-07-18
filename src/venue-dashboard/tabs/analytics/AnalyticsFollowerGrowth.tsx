import { useState } from "react";
import type {
  VenueDashboardAnalytics,
  VenueFollowerActivityPoint,
} from "../../venueDashboardService";
import { AnalyticsSectionHeading } from "./AnalyticsSectionHeading";
import "./AnalyticsFollowerGrowth.css";

type AnalyticsFollowerGrowthProps = {
  analytics: VenueDashboardAnalytics;
  onRefresh?: () => void;
};

type FollowerGrowthRange =
  | "last14Days"
  | "lastMonth"
  | "last6Months"
  | "lastYear";

type FollowerMovementType =
  | "start"
  | "follow"
  | "unfollow"
  | "snapshot";

type CumulativeFollowerPoint = {
  id: string;
  date: string;
  follows: number;
  unfollows: number;
  followerTotal: number;
  movementType: FollowerMovementType;
  timelinePosition: number;
};

type ChartPoint =
  CumulativeFollowerPoint & {
    x: number;
    y: number;
  };

const CHART_WIDTH = 1000;
const CHART_HEIGHT = 280;
const CHART_TOP = 28;
const CHART_BOTTOM = 226;
const CHART_LEFT = 28;
const CHART_RIGHT = 972;

const CHART_MIDDLE =
  CHART_TOP +
  (CHART_BOTTOM - CHART_TOP) / 2;

export function AnalyticsFollowerGrowth({
  analytics,
  onRefresh,
}: AnalyticsFollowerGrowthProps) {
  const [
    selectedRange,
    setSelectedRange,
  ] = useState<FollowerGrowthRange>(
    "last14Days"
  );

  const activityRanges =
    analytics.followerActivityRanges ?? {
      last14Days: [],
      lastMonth: [],
      last6Months: [],
      lastYear: [],
    };

  const activity =
    activityRanges[selectedRange];

  const rangeDetails =
    getFollowerRangeDetails(
      selectedRange
    );

  if (
    analytics.isFollowerAnalyticsLoading
  ) {
    return (
      <section className="venue-dashboard-analytics-card venue-dashboard-analytics-follower-chart-card">
        <AnalyticsSectionHeading
          eyebrow="Audience growth"
          title="Follower growth"
          description="See how your Livey audience changes over time."
        />

        <FollowerChartState
          title="Loading audience data"
          description="Your latest follower analytics are being prepared."
        />
      </section>
    );
  }

  if (
    analytics.followerAnalyticsError
  ) {
    return (
      <section className="venue-dashboard-analytics-card venue-dashboard-analytics-follower-chart-card">
        <AnalyticsSectionHeading
          eyebrow="Audience growth"
          title="Follower growth"
          description="See how your Livey audience changes over time."
        />

        <FollowerChartState
          title="Audience data unavailable"
          description="Follower growth could not be loaded right now."
          isError
        />
      </section>
    );
  }

  const totalFollowers =
    analytics.totalFollowers ?? 0;

  const cumulativeGrowth =
    buildCumulativeFollowerGrowth(
      activity,
      totalFollowers
    );

  const chartPoints =
    buildFollowerChartPoints(
      cumulativeGrowth,
      activity.length
    );

  const totalFollows =
    activity.reduce(
      (total, point) =>
        total + point.follows,
      0
    );

  const totalUnfollows =
    activity.reduce(
      (total, point) =>
        total + point.unfollows,
      0
    );

  const netChange =
    totalFollows -
    totalUnfollows;

  const activePeriods =
    activity.filter(
      (point) =>
        point.follows > 0 ||
        point.unfollows > 0
    ).length;

  const totalMovements =
    totalFollows +
    totalUnfollows;

  const lastUpdated =
    formatFollowerAnalyticsUpdatedAt(
      analytics
        .followerAnalyticsGeneratedAt
    );

  return (
    <section className="venue-dashboard-analytics-card venue-dashboard-analytics-follower-chart-card">
      <div className="venue-dashboard-analytics-follower-heading">
        <AnalyticsSectionHeading
          eyebrow="Audience growth"
          title="Follower growth"
          description="See how your total Livey audience changed across the selected period."
        />

        {onRefresh ? (
          <button
            type="button"
            className="venue-dashboard-analytics-refresh-button"
            disabled={
              analytics
                .isFollowerAnalyticsLoading
            }
            aria-label="Refresh follower analytics"
            onClick={onRefresh}
          >
            <RefreshIcon />

            <span>
              {analytics
                .isFollowerAnalyticsLoading
                ? "Refreshing"
                : "Refresh data"}
            </span>
          </button>
        ) : null}
      </div>

      <div
        className="venue-dashboard-analytics-follower-range-selector"
        aria-label="Follower growth range"
      >
        <FollowerRangeButton
          label="Last 14 days"
          isActive={
            selectedRange ===
            "last14Days"
          }
          onClick={() =>
            setSelectedRange(
              "last14Days"
            )
          }
        />

        <FollowerRangeButton
          label="Last month"
          isActive={
            selectedRange ===
            "lastMonth"
          }
          onClick={() =>
            setSelectedRange(
              "lastMonth"
            )
          }
        />

        <FollowerRangeButton
          label="Last 6 months"
          isActive={
            selectedRange ===
            "last6Months"
          }
          onClick={() =>
            setSelectedRange(
              "last6Months"
            )
          }
        />

        <FollowerRangeButton
          label="Last year"
          isActive={
            selectedRange ===
            "lastYear"
          }
          onClick={() =>
            setSelectedRange(
              "lastYear"
            )
          }
        />
      </div>

      <div className="venue-dashboard-analytics-follower-chart-meta">
        <div className="is-primary">
          <span>Total followers</span>

          <strong>
            {totalFollowers}
          </strong>

          <small>
            Current Livey audience
          </small>
        </div>

        <div>
          <span>New follows</span>

          <strong>
            {totalFollows}
          </strong>

          <small>
            Across{" "}
            {rangeDetails.summaryLabel}
          </small>
        </div>

        <div>
          <span>Unfollows</span>

          <strong>
            {totalUnfollows}
          </strong>

          <small>
            Across{" "}
            {rangeDetails.summaryLabel}
          </small>
        </div>

        <div>
          <span>Net change</span>

          <strong>
            {formatSignedFollowerValue(
              netChange
            )}
          </strong>

          <small>
            Across {activePeriods} active{" "}
            {activePeriods === 1
              ? "period"
              : "periods"}
          </small>
        </div>
      </div>

      {activity.length === 0 ? (
        <FollowerChartState
          title="No follower history yet"
          description="Your follower growth line will appear here once audience data becomes available."
        />
      ) : (
        <FollowerGrowthChart
          points={chartPoints}
          activity={activity}
          rangeLabel={
            rangeDetails.ariaLabel
          }
          labelInterval={
            rangeDetails.labelInterval
          }
          hasMovement={
            totalMovements > 0
          }
        />
      )}

      <footer className="venue-dashboard-analytics-follower-chart-footer">
        <span className="venue-dashboard-analytics-follower-live-status">
          <i />

          Livey audience data
        </span>

        <span>
          {lastUpdated
            ? `Updated ${lastUpdated}`
            : "Update time unavailable"}
        </span>
      </footer>
    </section>
  );
}

function FollowerRangeButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={
        isActive
          ? "is-active"
          : undefined
      }
      aria-pressed={isActive}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function FollowerGrowthChart({
  points,
  activity,
  rangeLabel,
  labelInterval,
  hasMovement,
}: {
  points: ChartPoint[];
  activity: VenueFollowerActivityPoint[];
  rangeLabel: string;
  labelInterval: number;
  hasMovement: boolean;
}) {
  const linePath =
    buildLinePath(points);

  const movementPoints =
    points.filter(
      (point) =>
        point.movementType ===
          "follow" ||
        point.movementType ===
          "unfollow"
    );

  const visibleLabels =
    buildVisibleDateLabels(
      points,
      activity,
      labelInterval
    );

  return (
    <div className="venue-dashboard-analytics-follower-chart-shell">
      <svg
        className="venue-dashboard-analytics-follower-chart-svg"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label={`Total follower growth during ${rangeLabel}`}
        preserveAspectRatio="none"
      >
        <ChartGrid />

        <path
          className="venue-dashboard-analytics-follower-chart-line is-follow"
          d={linePath}
        />

        {hasMovement
          ? movementPoints.map(
              (point) => (
                <circle
                  key={point.id}
                  className={
                    point.movementType ===
                    "follow"
                      ? "venue-dashboard-analytics-follower-chart-point is-positive"
                      : "venue-dashboard-analytics-follower-chart-point is-negative"
                  }
                  cx={point.x}
                  cy={point.y}
                  r={4.5}
                >
                  <title>
                    {buildMovementTooltip(
                      point
                    )}
                  </title>
                </circle>
              )
            )
          : null}
      </svg>

      <div className="venue-dashboard-analytics-follower-chart-labels">
        {visibleLabels.map(
          (point) => (
            <span
              key={point.id}
              style={{
                left: `${
                  point.x / 10
                }%`,
              }}
            >
              {formatFollowerActivityDate(
                point.date
              )}
            </span>
          )
        )}
      </div>
    </div>
  );
}

function ChartGrid() {
  const chartHeight =
    CHART_BOTTOM - CHART_TOP;

  const gridLines = [
    {
      y: CHART_TOP,
      className: undefined,
    },
    {
      y:
        CHART_TOP +
        chartHeight / 4,
      className: undefined,
    },
    {
      y: CHART_MIDDLE,
      className: "is-baseline",
    },
    {
      y:
        CHART_TOP +
        (chartHeight / 4) * 3,
      className: undefined,
    },
    {
      y: CHART_BOTTOM,
      className: undefined,
    },
  ];

  return (
    <g className="venue-dashboard-analytics-follower-chart-grid">
      {gridLines.map(
        (line, index) => (
          <line
            key={`${line.y}-${index}`}
            className={
              line.className
            }
            x1={CHART_LEFT}
            x2={CHART_RIGHT}
            y1={line.y}
            y2={line.y}
          />
        )
      )}
    </g>
  );
}

function FollowerChartState({
  title,
  description,
  isError = false,
}: {
  title: string;
  description: string;
  isError?: boolean;
}) {
  return (
    <div
      className={
        isError
          ? "venue-dashboard-analytics-follower-chart-state is-error"
          : "venue-dashboard-analytics-follower-chart-state"
      }
    >
      <span className="venue-dashboard-analytics-follower-empty-icon">
        <AudienceGrowthIcon />
      </span>

      <div>
        <strong>{title}</strong>

        <p>{description}</p>
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20 11a8 8 0 0 0-14.8-4.2L3 9" />
      <path d="M3 4v5h5" />
      <path d="M4 13a8 8 0 0 0 14.8 4.2L21 15" />
      <path d="M21 20v-5h-5" />
    </svg>
  );
}

function AudienceGrowthIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 19V9" />
      <path d="M10 19V5" />
      <path d="M15 19v-7" />
      <path d="M20 19V3" />
    </svg>
  );
}

function buildCumulativeFollowerGrowth(
  activity: VenueFollowerActivityPoint[],
  currentFollowerTotal: number
): CumulativeFollowerPoint[] {
  if (activity.length === 0) {
    return [];
  }

  const totalNetMovement =
    activity.reduce(
      (total, point) =>
        total +
        point.follows -
        point.unfollows,
      0
    );

  let runningTotal = Math.max(
    0,
    currentFollowerTotal -
      totalNetMovement
  );

  const points: CumulativeFollowerPoint[] = [
    {
      id: "range-start",
      date: activity[0].date,
      follows: 0,
      unfollows: 0,
      followerTotal: runningTotal,
      movementType: "start",
      timelinePosition: 0,
    },
  ];

  activity.forEach(
    (period, periodIndex) => {
      const movementCount =
        period.follows +
        period.unfollows;

      let movementIndex = 0;

      for (
        let followIndex = 0;
        followIndex <
        period.follows;
        followIndex += 1
      ) {
        movementIndex += 1;
        runningTotal += 1;

        points.push({
          id:
            `${period.date}-follow-` +
            `${followIndex}`,
          date: period.date,
          follows: 1,
          unfollows: 0,
          followerTotal:
            runningTotal,
          movementType: "follow",
          timelinePosition:
            periodIndex +
            movementIndex /
              (movementCount + 1),
        });
      }

      for (
        let unfollowIndex = 0;
        unfollowIndex <
        period.unfollows;
        unfollowIndex += 1
      ) {
        movementIndex += 1;

        runningTotal = Math.max(
          0,
          runningTotal - 1
        );

        points.push({
          id:
            `${period.date}-unfollow-` +
            `${unfollowIndex}`,
          date: period.date,
          follows: 0,
          unfollows: 1,
          followerTotal:
            runningTotal,
          movementType: "unfollow",
          timelinePosition:
            periodIndex +
            movementIndex /
              (movementCount + 1),
        });
      }

      points.push({
        id:
          `${period.date}-snapshot-` +
          `${periodIndex}`,
        date: period.date,
        follows: 0,
        unfollows: 0,
        followerTotal: runningTotal,
        movementType: "snapshot",
        timelinePosition:
          periodIndex + 1,
      });
    }
  );

  return points;
}

function buildFollowerChartPoints(
  growth: CumulativeFollowerPoint[],
  periodCount: number
): ChartPoint[] {
  if (growth.length === 0) {
    return [];
  }

  const baselineValue =
    growth[0].followerTotal;

  const largestDeviation = Math.max(
    ...growth.map((point) =>
      Math.abs(
        point.followerTotal -
          baselineValue
      )
    ),
    1
  );

  const paddedDeviation =
    largestDeviation * 1.18;

  const chartWidth =
    CHART_RIGHT - CHART_LEFT;

  const halfChartHeight =
    (CHART_BOTTOM - CHART_TOP) / 2;

  const timelineLength =
    Math.max(periodCount, 1);

  return growth.map((point) => {
    const normalizedTimelinePosition =
      point.timelinePosition /
      timelineLength;

    const x =
      CHART_LEFT +
      normalizedTimelinePosition *
        chartWidth;

    const followerDifference =
      point.followerTotal -
      baselineValue;

    const y =
      CHART_MIDDLE -
      (followerDifference /
        paddedDeviation) *
        halfChartHeight;

    return {
      ...point,
      x,
      y,
    };
  });
}

function buildLinePath(
  points: ChartPoint[]
) {
  return points
    .map((point, index) => {
      const command =
        index === 0
          ? "M"
          : "L";

      return `${command} ${point.x} ${point.y}`;
    })
    .join(" ");
}

function buildVisibleDateLabels(
  points: ChartPoint[],
  activity: VenueFollowerActivityPoint[],
  labelInterval: number
): ChartPoint[] {
  const snapshotPoints =
    points.filter(
      (point) =>
        point.movementType ===
        "snapshot"
    );

  return snapshotPoints.filter(
    (_, index) =>
      index === 0 ||
      index ===
        activity.length - 1 ||
      index % labelInterval === 0
  );
}

function buildMovementTooltip(
  point: ChartPoint
) {
  const movementLabel =
    point.movementType === "follow"
      ? "Follow"
      : "Unfollow";

  return (
    `${formatFollowerActivityDate(
      point.date,
      true
    )}: ${movementLabel} · ` +
    `${point.followerTotal} total follower${
      point.followerTotal === 1
        ? ""
        : "s"
    }`
  );
}

function getFollowerRangeDetails(
  range: FollowerGrowthRange
) {
  if (range === "last14Days") {
    return {
      summaryLabel:
        "the last 14 days",
      ariaLabel:
        "the last 14 days",
      labelInterval: 3,
    };
  }

  if (range === "lastMonth") {
    return {
      summaryLabel:
        "the last month",
      ariaLabel:
        "the last month",
      labelInterval: 7,
    };
  }

  if (range === "last6Months") {
    return {
      summaryLabel:
        "the last 6 months",
      ariaLabel:
        "the last 6 months",
      labelInterval: 4,
    };
  }

  return {
    summaryLabel:
      "the last year",
    ariaLabel:
      "the last year",
    labelInterval: 2,
  };
}

function formatSignedFollowerValue(
  value: number
) {
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
}

function formatFollowerActivityDate(
  dateValue: string,
  includeYear = false
) {
  const date = new Date(
    `${dateValue}T00:00:00.000Z`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      ...(includeYear
        ? {
            year: "numeric",
          }
        : {}),
      timeZone: "UTC",
    }
  ).format(date);
}

function formatFollowerAnalyticsUpdatedAt(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}