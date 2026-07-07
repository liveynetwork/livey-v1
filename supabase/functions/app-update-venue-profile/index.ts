import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type UpdateVenueProfilePayload = {
  app_venue_id?: string;
  name?: string;
  category?: string | null;
  area?: string | null;
  address?: string | null;
  description?: string | null;
  open_status?: string | null;
  opening_hours?: string | null;
  logo_url?: string | null;
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
      | UpdateVenueProfilePayload
      | null;

    const appVenueId =
      typeof body?.app_venue_id === "string" ? body.app_venue_id.trim() : "";

    if (!appVenueId) {
      return jsonResponse({ error: "Missing app venue ID" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Missing Supabase server config" }, 500);
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

    const updatePayload: Record<string, string | null> = {};

    if (typeof body?.name === "string") {
      const name = body.name.trim();

      if (!name) {
        return jsonResponse({ error: "Venue name is required" }, 400);
      }

      updatePayload.name = name;
    }

    if ("category" in (body ?? {})) {
      updatePayload.category = cleanOptional(body?.category);
    }

    if ("area" in (body ?? {})) {
      updatePayload.area = cleanOptional(body?.area);
    }

    if ("address" in (body ?? {})) {
      updatePayload.address = cleanOptional(body?.address);
    }

    if ("description" in (body ?? {})) {
      updatePayload.description = cleanOptional(body?.description);
    }

    if ("open_status" in (body ?? {})) {
      updatePayload.open_status = cleanOptional(body?.open_status);
    }

    if ("opening_hours" in (body ?? {})) {
      updatePayload.opening_hours = cleanOptional(body?.opening_hours);
    }

    if ("logo_url" in (body ?? {})) {
      const logoUrl = cleanOptional(body?.logo_url);

      if (logoUrl && !isAllowedVenueLogoUrl(logoUrl, supabaseUrl)) {
        return jsonResponse(
          { error: "Venue logo must come from Livey venue logo storage." },
          400
        );
      }

      updatePayload.logo_url = logoUrl;
    }

    if (Object.keys(updatePayload).length === 0) {
      return jsonResponse({ error: "No venue profile changes provided" }, 400);
    }

    updatePayload.updated_at = new Date().toISOString();

    const { data: updatedVenue, error: updateError } = await supabase
      .from("venues")
      .update(updatePayload)
      .eq("id", appVenueId)
      .select(
        "id, name, category, city, area, address, description, logo_url, verified, open_status, opening_hours"
      )
      .single();

    if (updateError) {
      console.error("Venue profile update error:", updateError);
      return jsonResponse({ error: "Could not update venue profile" }, 500);
    }

    return jsonResponse({ venue: updatedVenue }, 200);
  } catch (error) {
    console.error("app-update-venue-profile error:", error);
    return jsonResponse({ error: "Unexpected server error" }, 500);
  }
});

function cleanOptional(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isAllowedVenueLogoUrl(logoUrl: string, supabaseUrl: string) {
  const allowedPrefix = `${supabaseUrl}/storage/v1/object/public/venue-logos/`;

  return logoUrl.startsWith(allowedPrefix);
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