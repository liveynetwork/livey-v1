import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_DISTANCE_METERS = 150;
const MAX_LOCATION_ACCURACY_METERS = 100;

type CrowdValue =
  | "quiet"
  | "comfortable"
  | "busy"
  | "packed";

type QueueValue =
  | "none"
  | "short"
  | "long";

type RequestBody = {
  venue_id?: string;
  crowd?: CrowdValue;
  queue?: QueueValue;
  latitude?: number;
  longitude?: number;
  accuracy_meters?: number;
};

type AtomicSubmissionRow = {
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
  new_balance: number;

  next_submission_at: string;
};

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}

function isValidLatitude(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90
  );
}

function isValidLongitude(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  );
}

function isValidAccuracy(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

function isValidCrowdValue(
  value: unknown,
): value is CrowdValue {
  return (
    typeof value === "string" &&
    [
      "quiet",
      "comfortable",
      "busy",
      "packed",
    ].includes(value)
  );
}

function isValidQueueValue(
  value: unknown,
): value is QueueValue {
  return (
    typeof value === "string" &&
    [
      "none",
      "short",
      "long",
    ].includes(value)
  );
}

function degreesToRadians(
  degrees: number,
) {
  return degrees * (Math.PI / 180);
}

function calculateDistanceMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadiusMeters = 6_371_000;

  const latitudeDelta =
    degreesToRadians(
      latitude2 - latitude1,
    );

  const longitudeDelta =
    degreesToRadians(
      longitude2 - longitude1,
    );

  const lat1 =
    degreesToRadians(latitude1);

  const lat2 =
    degreesToRadians(latitude2);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(longitudeDelta / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a),
    );

  return earthRadiusMeters * c;
}

Deno.serve(
  async (request) => {
    if (request.method === "OPTIONS") {
      return new Response(
        "ok",
        {
          headers: corsHeaders,
        },
      );
    }

    if (request.method !== "POST") {
      return jsonResponse(
        405,
        {
          error:
            "Method not allowed.",
        },
      );
    }

    try {
      const supabaseUrl =
        Deno.env.get(
          "SUPABASE_URL",
        );

      const anonKey =
        Deno.env.get(
          "SUPABASE_ANON_KEY",
        );

      const serviceRoleKey =
        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY",
        );

      if (
        !supabaseUrl ||
        !anonKey ||
        !serviceRoleKey
      ) {
        return jsonResponse(
          500,
          {
            error:
              "Server configuration is incomplete.",
          },
        );
      }

      const authorization =
        request.headers.get(
          "Authorization",
        );

      if (!authorization) {
        return jsonResponse(
          401,
          {
            error:
              "Not signed in.",
          },
        );
      }

      const authClient =
        createClient(
          supabaseUrl,
          anonKey,
          {
            global: {
              headers: {
                Authorization:
                  authorization,
              },
            },
            auth: {
              autoRefreshToken:
                false,
              persistSession:
                false,
            },
          },
        );

      const {
        data: userData,
        error: userError,
      } =
        await authClient.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        return jsonResponse(
          401,
          {
            error:
              "Not signed in.",
          },
        );
      }

      const user =
        userData.user;

      const body =
        await request
          .json()
          .catch(
            () => null,
          ) as
          | RequestBody
          | null;

      if (!body) {
        return jsonResponse(
          400,
          {
            error:
              "Invalid request body.",
          },
        );
      }

      const venueId =
        body.venue_id?.trim();

      if (!venueId) {
        return jsonResponse(
          400,
          {
            error:
              "venue_id is required.",
          },
        );
      }

      if (
        !isValidCrowdValue(
          body.crowd,
        )
      ) {
        return jsonResponse(
          400,
          {
            error:
              "A valid crowd status is required.",
          },
        );
      }

      if (
        body.queue !==
          undefined &&
        !isValidQueueValue(
          body.queue,
        )
      ) {
        return jsonResponse(
          400,
          {
            error:
              "Invalid queue status.",
          },
        );
      }

      if (
        !isValidLatitude(
          body.latitude,
        ) ||
        !isValidLongitude(
          body.longitude,
        )
      ) {
        return jsonResponse(
          400,
          {
            error:
              "A valid foreground location is required.",
          },
        );
      }

      if (
        !isValidAccuracy(
          body.accuracy_meters,
        )
      ) {
        return jsonResponse(
          400,
          {
            error:
              "Location accuracy is required.",
          },
        );
      }

      if (
        body.accuracy_meters >
        MAX_LOCATION_ACCURACY_METERS
      ) {
        return jsonResponse(
          400,
          {
            error:
              "Location accuracy is too low. Try again when your location is more precise.",
          },
        );
      }

      const adminClient =
        createClient(
          supabaseUrl,
          serviceRoleKey,
          {
            auth: {
              autoRefreshToken:
                false,
              persistSession:
                false,
            },
          },
        );

      /*
       * Venue location is loaded server-side.
       *
       * The app cannot decide whether
       * the user is close enough.
       */
      const {
        data: venue,
        error: venueError,
      } =
        await adminClient
          .from("venues")
          .select(
            `
              id,
              latitude,
              longitude,
              is_active,
              approval_status
            `,
          )
          .eq(
            "id",
            venueId,
          )
          .maybeSingle();

      if (venueError) {
        console.error(
          "Venue lookup failed:",
          venueError,
        );

        return jsonResponse(
          500,
          {
            error:
              "Could not load venue.",
          },
        );
      }

      if (
        !venue ||
        !venue.is_active ||
        venue.approval_status !==
          "approved"
      ) {
        return jsonResponse(
          404,
          {
            error:
              "Venue not found.",
          },
        );
      }

      const distanceMeters =
        calculateDistanceMeters(
          body.latitude,
          body.longitude,
          venue.latitude,
          venue.longitude,
        );

      if (
        distanceMeters >
        MAX_DISTANCE_METERS
      ) {
        return jsonResponse(
          403,
          {
            error:
              "You must be near this venue to submit Crowd Status.",
          },
        );
      }

      /*
       * Everything below this point is
       * one atomic PostgreSQL transaction.
       *
       * The RPC handles:
       *
       * - 20-minute cooldown
       * - previous report expiry
       * - crowd report insertion
       * - optional queue report insertion
       * - +1 Livey Point ledger entry
       * - wallet balance update
       * - freshness-weighted aggregation
       * - venue_live_state update
       *
       * If any part fails, PostgreSQL
       * rolls the entire submission back.
       */
      const {
        data: atomicData,
        error: atomicError,
      } =
        await adminClient.rpc(
          "submit_crowd_status_atomic",
          {
            p_user_id:
              user.id,

            p_venue_id:
              venueId,

            p_crowd:
              body.crowd,

            p_queue:
              body.queue ??
              null,
          },
        );

      if (atomicError) {
        console.error(
          "Atomic Crowd Status submission failed:",
          atomicError,
        );

        return jsonResponse(
          500,
          {
            error:
              "Crowd Status could not be submitted.",
          },
        );
      }

      const result =
        (
          atomicData ??
          []
        )[0] as
          | AtomicSubmissionRow
          | undefined;

      if (!result) {
        return jsonResponse(
          500,
          {
            error:
              "Crowd Status returned no result.",
          },
        );
      }

      /*
       * Cooldown is a valid business
       * outcome, not a server failure.
       */
      if (
        !result.accepted &&
        result.reason ===
          "cooldown"
      ) {
        return jsonResponse(
          429,
          {
            error:
              "You recently submitted Crowd Status for this venue.",

            next_allowed_at:
              result.next_submission_at,
          },
        );
      }

      if (!result.accepted) {
        return jsonResponse(
          400,
          {
            error:
              "Crowd Status was not accepted.",

            reason:
              result.reason,
          },
        );
      }

      if (
        result.points_awarded !==
        1
      ) {
        console.error(
          "Unexpected Crowd Status reward result:",
          result,
        );

        return jsonResponse(
          500,
          {
            error:
              "Crowd Status reward could not be confirmed.",
          },
        );
      }

      return jsonResponse(
        200,
        {
          success: true,

          venue_id:
            venueId,

          contribution: {
            crowd:
              body.crowd,

            queue:
              body.queue ??
              null,

            next_submission_at:
              result.next_submission_at,
          },

          live_state: {
            crowd:
              result.crowd_state,

            /*
             * Consumer UI:
             *
             * null / none
             * → render no queue element
             */
            queue:
              result.queue_state,
          },

          reward: {
            awarded: true,

            points_awarded:
              result.points_awarded,

            new_balance:
              result.new_balance,
          },
        },
      );
    } catch (error) {
      console.error(
        "submit-live-report error:",
        error,
      );

      return jsonResponse(
        500,
        {
          error:
            "Unexpected server error.",
        },
      );
    }
  },
);