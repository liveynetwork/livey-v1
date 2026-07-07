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

    const body = (await request.json().catch(() => null)) as
      | ManageActivityPayload
      | null;

    const action = body?.action;
    const appVenueId =
      typeof body?.app_venue_id === "string" ? body.app_venue_id.trim() : "";

    if (!action) {
      return jsonResponse({ error: "Missing action" }, 400);
    }

    if (!appVenueId) {
      return jsonResponse({ error: "Missing app venue ID" }, 400);
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

    const dashboardAdmin = createClient(
      dashboardSupabaseUrl,
      dashboardServiceRoleKey
    );

    const { data: account, error: accountError } = await dashboardAdmin
      .from("dashboard_accounts")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (accountError) {
      console.error("Dashboard account lookup error:", accountError);
      return jsonResponse({ error: "Could not check dashboard account" }, 500);
    }

    if (!account) {
      return jsonResponse(
        { error: "This dashboard account is not connected to a venue." },
        403
      );
    }

    const { data: venueLink, error: venueLinkError } = await dashboardAdmin
      .from("dashboard_venue_links")
      .select("id, app_venue_id, role")
      .eq("dashboard_account_id", account.id)
      .eq("app_venue_id", appVenueId)
      .maybeSingle();

    if (venueLinkError) {
      console.error("Dashboard venue link lookup error:", venueLinkError);
      return jsonResponse({ error: "Could not check venue ownership" }, 500);
    }

    if (!venueLink) {
      return jsonResponse(
        { error: "This dashboard account does not have access to this venue." },
        403
      );
    }

    const appSupabaseUrl = Deno.env.get("LIVEY_APP_SUPABASE_URL");
    const sharedSecret = Deno.env.get("LIVEY_DASHBOARD_SHARED_SECRET");

    if (!appSupabaseUrl || !sharedSecret) {
      return jsonResponse({ error: "Missing dashboard bridge config" }, 500);
    }

    const appFunctionUrl = `${appSupabaseUrl}/functions/v1/app-manage-venue-activity`;

    const appResponse = await fetch(appFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-livey-dashboard-secret": sharedSecret,
      },
      body: JSON.stringify({
        action,
        app_venue_id: appVenueId,
        event_id: body?.event_id,
        title: body?.title,
        description: body?.description,
        starts_at: body?.starts_at,
        ends_at: body?.ends_at,
        is_active: body?.is_active,
        deleted_reason: body?.deleted_reason,
      }),
    });

    const appPayload = await appResponse.json().catch(() => null);

    if (!appResponse.ok) {
      return jsonResponse(
        {
          error:
            appPayload?.error || "This activity could not be updated right now.",
        },
        appResponse.status
      );
    }

    await dashboardAdmin.from("dashboard_audit_logs").insert({
      dashboard_account_id: account.id,
      app_venue_id: appVenueId,
      action: `activity_${action}`,
      payload: {
        event_id: body?.event_id ?? appPayload?.event?.id ?? null,
        app_response: appPayload,
      },
    });

    return jsonResponse(appPayload, 200);
  } catch (error) {
    console.error("dashboard-manage-venue-activity error:", error);
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