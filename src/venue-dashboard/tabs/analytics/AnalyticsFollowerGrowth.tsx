import {
  useEffect,
  useState,
} from "react";
import type {
  VenueDashboardAnalytics,
  VenueFollowerActivityPoint,
  VenueFollowerTodayPoint,
} from "../../venueDashboardService";
import { AnalyticsSectionHeading } from "./AnalyticsSectionHeading";
import "./AnalyticsFollowerGrowth.css";

type AnalyticsFollowerGrowthProps = {
  analytics: VenueDashboardAnalytics;
  onRefresh?: () => void;
};

type FollowerGrowthRange =
  | "today"
  | "last14Days"
  | "lastMonth"
  | "last6Months"
  | "lastYear";

type FollowerMovementType =
  | "start"
  | "follow"
  | "unfollow"
  | "snapshot";

type ChartActivityPoint = {
  date: string;
  follows: number;
  unfollows: number;
};

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
    isAdvancedOpen,
    setIsAdvancedOpen,
  ] = useState(false);

  const [
    selectedRange,
    setSelectedRange,
  ] = useState<FollowerGrowthRange>(
    "today"
  );

  useEffect(() => {
    if (!isAdvancedOpen) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setIsAdvancedOpen(false);
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

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
  }, [isAdvancedOpen]);

  const activityRanges =
    analytics.followerActivityRanges ?? {
      today: [],
      last14Days: [],
      lastMonth: [],
      last6Months: [],
      lastYear: [],
    };

  const todayActivity =
    normalizeTodayActivity(
      activityRanges.today
    );

  const totalFollowers =
    analytics.totalFollowers ?? 0;

  const lastUpdated =
    formatFollowerAnalyticsUpdatedAt(
      analytics
        .followerAnalyticsGeneratedAt
    );

  if (
    analytics.isFollowerAnalyticsLoading
  ) {
    return (
      <section className="venue-dashboard-analytics-card venue-dashboard-analytics-follower-chart-card">
        <AnalyticsSectionHeading
          eyebrow="Audience growth"
          title="Follower growth"
          description="A live view of your venue’s audience today."
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
          description="A live view of your venue’s audience today."
        />

        <FollowerChartState
          title="Audience data unavailable"
          description="Follower growth could not be loaded right now."
          isError
        />
      </section>
    );
  }

  const todayChartData =
    buildChartData(
      todayActivity,
      totalFollowers
    );

  return (
    <>
      <section className="venue-dashboard-analytics-card venue-dashboard-analytics-follower-chart-card">
        <div className="venue-dashboard-analytics-follower-heading">
          <AnalyticsSectionHeading
            eyebrow="Audience growth"
            title="Follower growth"
            description="See how your Livey audience is moving today."
          />
        </div>

        <div className="venue-dashboard-analytics-follower-compact-metric">
          <span>Followers</span>

          <strong>
            {totalFollowers}
          </strong>

          <small>
            Your current Livey audience
          </small>
        </div>

        <div className="venue-dashboard-analytics-follower-today-label">
          <span>Today</span>

          <small>
            Cyprus local time
          </small>
        </div>

        {todayActivity.length === 0 ? (
          <FollowerChartState
            title="No audience data today"
            description="Today’s follower activity will appear here as it happens."
          />
        ) : (
          <FollowerGrowthChart
            points={
              todayChartData.chartPoints
            }
            activity={todayActivity}
            range="today"
            labelInterval={4}
            hasMovement={
              todayChartData
                .totalMovements > 0
            }
          />
        )}

        <div className="venue-dashboard-analytics-follower-advanced-action">
          <button
            type="button"
            className="venue-dashboard-analytics-follower-advanced-button"
            onClick={() =>
              setIsAdvancedOpen(true)
            }
          >
            <span>
              View advanced analytics
            </span>

            <ExpandIcon />
          </button>
        </div>

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

      {isAdvancedOpen ? (
        <FollowerAdvancedModal
          analytics={analytics}
          selectedRange={selectedRange}
          onSelectRange={
            setSelectedRange
          }
          onRefresh={onRefresh}
          onClose={() =>
            setIsAdvancedOpen(false)
          }
        />
      ) : null}
    </>
  );
}

function FollowerAdvancedModal({
  analytics,
  selectedRange,
  onSelectRange,
  onRefresh,
  onClose,
}: {
  analytics: VenueDashboardAnalytics;
  selectedRange: FollowerGrowthRange;
  onSelectRange: (
    range: FollowerGrowthRange
  ) => void;
  onRefresh?: () => void;
  onClose: () => void;
}) {
  const activityRanges =
    analytics.followerActivityRanges ?? {
      today: [],
      last14Days: [],
      lastMonth: [],
      last6Months: [],
      lastYear: [],
    };

  const activity =
    getSelectedActivity(
      selectedRange,
      activityRanges
    );

  const totalFollowers =
    analytics.totalFollowers ?? 0;

  const rangeDetails =
    getFollowerRangeDetails(
      selectedRange
    );

  const chartData =
    buildChartData(
      activity,
      totalFollowers
    );

  const lastUpdated =
    formatFollowerAnalyticsUpdatedAt(
      analytics
        .followerAnalyticsGeneratedAt
    );

  return (
    <div
      className="venue-dashboard-analytics-follower-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="venue-dashboard-analytics-follower-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="advanced-follower-analytics-title"
      >
        <header className="venue-dashboard-analytics-follower-modal-header">
          <div>
            <span>
              Audience intelligence
            </span>

            <h2 id="advanced-follower-analytics-title">
              Advanced follower analytics
            </h2>

            <p>
              Explore how your Livey
              audience changes across
              different periods.
            </p>
          </div>

          <button
            type="button"
            className="venue-dashboard-analytics-follower-modal-close"
            aria-label="Close advanced follower analytics"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>

        <div
          className="venue-dashboard-analytics-follower-range-selector is-advanced"
          aria-label="Follower growth range"
        >
          <FollowerRangeButton
            label="Today"
            isActive={
              selectedRange ===
              "today"
            }
            onClick={() =>
              onSelectRange("today")
            }
          />

          <FollowerRangeButton
            label="Last 14 days"
            isActive={
              selectedRange ===
              "last14Days"
            }
            onClick={() =>
              onSelectRange(
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
              onSelectRange(
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
              onSelectRange(
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
              onSelectRange(
                "lastYear"
              )
            }
          />
        </div>

        <div className="venue-dashboard-analytics-follower-chart-meta is-advanced">
          <div className="is-primary">
            <span>Followers</span>

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
              {chartData.totalFollows}
            </strong>

            <small>
              Across{" "}
              {
                rangeDetails.summaryLabel
              }
            </small>
          </div>

          <div>
            <span>Unfollows</span>

            <strong>
              {
                chartData
                  .totalUnfollows
              }
            </strong>

            <small>
              Across{" "}
              {
                rangeDetails.summaryLabel
              }
            </small>
          </div>

          <div>
            <span>Net change</span>

            <strong>
              {formatSignedFollowerValue(
                chartData.netChange
              )}
            </strong>

            <small>
              Across{" "}
              {chartData.activePeriods}{" "}
              active{" "}
              {chartData
                .activePeriods === 1
                ? "period"
                : "periods"}
            </small>
          </div>
        </div>

        {activity.length === 0 ? (
          <FollowerChartState
            title="No follower history yet"
            description="Follower activity for this period will appear here once data becomes available."
          />
        ) : (
          <FollowerGrowthChart
            points={
              chartData.chartPoints
            }
            activity={activity}
            range={selectedRange}
            labelInterval={
              rangeDetails.labelInterval
            }
            hasMovement={
              chartData.totalMovements >
              0
            }
          />
        )}

        <footer className="venue-dashboard-analytics-follower-modal-footer">
          <span>
            {lastUpdated
              ? `Updated ${lastUpdated}`
              : "Update time unavailable"}
          </span>

          {onRefresh ? (
            <button
              type="button"
              className="venue-dashboard-analytics-refresh-button"
              disabled={
                analytics
                  .isFollowerAnalyticsLoading
              }
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
        </footer>
      </section>
    </div>
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
  range,
  labelInterval,
  hasMovement,
}: {
  points: ChartPoint[];
  activity: ChartActivityPoint[];
  range: FollowerGrowthRange;
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
        aria-label={`Total follower growth during ${
          getFollowerRangeDetails(
            range
          ).ariaLabel
        }`}
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
                      point,
                      range
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
              {formatActivityLabel(
                point.date,
                range
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
    CHART_TOP,
    CHART_TOP + chartHeight / 4,
    CHART_MIDDLE,
    CHART_TOP +
      (chartHeight / 4) * 3,
    CHART_BOTTOM,
  ];

  return (
    <g className="venue-dashboard-analytics-follower-chart-grid">
      {gridLines.map(
        (y, index) => (
          <line
            key={`${y}-${index}`}
            className={
              y === CHART_MIDDLE
                ? "is-baseline"
                : undefined
            }
            x1={CHART_LEFT}
            x2={CHART_RIGHT}
            y1={y}
            y2={y}
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

function buildChartData(
  activity: ChartActivityPoint[],
  totalFollowers: number
) {
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

  return {
    chartPoints,
    totalFollows,
    totalUnfollows,
    netChange,
    activePeriods,
    totalMovements:
      totalFollows +
      totalUnfollows,
  };
}

function normalizeTodayActivity(
  activity: VenueFollowerTodayPoint[]
): ChartActivityPoint[] {
  return activity.map((point) => ({
    date: point.timestamp,
    follows: point.follows,
    unfollows: point.unfollows,
  }));
}

function normalizeHistoricalActivity(
  activity: VenueFollowerActivityPoint[]
): ChartActivityPoint[] {
  return activity.map((point) => ({
    date: point.date,
    follows: point.follows,
    unfollows: point.unfollows,
  }));
}

function getSelectedActivity(
  range: FollowerGrowthRange,
  ranges: NonNullable<
    VenueDashboardAnalytics[
      "followerActivityRanges"
    ]
  >
): ChartActivityPoint[] {
  if (range === "today") {
    return normalizeTodayActivity(
      ranges.today
    );
  }

  return normalizeHistoricalActivity(
    ranges[range]
  );
}

function buildCumulativeFollowerGrowth(
  activity: ChartActivityPoint[],
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
  activity: ChartActivityPoint[],
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
  point: ChartPoint,
  range: FollowerGrowthRange
) {
  const movementLabel =
    point.movementType === "follow"
      ? "Follow"
      : "Unfollow";

  return (
    `${formatActivityTooltipDate(
      point.date,
      range
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
  if (range === "today") {
    return {
      summaryLabel: "today",
      ariaLabel:
        "today in Cyprus local time",
      labelInterval: 4,
    };
  }

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

function formatActivityLabel(
  value: string,
  range: FollowerGrowthRange
) {
  if (range === "today") {
    const hour =
      value.slice(11, 13);

    return `${hour}:00`;
  }

  return formatFollowerActivityDate(
    value
  );
}

function formatActivityTooltipDate(
  value: string,
  range: FollowerGrowthRange
) {
  if (range === "today") {
    const hour =
      value.slice(11, 13);

    return `Today at ${hour}:00`;
  }

  return formatFollowerActivityDate(
    value,
    true
  );
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
      timeZone: "Europe/Nicosia",
    }
  ).format(date);
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

function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M8 3H3v5" />
      <path d="M16 3h5v5" />
      <path d="M8 21H3v-5" />
      <path d="M16 21h5v-5" />
    </svg>
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