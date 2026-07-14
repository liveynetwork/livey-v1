import type {
  VenueDashboardAnalytics,
  VenueFollowerGrowthPoint,
} from "../../venueDashboardService";
import { AnalyticsSectionHeading } from "./AnalyticsSectionHeading";

type AnalyticsFollowerGrowthProps = {
  analytics: VenueDashboardAnalytics;
  onRefresh?: () => void;
};

type ChartPoint = VenueFollowerGrowthPoint & {
  x: number;
  y: number;
};

const CHART_WIDTH = 1000;
const CHART_HEIGHT = 280;
const CHART_TOP = 22;
const CHART_BOTTOM = 226;
const CHART_LEFT = 28;
const CHART_RIGHT = 972;

export function AnalyticsFollowerGrowth({
  analytics,
  onRefresh,
}: AnalyticsFollowerGrowthProps) {
  const growth =
    analytics.followerGrowthLast30Days ?? [];

  if (analytics.isFollowerAnalyticsLoading) {
    return (
      <section className="venue-dashboard-analytics-card venue-dashboard-analytics-follower-chart-card">
        <AnalyticsSectionHeading
          eyebrow="Audience growth"
          title="Follower growth"
          description="See how your Livey audience has grown during the last 30 days."
        />

        <FollowerChartState>
          Loading follower growth...
        </FollowerChartState>
      </section>
    );
  }

  if (analytics.followerAnalyticsError) {
    return (
      <section className="venue-dashboard-analytics-card venue-dashboard-analytics-follower-chart-card">
        <AnalyticsSectionHeading
          eyebrow="Audience growth"
          title="Follower growth"
          description="See how your Livey audience has grown during the last 30 days."
        />

        <FollowerChartState isError>
          Follower growth could not be loaded right now.
        </FollowerChartState>
      </section>
    );
  }

  const chartPoints =
    buildFollowerChartPoints(growth);

  const totalGrowth = growth.reduce(
    (total, point) =>
      total + point.newFollowers,
    0
  );

  const activeGrowthDays =
  growth.filter(
    (point) => point.newFollowers > 0
  ).length;

const averagePerActiveDay =
  activeGrowthDays > 0
    ? totalGrowth / activeGrowthDays
    : 0;

  const bestDay = growth.reduce<
    VenueFollowerGrowthPoint | null
  >((currentBest, point) => {
    if (
      !currentBest ||
      point.newFollowers >
        currentBest.newFollowers
    ) {
      return point;
    }

    return currentBest;
  }, null);

  const lastUpdated =
    formatFollowerAnalyticsUpdatedAt(
      analytics.followerAnalyticsGeneratedAt
    );

  return (
    <section className="venue-dashboard-analytics-card venue-dashboard-analytics-follower-chart-card">
      <AnalyticsSectionHeading
        eyebrow="Audience growth"
        title="Follower growth"
        description="See how many people followed your venue on each day during the last 30 days."
      />

      {onRefresh ? (
  <button
    type="button"
    className="venue-dashboard-analytics-refresh-button"
    disabled={
      analytics.isFollowerAnalyticsLoading
    }
    onClick={onRefresh}
  >
    {analytics.isFollowerAnalyticsLoading
      ? "Refreshing..."
      : "Refresh data"}
  </button>
) : null}

      <div className="venue-dashboard-analytics-follower-chart-meta">
  <div>
    <span>New followers</span>
    <strong>+{totalGrowth}</strong>
    <small>Last 30 days</small>
  </div>

  <div>
    <span>Best day</span>
    <strong>
      +{bestDay?.newFollowers ?? 0}
    </strong>
    <small>
      {bestDay
        ? formatFollowerGrowthDate(
            bestDay.date,
            true
          )
        : "No follower activity"}
    </small>
  </div>

  <div>
    <span>Active growth days</span>
    <strong>{activeGrowthDays}</strong>
    <small>
      Days with new followers
    </small>
  </div>

  <div>
    <span>Average</span>
    <strong>
      {averagePerActiveDay.toFixed(1)}
    </strong>
    <small>
      Per active growth day
    </small>
  </div>
</div>

      {growth.length === 0 ? (
  <FollowerChartState>
    No follower history is available yet.
  </FollowerChartState>
) : totalGrowth === 0 ? (
  <FollowerChartState>
    No new followers in the last 30 days yet.
  </FollowerChartState>
) : (
  <FollowerGrowthChart
    points={chartPoints}
  />
)}

      <footer className="venue-dashboard-analytics-follower-chart-footer">
        <span className="venue-dashboard-analytics-follower-live-status">
          <i />
          Livey audience data
        </span>

        <span>
          {lastUpdated
            ? `Last updated ${lastUpdated}`
            : "Update time unavailable"}
        </span>
      </footer>
    </section>
  );
}

function FollowerGrowthChart({
  points,
}: {
  points: ChartPoint[];
}) {
  const linePath = buildLinePath(points);

  const areaPath = buildAreaPath(
    points,
    linePath
  );

  const visibleLabels = points.filter(
    (_, index) =>
      index === 0 ||
      index === points.length - 1 ||
      index % 7 === 0
  );

  return (
    <div className="venue-dashboard-analytics-follower-chart-shell">
      <svg
        className="venue-dashboard-analytics-follower-chart-svg"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label="New followers during the last 30 days"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="liveyFollowerChartFill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#ff5b32"
              stopOpacity="0.28"
            />

            <stop
              offset="100%"
              stopColor="#ff5b32"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        <ChartGrid />

        <path
          className="venue-dashboard-analytics-follower-chart-area"
          d={areaPath}
        />

        <path
          className="venue-dashboard-analytics-follower-chart-line"
          d={linePath}
        />

        {points.map((point) => (
          <g key={point.date}>
            <circle
              className={
                point.newFollowers > 0
                  ? "venue-dashboard-analytics-follower-chart-point is-active"
                  : "venue-dashboard-analytics-follower-chart-point"
              }
              cx={point.x}
              cy={point.y}
              r={
                point.newFollowers > 0
                  ? 5
                  : 3
              }
            />

            <title>
              {`${formatFollowerGrowthDate(
                point.date,
                true
              )}: ${point.newFollowers} new follower${
                point.newFollowers === 1
                  ? ""
                  : "s"
              }`}
            </title>
          </g>
        ))}
      </svg>

      <div className="venue-dashboard-analytics-follower-chart-labels">
        {visibleLabels.map((point) => (
          <span
            key={point.date}
            style={{
              left: `${point.x / 10}%`,
            }}
          >
            {formatFollowerGrowthDate(
              point.date
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChartGrid() {
  return (
    <g className="venue-dashboard-analytics-follower-chart-grid">
      {[0, 1, 2, 3].map((line) => {
        const y =
          CHART_TOP +
          ((CHART_BOTTOM - CHART_TOP) /
            3) *
            line;

        return (
          <line
            key={line}
            x1={CHART_LEFT}
            x2={CHART_RIGHT}
            y1={y}
            y2={y}
          />
        );
      })}
    </g>
  );
}

function FollowerChartState({
  children,
  isError = false,
}: {
  children: string;
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
      {children}
    </div>
  );
}

function buildFollowerChartPoints(
  growth: VenueFollowerGrowthPoint[]
): ChartPoint[] {
  if (growth.length === 0) {
    return [];
  }

  const highestValue = Math.max(
    ...growth.map(
      (point) => point.newFollowers
    ),
    1
  );

  const chartWidth =
    CHART_RIGHT - CHART_LEFT;

  const chartHeight =
    CHART_BOTTOM - CHART_TOP;

  return growth.map((point, index) => {
    const x =
      growth.length === 1
        ? CHART_LEFT + chartWidth / 2
        : CHART_LEFT +
          (index /
            (growth.length - 1)) *
            chartWidth;

    const y =
      CHART_BOTTOM -
      (point.newFollowers /
        highestValue) *
        chartHeight;

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
        index === 0 ? "M" : "L";

      return `${command} ${point.x} ${point.y}`;
    })
    .join(" ");
}

function buildAreaPath(
  points: ChartPoint[],
  linePath: string
) {
  if (points.length === 0) {
    return "";
  }

  const firstPoint = points[0];
  const lastPoint =
    points[points.length - 1];

  return [
    linePath,
    `L ${lastPoint.x} ${CHART_BOTTOM}`,
    `L ${firstPoint.x} ${CHART_BOTTOM}`,
    "Z",
  ].join(" ");
}

function formatFollowerGrowthDate(
  dateValue: string,
  includeYear = false
) {
  const date = new Date(
    `${dateValue}T00:00:00.000Z`
  );

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      ...(includeYear
        ? { year: "numeric" }
        : {}),
      timeZone: "UTC",
    }
  ).format(date);
}

function formatFollowerAnalyticsUpdatedAt(
  value: string | null | undefined
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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