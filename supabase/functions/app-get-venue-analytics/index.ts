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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-livey-dashboard-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405
    );
  }

  try {
    const expectedSecret = Deno.env.get(
      "LIVEY_DASHBOARD_SHARED_SECRET"
    );

    const receivedSecret = request.headers.get(
      "x-livey-dashboard-secret"
    );

    if (
      !expectedSecret ||
      receivedSecret !== expectedSecret
    ) {
      return jsonResponse(
        { error: "Unauthorized" },
        401
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as
      | VenueAnalyticsPayload
      | null;

    const appVenueId =
      typeof body?.app_venue_id === "string"
        ? body.app_venue_id.trim()
        : "";

    if (!appVenueId) {
      return jsonResponse(
        { error: "Missing app venue ID" },
        400
      );
    }

    const supabaseUrl = Deno.env.get(
      "SUPABASE_URL"
    );

    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    if (!supabaseUrl || !serviceRoleKey) {
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
      .select("id, approval_status")
      .eq("id", appVenueId)
      .maybeSingle();

    if (venueError) {
      console.error(
        "Analytics venue lookup error:",
        venueError
      );

      return jsonResponse(
        { error: "Could not check venue" },
        500
      );
    }

    if (!venue) {
      return jsonResponse(
        { error: "Venue not found" },
        404
      );
    }

    if (
      venue.approval_status !== "approved"
    ) {
      return jsonResponse(
        { error: "Venue is not approved" },
        403
      );
    }

    const now = new Date();

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setUTCDate(
      sevenDaysAgo.getUTCDate() - 7
    );

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setUTCDate(
      thirtyDaysAgo.getUTCDate() - 30
    );

    const [
      totalFollowersResult,
      sevenDayFollowersResult,
      thirtyDayFollowersResult,
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

    return jsonResponse(
      {
        followers: {
          total:
            totalFollowersResult.count ?? 0,
          new_last_7_days:
            sevenDayFollowersResult.count ?? 0,
          new_last_30_days:
            thirtyDayFollowersResult.count ??
            0,
        },
        generated_at: now.toISOString(),
      },
      200
    );
  } catch (error) {
    console.error(
      "app-get-venue-analytics error:",
      error
    );

    return jsonResponse(
      { error: "Unexpected server error" },
      500
    );
  }
});

function countVenueFollowers(
  supabase: ReturnType<typeof createClient>,
  appVenueId: string,
  createdAfter?: string
): Promise<CountResult> {
  let query = supabase
    .from("venue_follows")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("venue_id", appVenueId);

  if (createdAfter) {
    query = query.gte(
      "created_at",
      createdAfter
    );
  }

  return query;
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
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}