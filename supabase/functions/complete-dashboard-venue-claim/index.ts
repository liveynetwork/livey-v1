import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CompleteClaimPayload = {
  claim_code?: string;
  dashboard_auth_user_id?: string;
  dashboard_user_email?: string;
  dashboard_project_ref?: string;
};

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
    const receivedSecret = request.headers.get("x-livey-dashboard-secret");

    if (!expectedSecret || receivedSecret !== expectedSecret) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = (await request.json().catch(() => null)) as
      | CompleteClaimPayload
      | null;

    const claimCode =
      typeof body?.claim_code === "string" ? body.claim_code.trim() : "";

    const dashboardAuthUserId =
      typeof body?.dashboard_auth_user_id === "string"
        ? body.dashboard_auth_user_id.trim()
        : "";

    const dashboardUserEmail =
      typeof body?.dashboard_user_email === "string"
        ? body.dashboard_user_email.trim().toLowerCase()
        : "";

    const dashboardProjectRef =
      typeof body?.dashboard_project_ref === "string"
        ? body.dashboard_project_ref.trim()
        : "";

    if (!claimCode) {
      return jsonResponse({ error: "Missing claim code" }, 400);
    }

    if (!dashboardAuthUserId) {
      return jsonResponse({ error: "Missing dashboard user ID" }, 400);
    }

    if (!dashboardUserEmail) {
      return jsonResponse({ error: "Missing dashboard user email" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Missing Supabase server config" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select(
        `
        id,
        name,
        city,
        area,
        approval_status,
        venue_claim_code,
        venue_claimed_at,
        dashboard_claimed_by_user_id,
        dashboard_claimed_by_email,
        dashboard_claimed_project_ref
      `
      )
      .eq("venue_claim_code", claimCode)
      .maybeSingle();

    if (venueError) {
      console.error("Venue claim lookup error:", venueError);
      return jsonResponse({ error: "Could not check claim code" }, 500);
    }

    if (!venue) {
      return jsonResponse(
        { error: "This claim code was not found." },
        404
      );
    }

    if (venue.approval_status !== "approved") {
      return jsonResponse(
        { error: "This venue is not approved yet." },
        403
      );
    }

    const isAlreadyClaimed = Boolean(venue.venue_claimed_at);
    const isSameDashboardUser =
      venue.dashboard_claimed_by_user_id === dashboardAuthUserId;

    if (isAlreadyClaimed && !isSameDashboardUser) {
      return jsonResponse(
        { error: "This venue has already been claimed." },
        409
      );
    }

    const { data: updatedVenue, error: updateError } = await supabase
      .from("venues")
      .update({
        venue_claimed_at: venue.venue_claimed_at ?? new Date().toISOString(),
        dashboard_claimed_by_user_id: dashboardAuthUserId,
        dashboard_claimed_by_email: dashboardUserEmail,
        dashboard_claimed_project_ref: dashboardProjectRef || null,
      })
      .eq("id", venue.id)
      .select(
        `
        id,
        name,
        city,
        area,
        approval_status,
        venue_claimed_at,
        dashboard_claimed_by_user_id,
        dashboard_claimed_by_email,
        dashboard_claimed_project_ref
      `
      )
      .single();

    if (updateError) {
      console.error("Venue claim update error:", updateError);
      return jsonResponse({ error: "Could not claim venue" }, 500);
    }

    return jsonResponse(
      {
        venue: {
          app_venue_id: updatedVenue.id,
          app_venue_name: updatedVenue.name,
          app_venue_city: updatedVenue.city,
          app_venue_area: updatedVenue.area,
          claimed_at: updatedVenue.venue_claimed_at,
        },
      },
      200
    );
  } catch (error) {
    console.error("complete-dashboard-venue-claim error:", error);
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