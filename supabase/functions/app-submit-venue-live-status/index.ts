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
  dashboard_account_id?: string;
  crowd?: CrowdState;
  queue?: QueueState | null;
};

type VenueLiveStatusRpcRow = {
  accepted: boolean;
  reason: string | null;

  crowd_report_id: string | null;
  queue_report_id: string | null;

  crowd_state: string | null;
  crowd_confidence: number | null;
  crowd_report_count: number;

  queue_state: string | null;
  queue_confidence: number | null;
  queue_report_count: number;

  points_awarded: number;

  next_submission_at: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-livey-dashboard-secret",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

const allowedCrowdStates =
  new Set<CrowdState>([
    "quiet",
    "comfortable",
    "busy",
    "packed",
  ]);

const allowedQueueStates =
  new Set<QueueState>([
    "none",
    "short",
    "long",
  ]);

const allowedRequestFields =
  new Set([
    "app_venue_id",
    "dashboard_account_id",
    "crowd",
    "queue",
  ]);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(
      "ok",
      {
        headers: corsHeaders,
      }
    );
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
    const expectedSecret =
      Deno.env.get(
        "LIVEY_DASHBOARD_SHARED_SECRET"
      );

    const receivedSecret =
      request.headers.get(
        "x-livey-dashboard-secret"
      );

    if (
      !expectedSecret ||
      receivedSecret !== expectedSecret
    ) {
      return jsonResponse(
        {
          error: "Unauthorized",
        },
        401
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as
      | SubmitVenueLiveStatusPayload
      | null;

    if (
      !body ||
      typeof body !== "object"
    ) {
      return jsonResponse(
        {
          error:
            "Invalid request body",
        },
        400
      );
    }

    const unsupportedField =
      Object.keys(body).find(
        (field) =>
          !allowedRequestFields.has(
            field
          )
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
      typeof body.app_venue_id ===
        "string"
        ? body.app_venue_id.trim()
        : "";

    const dashboardAccountId =
      typeof body.dashboard_account_id ===
        "string"
        ? body.dashboard_account_id.trim()
        : "";

    if (!appVenueId) {
      return jsonResponse(
        {
          error:
            "Missing app venue ID",
        },
        400
      );
    }

    if (!dashboardAccountId) {
      return jsonResponse(
        {
          error:
            "Missing dashboard account ID",
        },
        400
      );
    }

    const crowd =
      body.crowd;

    if (
      typeof crowd !== "string" ||
      !allowedCrowdStates.has(
        crowd as CrowdState
      )
    ) {
      return jsonResponse(
        {
          error:
            "Invalid crowd status",
        },
        400
      );
    }

    let queue:
      | QueueState
      | null = null;

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "queue"
      )
    ) {
      if (body.queue === null) {
        queue = null;
      } else if (
        typeof body.queue ===
          "string" &&
        allowedQueueStates.has(
          body.queue as QueueState
        )
      ) {
        queue =
          body.queue as QueueState;
      } else {
        return jsonResponse(
          {
            error:
              "Invalid queue status",
          },
          400
        );
      }
    }

    const supabaseUrl =
      Deno.env.get(
        "SUPABASE_URL"
      );

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      );

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return jsonResponse(
        {
          error:
            "Missing Supabase server config",
        },
        500
      );
    }

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey
      );

    // ------------------------------------------------------------------------
    // Independent Consumer-side venue validation.
    // ------------------------------------------------------------------------

    const {
      data: venue,
      error: venueError,
    } = await supabase
      .from("venues")
      .select(
        "id, is_active, approval_status"
      )
      .eq(
        "id",
        appVenueId
      )
      .maybeSingle();

    if (venueError) {
      console.error(
        "Venue lookup error:",
        venueError
      );

      return jsonResponse(
        {
          error:
            "Could not check venue",
        },
        500
      );
    }

    if (!venue) {
      return jsonResponse(
        {
          error:
            "Venue not found",
        },
        404
      );
    }

    if (
      venue.is_active !== true ||
      venue.approval_status !==
        "approved"
    ) {
      return jsonResponse(
        {
          error:
            "Venue is not available for Crowd Status",
        },
        403
      );
    }

    // ------------------------------------------------------------------------
    // Atomic database transaction.
    //
    // The database RPC owns:
    // - venue cooldown
    // - previous venue-signal expiry
    // - insertion of the new signal
    // - weighted aggregation
    // - public venue_live_state update
    //
    // Venue reports never receive Livey Points.
    // ------------------------------------------------------------------------

    const {
      data,
      error: rpcError,
    } = await supabase.rpc(
      "submit_venue_crowd_status_atomic",
      {
        p_dashboard_account_id:
          dashboardAccountId,

        p_venue_id:
          appVenueId,

        p_crowd:
          crowd,

        p_queue:
          queue,
      }
    );

    if (rpcError) {
      console.error(
        "Venue Crowd Status RPC error:",
        rpcError
      );

      return jsonResponse(
        {
          error:
            "Could not update Crowd Status",
        },
        500
      );
    }

    const result =
      Array.isArray(data)
        ? (
            data[0] as
              | VenueLiveStatusRpcRow
              | undefined
          )
        : (
            data as
              | VenueLiveStatusRpcRow
              | null
          );

    if (!result) {
      return jsonResponse(
        {
          error:
            "Crowd Status update returned no result",
        },
        500
      );
    }

    if (
      result.accepted !== true
    ) {
      if (
        result.reason ===
        "cooldown"
      ) {
        return jsonResponse(
          {
            error:
              "Please wait before updating Crowd Status again.",

            accepted: false,

            reason:
              "cooldown",

            next_submission_at:
              result.next_submission_at,
          },
          429
        );
      }

      return jsonResponse(
        {
          error:
            "Crowd Status update was not accepted",

          accepted: false,

          reason:
            result.reason,
        },
        409
      );
    }

    // This is an invariant for venue-owner submissions.
    if (
      result.points_awarded !== 0
    ) {
      console.error(
        "Unexpected venue Crowd Status reward:",
        result.points_awarded
      );

      return jsonResponse(
        {
          error:
            "Crowd Status reward invariant failed",
        },
        500
      );
    }

    return jsonResponse(
      {
        accepted: true,

        crowd_report_id:
          result.crowd_report_id,

        queue_report_id:
          result.queue_report_id,

        live_state: {
          crowd_state:
            result.crowd_state,

          crowd_confidence:
            result.crowd_confidence,

          crowd_report_count:
            result.crowd_report_count,

          queue_state:
            result.queue_state,

          queue_confidence:
            result.queue_confidence,

          queue_report_count:
            result.queue_report_count,
        },

        points_awarded: 0,

        next_submission_at:
          result.next_submission_at,
      },
      200
    );
  } catch (error) {
    console.error(
      "app-submit-venue-live-status error:",
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