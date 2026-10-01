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
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405
    );
  }

  try {
    const authHeader =
      request.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse(
        { error: "Missing authorization header" },
        401
      );
    }

    const body = await request
      .json()
      .catch(() => null);

    const claimCode =
      typeof body?.claim_code === "string"
        ? body.claim_code.trim()
        : "";

    if (!claimCode) {
      return jsonResponse(
        { error: "Missing claim code" },
        400
      );
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

    /*
     * Resolve the authenticated dashboard user from the actual
     * Authorization header.
     *
     * Never trust a user ID or email supplied in the request body.
     */
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
        { error: "Not signed in" },
        401
      );
    }

    if (!user.email) {
      return jsonResponse(
        {
          error:
            "Dashboard user has no email",
        },
        400
      );
    }

    const dashboardAdmin = createClient(
      dashboardSupabaseUrl,
      dashboardServiceRoleKey
    );

    /*
     * SECURITY BOUNDARY:
     *
     * V1 permits exactly:
     *
     * 1 authenticated user
     *   -> 1 dashboard account
     *   -> 1 venue
     *
     * Before touching the consumer/app Supabase claim state,
     * check whether this authenticated user already owns a venue.
     *
     * This prevents an existing dashboard account from claiming
     * a second venue even if the frontend sends an incorrect or
     * stale claim code.
     */
    const {
      data: existingAccount,
      error: existingAccountError,
    } = await dashboardAdmin
      .from("dashboard_accounts")
      .select(
        "id, auth_user_id, account_email, account_name"
      )
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (existingAccountError) {
      console.error(
        "Dashboard account lookup error:",
        existingAccountError
      );

      return jsonResponse(
        {
          error:
            "Could not check dashboard account",
        },
        500
      );
    }

    if (existingAccount) {
      const {
        data: existingVenueLinks,
        error: existingVenueLinksError,
      } = await dashboardAdmin
        .from("dashboard_venue_links")
        .select(
          `
          id,
          dashboard_account_id,
          app_venue_id,
          app_venue_name,
          app_venue_city,
          app_venue_area,
          role
        `
        )
        .eq(
          "dashboard_account_id",
          existingAccount.id
        )
        .limit(2);

      if (existingVenueLinksError) {
        console.error(
          "Dashboard venue link lookup error:",
          existingVenueLinksError
        );

        return jsonResponse(
          {
            error:
              "Could not check dashboard venue ownership",
          },
          500
        );
      }

      if (
        existingVenueLinks &&
        existingVenueLinks.length > 0
      ) {
        console.warn(
          "Blocked second venue claim for existing dashboard account:",
          {
            auth_user_id: user.id,
            dashboard_account_id:
              existingAccount.id,
            existing_venue_ids:
              existingVenueLinks.map(
                (link) => link.app_venue_id
              ),
          }
        );

        return jsonResponse(
          {
            error:
              "This dashboard account is already linked to another venue.",
          },
          409
        );
      }
    }

    /*
     * Only after the dashboard-side ownership guard has passed
     * are we allowed to ask the consumer/app backend to complete
     * the actual venue claim.
     *
     * This ordering matters:
     * the old implementation claimed the venue in the app backend
     * first and only then created the dashboard relationship.
     */
    const appSupabaseUrl =
      Deno.env.get(
        "LIVEY_APP_SUPABASE_URL"
      );

    const sharedSecret =
      Deno.env.get(
        "LIVEY_DASHBOARD_SHARED_SECRET"
      );

    const dashboardProjectRef =
      Deno.env.get(
        "LIVEY_DASHBOARD_PROJECT_REF"
      ) || "";

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
      `${appSupabaseUrl}/functions/v1/complete-dashboard-venue-claim`;

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
          claim_code: claimCode,
          dashboard_auth_user_id:
            user.id,
          dashboard_user_email:
            user.email,
          dashboard_project_ref:
            dashboardProjectRef,
        }),
      }
    );

    const appPayload =
      (await appResponse
        .json()
        .catch(
          () => null
        )) as CompleteAppClaimResponse | null;

    if (
      !appResponse.ok ||
      !appPayload?.venue
    ) {
      return jsonResponse(
        {
          error:
            appPayload?.error ||
            "This venue could not be claimed right now.",
        },
        appResponse.status
      );
    }

    /*
     * Create or recover the dashboard account for this exact
     * authenticated user.
     *
     * Existing accounts without a venue link are allowed to
     * continue. Existing accounts WITH a venue link were rejected
     * above before the app-side claim was touched.
     */
    const {
      data: account,
      error: accountError,
    } = await dashboardAdmin
      .from("dashboard_accounts")
      .upsert(
        {
          auth_user_id: user.id,
          account_email: user.email,
          account_name:
            typeof user.user_metadata
              ?.verified_venue_name ===
            "string"
              ? user.user_metadata
                  .verified_venue_name
              : appPayload.venue
                  .app_venue_name,
        },
        {
          onConflict:
            "auth_user_id",
        }
      )
      .select(
        "id, auth_user_id, account_email, account_name"
      )
      .single();

    if (
      accountError ||
      !account
    ) {
      console.error(
        "Dashboard account upsert error:",
        accountError
      );

      return jsonResponse(
        {
          error:
            "Could not create dashboard account",
        },
        500
      );
    }

    /*
     * Defensive second check.
     *
     * Another claim request could theoretically race with this
     * request after the first ownership check.
     *
     * The database UNIQUE(dashboard_account_id) constraint that
     * we will add after repairing the existing bad data will become
     * the final authoritative protection against that race.
     */
    const {
      data: linkBeforeInsert,
      error: linkBeforeInsertError,
    } = await dashboardAdmin
      .from("dashboard_venue_links")
      .select(
        "id, app_venue_id, app_venue_name"
      )
      .eq(
        "dashboard_account_id",
        account.id
      )
      .maybeSingle();

    if (linkBeforeInsertError) {
      console.error(
        "Pre-insert venue ownership check error:",
        linkBeforeInsertError
      );

      return jsonResponse(
        {
          error:
            "Could not verify dashboard venue ownership",
        },
        500
      );
    }

    if (linkBeforeInsert) {
      if (
        linkBeforeInsert.app_venue_id ===
        appPayload.venue.app_venue_id
      ) {
        return jsonResponse(
          {
            account,
            venue_link:
              linkBeforeInsert,
          },
          200
        );
      }

      return jsonResponse(
        {
          error:
            "This dashboard account is already linked to another venue.",
        },
        409
      );
    }

    const {
      data: venueLink,
      error: linkError,
    } = await dashboardAdmin
      .from("dashboard_venue_links")
      .insert({
        dashboard_account_id:
          account.id,
        app_venue_id:
          appPayload.venue
            .app_venue_id,
        app_venue_name:
          appPayload.venue
            .app_venue_name,
        app_venue_city:
          appPayload.venue
            .app_venue_city,
        app_venue_area:
          appPayload.venue
            .app_venue_area,
        role: "owner",
      })
      .select(
        `
        id,
        dashboard_account_id,
        app_venue_id,
        app_venue_name,
        app_venue_city,
        app_venue_area,
        role
      `
      )
      .single();

    if (
      linkError ||
      !venueLink
    ) {
      console.error(
        "Dashboard venue link insert error:",
        linkError
      );

      /*
       * Once UNIQUE(dashboard_account_id) exists, a concurrent
       * second claim will also be rejected by PostgreSQL even if
       * it somehow passes the application-level checks.
       */
      if (
        linkError?.code === "23505"
      ) {
        return jsonResponse(
          {
            error:
              "This dashboard account is already linked to another venue.",
          },
          409
        );
      }

      return jsonResponse(
        {
          error:
            "Could not link this venue to your dashboard account",
        },
        500
      );
    }

    const { error: auditError } =
      await dashboardAdmin
        .from(
          "dashboard_audit_logs"
        )
        .insert({
          dashboard_account_id:
            account.id,
          app_venue_id:
            appPayload.venue
              .app_venue_id,
          action: "venue_claimed",
          payload: {
            app_venue_name:
              appPayload.venue
                .app_venue_name,
            dashboard_auth_user_id:
              user.id,
          },
        });

    if (auditError) {
      /*
       * Audit logging failure must not undo a successfully created
       * ownership relationship, but it should remain visible in
       * server logs.
       */
      console.error(
        "Dashboard venue claim audit log error:",
        auditError
      );
    }

    return jsonResponse(
      {
        account,
        venue_link:
          venueLink,
      },
      200
    );
  } catch (error) {
    console.error(
      "dashboard-complete-venue-claim error:",
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