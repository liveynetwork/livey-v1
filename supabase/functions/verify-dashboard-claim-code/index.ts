import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type VerifyClaimCodeResponse = {
  venue_id: string;
  venue_name: string;
  venue_area: string | null;
  venue_city: string | null;
  already_claimed: boolean;
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

    const body = await request.json().catch(() => null);
    const claimCode =
      typeof body?.claim_code === "string" ? body.claim_code.trim() : "";

    if (!claimCode) {
      return jsonResponse({ error: "Missing claim code" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Missing Supabase server config" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase.rpc("verify_venue_claim_code", {
      input_claim_code: claimCode,
    });

    if (error) {
      console.error("verify_venue_claim_code RPC error:", error);
      return jsonResponse({ error: "Could not verify claim code" }, 500);
    }

    const venue = Array.isArray(data) ? data[0] : null;

    if (!venue) {
      return jsonResponse(
        { error: "This claim code was not found or is not approved yet." },
        404
      );
    }

    const response: VerifyClaimCodeResponse = {
      venue_id: venue.venue_id,
      venue_name: venue.venue_name,
      venue_area: venue.venue_area,
      venue_city: venue.venue_city,
      already_claimed: Boolean(venue.already_claimed),
    };

    return jsonResponse({ venue: response }, 200);
  } catch (error) {
    console.error("verify-dashboard-claim-code error:", error);
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