import { defaultOpeningHours } from "./accountOptions";
import type { DayHours, OpeningHoursPreviewItem } from "./accountTypes";

export function buildOpeningHoursDraft(openingHours: string): DayHours[] {
  const draft = defaultOpeningHours.map((day) => ({ ...day }));

  const weekdayMatch = openingHours.match(
    /Weekdays\s+(\d{2}:\d{2})[–-](\d{2}:\d{2})/i
  );
  const weekendMatch = openingHours.match(
    /Weekends\s+(\d{2}:\d{2})[–-](\d{2}:\d{2})/i
  );

  if (weekdayMatch) {
    draft.slice(0, 5).forEach((day) => {
      day.openTime = weekdayMatch[1];
      day.closeTime = weekdayMatch[2];
      day.isClosed = false;
    });
  }

  if (weekendMatch) {
    draft.slice(5).forEach((day) => {
      day.openTime = weekendMatch[1];
      day.closeTime = weekendMatch[2];
      day.isClosed = false;
    });
  }

  openingHours.split("•").forEach((section) => {
    const cleanSection = section.trim();

    draft.forEach((day) => {
      if (!cleanSection.startsWith(day.shortDay)) return;

      if (cleanSection.toLowerCase().includes("closed")) {
        day.isClosed = true;
        return;
      }

      const timeMatch = cleanSection.match(
        /(\d{2}:\d{2})[–-](\d{2}:\d{2})/
      );

      if (timeMatch) {
        day.openTime = timeMatch[1];
        day.closeTime = timeMatch[2];
        day.isClosed = false;
      }
    });
  });

  return draft;
}

export function formatOpeningHours(days: DayHours[]) {
  const weekdayDays = days.slice(0, 5);
  const weekendDays = days.slice(5);

  const weekdayOpen = weekdayDays[0]?.openTime ?? "09:00";
  const weekdayClose = weekdayDays[0]?.closeTime ?? "18:00";
  const weekendOpen = weekendDays[0]?.openTime ?? "10:00";
  const weekendClose = weekendDays[0]?.closeTime ?? "22:00";

  const sameWeekdayHours = weekdayDays.every(
    (day) =>
      !day.isClosed &&
      day.openTime === weekdayOpen &&
      day.closeTime === weekdayClose
  );

  const sameWeekendHours = weekendDays.every(
    (day) =>
      !day.isClosed &&
      day.openTime === weekendOpen &&
      day.closeTime === weekendClose
  );

  if (sameWeekdayHours && sameWeekendHours) {
    return `Weekdays ${weekdayOpen}–${weekdayClose} • Weekends ${weekendOpen}–${weekendClose}`;
  }

  return days
    .map((day) =>
      day.isClosed
        ? `${day.shortDay} Closed`
        : `${day.shortDay} ${day.openTime}–${day.closeTime}`
    )
    .join(" • ");
}

export function getOpeningHoursPreview(
  openingHours: string
): OpeningHoursPreviewItem[] {
  const days = buildOpeningHoursDraft(openingHours);

  const weekdayDays = days.slice(0, 5);
  const weekendDays = days.slice(5);

  const weekdayOpen = weekdayDays[0]?.openTime ?? "09:00";
  const weekdayClose = weekdayDays[0]?.closeTime ?? "18:00";
  const weekendOpen = weekendDays[0]?.openTime ?? "10:00";
  const weekendClose = weekendDays[0]?.closeTime ?? "22:00";

  const sameWeekdayHours = weekdayDays.every(
    (day) =>
      !day.isClosed &&
      day.openTime === weekdayOpen &&
      day.closeTime === weekdayClose
  );

  const sameWeekendHours = weekendDays.every(
    (day) =>
      !day.isClosed &&
      day.openTime === weekendOpen &&
      day.closeTime === weekendClose
  );

  if (openingHours && sameWeekdayHours && sameWeekendHours) {
    return [
      {
        title: "Weekdays",
        value: `${weekdayOpen}–${weekdayClose}`,
      },
      {
        title: "Weekend",
        value: `${weekendOpen}–${weekendClose}`,
      },
    ];
  }

  return days.map((day) => ({
    title: day.shortDay,
    value: day.isClosed ? "Closed" : `${day.openTime}–${day.closeTime}`,
  }));
}