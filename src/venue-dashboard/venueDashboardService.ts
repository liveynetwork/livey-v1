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
};

export type VenueDashboardData = {
  venue: VenueDashboardVenue;
  events: VenueDashboardEvent[];
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
  profileMissingFields: string[];
  nextActivity: VenueDashboardEvent | null;
  currentLiveActivity: VenueDashboardEvent | null;
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
      "id, venue_id, title, description, status, display_time, starts_at, ends_at, is_live, is_active, deleted_at, deleted_reason"
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
    if (event.deleted_at) return false;
    if (!event.ends_at) return false;

    return new Date(event.ends_at).getTime() < now;
  });

  const historyActivities = [
    ...removedActivities,
    ...expiredActivities,
  ];

  const activeOrUpcomingActivities = events.filter((event) => {
    if (event.deleted_at) return false;
    if (!event.ends_at) return true;

    return new Date(event.ends_at).getTime() >= now;
  });

  const visibleActivities = activeOrUpcomingActivities.filter(
    (event) => event.is_active !== false
  );

  const hiddenActivities = activeOrUpcomingActivities.filter(
    (event) => event.is_active === false
  );

  const liveNowActivities = visibleActivities.filter((event) => {
    if (event.is_live === true) return true;
    if (!event.starts_at || !event.ends_at) return false;

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
    if (!event.starts_at) return false;

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
      label: "Venue name",
      value: venue.name,
    },
    {
      label: "Category",
      value: venue.category,
    },
    {
      label: "City",
      value: venue.city,
    },
    {
      label: "Area",
      value: venue.area,
    },
    {
      label: "Address",
      value: venue.address,
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
    (field) => Boolean(String(field.value ?? "").trim())
  );

  const profileMissingFields = profileFields
    .filter(
      (field) => !String(field.value ?? "").trim()
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
  tomorrow.setDate(now.getDate() + 1);

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