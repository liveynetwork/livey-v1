import { supabase } from "../lib/supabase";
import { dashboardSupabase } from "../lib/dashboardSupabase";
import { uploadVenueLogo } from "../services/venueLogoUpload";

export type VenueActivityStatus =
  | "Live now"
  | "Open now"
  | "Tonight"
  | "Tomorrow"
  | "Weekend"
  | "Scheduled";

export type VenueDashboardVenue = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  area: string | null;
  address: string | null;
  description: string | null;
  logo_url: string | null;
  verified: boolean | null;
  open_status: string | null;
  opening_hours: string | null;
};

export type UpdateVenueProfileInput = {
  venueId: string;
  name?: string;
  category?: string | null;
  area?: string | null;
  address?: string | null;
  description?: string | null;
  openStatus?: string | null;
  openingHours?: string | null;
  logoFile?: File | null;
};

type UpdateVenueProfileResponse = {
  venue?: VenueDashboardVenue;
};

export type VenueDashboardEvent = {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  status: VenueActivityStatus;
  display_time: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_live: boolean | null;
  is_active: boolean | null;
  deleted_at: string | null;
  deleted_reason: string | null;
  created_at: string;
};

export type VenueDashboardData = {
  venue: VenueDashboardVenue;
  events: VenueDashboardEvent[];
};

export type VenueFollowerGrowthPoint = {
  date: string;
  newFollowers: number;
};

export type VenueFollowerActivityPoint = {
  date: string;
  follows: number;
  unfollows: number;
};

export type VenueFollowerTodayPoint = {
  timestamp: string;
  follows: number;
  unfollows: number;
};

export type VenueFollowerActivityRanges = {
  today: VenueFollowerTodayPoint[];
  last14Days: VenueFollowerActivityPoint[];
  lastMonth: VenueFollowerActivityPoint[];
  last6Months: VenueFollowerActivityPoint[];
  lastYear: VenueFollowerActivityPoint[];
};

export type VenueNetFollowerGrowthPoint = {
  date: string;
  netFollowers: number;
};

export type VenueFollowerGrowthRanges = {
  last14Days: VenueNetFollowerGrowthPoint[];
  lastMonth: VenueNetFollowerGrowthPoint[];
  last6Months: VenueNetFollowerGrowthPoint[];
  lastYear: VenueNetFollowerGrowthPoint[];
};

export type VenueDashboardAnalytics = {
  totalActivities: number;
  visibleActivities: number;
  hiddenActivities: number;
  liveNowActivities: number;
  upcomingActivities: number;
  expiredActivities: number;
  removedActivities: number;
  historyActivities: number;
  profileCompleteness: number;
  profileCompletedFields: string[];
  profileMissingFields: string[]; 
  nextActivity: VenueDashboardEvent | null;
  currentLiveActivity: VenueDashboardEvent | null;

  totalFollowers?: number;
  newFollowersLast7Days?: number;
  newFollowersLast30Days?: number;
  followerGrowthLast30Days?: VenueFollowerGrowthPoint[];
followerGrowthRanges?: VenueFollowerGrowthRanges;
followerActivityRanges?: VenueFollowerActivityRanges;
followerAnalyticsGeneratedAt?: string | null;
  isFollowerAnalyticsLoading?: boolean;
  followerAnalyticsError?: string;
};

export type VenueFollowerAnalytics = {
  totalFollowers: number;
  newFollowersLast7Days: number;
  newFollowersLast30Days: number;
  followerGrowthLast30Days: VenueFollowerGrowthPoint[];
  followerGrowthRanges: VenueFollowerGrowthRanges;
  followerActivityRanges: VenueFollowerActivityRanges;
  generatedAt: string | null;
};

type VenueFollowerActivityResponsePoint = {
  date?: string;
  follows?: number;
  unfollows?: number;
};

type VenueFollowerTodayResponsePoint = {
  timestamp?: string;
  follows?: number;
  unfollows?: number;
};

type VenueFollowerAnalyticsResponse = {
  followers?: {
    total?: number;
    new_last_7_days?: number;
    new_last_30_days?: number;

    growth_last_30_days?: Array<{
      date?: string;
      new_followers?: number;
    }>;

    activity?: {
  today?: VenueFollowerTodayResponsePoint[];
  last_14_days?: VenueFollowerActivityResponsePoint[];
  last_month?: VenueFollowerActivityResponsePoint[];
  last_6_months?: VenueFollowerActivityResponsePoint[];
  last_year?: VenueFollowerActivityResponsePoint[];
};
  };

  generated_at?: string;
};

export type UpdateVenueEventInput = {
  eventId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export type CreateVenueEventInput = {
  venueId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export type DeleteVenueEventInput = {
  eventId: string;
  reason?: string;
};

export type RestoreVenueEventInput = {
  eventId: string;
};

type ManageActivityResponse = {
  event?: VenueDashboardEvent;
};

export async function getVenueDashboardData(): Promise<
  VenueDashboardData[]
> {
  const ownedVenueIds = await getOwnedVenueIds();

  if (ownedVenueIds.length === 0) {
    return [];
  }

  const { data: venues, error: venuesError } = await supabase
    .from("venues")
    .select(
      "id, name, category, city, area, address, description, logo_url, verified, open_status, opening_hours"
    )
    .in("id", ownedVenueIds)
    .order("created_at", { ascending: false });

  if (venuesError) {
    throw venuesError;
  }

  const { data: events, error: eventsError } = await supabase
    .from("venue_events")
    .select(
      "id, venue_id, title, description, status, display_time, starts_at, ends_at, is_live, is_active, deleted_at, deleted_reason, created_at"
    )
    .in("venue_id", ownedVenueIds)
    .order("starts_at", {
      ascending: true,
      nullsFirst: false,
    });

  if (eventsError) {
    throw eventsError;
  }

  return (venues ?? []).map((venue) => ({
    venue: venue as VenueDashboardVenue,
    events: ((events ?? []).filter(
      (event) => event.venue_id === venue.id
    ) ?? []) as VenueDashboardEvent[],
  }));
}

export async function getVenueFollowerAnalytics(
  venueId: string
): Promise<VenueFollowerAnalytics> {
  await assertUserOwnsVenue(venueId);

  const { data, error } =
    await dashboardSupabase.functions.invoke<VenueFollowerAnalyticsResponse>(
      "dashboard-get-venue-analytics",
      {
        body: {
          app_venue_id: venueId,
        },
      }
    );

  if (error) {
    throw error;
  }

  const followerActivityRanges: VenueFollowerActivityRanges = {
  today: normalizeFollowerTodayActivity(
    data?.followers?.activity?.today
  ),

  last14Days: normalizeFollowerActivity(
    data?.followers?.activity?.last_14_days
  ),

    lastMonth: normalizeFollowerActivity(
      data?.followers?.activity?.last_month
    ),

    last6Months: normalizeFollowerActivity(
      data?.followers?.activity?.last_6_months
    ),

    lastYear: normalizeFollowerActivity(
      data?.followers?.activity?.last_year
    ),
  };

  return {
    totalFollowers: normalizeAnalyticsCount(
      data?.followers?.total
    ),

    newFollowersLast7Days: normalizeAnalyticsCount(
      data?.followers?.new_last_7_days
    ),

    newFollowersLast30Days: normalizeAnalyticsCount(
      data?.followers?.new_last_30_days
    ),

    followerGrowthLast30Days: normalizeFollowerGrowth(
      data?.followers?.growth_last_30_days
    ),

    /*
     * Temporary compatibility data.
     * The current chart still expects net
     * values until its next update.
     */
    followerGrowthRanges:
      convertFollowerActivityRangesToNet(
        followerActivityRanges
      ),

    followerActivityRanges,

    generatedAt: normalizeGeneratedAt(
      data?.generated_at
    ),
  };
}

export async function createVenueEvent(
  input: CreateVenueEventInput
): Promise<VenueDashboardEvent> {
  await assertUserOwnsVenue(input.venueId);

  const event = await manageVenueActivity({
    action: "create",
    app_venue_id: input.venueId,
    title: input.title,
    description: input.description,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    is_active: input.isActive,
  });

  return event;
}

export async function updateVenueEvent(
  input: UpdateVenueEventInput
): Promise<void> {
  const ownedVenueIds = await getOwnedVenueIds();

  if (ownedVenueIds.length === 0) {
    throw new Error(
      "This account is not connected to a venue."
    );
  }

  const event = await getExistingOwnedEvent(
    input.eventId,
    ownedVenueIds
  );

  await manageVenueActivity({
    action: "update",
    app_venue_id: event.venue_id,
    event_id: input.eventId,
    title: input.title,
    description: input.description,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    is_active: input.isActive,
  });
}

export async function deleteVenueEvent(
  input: DeleteVenueEventInput
): Promise<void> {
  const ownedVenueIds = await getOwnedVenueIds();

  if (ownedVenueIds.length === 0) {
    throw new Error(
      "This account is not connected to a venue."
    );
  }

  const event = await getExistingOwnedEvent(
    input.eventId,
    ownedVenueIds
  );

  await manageVenueActivity({
    action: "delete",
    app_venue_id: event.venue_id,
    event_id: input.eventId,
    deleted_reason:
      input.reason || "Removed by venue owner",
  });
}

export async function restoreVenueEvent(
  input: RestoreVenueEventInput
): Promise<VenueDashboardEvent> {
  const ownedVenueIds = await getOwnedVenueIds();

  if (ownedVenueIds.length === 0) {
    throw new Error(
      "This account is not connected to a venue."
    );
  }

  const event = await getExistingOwnedEvent(
    input.eventId,
    ownedVenueIds
  );

  const restoredEvent = await manageVenueActivity({
    action: "restore",
    app_venue_id: event.venue_id,
    event_id: input.eventId,
  });

  return restoredEvent;
}

export async function updateVenueProfile(
  input: UpdateVenueProfileInput
): Promise<VenueDashboardVenue> {
  await assertUserOwnsVenue(input.venueId);

  const logoUrl = input.logoFile
    ? await uploadVenueLogo(input.logoFile, {
        folder: "dashboard",
      })
    : undefined;

  const { data, error } =
    await dashboardSupabase.functions.invoke<UpdateVenueProfileResponse>(
      "dashboard-update-venue-profile",
      {
        body: {
          app_venue_id: input.venueId,
          name: input.name,
          category: input.category,
          area: input.area,
          address: input.address,
          description: input.description,
          open_status: input.openStatus,
          opening_hours: input.openingHours,
          logo_url: logoUrl,
        },
      }
    );

  if (error) {
    throw error;
  }

  if (!data?.venue) {
    throw new Error(
      "The venue profile response was empty."
    );
  }

  return data.venue;
}

async function manageVenueActivity(input: {
  action: "create" | "update" | "delete" | "restore";
  app_venue_id: string;
  event_id?: string;
  title?: string;
  description?: string;
  starts_at?: string;
  ends_at?: string;
  is_active?: boolean;
  deleted_reason?: string;
}): Promise<VenueDashboardEvent> {
  const { data, error } =
    await dashboardSupabase.functions.invoke<ManageActivityResponse>(
      "dashboard-manage-venue-activity",
      {
        body: input,
      }
    );

  if (error) {
    throw error;
  }

  if (!data?.event) {
    throw new Error(
      "The activity response was empty."
    );
  }

  return data.event;
}

async function getExistingOwnedEvent(
  eventId: string,
  ownedVenueIds: string[]
): Promise<Pick<VenueDashboardEvent, "id" | "venue_id">> {
  const { data, error } = await supabase
    .from("venue_events")
    .select("id, venue_id")
    .eq("id", eventId)
    .in("venue_id", ownedVenueIds)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "This activity does not belong to your venue."
    );
  }

  return data;
}

export function buildVenueDashboardAnalytics(
  venue: VenueDashboardVenue,
  events: VenueDashboardEvent[]
): VenueDashboardAnalytics {
  const now = Date.now();

  const removedActivities = events.filter((event) =>
    Boolean(event.deleted_at)
  );

  const expiredActivities = events.filter((event) => {
    if (event.deleted_at) {
      return false;
    }

    if (!event.ends_at) {
      return false;
    }

    return new Date(event.ends_at).getTime() < now;
  });

  const historyActivities = [
    ...removedActivities,
    ...expiredActivities,
  ];

  const activeOrUpcomingActivities = events.filter((event) => {
    if (event.deleted_at) {
      return false;
    }

    if (!event.ends_at) {
      return true;
    }

    return new Date(event.ends_at).getTime() >= now;
  });

  const visibleActivities =
    activeOrUpcomingActivities.filter(
      (event) => event.is_active !== false
    );

  const hiddenActivities =
    activeOrUpcomingActivities.filter(
      (event) => event.is_active === false
    );

  const liveNowActivities = visibleActivities.filter((event) => {
    if (event.is_live === true) {
      return true;
    }

    if (!event.starts_at || !event.ends_at) {
      return false;
    }

    const startsAtTime = new Date(
      event.starts_at
    ).getTime();

    const endsAtTime = new Date(
      event.ends_at
    ).getTime();

    return (
      now >= startsAtTime &&
      now <= endsAtTime
    );
  });

  const upcomingActivities = visibleActivities.filter((event) => {
    if (!event.starts_at) {
      return false;
    }

    return new Date(event.starts_at).getTime() > now;
  });

  const nextActivity =
    upcomingActivities
      .slice()
      .sort((firstEvent, secondEvent) => {
        const firstTime = firstEvent.starts_at
          ? new Date(firstEvent.starts_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        const secondTime = secondEvent.starts_at
          ? new Date(secondEvent.starts_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        return firstTime - secondTime;
      })[0] ?? null;

  const currentLiveActivity =
    liveNowActivities[0] ?? null;

  const profileFields = [
  {
    label: "Venue logo",
    value: venue.logo_url,
  },
  {
    label: "Description",
    value: venue.description,
  },
  {
    label: "Opening hours",
    value: venue.opening_hours,
  },
  {
    label: "Open status",
    value: venue.open_status,
  },
];

  const completedProfileFields = profileFields.filter(
    (field) =>
      Boolean(
        String(field.value ?? "").trim()
      )
  );

  const profileCompletedFields =
  completedProfileFields.map(
    (field) => field.label
  );

  const profileMissingFields = profileFields
    .filter(
      (field) =>
        !String(field.value ?? "").trim()
    )
    .map((field) => field.label);

  const profileCompleteness = Math.round(
    (completedProfileFields.length /
      profileFields.length) *
      100
  );

  return {
    totalActivities: events.length,
    visibleActivities: visibleActivities.length,
    hiddenActivities: hiddenActivities.length,
    liveNowActivities: liveNowActivities.length,
    upcomingActivities: upcomingActivities.length,
    expiredActivities: expiredActivities.length,
    removedActivities: removedActivities.length,
    historyActivities: historyActivities.length,
    profileCompleteness,
    profileCompletedFields,
    profileMissingFields,
    nextActivity,
    currentLiveActivity,
  };
}

export function deriveActivityTiming(
  startsAtIso: string,
  endsAtIso: string
): {
  status: VenueActivityStatus;
  displayTime: string;
  isLive: boolean;
} {
  const now = new Date();
  const startsAt = new Date(startsAtIso);
  const endsAt = new Date(endsAtIso);

  const isLive =
    now >= startsAt &&
    now <= endsAt;

  if (isLive) {
    return {
      status: "Live now",
      displayTime: `Live now · until ${formatTime(
        endsAt
      )}`,
      isLive: true,
    };
  }

  if (isSameDay(startsAt, now)) {
    if (startsAt.getHours() >= 17) {
      return {
        status: "Tonight",
        displayTime: `Tonight · ${formatTime(
          startsAt
        )}–${formatTime(endsAt)}`,
        isLive: false,
      };
    }

    return {
      status: "Open now",
      displayTime: `Today · ${formatTime(
        startsAt
      )}–${formatTime(endsAt)}`,
      isLive: false,
    };
  }

  const tomorrow = new Date(now);

  tomorrow.setDate(
    now.getDate() + 1
  );

  if (isSameDay(startsAt, tomorrow)) {
    return {
      status: "Tomorrow",
      displayTime: `Tomorrow · ${formatTime(
        startsAt
      )}–${formatTime(endsAt)}`,
      isLive: false,
    };
  }

  if (isWeekend(startsAt)) {
    return {
      status: "Weekend",
      displayTime: `${formatWeekday(
        startsAt
      )} · ${formatTime(
        startsAt
      )}–${formatTime(endsAt)}`,
      isLive: false,
    };
  }

  return {
    status: "Scheduled",
    displayTime: `${formatShortDate(
      startsAt
    )} · ${formatTime(
      startsAt
    )}–${formatTime(endsAt)}`,
    isLive: false,
  };
}

async function getOwnedVenueIds(): Promise<string[]> {
  const {
    data: { user },
    error: userError,
  } = await dashboardSupabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return [];
  }

  const {
    data: dashboardAccount,
    error: accountError,
  } = await dashboardSupabase
    .from("dashboard_accounts")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (accountError) {
    throw accountError;
  }

  if (!dashboardAccount) {
    return [];
  }

  const {
    data: venueLinks,
    error: venueLinksError,
  } = await dashboardSupabase
    .from("dashboard_venue_links")
    .select("app_venue_id")
    .eq(
      "dashboard_account_id",
      dashboardAccount.id
    );

  if (venueLinksError) {
    throw venueLinksError;
  }

  return (
    venueLinks
      ?.map((row) => row.app_venue_id)
      .filter(
        (venueId): venueId is string =>
          Boolean(venueId)
      ) ?? []
  );
}

async function assertUserOwnsVenue(
  venueId: string
): Promise<void> {
  const ownedVenueIds =
    await getOwnedVenueIds();

  if (!ownedVenueIds.includes(venueId)) {
    throw new Error(
      "This account does not have access to this venue."
    );
  }
}

function normalizeAnalyticsCount(
  value: unknown
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return 0;
  }

  return Math.floor(value);
}

function normalizeFollowerGrowth(
  value: unknown
): VenueFollowerGrowthPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((point) => {
      if (
        !point ||
        typeof point !== "object"
      ) {
        return null;
      }

      const candidate = point as {
        date?: unknown;
        new_followers?: unknown;
      };

      const date =
        typeof candidate.date === "string"
          ? candidate.date.trim()
          : "";

      if (!isValidAnalyticsDateKey(date)) {
        return null;
      }

      return {
        date,
        newFollowers:
          normalizeAnalyticsCount(
            candidate.new_followers
          ),
      };
    })
    .filter(
      (
        point
      ): point is VenueFollowerGrowthPoint =>
        point !== null
    );
}

function normalizeFollowerTodayActivity(
  value: unknown
): VenueFollowerTodayPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((point) => {
      if (
        !point ||
        typeof point !== "object"
      ) {
        return null;
      }

      const candidate = point as {
        timestamp?: unknown;
        follows?: unknown;
        unfollows?: unknown;
      };

      const timestamp =
        typeof candidate.timestamp === "string"
          ? candidate.timestamp.trim()
          : "";

      if (
        !isValidLocalHourTimestamp(
          timestamp
        )
      ) {
        return null;
      }

      return {
        timestamp,

        follows: normalizeAnalyticsCount(
          candidate.follows
        ),

        unfollows: normalizeAnalyticsCount(
          candidate.unfollows
        ),
      };
    })
    .filter(
      (
        point
      ): point is VenueFollowerTodayPoint =>
        point !== null
    );
}

function normalizeFollowerActivity(
  value: unknown
): VenueFollowerActivityPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((point) => {
      if (
        !point ||
        typeof point !== "object"
      ) {
        return null;
      }

      const candidate = point as {
        date?: unknown;
        follows?: unknown;
        unfollows?: unknown;
      };

      const date =
        typeof candidate.date === "string"
          ? candidate.date.trim()
          : "";

      if (!isValidAnalyticsDateKey(date)) {
        return null;
      }

      return {
        date,

        follows: normalizeAnalyticsCount(
          candidate.follows
        ),

        unfollows: normalizeAnalyticsCount(
          candidate.unfollows
        ),
      };
    })
    .filter(
      (
        point
      ): point is VenueFollowerActivityPoint =>
        point !== null
    );
}

function convertFollowerActivityRangesToNet(
  ranges: VenueFollowerActivityRanges
): VenueFollowerGrowthRanges {
  return {
    last14Days:
      convertFollowerActivityToNet(
        ranges.last14Days
      ),

    lastMonth:
      convertFollowerActivityToNet(
        ranges.lastMonth
      ),

    last6Months:
      convertFollowerActivityToNet(
        ranges.last6Months
      ),

    lastYear:
      convertFollowerActivityToNet(
        ranges.lastYear
      ),
  };
}

function convertFollowerActivityToNet(
  points: VenueFollowerActivityPoint[]
): VenueNetFollowerGrowthPoint[] {
  return points.map((point) => ({
    date: point.date,
    netFollowers:
      point.follows -
      point.unfollows,
  }));
}

function normalizeGeneratedAt(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const generatedAt = new Date(value);

  if (
    Number.isNaN(
      generatedAt.getTime()
    )
  ) {
    return null;
  }

  return generatedAt.toISOString();
}

function isValidLocalHourTimestamp(
  value: string
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:00:00$/.test(
      value
    )
  ) {
    return false;
  }

  const [
    datePart,
    timePart,
  ] = value.split("T");

  if (
    !datePart ||
    !timePart ||
    !isValidAnalyticsDateKey(
      datePart
    )
  ) {
    return false;
  }

  const hour = Number(
    timePart.slice(0, 2)
  );

  return (
    Number.isInteger(hour) &&
    hour >= 0 &&
    hour <= 23
  );
}

function isValidAnalyticsDateKey(
  value: string
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  return !Number.isNaN(date.getTime());
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