import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type UpdateVenueProfilePayload = {
  app_venue_id?: string;
  description?: string | null;
  open_status?: string | null;
  opening_hours?: string | null;
  logo_url?: string | null;

  // Locked fields are represented only
  // so forged requests can be rejected.
  name?: unknown;
  category?: unknown;
  area?: unknown;
  address?: unknown;
  city?: unknown;
  verified?: unknown;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-livey-dashboard-secret",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

const lockedVenueFields = [
  "name",
  "category",
  "area",
  "address",
  "city",
  "verified",
] as const;

const allowedRequestFields = new Set([
  "app_venue_id",
  "description",
  "open_status",
  "opening_hours",
  "logo_url",
  ...lockedVenueFields,
]);

const allowedOpenStatuses = new Set([
  "Open now",
  "Live now",
  "Tonight",
  "Weekend",
]);

const MAX_DESCRIPTION_LENGTH = 200;
const MAX_OPENING_HOURS_LENGTH = 5000;
const MAX_LOGO_URL_LENGTH = 2048;

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
      | UpdateVenueProfilePayload
      | null;

    if (!body || typeof body !== "object") {
      return jsonResponse(
        {
          error: "Invalid request body",
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

    /*
     * These values are controlled by Livey,
     * not by venue owners through the
     * dashboard.
     *
     * Do not silently ignore them.
     * Explicit rejection makes forged
     * requests fail closed.
     */
    const lockedField =
      lockedVenueFields.find((field) =>
        Object.prototype.hasOwnProperty.call(
          body,
          field
        )
      );

    if (lockedField) {
      return jsonResponse(
        {
          error:
            "This venue detail is locked and cannot be changed from the dashboard.",
        },
        403
      );
    }

    /*
     * Fail closed if somebody attempts
     * to introduce an undocumented field.
     */
    const unsupportedField =
      Object.keys(body).find(
        (field) =>
          !allowedRequestFields.has(field)
      );

    if (unsupportedField) {
      return jsonResponse(
        {
          error:
            "Unsupported venue profile field",
        },
        400
      );
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      );

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        {
          error:
            "Missing Supabase server config",
        },
        500
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const {
      data: venue,
      error: venueError,
    } = await supabase
      .from("venues")
      .select(
        "id, approval_status"
      )
      .eq("id", appVenueId)
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
          error: "Venue not found",
        },
        404
      );
    }

    if (
      venue.approval_status !==
      "approved"
    ) {
      return jsonResponse(
        {
          error:
            "Venue is not approved",
        },
        403
      );
    }

    const updatePayload:
      Record<string, string | null> =
      {};

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "description"
      )
    ) {
      const description =
        cleanOptional(
          body.description
        );

      if (
        description &&
        description.length >
          MAX_DESCRIPTION_LENGTH
      ) {
        return jsonResponse(
          {
            error:
              `Venue description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
          },
          400
        );
      }

      updatePayload.description =
        description;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "open_status"
      )
    ) {
      const openStatus =
        cleanOptional(
          body.open_status
        );

      if (
        openStatus &&
        !allowedOpenStatuses.has(
          openStatus
        )
      ) {
        return jsonResponse(
          {
            error:
              "Invalid venue status",
          },
          400
        );
      }

      updatePayload.open_status =
        openStatus;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "opening_hours"
      )
    ) {
      const openingHours =
        cleanOptional(
          body.opening_hours
        );

      if (
        openingHours &&
        openingHours.length >
          MAX_OPENING_HOURS_LENGTH
      ) {
        return jsonResponse(
          {
            error:
              "Opening hours data is too large",
          },
          400
        );
      }

      updatePayload.opening_hours =
        openingHours;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "logo_url"
      )
    ) {
      const logoUrl =
        cleanOptional(
          body.logo_url
        );

      if (
        logoUrl &&
        logoUrl.length >
          MAX_LOGO_URL_LENGTH
      ) {
        return jsonResponse(
          {
            error:
              "Venue logo URL is too long",
          },
          400
        );
      }

      if (
        logoUrl &&
        !isAllowedVenueLogoUrl(
          logoUrl,
          supabaseUrl
        )
      ) {
        return jsonResponse(
          {
            error:
              "Venue logo must come from Livey venue logo storage.",
          },
          400
        );
      }

      updatePayload.logo_url =
        logoUrl;
    }

    if (
      Object.keys(updatePayload).length === 0
    ) {
      return jsonResponse(
        {
          error:
            "No venue profile changes provided",
        },
        400
      );
    }

    updatePayload.updated_at =
      new Date().toISOString();

    const {
      data: updatedVenue,
      error: updateError,
    } = await supabase
      .from("venues")
      .update(updatePayload)
      .eq("id", appVenueId)
      .select(
        "id, name, category, city, area, address, description, logo_url, verified, open_status, opening_hours"
      )
      .single();

    if (updateError) {
      console.error(
        "Venue profile update error:",
        updateError
      );

      return jsonResponse(
        {
          error:
            "Could not update venue profile",
        },
        500
      );
    }

    return jsonResponse(
      {
        venue: updatedVenue,
      },
      200
    );
  } catch (error) {
    console.error(
      "app-update-venue-profile error:",
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

function cleanOptional(
  value: unknown
): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function isAllowedVenueLogoUrl(
  logoUrl: string,
  supabaseUrl: string
) {
  const allowedPrefix =
    `${supabaseUrl}/storage/v1/object/public/venue-logos/`;

  return logoUrl.startsWith(
    allowedPrefix
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
      },
    }
  );
}