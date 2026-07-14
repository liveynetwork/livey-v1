import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type DashboardAnalyticsPayload = {
  app_venue_id?: string;
};

type AppFollowerGrowthPoint = {
  date?: string;
  new_followers?: number;
};

type AppAnalyticsResponse = {
  followers?: {
    total?: number;
    new_last_7_days?: number;
    new_last_30_days?: number;
    growth_last_30_days?: AppFollowerGrowthPoint[];
  };
  generated_at?: string;
  error?: string;
};

type FollowerGrowthPoint = {
  date: string;
  new_followers: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const authHeader =
      request.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse(
        {
          error:
            "Missing authorization header",
        },
        401
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as
      | DashboardAnalyticsPayload
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

    const dashboardSupabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const dashboardAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY");

    const dashboardServiceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      );

    if (
      !dashboardSupabaseUrl ||
      !dashboardAnonKey ||
      !dashboardServiceRoleKey
    ) {
      return jsonResponse(
        {
          error:
            "Missing dashboard Supabase server config",
        },
        500
      );
    }

    const userClient = createClient(
      dashboardSupabaseUrl,
      dashboardAnonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        { error: "Not signed in" },
        401
      );
    }

    const dashboardAdmin = createClient(
      dashboardSupabaseUrl,
      dashboardServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: account,
      error: accountError,
    } = await dashboardAdmin
      .from("dashboard_accounts")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (accountError) {
      console.error(
        "Dashboard account lookup error:",
        accountError
      );

      return jsonResponse(
        {
          error:
            "Could not check dashboard account",
        },
        500
      );
    }

    if (!account) {
      return jsonResponse(
        {
          error:
            "This dashboard account is not connected to a venue.",
        },
        403
      );
    }

    const {
      data: venueLink,
      error: venueLinkError,
    } = await dashboardAdmin
      .from("dashboard_venue_links")
      .select(
        "id, app_venue_id, role"
      )
      .eq(
        "dashboard_account_id",
        account.id
      )
      .eq("app_venue_id", appVenueId)
      .maybeSingle();

    if (venueLinkError) {
      console.error(
        "Dashboard venue link lookup error:",
        venueLinkError
      );

      return jsonResponse(
        {
          error:
            "Could not check venue ownership",
        },
        500
      );
    }

    if (!venueLink) {
      return jsonResponse(
        {
          error:
            "This dashboard account does not have access to this venue.",
        },
        403
      );
    }

    const appSupabaseUrl = Deno.env.get(
      "LIVEY_APP_SUPABASE_URL"
    );

    const sharedSecret = Deno.env.get(
      "LIVEY_DASHBOARD_SHARED_SECRET"
    );

    if (!appSupabaseUrl || !sharedSecret) {
      return jsonResponse(
        {
          error:
            "Missing dashboard bridge config",
        },
        500
      );
    }

    const appFunctionUrl =
      `${appSupabaseUrl}/functions/v1/` +
      "app-get-venue-analytics";

    const appResponse = await fetch(
      appFunctionUrl,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          "x-livey-dashboard-secret":
            sharedSecret,
        },
        body: JSON.stringify({
          app_venue_id: appVenueId,
        }),
      }
    );

    const appPayload =
      (await appResponse
        .json()
        .catch(() => null)) as
        | AppAnalyticsResponse
        | null;

    if (!appResponse.ok) {
      console.error(
        "App analytics bridge error:",
        appPayload
      );

      return jsonResponse(
        {
          error:
            appPayload?.error ||
            "Venue analytics could not be loaded right now.",
        },
        appResponse.status
      );
    }

    return jsonResponse(
      {
        followers: {
          total: normalizeCount(
            appPayload?.followers?.total
          ),
          new_last_7_days: normalizeCount(
            appPayload?.followers
              ?.new_last_7_days
          ),
          new_last_30_days: normalizeCount(
            appPayload?.followers
              ?.new_last_30_days
          ),
          growth_last_30_days:
            normalizeFollowerGrowth(
              appPayload?.followers
                ?.growth_last_30_days
            ),
        },
        generated_at:
          normalizeGeneratedAt(
            appPayload?.generated_at
          ),
      },
      200
    );
  } catch (error) {
    console.error(
      "dashboard-get-venue-analytics error:",
      error
    );

    return jsonResponse(
      { error: "Unexpected server error" },
      500
    );
  }
});

function normalizeCount(
  value: unknown
) {
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
): FollowerGrowthPoint[] {
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

      const candidate =
        point as AppFollowerGrowthPoint;

      const date =
        typeof candidate.date === "string"
          ? candidate.date.trim()
          : "";

      if (!isValidDateKey(date)) {
        return null;
      }

      return {
        date,
        new_followers: normalizeCount(
          candidate.new_followers
        ),
      };
    })
    .filter(
      (
        point
      ): point is FollowerGrowthPoint =>
        point !== null
    );
}

function normalizeGeneratedAt(
  value: unknown
) {
  if (typeof value !== "string") {
    return new Date().toISOString();
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function isValidDateKey(
  value: string
) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value
  );
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
        "Cache-Control": "no-store",
      },
    }
  );
}