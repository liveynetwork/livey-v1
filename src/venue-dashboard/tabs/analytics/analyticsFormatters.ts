export function calculateAnalyticsPercentage(
  value: number,
  total: number
) {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return 0;
  }

  return clampAnalyticsPercentage(
    Math.round((value / total) * 100)
  );
}

export function clampAnalyticsPercentage(
  percentage: number
) {
  if (!Number.isFinite(percentage)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(Math.round(percentage), 100)
  );
}

export function formatAnalyticsActivityDate(
  value: string | null
) {
  if (!value) {
    return "Time not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}