import type {
  VenueActivityStatus,
} from "../venueDashboardService";

export function toDateTimeLocalValue(
  isoValue: string | null
) {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);

  const timezoneOffsetMs =
    date.getTimezoneOffset() *
    60 *
    1000;

  const localDate = new Date(
    date.getTime() -
      timezoneOffsetMs
  );

  return localDate
    .toISOString()
    .slice(0, 16);
}

export function getPreviewTiming(
  startsAtValue: string,
  endsAtValue: string
) {
  if (
    !startsAtValue ||
    !endsAtValue
  ) {
    return {
      status:
        "Scheduled" as VenueActivityStatus,
      displayTime:
        "Choose start and end time",
    };
  }

  const startsAt =
    new Date(startsAtValue);

  const endsAt =
    new Date(endsAtValue);

  if (
    Number.isNaN(
      startsAt.getTime()
    ) ||
    Number.isNaN(
      endsAt.getTime()
    )
  ) {
    return {
      status:
        "Scheduled" as VenueActivityStatus,
      displayTime:
        "Choose start and end time",
    };
  }

  if (endsAt <= startsAt) {
    return {
      status:
        "Scheduled" as VenueActivityStatus,
      displayTime:
        "End time must be after start time",
    };
  }

  const now = new Date();

  const isLive =
    now >= startsAt &&
    now <= endsAt;

  if (isLive) {
    return {
      status:
        "Live now" as VenueActivityStatus,
      displayTime:
        `Live now · until ${formatTime(
          endsAt
        )}`,
    };
  }

  if (isSameDay(startsAt, now)) {
    if (startsAt.getHours() >= 17) {
      return {
        status:
          "Tonight" as VenueActivityStatus,
        displayTime:
          `Tonight · ${formatTime(
            startsAt
          )}–${formatTime(
            endsAt
          )}`,
      };
    }

    return {
      status:
        "Open now" as VenueActivityStatus,
      displayTime:
        `Today · ${formatTime(
          startsAt
        )}–${formatTime(
          endsAt
        )}`,
    };
  }

  const tomorrow = new Date(now);

  tomorrow.setDate(
    now.getDate() + 1
  );

  if (
    isSameDay(
      startsAt,
      tomorrow
    )
  ) {
    return {
      status:
        "Tomorrow" as VenueActivityStatus,
      displayTime:
        `Tomorrow · ${formatTime(
          startsAt
        )}–${formatTime(
          endsAt
        )}`,
    };
  }

  if (isWeekend(startsAt)) {
    return {
      status:
        "Weekend" as VenueActivityStatus,
      displayTime:
        `${formatWeekday(
          startsAt
        )} · ${formatTime(
          startsAt
        )}–${formatTime(
          endsAt
        )}`,
    };
  }

  return {
    status:
      "Scheduled" as VenueActivityStatus,
    displayTime:
      `${formatShortDate(
        startsAt
      )} · ${formatTime(
        startsAt
      )}–${formatTime(
        endsAt
      )}`,
  };
}

function isSameDay(
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

function isWeekend(date: Date) {
  const day = date.getDay();

  return day === 0 || day === 6;
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "long",
    }
  ).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
    }
  ).format(date);
}