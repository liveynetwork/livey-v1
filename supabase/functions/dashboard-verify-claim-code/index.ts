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
    const body = await request.json().catch(() => null);
    const claimCode =
      typeof body?.claim_code === "string" ? body.claim_code.trim() : "";

    if (!claimCode) {
      return jsonResponse({ error: "Missing claim code" }, 400);
    }

    const appSupabaseUrl = Deno.env.get("LIVEY_APP_SUPABASE_URL");
    const sharedSecret = Deno.env.get("LIVEY_DASHBOARD_SHARED_SECRET");

    if (!appSupabaseUrl || !sharedSecret) {
      return jsonResponse({ error: "Missing dashboard bridge config" }, 500);
    }

    const appFunctionUrl = `${appSupabaseUrl}/functions/v1/verify-dashboard-claim-code`;

    const appResponse = await fetch(appFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-livey-dashboard-secret": sharedSecret,
      },
      body: JSON.stringify({
        claim_code: claimCode,
      }),
    });

    const appPayload = await appResponse.json().catch(() => null);

    if (!appResponse.ok) {
      return jsonResponse(
        {
          error:
            appPayload?.error ||
            "This claim code could not be verified right now.",
        },
        appResponse.status
      );
    }

    return jsonResponse(appPayload, 200);
  } catch (error) {
    console.error("dashboard-verify-claim-code error:", error);
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