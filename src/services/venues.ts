import { supabase } from "../lib/supabase";
import type {
  LiveyVenue,
  LiveyVenueCategory,
  LiveyVenueStatus,
} from "../components/liveyVenues";

type SupabaseVenueEvent = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  display_time: string | null;
  is_live: boolean;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  priority: number;
};

type SupabaseVenueRow = {
  id: string;
  name: string;
  category: string;
  area: string;
  description: string | null;
  latitude: number;
  longitude: number;
  logo_url: string | null;
  verified: boolean;
  open_status: string;
  opening_hours: string | null;
  approval_status: string;
  priority: number;
  venue_events: SupabaseVenueEvent[];
};

function mapVenueFromSupabase(row: SupabaseVenueRow): LiveyVenue {
  const now = new Date();

  const sortedEvents = [...(row.venue_events ?? [])]
    .filter((event) => {
      if (event.is_active === false) return false;

      if (!event.ends_at) return true;

      return new Date(event.ends_at).getTime() > now.getTime();
    })
    .map((event) => {
      const timing = deriveEventTiming(event, now);

      return {
        ...event,
        derivedStatus: timing.status,
        derivedDisplayTime: timing.displayTime,
        derivedIsLive: timing.isLive,
        derivedStartsAtTime: timing.startsAtTime,
        derivedEndsAtTime: timing.endsAtTime,
      };
    })
    .sort((a, b) => {
      if (a.derivedIsLive && !b.derivedIsLive) return -1;
      if (!a.derivedIsLive && b.derivedIsLive) return 1;

      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      return a.derivedStartsAtTime - b.derivedStartsAtTime;
    });

  const event = sortedEvents[0];

  return {
    id: row.id,
    name: row.name,
    category: row.category as LiveyVenueCategory,
    area: row.area,
    status: (event?.derivedStatus ??
      row.open_status ??
      "Open now") as LiveyVenueStatus,
    eventTitle: event?.title ?? row.name,
    time: event?.derivedDisplayTime ?? row.opening_hours ?? "",
    description: event?.description ?? row.description ?? "",
    verified: row.verified,
    coordinates: [row.longitude, row.latitude],
    logoUrl: row.logo_url ?? "/Livey-Logo.png",
    driveTime: "8 min",
    walkTime: "24 min",
    openStatus: row.open_status,
    openingHours: row.opening_hours ?? "",
  };
}

function deriveEventTiming(
  event: SupabaseVenueEvent,
  now: Date
): {
  status: string;
  displayTime: string;
  isLive: boolean;
  startsAtTime: number;
  endsAtTime: number;
} {
  if (!event.starts_at || !event.ends_at) {
    return {
      status: event.status || "Open now",
      displayTime: event.display_time || "",
      isLive: Boolean(event.is_live),
      startsAtTime: event.starts_at
        ? new Date(event.starts_at).getTime()
        : Infinity,
      endsAtTime: event.ends_at ? new Date(event.ends_at).getTime() : Infinity,
    };
  }

  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);

  const startsAtTime = startsAt.getTime();
  const endsAtTime = endsAt.getTime();

  const isLive = now.getTime() >= startsAtTime && now.getTime() <= endsAtTime;

  if (isLive) {
    return {
      status: "Live now",
      displayTime: `Live now · until ${formatTime(endsAt)}`,
      isLive: true,
      startsAtTime,
      endsAtTime,
    };
  }

  if (isSameDay(startsAt, now)) {
    if (startsAt.getHours() >= 17) {
      return {
        status: "Tonight",
        displayTime: `Tonight · ${formatTime(startsAt)}–${formatTime(endsAt)}`,
        isLive: false,
        startsAtTime,
        endsAtTime,
      };
    }

    return {
      status: "Open now",
      displayTime: `Today · ${formatTime(startsAt)}–${formatTime(endsAt)}`,
      isLive: false,
      startsAtTime,
      endsAtTime,
    };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (isSameDay(startsAt, tomorrow)) {
    return {
      status: "Tomorrow",
      displayTime: `Tomorrow · ${formatTime(startsAt)}–${formatTime(endsAt)}`,
      isLive: false,
      startsAtTime,
      endsAtTime,
    };
  }

  if (isWeekend(startsAt)) {
    return {
      status: "Weekend",
      displayTime: `${formatWeekday(startsAt)} · ${formatTime(
        startsAt
      )}–${formatTime(endsAt)}`,
      isLive: false,
      startsAtTime,
      endsAtTime,
    };
  }

  return {
    status: "Scheduled",
    displayTime: `${formatShortDate(startsAt)} · ${formatTime(
      startsAt
    )}–${formatTime(endsAt)}`,
    isLive: false,
    startsAtTime,
    endsAtTime,
  };
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function isWeekend(date: Date) {
  const day = date.getDay();

  return day === 0 || day === 6;
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export async function fetchLiveyVenues(): Promise<LiveyVenue[]> {
  const { data, error } = await supabase
    .from("venues")
    .select(
      `
      id,
      name,
      category,
      area,
      description,
      latitude,
      longitude,
      logo_url,
      verified,
      open_status,
      opening_hours,
      approval_status,
      priority,
      venue_events (
        id,
        title,
        description,
        status,
        display_time,
        is_live,
        starts_at,
        ends_at,
        is_active,
        priority
      )
    `
    )
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .order("priority", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch Livey venues from Supabase:", error);
    throw error;
  }

  const rows = (data ?? []) as unknown as SupabaseVenueRow[];

  return rows.map(mapVenueFromSupabase);
}