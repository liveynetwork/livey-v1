import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ActivityAction = "create" | "update" | "delete" | "restore";

type ManageActivityPayload = {
  action?: ActivityAction;
  app_venue_id?: string;
  event_id?: string;
  title?: string;
  description?: string;
  starts_at?: string;
  ends_at?: string;
  is_active?: boolean;
  deleted_reason?: string;
};

type VenueActivityStatus =
  | "Live now"
  | "Open now"
  | "Tonight"
  | "Tomorrow"
  | "Weekend"
  | "Scheduled";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-livey-dashboard-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const expectedSecret = Deno.env.get("LIVEY_DASHBOARD_SHARED_SECRET");
    const receivedSecret = request.headers.get(
      "x-livey-dashboard-secret"
    );

    if (!expectedSecret || receivedSecret !== expectedSecret) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = (await request.json().catch(() => null)) as
      | ManageActivityPayload
      | null;

    const action = body?.action;
    const appVenueId =
      typeof body?.app_venue_id === "string"
        ? body.app_venue_id.trim()
        : "";
    const eventId =
      typeof body?.event_id === "string" ? body.event_id.trim() : "";

    if (!action) {
      return jsonResponse({ error: "Missing action" }, 400);
    }

    if (!appVenueId) {
      return jsonResponse({ error: "Missing app venue ID" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        { error: "Missing Supabase server config" },
        500
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("id, approval_status")
      .eq("id", appVenueId)
      .maybeSingle();

    if (venueError) {
      console.error("Venue lookup error:", venueError);

      return jsonResponse({ error: "Could not check venue" }, 500);
    }

    if (!venue) {
      return jsonResponse({ error: "Venue not found" }, 404);
    }

    if (venue.approval_status !== "approved") {
      return jsonResponse({ error: "Venue is not approved" }, 403);
    }

    if (action === "create") {
      const activityInput = parseActivityInput(body);

      if ("error" in activityInput) {
        return jsonResponse(
          { error: activityInput.error },
          activityInput.status
        );
      }

      const timing = deriveActivityTiming(
        activityInput.startsAt,
        activityInput.endsAt
      );

      const { data, error } = await supabase
        .from("venue_events")
        .insert({
          venue_id: appVenueId,
          title: activityInput.title,
          description: activityInput.description || null,
          status: timing.status,
          display_time: timing.displayTime,
          starts_at: activityInput.startsAt,
          ends_at: activityInput.endsAt,
          is_live: timing.isLive,
          is_active: activityInput.isActive,
          priority: 50,
          deleted_at: null,
          deleted_reason: null,
        })
        .select(
          "id, venue_id, title, description, status, display_time, starts_at, ends_at, is_live, is_active, deleted_at, deleted_reason"
        )
        .single();

      if (error) {
        console.error("Create activity error:", error);

        return jsonResponse({ error: "Could not create activity" }, 500);
      }

      return jsonResponse({ event: data }, 200);
    }

    if (!eventId) {
      return jsonResponse({ error: "Missing event ID" }, 400);
    }

    const { data: existingEvent, error: existingEventError } =
      await supabase
        .from("venue_events")
        .select("id, venue_id, starts_at, ends_at")
        .eq("id", eventId)
        .eq("venue_id", appVenueId)
        .maybeSingle();

    if (existingEventError) {
      console.error(
        "Existing activity lookup error:",
        existingEventError
      );

      return jsonResponse(
        { error: "Could not check activity" },
        500
      );
    }

    if (!existingEvent) {
      return jsonResponse(
        { error: "Activity not found for this venue" },
        404
      );
    }

    if (action === "update") {
      const activityInput = parseActivityInput(body);

      if ("error" in activityInput) {
        return jsonResponse(
          { error: activityInput.error },
          activityInput.status
        );
      }

      const timing = deriveActivityTiming(
        activityInput.startsAt,
        activityInput.endsAt
      );

      const { data, error } = await supabase
        .from("venue_events")
        .update({
          title: activityInput.title,
          description: activityInput.description || null,
          starts_at: activityInput.startsAt,
          ends_at: activityInput.endsAt,
          status: timing.status,
          display_time: timing.displayTime,
          is_live: timing.isLive,
          is_active: activityInput.isActive,
          deleted_at: null,
          deleted_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId)
        .eq("venue_id", appVenueId)
        .select(
          "id, venue_id, title, description, status, display_time, starts_at, ends_at, is_live, is_active, deleted_at, deleted_reason"
        )
        .single();

      if (error) {
        console.error("Update activity error:", error);

        return jsonResponse({ error: "Could not update activity" }, 500);
      }

      return jsonResponse({ event: data }, 200);
    }

    if (action === "delete") {
      const deletedReason =
        typeof body?.deleted_reason === "string" &&
        body.deleted_reason.trim()
          ? body.deleted_reason.trim()
          : "Removed by venue owner";

      const { data, error } = await supabase
        .from("venue_events")
        .update({
          is_active: false,
          is_live: false,
          deleted_at: new Date().toISOString(),
          deleted_reason: deletedReason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId)
        .eq("venue_id", appVenueId)
        .select(
          "id, venue_id, title, description, status, display_time, starts_at, ends_at, is_live, is_active, deleted_at, deleted_reason"
        )
        .single();

      if (error) {
        console.error("Delete activity error:", error);

        return jsonResponse({ error: "Could not remove activity" }, 500);
      }

      return jsonResponse({ event: data }, 200);
    }

    if (action === "restore") {
      const timing =
        existingEvent.starts_at && existingEvent.ends_at
          ? deriveActivityTiming(
              existingEvent.starts_at,
              existingEvent.ends_at
            )
          : null;

      const { data, error } = await supabase
        .from("venue_events")
        .update({
          is_active: true,
          is_live: timing?.isLive ?? false,
          status: timing?.status ?? "Scheduled",
          display_time: timing?.displayTime ?? null,
          deleted_at: null,
          deleted_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId)
        .eq("venue_id", appVenueId)
        .select(
          "id, venue_id, title, description, status, display_time, starts_at, ends_at, is_live, is_active, deleted_at, deleted_reason"
        )
        .single();

      if (error) {
        console.error("Restore activity error:", error);

        return jsonResponse({ error: "Could not restore activity" }, 500);
      }

      return jsonResponse({ event: data }, 200);
    }

    return jsonResponse({ error: "Unsupported action" }, 400);
  } catch (error) {
    console.error("app-manage-venue-activity error:", error);

    return jsonResponse({ error: "Unexpected server error" }, 500);
  }
});

function parseActivityInput(
  body: ManageActivityPayload | null
):
  | {
      title: string;
      description: string;
      startsAt: string;
      endsAt: string;
      isActive: boolean;
    }
  | {
      error: string;
      status: number;
    } {
  const title =
    typeof body?.title === "string" ? body.title.trim() : "";
  const description =
    typeof body?.description === "string"
      ? body.description.trim()
      : "";
  const startsAt =
    typeof body?.starts_at === "string"
      ? body.starts_at.trim()
      : "";
  const endsAt =
    typeof body?.ends_at === "string" ? body.ends_at.trim() : "";
  const isActive = body?.is_active !== false;

  if (!title) {
    return {
      error: "Activity title is required",
      status: 400,
    };
  }

  if (!startsAt || !endsAt) {
    return {
      error: "Activity start and end time are required",
      status: 400,
    };
  }

  const startsAtDate = new Date(startsAt);
  const endsAtDate = new Date(endsAt);

  if (
    Number.isNaN(startsAtDate.getTime()) ||
    Number.isNaN(endsAtDate.getTime())
  ) {
    return {
      error: "Invalid activity dates",
      status: 400,
    };
  }

  if (endsAtDate <= startsAtDate) {
    return {
      error: "Activity end time must be after start time",
      status: 400,
    };
  }

  return {
    title,
    description,
    startsAt: startsAtDate.toISOString(),
    endsAt: endsAtDate.toISOString(),
    isActive,
  };
}

function deriveActivityTiming(
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

  const isLive = now >= startsAt && now <= endsAt;

  if (isLive) {
    return {
      status: "Live now",
      displayTime: `Live now · until ${formatTime(endsAt)}`,
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
      displayTime: `${formatWeekday(startsAt)} · ${formatTime(
        startsAt
      )}–${formatTime(endsAt)}`,
      isLive: false,
    };
  }

  return {
    status: "Scheduled",
    displayTime: `${formatShortDate(startsAt)} · ${formatTime(
      startsAt
    )}–${formatTime(endsAt)}`,
    isLive: false,
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

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}