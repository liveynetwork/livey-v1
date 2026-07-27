import type {
  VenueDashboardEvent,
} from "../../venueDashboardService";
import {
  getHistoryEventTimestamp,
} from "./historyUtils";

export type HistorySortOrder =
  | "newest"
  | "oldest";

export type HistoryDateGroup = {
  key: string;
  label: string;
  events: VenueDashboardEvent[];
};

export function groupHistoryEventsByDate(
  events: VenueDashboardEvent[],
  order: HistorySortOrder
): HistoryDateGroup[] {
  const now = new Date();

  const todayStart =
    startOfLocalDay(now);

  const yesterdayStart =
    addLocalDays(todayStart, -1);

  const tomorrowStart =
    addLocalDays(todayStart, 1);

  const currentWeekStart =
    startOfMondayWeek(now);

  const currentMonthStart =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

  const groups = new Map<
    string,
    HistoryDateGroup
  >();

  for (const event of events) {
    const timestamp =
      getHistoryEventTimestamp(event);

    const eventDate =
      timestamp > 0
        ? new Date(timestamp)
        : null;

    const groupDefinition =
      getHistoryGroupDefinition({
        eventDate,
        todayStart,
        yesterdayStart,
        tomorrowStart,
        currentWeekStart,
        currentMonthStart,
      });

    const existingGroup =
      groups.get(groupDefinition.key);

    if (existingGroup) {
      existingGroup.events.push(event);
      continue;
    }

    groups.set(
      groupDefinition.key,
      {
        key: groupDefinition.key,
        label: groupDefinition.label,
        events: [event],
      }
    );
  }

  const groupedEvents =
    Array.from(groups.values());

  groupedEvents.forEach((group) => {
    group.events.sort(
      (firstEvent, secondEvent) => {
        const firstTimestamp =
          getHistoryEventTimestamp(
            firstEvent
          );

        const secondTimestamp =
          getHistoryEventTimestamp(
            secondEvent
          );

        return order === "newest"
          ? secondTimestamp -
              firstTimestamp
          : firstTimestamp -
              secondTimestamp;
      }
    );
  });

  return groupedEvents.sort(
    (firstGroup, secondGroup) => {
      const firstTimestamp =
        getGroupTimestamp(
          firstGroup,
          order
        );

      const secondTimestamp =
        getGroupTimestamp(
          secondGroup,
          order
        );

      return order === "newest"
        ? secondTimestamp -
            firstTimestamp
        : firstTimestamp -
            secondTimestamp;
    }
  );
}

type HistoryGroupDefinitionInput = {
  eventDate: Date | null;
  todayStart: Date;
  yesterdayStart: Date;
  tomorrowStart: Date;
  currentWeekStart: Date;
  currentMonthStart: Date;
};

function getHistoryGroupDefinition({
  eventDate,
  todayStart,
  yesterdayStart,
  tomorrowStart,
  currentWeekStart,
  currentMonthStart,
}: HistoryGroupDefinitionInput) {
  if (!eventDate) {
    return {
      key: "unknown-date",
      label: "Unknown date",
    };
  }

  if (
    eventDate >= todayStart &&
    eventDate < tomorrowStart
  ) {
    return {
      key: "today",
      label: "Today",
    };
  }

  if (
    eventDate >= yesterdayStart &&
    eventDate < todayStart
  ) {
    return {
      key: "yesterday",
      label: "Yesterday",
    };
  }

  if (
    eventDate >= currentWeekStart &&
    eventDate < yesterdayStart
  ) {
    return {
      key: "this-week",
      label: "This week",
    };
  }

  if (
    eventDate >= currentMonthStart &&
    eventDate < currentWeekStart
  ) {
    return {
      key: "earlier-this-month",
      label: "Earlier this month",
    };
  }

  return {
    key: formatMonthKey(eventDate),
    label: formatMonthLabel(eventDate),
  };
}

function getGroupTimestamp(
  group: HistoryDateGroup,
  order: HistorySortOrder
) {
  if (group.events.length === 0) {
    return 0;
  }

  const timestamp =
    getHistoryEventTimestamp(
      group.events[0]
    );

  if (order === "newest") {
    return timestamp;
  }

  return timestamp;
}

function startOfLocalDay(
  date: Date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function startOfMondayWeek(
  date: Date
) {
  const dayStart =
    startOfLocalDay(date);

  const currentDay =
    dayStart.getDay();

  const daysSinceMonday =
    currentDay === 0
      ? 6
      : currentDay - 1;

  return addLocalDays(
    dayStart,
    -daysSinceMonday
  );
}

function addLocalDays(
  date: Date,
  days: number
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days
  );
}

function formatMonthKey(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  return `${year}-${month}`;
}

function formatMonthLabel(
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