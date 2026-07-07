import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CompleteAppClaimResponse = {
  venue?: {
    app_venue_id: string;
    app_venue_name: string;
    app_venue_city: string | null;
    app_venue_area: string | null;
    claimed_at: string;
  };
  error?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const body = await request.json().catch(() => null);
    const claimCode =
      typeof body?.claim_code === "string" ? body.claim_code.trim() : "";

    if (!claimCode) {
      return jsonResponse({ error: "Missing claim code" }, 400);
    }

    const dashboardSupabaseUrl = Deno.env.get("SUPABASE_URL");
    const dashboardAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const dashboardServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!dashboardSupabaseUrl || !dashboardAnonKey || !dashboardServiceRoleKey) {
      return jsonResponse(
        { error: "Missing dashboard Supabase server config" },
        500
      );
    }

    const userClient = createClient(dashboardSupabaseUrl, dashboardAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Not signed in" }, 401);
    }

    if (!user.email) {
      return jsonResponse({ error: "Dashboard user has no email" }, 400);
    }

    const appSupabaseUrl = Deno.env.get("LIVEY_APP_SUPABASE_URL");
    const sharedSecret = Deno.env.get("LIVEY_DASHBOARD_SHARED_SECRET");
    const dashboardProjectRef =
      Deno.env.get("LIVEY_DASHBOARD_PROJECT_REF") || "";

    if (!appSupabaseUrl || !sharedSecret) {
      return jsonResponse({ error: "Missing dashboard bridge config" }, 500);
    }

    const appFunctionUrl = `${appSupabaseUrl}/functions/v1/complete-dashboard-venue-claim`;

    const appResponse = await fetch(appFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-livey-dashboard-secret": sharedSecret,
      },
      body: JSON.stringify({
        claim_code: claimCode,
        dashboard_auth_user_id: user.id,
        dashboard_user_email: user.email,
        dashboard_project_ref: dashboardProjectRef,
      }),
    });

    const appPayload =
      (await appResponse.json().catch(() => null)) as CompleteAppClaimResponse | null;

    if (!appResponse.ok || !appPayload?.venue) {
      return jsonResponse(
        {
          error:
            appPayload?.error ||
            "This venue could not be claimed right now.",
        },
        appResponse.status
      );
    }

    const dashboardAdmin = createClient(
      dashboardSupabaseUrl,
      dashboardServiceRoleKey
    );

    const { data: account, error: accountError } = await dashboardAdmin
      .from("dashboard_accounts")
      .upsert(
        {
          auth_user_id: user.id,
          account_email: user.email,
          account_name:
            typeof user.user_metadata?.verified_venue_name === "string"
              ? user.user_metadata.verified_venue_name
              : appPayload.venue.app_venue_name,
        },
        {
          onConflict: "auth_user_id",
        }
      )
      .select("id, auth_user_id, account_email, account_name")
      .single();

    if (accountError || !account) {
      console.error("Dashboard account upsert error:", accountError);
      return jsonResponse(
        { error: "Could not create dashboard account" },
        500
      );
    }

    const { data: venueLink, error: linkError } = await dashboardAdmin
      .from("dashboard_venue_links")
      .upsert(
        {
          dashboard_account_id: account.id,
          app_venue_id: appPayload.venue.app_venue_id,
          app_venue_name: appPayload.venue.app_venue_name,
          app_venue_city: appPayload.venue.app_venue_city,
          app_venue_area: appPayload.venue.app_venue_area,
          role: "owner",
        },
        {
          onConflict: "app_venue_id",
        }
      )
      .select(
        "id, dashboard_account_id, app_venue_id, app_venue_name, app_venue_city, app_venue_area, role"
      )
      .single();

    if (linkError || !venueLink) {
      console.error("Dashboard venue link upsert error:", linkError);
      return jsonResponse(
        { error: "Could not link this venue to your dashboard account" },
        500
      );
    }

    await dashboardAdmin.from("dashboard_audit_logs").insert({
      dashboard_account_id: account.id,
      app_venue_id: appPayload.venue.app_venue_id,
      action: "venue_claimed",
      payload: {
        app_venue_name: appPayload.venue.app_venue_name,
        dashboard_auth_user_id: user.id,
      },
    });

    return jsonResponse(
      {
        account,
        venue_link: venueLink,
      },
      200
    );
  } catch (error) {
    console.error("dashboard-complete-venue-claim error:", error);
    return jsonResponse({ error: "Unexpected server error" }, 500);
  }
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}