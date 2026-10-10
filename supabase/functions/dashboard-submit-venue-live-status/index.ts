import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CrowdState =
  | "quiet"
  | "comfortable"
  | "busy"
  | "packed";

type QueueState =
  | "none"
  | "short"
  | "long";

type SubmitVenueLiveStatusPayload = {
  app_venue_id?: string;
  crowd?: CrowdState;
  queue?: QueueState | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedCrowdStates = new Set<CrowdState>([
  "quiet",
  "comfortable",
  "busy",
  "packed",
]);

const allowedQueueStates = new Set<QueueState>([
  "none",
  "short",
  "long",
]);

const allowedRequestFields = new Set([
  "app_venue_id",
  "crowd",
  "queue",
]);

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
    const authHeader =
      request.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse(
        {
          error: "Missing authorization header",
        },
        401
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as
      | SubmitVenueLiveStatusPayload
      | null;

    if (!body || typeof body !== "object") {
      return jsonResponse(
        {
          error: "Invalid request body",
        },
        400
      );
    }

    const unsupportedField =
      Object.keys(body).find(
        (field) =>
          !allowedRequestFields.has(field)
      );

    if (unsupportedField) {
      return jsonResponse(
        {
          error:
            "Unsupported Crowd Status field",
        },
        400
      );
    }

    const appVenueId =
      typeof body.app_venue_id === "string"
        ? body.app_venue_id.trim()
        : "";

    if (!appVenueId) {
      return jsonResponse(
        {
          error: "Missing app venue ID",
        },
        400
      );
    }

    const crowd = body.crowd;

    if (
      typeof crowd !== "string" ||
      !allowedCrowdStates.has(
        crowd as CrowdState
      )
    ) {
      return jsonResponse(
        {
          error: "Invalid crowd status",
        },
        400
      );
    }

    let queue: QueueState | null = null;

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "queue"
      )
    ) {
      if (body.queue === null) {
        queue = null;
      } else if (
        typeof body.queue === "string" &&
        allowedQueueStates.has(
          body.queue as QueueState
        )
      ) {
        queue =
          body.queue as QueueState;
      } else {
        return jsonResponse(
          {
            error: "Invalid queue status",
          },
          400
        );
      }
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
      }
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        {
          error: "Not signed in",
        },
        401
      );
    }

    const dashboardAdmin = createClient(
      dashboardSupabaseUrl,
      dashboardServiceRoleKey
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
      .eq(
        "app_venue_id",
        appVenueId
      )
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

    const appSupabaseUrl =
      Deno.env.get(
        "LIVEY_APP_SUPABASE_URL"
      );

    const sharedSecret =
      Deno.env.get(
        "LIVEY_DASHBOARD_SHARED_SECRET"
      );

    if (
      !appSupabaseUrl ||
      !sharedSecret
    ) {
      return jsonResponse(
        {
          error:
            "Missing dashboard bridge config",
        },
        500
      );
    }

    const appFunctionUrl =
      `${appSupabaseUrl}/functions/v1/app-submit-venue-live-status`;

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
          app_venue_id:
            appVenueId,

          dashboard_account_id:
            account.id,

          crowd,

          queue,
        }),
      }
    );

    const appPayload =
      await appResponse
        .json()
        .catch(() => null);

    if (!appResponse.ok) {
      return jsonResponse(
        {
          error:
            appPayload?.error ||
            "Crowd Status could not be updated right now.",

          reason:
            appPayload?.reason ??
            null,

          next_submission_at:
            appPayload?.next_submission_at ??
            null,
        },
        appResponse.status
      );
    }

    const { error: auditError } =
      await dashboardAdmin
        .from("dashboard_audit_logs")
        .insert({
          dashboard_account_id:
            account.id,

          app_venue_id:
            appVenueId,

          action:
            "venue_live_status_update",

          payload: {
            crowd,

            queue,

            accepted:
              appPayload?.accepted ??
              null,

            crowd_report_id:
              appPayload?.crowd_report_id ??
              null,

            queue_report_id:
              appPayload?.queue_report_id ??
              null,

            public_crowd_state:
              appPayload?.live_state
                ?.crowd_state ??
              null,

            public_queue_state:
              appPayload?.live_state
                ?.queue_state ??
              null,
          },
        });

    if (auditError) {
      console.error(
        "Dashboard audit log error:",
        auditError
      );
    }

    return jsonResponse(
      appPayload,
      200
    );
  } catch (error) {
    console.error(
      "dashboard-submit-venue-live-status error:",
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
      },
    }
  );
}