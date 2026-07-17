import type {
  VenueDashboardEvent,
  VenueDashboardVenue,
} from "../../venueDashboardService";

export type AnalyticsTrendPoint = {
  key: string;
  label: string;
  accessibleLabel: string;
  count: number;
  isCurrent?: boolean;
  isFuture?: boolean;
};

export type AnalyticsPublishingRange =
  | "14-days"
  | "last-month"
  | "6-months"
  | "12-months";

export type AnalyticsPublishingSummaryData = {
  thisMonth: number;
  lastMonth: number;
  difference: number;
  percentageChange: number | null;
  direction: "up" | "down" | "same";
};

export type AnalyticsProfileRecommendation = {
  id: string;
  title: string;
  description: string;
};

export function buildPublishingTrend(
  events: VenueDashboardEvent[],
  numberOfDays = 14
): AnalyticsTrendPoint[] {
  return buildDailyPublishingTrend(
    events,
    numberOfDays
  );
}

export function buildCurrentWeekPublishingTrend(
  events: VenueDashboardEvent[]
): AnalyticsTrendPoint[] {
  const today = startOfDay(
    new Date()
  );

  const monday = new Date(today);

  const currentDay =
    today.getDay();

  const daysSinceMonday =
    currentDay === 0
      ? 6
      : currentDay - 1;

  monday.setDate(
    today.getDate() -
      daysSinceMonday
  );

  const points = Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date(
        monday
      );

      date.setDate(
        monday.getDate() + index
      );

      return {
        key: toLocalDateKey(date),
        label: formatWeekdayLetter(
          date
        ),
        accessibleLabel:
          formatFullTrendDate(date),
        count: 0,
        isCurrent:
          isSameLocalDate(
            date,
            today
          ),
        isFuture: date > today,
      };
    }
  );

  countEventsIntoDailyPoints(
    events,
    points
  );

  return points;
}

export function buildPublishingHistoryTrend(
  events: VenueDashboardEvent[],
  range: AnalyticsPublishingRange
): AnalyticsTrendPoint[] {
  if (range === "14-days") {
    return buildDailyPublishingTrend(
      events,
      14
    );
  }

  if (range === "last-month") {
    return buildPreviousMonthWeeklyTrend(
      events
    );
  }

  if (range === "6-months") {
    return buildMonthlyPublishingTrend(
      events,
      6
    );
  }

  return buildMonthlyPublishingTrend(
    events,
    12
  );
}

function buildDailyPublishingTrend(
  events: VenueDashboardEvent[],
  numberOfDays: number
): AnalyticsTrendPoint[] {
  const today = startOfDay(
    new Date()
  );

  const points = Array.from(
    { length: numberOfDays },
    (_, index) => {
      const date = new Date(today);

      date.setDate(
        today.getDate() -
          (numberOfDays -
            1 -
            index)
      );

      return {
        key: toLocalDateKey(date),
        label: formatTrendLabel(
          date
        ),
        accessibleLabel:
          formatFullTrendDate(date),
        count: 0,
        isCurrent:
          isSameLocalDate(
            date,
            today
          ),
      };
    }
  );

  countEventsIntoDailyPoints(
    events,
    points
  );

  return points;
}

function buildPreviousMonthWeeklyTrend(
  events: VenueDashboardEvent[]
): AnalyticsTrendPoint[] {
  const now = new Date();

  const previousMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  const previousMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    0
  );

  const totalDays =
    previousMonthEnd.getDate();

  const numberOfWeeks = Math.ceil(
    totalDays / 7
  );

  const points = Array.from(
    { length: numberOfWeeks },
    (_, index) => {
      const weekStartDay =
        index * 7 + 1;

      const weekEndDay = Math.min(
        weekStartDay + 6,
        totalDays
      );

      const weekStart = new Date(
        previousMonthStart.getFullYear(),
        previousMonthStart.getMonth(),
        weekStartDay
      );

      const weekEnd = new Date(
        previousMonthStart.getFullYear(),
        previousMonthStart.getMonth(),
        weekEndDay
      );

      return {
        key: `week-${index + 1}`,
        label: `W${index + 1}`,
        accessibleLabel:
          formatWeeklyTrendRange(
            weekStart,
            weekEnd
          ),
        count: 0,
      };
    }
  );

  events.forEach((event) => {
    const createdAt = new Date(
      event.created_at
    );

    if (
      Number.isNaN(
        createdAt.getTime()
      )
    ) {
      return;
    }

    if (
      createdAt < previousMonthStart ||
      createdAt >
        endOfLocalDay(
          previousMonthEnd
        )
    ) {
      return;
    }

    const weekIndex = Math.floor(
      (createdAt.getDate() - 1) / 7
    );

    const point =
      points[weekIndex];

    if (point) {
      point.count += 1;
    }
  });

  return points;
}

function buildMonthlyPublishingTrend(
  events: VenueDashboardEvent[],
  numberOfMonths: number
): AnalyticsTrendPoint[] {
  const now = new Date();

  const points = Array.from(
    { length: numberOfMonths },
    (_, index) => {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() -
          (numberOfMonths -
            1 -
            index),
        1
      );

      return {
        key: toLocalMonthKey(
          monthDate
        ),
        label:
          formatTrendMonthLabel(
            monthDate
          ),
        accessibleLabel:
          formatFullTrendMonth(
            monthDate
          ),
        count: 0,
        isCurrent:
          monthDate.getFullYear() ===
            now.getFullYear() &&
          monthDate.getMonth() ===
            now.getMonth(),
      };
    }
  );

  const pointsByKey = new Map(
    points.map((point) => [
      point.key,
      point,
    ])
  );

  events.forEach((event) => {
    const createdAt = new Date(
      event.created_at
    );

    if (
      Number.isNaN(
        createdAt.getTime()
      )
    ) {
      return;
    }

    const point = pointsByKey.get(
      toLocalMonthKey(
        createdAt
      )
    );

    if (point) {
      point.count += 1;
    }
  });

  return points;
}

function countEventsIntoDailyPoints(
  events: VenueDashboardEvent[],
  points: AnalyticsTrendPoint[]
) {
  const pointsByKey = new Map(
    points.map((point) => [
      point.key,
      point,
    ])
  );

  events.forEach((event) => {
    const createdAt = new Date(
      event.created_at
    );

    if (
      Number.isNaN(
        createdAt.getTime()
      )
    ) {
      return;
    }

    const point = pointsByKey.get(
      toLocalDateKey(
        createdAt
      )
    );

    if (point) {
      point.count += 1;
    }
  });
}

export function buildPublishingSummary(
  events: VenueDashboardEvent[]
): AnalyticsPublishingSummaryData {
  const now = new Date();

  const currentMonthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const nextMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );

  const previousMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  let thisMonth = 0;
  let lastMonth = 0;

  events.forEach((event) => {
    const createdAt = new Date(event.created_at);

    if (Number.isNaN(createdAt.getTime())) {
      return;
    }

    if (
      createdAt >= currentMonthStart &&
      createdAt < nextMonthStart
    ) {
      thisMonth += 1;
      return;
    }

    if (
      createdAt >= previousMonthStart &&
      createdAt < currentMonthStart
    ) {
      lastMonth += 1;
    }
  });

  const difference = thisMonth - lastMonth;

  let percentageChange: number | null = null;

  if (lastMonth > 0) {
    percentageChange = Math.round(
      (difference / lastMonth) * 100
    );
  }

  return {
    thisMonth,
    lastMonth,
    difference,
    percentageChange,
    direction:
      difference > 0
        ? "up"
        : difference < 0
          ? "down"
          : "same",
  };
}

export function getTimeUntilActivity(
  startsAt: string | null
) {
  if (!startsAt) {
    return null;
  }

  const startDate = new Date(startsAt);

  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const differenceMs =
    startDate.getTime() - Date.now();

  if (differenceMs <= 0) {
    return "Starting now";
  }

  const totalMinutes = Math.floor(
    differenceMs / (60 * 1000)
  );

  const days = Math.floor(
    totalMinutes / (60 * 24)
  );

  const hours = Math.floor(
    (totalMinutes % (60 * 24)) / 60
  );

  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0
      ? `${days}d ${hours}h`
      : `${days}d`;
  }

  if (hours > 0) {
    return minutes > 0
      ? `${hours}h ${minutes}m`
      : `${hours}h`;
  }

  return `${Math.max(minutes, 1)}m`;
}

export function getLiveActivityTiming(
  event: VenueDashboardEvent
) {
  if (!event.starts_at || !event.ends_at) {
    return null;
  }

  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);
  const now = new Date();

  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime())
  ) {
    return null;
  }

  if (now < startsAt || now > endsAt) {
    return null;
  }

  const elapsedMinutes = Math.max(
    0,
    Math.floor(
      (now.getTime() - startsAt.getTime()) /
        (60 * 1000)
    )
  );

  const remainingMinutes = Math.max(
    0,
    Math.ceil(
      (endsAt.getTime() - now.getTime()) /
        (60 * 1000)
    )
  );

  return {
    elapsed: formatDuration(elapsedMinutes),
    remaining: formatDuration(remainingMinutes),
  };
}

export function buildProfileRecommendations(
  venue: VenueDashboardVenue
): AnalyticsProfileRecommendation[] {
  const recommendations: AnalyticsProfileRecommendation[] =
    [];

  if (!venue.logo_url?.trim()) {
    recommendations.push({
      id: "logo",
      title: "Add your venue logo",
      description:
        "A clear logo makes the venue easier to recognise on the Livey map.",
    });
  }

  if (!venue.description?.trim()) {
    recommendations.push({
      id: "description",
      title: "Add a venue description",
      description:
        "Explain what makes your venue worth visiting and what people should expect.",
    });
  }

  if (!venue.opening_hours?.trim()) {
    recommendations.push({
      id: "opening-hours",
      title: "Complete opening hours",
      description:
        "Accurate opening hours help customers decide when to visit.",
    });
  }

  if (!venue.open_status?.trim()) {
    recommendations.push({
      id: "open-status",
      title: "Set your venue status",
      description:
        "Keep the current venue status accurate for people viewing Livey.",
    });
  }

  if (!venue.address?.trim()) {
    recommendations.push({
      id: "address",
      title: "Confirm the venue address",
      description:
        "Contact Livey support to complete or correct protected location details.",
    });
  }

  if (!venue.area?.trim() || !venue.city?.trim()) {
    recommendations.push({
      id: "location",
      title: "Complete location details",
      description:
        "Area and city details make the venue easier to discover and understand.",
    });
  }

  return recommendations;
}

function startOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(
    2,
    "0"
  );

  return `${year}-${month}-${day}`;
}

function toLocalMonthKey(
  date: Date
) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
}

function isSameLocalDate(
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

function formatWeekdayLetter(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "narrow",
    }
  ).format(date);
}

function formatFullTrendDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function formatTrendMonthLabel(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      month: "short",
    }
  ).format(date);
}

function formatFullTrendMonth(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function formatTrendLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatDuration(totalMinutes: number) {
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(
    totalMinutes / 60
  );
  const minutes = totalMinutes % 60;

  return minutes > 0
    ? `${hours}h ${minutes}m`
    : `${hours}h`;
}

function endOfLocalDay(
  date: Date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );
}

function formatWeeklyTrendRange(
  startDate: Date,
  endDate: Date
) {
  const sameMonth =
    startDate.getMonth() ===
      endDate.getMonth() &&
    startDate.getFullYear() ===
      endDate.getFullYear();

  if (sameMonth) {
    const monthAndYear =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          month: "long",
          year: "numeric",
        }
      ).format(endDate);

    return `${startDate.getDate()}–${endDate.getDate()} ${monthAndYear}`;
  }

  const formatter =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  return `${formatter.format(
    startDate
  )}–${formatter.format(endDate)}`;
}