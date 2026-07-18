import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type VenueAnalyticsPayload = {
  app_venue_id?: string;
};

type CountResult = {
  count: number | null;
  error: {
    message?: string;
  } | null;
};

type FollowerRow = {
  created_at: string;
};

type FollowEventAction =
  | "follow"
  | "unfollow";

type FollowEventRow = {
  action: FollowEventAction;
  created_at: string;
};

type FollowerGrowthPoint = {
  date: string;
  new_followers: number;
};

type FollowerActivityPoint = {
  date: string;
  follows: number;
  unfollows: number;
};

type TodayFollowerActivityPoint = {
  timestamp: string;
  follows: number;
  unfollows: number;
};

const LIVEY_TIME_ZONE =
  "Europe/Nicosia";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-livey-dashboard-secret",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed",
      },
      405
    );
  }

  try {
    const expectedSecret = Deno.env.get(
      "LIVEY_DASHBOARD_SHARED_SECRET"
    );

    const receivedSecret =
      request.headers.get(
        "x-livey-dashboard-secret"
      );

    if (
      !expectedSecret ||
      receivedSecret !== expectedSecret
    ) {
      return jsonResponse(
        {
          error: "Unauthorized",
        },
        401
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as
      | VenueAnalyticsPayload
      | null;

    const appVenueId =
      typeof body?.app_venue_id ===
      "string"
        ? body.app_venue_id.trim()
        : "";

    if (!appVenueId) {
      return jsonResponse(
        {
          error:
            "Missing app venue ID",
        },
        400
      );
    }

    const supabaseUrl = Deno.env.get(
      "SUPABASE_URL"
    );

    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return jsonResponse(
        {
          error:
            "Missing app Supabase server config",
        },
        500
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: venue,
      error: venueError,
    } = await supabase
      .from("venues")
      .select(
        "id, approval_status"
      )
      .eq(
        "id",
        appVenueId
      )
      .maybeSingle();

    if (venueError) {
      console.error(
        "Analytics venue lookup error:",
        venueError
      );

      return jsonResponse(
        {
          error:
            "Could not check venue",
        },
        500
      );
    }

    if (!venue) {
      return jsonResponse(
        {
          error:
            "Venue not found",
        },
        404
      );
    }

    if (
      venue.approval_status !==
      "approved"
    ) {
      return jsonResponse(
        {
          error:
            "Venue is not approved",
        },
        403
      );
    }

    const now = new Date();

    const sevenDaysAgo =
      startOfUtcDay(now);

    sevenDaysAgo.setUTCDate(
      sevenDaysAgo.getUTCDate() - 6
    );

    const thirtyDaysAgo =
      startOfUtcDay(now);

    thirtyDaysAgo.setUTCDate(
      thirtyDaysAgo.getUTCDate() - 29
    );

    const legacyGrowthStart =
      getDailyRangeStart(
        now,
        30
      );

    const activityHistoryStart =
      getMonthlyRangeStart(
        now,
        12
      );

    const [
      totalFollowersResult,
      sevenDayFollowersResult,
      thirtyDayFollowersResult,
      followerGrowthResult,
      followerActivityResult,
    ] = await Promise.all([
      countVenueFollowers(
        supabase,
        appVenueId
      ),

      countVenueFollowers(
        supabase,
        appVenueId,
        sevenDaysAgo.toISOString()
      ),

      countVenueFollowers(
        supabase,
        appVenueId,
        thirtyDaysAgo.toISOString()
      ),

      getVenueFollowerRows(
        supabase,
        appVenueId,
        legacyGrowthStart.toISOString()
      ),

      getVenueFollowEventRows(
        supabase,
        appVenueId,
        activityHistoryStart.toISOString()
      ),
    ]);

    const countError =
      totalFollowersResult.error ||
      sevenDayFollowersResult.error ||
      thirtyDayFollowersResult.error;

    if (countError) {
      console.error(
        "Follower analytics count error:",
        countError
      );

      return jsonResponse(
        {
          error:
            "Could not load follower analytics",
        },
        500
      );
    }

    if (
      followerGrowthResult.error
    ) {
      console.error(
        "Follower growth query error:",
        followerGrowthResult.error
      );

      return jsonResponse(
        {
          error:
            "Could not load follower growth",
        },
        500
      );
    }

    if (
      followerActivityResult.error
    ) {
      console.error(
        "Follower activity query error:",
        followerActivityResult.error
      );

      return jsonResponse(
        {
          error:
            "Could not load follower activity",
        },
        500
      );
    }

    const legacyFollowerGrowth =
      buildFollowerGrowthSeries(
        followerGrowthResult.data ??
          [],
        now
      );

    const followerEvents =
  followerActivityResult.data ??
  [];

const today =
  buildTodayFollowerActivitySeries(
    followerEvents,
    now
  );

const last14Days =
      buildDailyFollowerActivitySeries(
        followerEvents,
        now,
        14
      );

    const lastMonth =
      buildDailyFollowerActivitySeries(
        followerEvents,
        now,
        30
      );

    const last6Months =
      buildWeeklyFollowerActivitySeries(
        followerEvents,
        now,
        26
      );

    const lastYear =
      buildMonthlyFollowerActivitySeries(
        followerEvents,
        now,
        12
      );

    return jsonResponse(
      {
        followers: {
          total:
            totalFollowersResult.count ??
            0,

          new_last_7_days:
            sevenDayFollowersResult.count ??
            0,

          new_last_30_days:
            thirtyDayFollowersResult.count ??
            0,

          /*
           * Retained temporarily for
           * compatibility with older
           * dashboard code.
           */
          growth_last_30_days:
            legacyFollowerGrowth,

          activity: {
  today,

  last_14_days:
    last14Days,

            last_month:
              lastMonth,

            last_6_months:
              last6Months,

            last_year:
              lastYear,
          },
        },

        generated_at:
          now.toISOString(),
      },
      200
    );
  } catch (error) {
    console.error(
      "app-get-venue-analytics error:",
      error
    );

    return jsonResponse(
      {
        error:
          "Unexpected server error",
      },
      500
    );
  }
});

function countVenueFollowers(
  supabase: ReturnType<
    typeof createClient
  >,
  appVenueId: string,
  createdAfter?: string
): Promise<CountResult> {
  let query = supabase
    .from("venue_follows")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq(
      "venue_id",
      appVenueId
    );

  if (createdAfter) {
    query = query.gte(
      "created_at",
      createdAfter
    );
  }

  return query;
}

async function getVenueFollowerRows(
  supabase: ReturnType<
    typeof createClient
  >,
  appVenueId: string,
  createdAfter: string
): Promise<{
  data: FollowerRow[] | null;
  error: {
    message?: string;
  } | null;
}> {
  const {
    data,
    error,
  } = await supabase
    .from("venue_follows")
    .select("created_at")
    .eq(
      "venue_id",
      appVenueId
    )
    .gte(
      "created_at",
      createdAfter
    )
    .order("created_at", {
      ascending: true,
    });

  return {
    data:
      data as
        | FollowerRow[]
        | null,
    error,
  };
}

async function getVenueFollowEventRows(
  supabase: ReturnType<
    typeof createClient
  >,
  appVenueId: string,
  createdAfter: string
): Promise<{
  data: FollowEventRow[] | null;
  error: {
    message?: string;
  } | null;
}> {
  const {
    data,
    error,
  } = await supabase
    .from("venue_follow_events")
    .select(
      "action, created_at"
    )
    .eq(
      "venue_id",
      appVenueId
    )
    .gte(
      "created_at",
      createdAfter
    )
    .order("created_at", {
      ascending: true,
    });

  return {
    data:
      data as
        | FollowEventRow[]
        | null,
    error,
  };
}

function buildFollowerGrowthSeries(
  followerRows: FollowerRow[],
  now: Date
): FollowerGrowthPoint[] {
  const growthPoints =
    createEmptyFollowerGrowthSeries(
      now
    );

  const pointsByDate = new Map(
    growthPoints.map((point) => [
      point.date,
      point,
    ])
  );

  followerRows.forEach((row) => {
    const createdAt = new Date(
      row.created_at
    );

    if (
      Number.isNaN(
        createdAt.getTime()
      )
    ) {
      return;
    }

    const dateKey =
      toUtcDateKey(createdAt);

    const matchingPoint =
      pointsByDate.get(dateKey);

    if (matchingPoint) {
      matchingPoint.new_followers +=
        1;
    }
  });

  return growthPoints;
}

function createEmptyFollowerGrowthSeries(
  now: Date
): FollowerGrowthPoint[] {
  const rangeStart =
    getDailyRangeStart(
      now,
      30
    );

  return Array.from(
    {
      length: 30,
    },
    (_, index) => {
      const date = new Date(
        rangeStart
      );

      date.setUTCDate(
        rangeStart.getUTCDate() +
          index
      );

      return {
        date:
          toUtcDateKey(date),
        new_followers: 0,
      };
    }
  );
}

function buildTodayFollowerActivitySeries(
  events: FollowEventRow[],
  now: Date
): TodayFollowerActivityPoint[] {
  const todayDateKey =
    toLiveyLocalDateKey(now);

  const points = Array.from(
    {
      length: 24,
    },
    (_, hour) => ({
      timestamp:
        `${todayDateKey}T` +
        `${String(hour).padStart(
          2,
          "0"
        )}:00:00`,
      follows: 0,
      unfollows: 0,
    })
  );

  events.forEach((event) => {
    const eventDate = new Date(
      event.created_at
    );

    if (
      Number.isNaN(
        eventDate.getTime()
      )
    ) {
      return;
    }

    const localParts =
      getLiveyLocalDateParts(
        eventDate
      );

    if (
      localParts.dateKey !==
      todayDateKey
    ) {
      return;
    }

    const point =
      points[localParts.hour];

    if (!point) {
      return;
    }

    addEventToActivityPoint(
      point,
      event.action
    );
  });

  return points;
}

function buildDailyFollowerActivitySeries(
  events: FollowEventRow[],
  now: Date,
  numberOfDays: number
): FollowerActivityPoint[] {
  const rangeStart =
    getDailyRangeStart(
      now,
      numberOfDays
    );

  const points = Array.from(
    {
      length: numberOfDays,
    },
    (_, index) => {
      const date = new Date(
        rangeStart
      );

      date.setUTCDate(
        rangeStart.getUTCDate() +
          index
      );

      return createFollowerActivityPoint(
        date
      );
    }
  );

  const pointsByDate = new Map(
    points.map((point) => [
      point.date,
      point,
    ])
  );

  events.forEach((event) => {
    const eventDate = new Date(
      event.created_at
    );

    if (
      Number.isNaN(
        eventDate.getTime()
      ) ||
      eventDate < rangeStart
    ) {
      return;
    }

    const dateKey =
      toUtcDateKey(eventDate);

    const point =
      pointsByDate.get(dateKey);

    if (!point) {
      return;
    }

    addEventToActivityPoint(
      point,
      event.action
    );
  });

  return points;
}

function buildWeeklyFollowerActivitySeries(
  events: FollowEventRow[],
  now: Date,
  numberOfWeeks: number
): FollowerActivityPoint[] {
  const rangeStart =
    getWeeklyRangeStart(
      now,
      numberOfWeeks
    );

  const points = Array.from(
    {
      length: numberOfWeeks,
    },
    (_, index) => {
      const date = new Date(
        rangeStart
      );

      date.setUTCDate(
        rangeStart.getUTCDate() +
          index * 7
      );

      return createFollowerActivityPoint(
        date
      );
    }
  );

  const pointsByDate = new Map(
    points.map((point) => [
      point.date,
      point,
    ])
  );

  events.forEach((event) => {
    const eventDate = new Date(
      event.created_at
    );

    if (
      Number.isNaN(
        eventDate.getTime()
      ) ||
      eventDate < rangeStart
    ) {
      return;
    }

    const weekStart =
      startOfUtcWeek(
        eventDate
      );

    const dateKey =
      toUtcDateKey(
        weekStart
      );

    const point =
      pointsByDate.get(dateKey);

    if (!point) {
      return;
    }

    addEventToActivityPoint(
      point,
      event.action
    );
  });

  return points;
}

function buildMonthlyFollowerActivitySeries(
  events: FollowEventRow[],
  now: Date,
  numberOfMonths: number
): FollowerActivityPoint[] {
  const rangeStart =
    getMonthlyRangeStart(
      now,
      numberOfMonths
    );

  const points = Array.from(
    {
      length: numberOfMonths,
    },
    (_, index) => {
      const date = new Date(
        Date.UTC(
          rangeStart.getUTCFullYear(),
          rangeStart.getUTCMonth() +
            index,
          1
        )
      );

      return createFollowerActivityPoint(
        date
      );
    }
  );

  const pointsByDate = new Map(
    points.map((point) => [
      point.date,
      point,
    ])
  );

  events.forEach((event) => {
    const eventDate = new Date(
      event.created_at
    );

    if (
      Number.isNaN(
        eventDate.getTime()
      ) ||
      eventDate < rangeStart
    ) {
      return;
    }

    const monthStart =
      startOfUtcMonth(
        eventDate
      );

    const dateKey =
      toUtcDateKey(
        monthStart
      );

    const point =
      pointsByDate.get(dateKey);

    if (!point) {
      return;
    }

    addEventToActivityPoint(
      point,
      event.action
    );
  });

  return points;
}

function createFollowerActivityPoint(
  date: Date
): FollowerActivityPoint {
  return {
    date:
      toUtcDateKey(date),
    follows: 0,
    unfollows: 0,
  };
}

function addEventToActivityPoint(
  point: FollowerActivityPoint,
  action: FollowEventAction
) {
  if (action === "follow") {
    point.follows += 1;
    return;
  }

  point.unfollows += 1;
}

function getDailyRangeStart(
  now: Date,
  numberOfDays: number
) {
  const rangeStart =
    startOfUtcDay(now);

  rangeStart.setUTCDate(
    rangeStart.getUTCDate() -
      (numberOfDays - 1)
  );

  return rangeStart;
}

function getWeeklyRangeStart(
  now: Date,
  numberOfWeeks: number
) {
  const rangeStart =
    startOfUtcWeek(now);

  rangeStart.setUTCDate(
    rangeStart.getUTCDate() -
      (numberOfWeeks - 1) * 7
  );

  return rangeStart;
}

function getMonthlyRangeStart(
  now: Date,
  numberOfMonths: number
) {
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() -
        (numberOfMonths - 1),
      1
    )
  );
}

function startOfUtcDay(
  date: Date
) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
}

function startOfUtcWeek(
  date: Date
) {
  const dayStart =
    startOfUtcDay(date);

  const dayOfWeek =
    dayStart.getUTCDay();

  const daysSinceMonday =
    dayOfWeek === 0
      ? 6
      : dayOfWeek - 1;

  dayStart.setUTCDate(
    dayStart.getUTCDate() -
      daysSinceMonday
  );

  return dayStart;
}

function startOfUtcMonth(
  date: Date
) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      1
    )
  );
}

function getLiveyLocalDateParts(
  date: Date
): {
  dateKey: string;
  hour: number;
} {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          LIVEY_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hourCycle: "h23",
      }
    );

  const parts =
    formatter.formatToParts(
      date
    );

  const year =
    getDateTimePart(
      parts,
      "year"
    );

  const month =
    getDateTimePart(
      parts,
      "month"
    );

  const day =
    getDateTimePart(
      parts,
      "day"
    );

  const hourValue =
    Number(
      getDateTimePart(
        parts,
        "hour"
      )
    );

  return {
    dateKey:
      `${year}-${month}-${day}`,

    hour:
      Number.isInteger(
        hourValue
      ) &&
      hourValue >= 0 &&
      hourValue <= 23
        ? hourValue
        : 0,
  };
}

function toLiveyLocalDateKey(
  date: Date
): string {
  return getLiveyLocalDateParts(
    date
  ).dateKey;
}

function getDateTimePart(
  parts: Intl.DateTimeFormatPart[],
  type:
    | "year"
    | "month"
    | "day"
    | "hour"
): string {
  return (
    parts.find(
      (part) =>
        part.type === type
    )?.value ?? ""
  );
}

function toUtcDateKey(
  date: Date
) {
  return date
    .toISOString()
    .slice(0, 10);
}

function jsonResponse(
  payload: unknown,
  status = 200
) {
  return new Response(
    JSON.stringify(payload),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
        "Cache-Control":
          "no-store",
      },
    }
  );
}