import { createClient } from "@supabase/supabase-js";

const requiredEnv = [
  // Consumer/App project
  "SECURITY_CONSUMER_SUPABASE_URL",
  "SECURITY_CONSUMER_SUPABASE_ANON_KEY",
  "SECURITY_CONSUMER_TEST_EMAIL",
  "SECURITY_CONSUMER_TEST_PASSWORD",

  // Dashboard project
  "SECURITY_DASHBOARD_SUPABASE_URL",
  "SECURITY_DASHBOARD_SUPABASE_ANON_KEY",
  "SECURITY_DASHBOARD_UNLINKED_EMAIL",
  "SECURITY_DASHBOARD_UNLINKED_PASSWORD",
  "SECURITY_DASHBOARD_OWNER_EMAIL",
  "SECURITY_DASHBOARD_OWNER_PASSWORD",

  // Test fixtures
  "SECURITY_TEST_VENUE_ID",
  "SECURITY_FOREIGN_EVENT_ID",
  "SECURITY_ACTIVE_FOREIGN_EVENT_ID",
  "SECURITY_OWNED_APP_VENUE_ID",
  "SECURITY_FOREIGN_APP_VENUE_ID",
];

const missingEnv = requiredEnv.filter(
  (name) => !process.env[name]?.trim(),
);

if (missingEnv.length > 0) {
  console.error("\nLIVEY SECURITY TESTS\n");
  console.error("Missing required environment variables:\n");

  for (const name of missingEnv) {
    console.error(`  - ${name}`);
  }

  console.error(
    "\nCheck .env.security.local and try again.\n",
  );

  process.exit(1);
}

/* -------------------------------------------------------------------------- */
/* Environment                                                                */
/* -------------------------------------------------------------------------- */

const consumerSupabaseUrl =
  process.env.SECURITY_CONSUMER_SUPABASE_URL;

const consumerAnonKey =
  process.env.SECURITY_CONSUMER_SUPABASE_ANON_KEY;

const consumerEmail =
  process.env.SECURITY_CONSUMER_TEST_EMAIL;

const consumerPassword =
  process.env.SECURITY_CONSUMER_TEST_PASSWORD;

const dashboardSupabaseUrl =
  process.env.SECURITY_DASHBOARD_SUPABASE_URL;

const dashboardAnonKey =
  process.env.SECURITY_DASHBOARD_SUPABASE_ANON_KEY;

const dashboardUnlinkedEmail =
  process.env.SECURITY_DASHBOARD_UNLINKED_EMAIL;

const dashboardUnlinkedPassword =
  process.env.SECURITY_DASHBOARD_UNLINKED_PASSWORD;

const dashboardOwnerEmail =
  process.env.SECURITY_DASHBOARD_OWNER_EMAIL;

const dashboardOwnerPassword =
  process.env.SECURITY_DASHBOARD_OWNER_PASSWORD;

const testVenueId =
  process.env.SECURITY_TEST_VENUE_ID;

const foreignEventId =
  process.env.SECURITY_FOREIGN_EVENT_ID;

const activeForeignEventId =
  process.env.SECURITY_ACTIVE_FOREIGN_EVENT_ID;

const ownedAppVenueId =
  process.env.SECURITY_OWNED_APP_VENUE_ID;

const foreignAppVenueId =
  process.env.SECURITY_FOREIGN_APP_VENUE_ID;

/* -------------------------------------------------------------------------- */
/* Supabase clients                                                           */
/* -------------------------------------------------------------------------- */

const consumerSupabase = createClient(
  consumerSupabaseUrl,
  consumerAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
);

const dashboardUnlinkedSupabase = createClient(
  dashboardSupabaseUrl,
  dashboardAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
);

const dashboardOwnerSupabase = createClient(
  dashboardSupabaseUrl,
  dashboardAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
);

/* -------------------------------------------------------------------------- */
/* Result helpers                                                             */
/* -------------------------------------------------------------------------- */

const results = [];

function recordResult({
  name,
  passed,
  detail,
}) {
  results.push({
    name,
    passed,
    detail,
  });

  const status = passed ? "PASS" : "FAIL";

  console.log(
    `${status.padEnd(6)} ${name}${detail ? ` — ${detail}` : ""}`,
  );
}

async function runTest(
  name,
  test,
) {
  try {
    const result = await test();

    recordResult({
      name,
      passed: result.passed,
      detail: result.detail,
    });
  } catch (error) {
    recordResult({
      name,
      passed: false,
      detail:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
}

function printSummary() {
  const passed =
    results.filter(
      (result) => result.passed,
    ).length;

  const failed =
    results.length - passed;

  console.log("");
  console.log("====================");
  console.log(
    `RESULT: ${passed}/${results.length} passed`,
  );

  if (failed === 0) {
    console.log(
      "LIVEY SECURITY CHECK PASSED",
    );
  } else {
    console.log(
      `LIVEY SECURITY CHECK FAILED (${failed} failure${failed === 1 ? "" : "s"})`,
    );
  }

  console.log("");
}

/* -------------------------------------------------------------------------- */
/* Authentication helpers                                                     */
/* -------------------------------------------------------------------------- */

async function signInWithPassword(
  client,
  email,
  password,
  label,
) {
  const {
    data,
    error,
  } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(
      `${label} sign-in failed: ${error.message}`,
    );
  }

  if (
    !data.user ||
    !data.session?.access_token
  ) {
    throw new Error(
      `${label} sign-in succeeded but returned no authenticated session.`,
    );
  }

  return data;
}

async function signInConsumerTestUser() {
  return signInWithPassword(
    consumerSupabase,
    consumerEmail,
    consumerPassword,
    "Consumer test user",
  );
}

async function signInDashboardUnlinkedUser() {
  return signInWithPassword(
    dashboardUnlinkedSupabase,
    dashboardUnlinkedEmail,
    dashboardUnlinkedPassword,
    "Dashboard unlinked test user",
  );
}

async function signInDashboardOwnerUser() {
  return signInWithPassword(
    dashboardOwnerSupabase,
    dashboardOwnerEmail,
    dashboardOwnerPassword,
    "Dashboard owner test user",
  );
}

/* -------------------------------------------------------------------------- */
/* Consumer fixture checks                                                    */
/* -------------------------------------------------------------------------- */

async function verifyConsumerOwnsNoVenues(
  userId,
) {
  const {
    data,
    error,
  } = await consumerSupabase
    .from("venue_owners")
    .select("venue_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(
      `Could not verify consumer venue ownership: ${error.message}`,
    );
  }

  if ((data ?? []).length > 0) {
    throw new Error(
      `Consumer security account owns ${(data ?? []).length} venue(s). ` +
        "Use a consumer test account with zero venue ownership.",
    );
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/* Dashboard fixture checks                                                   */
/* -------------------------------------------------------------------------- */

async function getDashboardAccountForUser(
  client,
  authUserId,
) {
  const {
    data,
    error,
  } = await client
    .from("dashboard_accounts")
    .select("id, auth_user_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not read dashboard account: ${error.message}`,
    );
  }

  return data ?? null;
}

async function getDashboardLinksForAccount(
  client,
  dashboardAccountId,
) {
  const {
    data,
    error,
  } = await client
    .from("dashboard_venue_links")
    .select(
      "dashboard_account_id, app_venue_id",
    )
    .eq(
      "dashboard_account_id",
      dashboardAccountId,
    );

  if (error) {
    throw new Error(
      `Could not read dashboard venue links: ${error.message}`,
    );
  }

  return data ?? [];
}

async function verifyDashboardUnlinkedFixture(
  authUserId,
) {
  const account =
    await getDashboardAccountForUser(
      dashboardUnlinkedSupabase,
      authUserId,
    );

  if (!account) {
    return {
      account: null,
      links: [],
    };
  }

  const links =
    await getDashboardLinksForAccount(
      dashboardUnlinkedSupabase,
      account.id,
    );

  if (links.length > 0) {
    throw new Error(
      `Dashboard unlinked test account unexpectedly has ${links.length} venue link(s).`,
    );
  }

  return {
    account,
    links,
  };
}

async function verifyDashboardOwnerFixture(
  authUserId,
) {
  const account =
    await getDashboardAccountForUser(
      dashboardOwnerSupabase,
      authUserId,
    );

  if (!account) {
    throw new Error(
      "Dashboard owner test user has no dashboard_accounts row.",
    );
  }

  const links =
    await getDashboardLinksForAccount(
      dashboardOwnerSupabase,
      account.id,
    );

  if (links.length !== 1) {
    throw new Error(
      `Dashboard owner fixture must have exactly one venue link. Found ${links.length}.`,
    );
  }

  const linkedVenueId =
    links[0]?.app_venue_id;

  if (
    linkedVenueId !==
    ownedAppVenueId
  ) {
    throw new Error(
      `Dashboard owner fixture is linked to ${linkedVenueId}, ` +
        `but SECURITY_OWNED_APP_VENUE_ID is ${ownedAppVenueId}.`,
    );
  }

  return {
    account,
    links,
  };
}

/* -------------------------------------------------------------------------- */
/* Generic Edge Function helper                                               */
/* -------------------------------------------------------------------------- */

async function callDashboardFunction({
  functionName,
  accessToken,
  body,
}) {
  const response = await fetch(
    `${dashboardSupabaseUrl}/functions/v1/${functionName}`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        apikey: dashboardAnonKey,
        Authorization:
          `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    },
  );

  let responseBody = null;

  try {
    responseBody =
      await response.json();
  } catch {
    responseBody = null;
  }

  return {
    status: response.status,
    body: responseBody,
  };
}

/* -------------------------------------------------------------------------- */
/* Consumer RLS tests                                                         */
/* -------------------------------------------------------------------------- */

async function testUnauthorizedEventInsert() {
  const uniqueTitle =
    `SECURITY TEST ${Date.now()} UNAUTHORIZED INSERT`;

  const {
    data,
    error,
  } = await consumerSupabase
    .from("venue_events")
    .insert({
      venue_id: testVenueId,
      title: uniqueTitle,
    })
    .select("id");

  const rows = data ?? [];

  if (rows.length > 0) {
    return {
      passed: false,
      detail:
        "Unauthorized INSERT returned a created event.",
    };
  }

  if (!error) {
    return {
      passed: false,
      detail:
        "Unauthorized INSERT was not rejected.",
    };
  }

  const looksLikeRlsBlock =
    error.code === "42501" ||
    error.message
      ?.toLowerCase()
      .includes("row-level security");

  return {
    passed: looksLikeRlsBlock,
    detail: looksLikeRlsBlock
      ? "RLS rejected unauthorized event creation."
      : `Unexpected error: ${error.message}`,
  };
}

async function testUnauthorizedEventUpdate() {
  const marker =
    `SECURITY TEST ${Date.now()} UNAUTHORIZED UPDATE`;

  const {
    data,
    error,
  } = await consumerSupabase
    .from("venue_events")
    .update({
      description: marker,
    })
    .eq("id", foreignEventId)
    .select("id, description");

  if (error) {
    const looksLikeRlsBlock =
      error.code === "42501" ||
      error.message
        ?.toLowerCase()
        .includes("row-level security");

    return {
      passed: looksLikeRlsBlock,
      detail: looksLikeRlsBlock
        ? "RLS explicitly rejected unauthorized update."
        : `Unexpected error: ${error.message}`,
    };
  }

  const rows = data ?? [];

  return {
    passed: rows.length === 0,
    detail:
      rows.length === 0
        ? "Zero rows were writable under RLS."
        : "Foreign event was unexpectedly updated.",
  };
}

async function testUnauthorizedSoftDelete() {
  const {
    data,
    error,
  } = await consumerSupabase
    .from("venue_events")
    .update({
      is_active: false,
      deleted_at:
        new Date().toISOString(),
      deleted_reason:
        "SECURITY TEST - UNAUTHORIZED SOFT DELETE",
    })
    .eq(
      "id",
      activeForeignEventId,
    )
    .select(
      "id, is_active, deleted_at, deleted_reason",
    );

  if (error) {
    const looksLikeRlsBlock =
      error.code === "42501" ||
      error.message
        ?.toLowerCase()
        .includes("row-level security");

    return {
      passed: looksLikeRlsBlock,
      detail: looksLikeRlsBlock
        ? "RLS explicitly rejected unauthorized soft delete."
        : `Unexpected error: ${error.message}`,
    };
  }

  const rows = data ?? [];

  return {
    passed: rows.length === 0,
    detail:
      rows.length === 0
        ? "Zero rows were writable under RLS."
        : "Foreign event was unexpectedly soft-deleted.",
  };
}

async function testUnauthorizedVenueUpdate() {
  const marker =
    `SECURITY TEST ${Date.now()} UNAUTHORIZED VENUE UPDATE`;

  const {
    data,
    error,
  } = await consumerSupabase
    .from("venues")
    .update({
      description: marker,
    })
    .eq("id", testVenueId)
    .select("id, description");

  if (error) {
    const looksLikeRlsBlock =
      error.code === "42501" ||
      error.message
        ?.toLowerCase()
        .includes("row-level security");

    return {
      passed: looksLikeRlsBlock,
      detail: looksLikeRlsBlock
        ? "RLS explicitly rejected unauthorized venue update."
        : `Unexpected error: ${error.message}`,
    };
  }

  const rows = data ?? [];

  return {
    passed: rows.length === 0,
    detail:
      rows.length === 0
        ? "Zero venue rows were writable under RLS."
        : "Foreign venue was unexpectedly modified.",
  };
}

/* -------------------------------------------------------------------------- */
/* Dashboard authorization tests                                              */
/* -------------------------------------------------------------------------- */

async function testInvalidClaimCode(
  accessToken,
) {
  const result =
    await callDashboardFunction({
      functionName:
        "dashboard-complete-venue-claim",
      accessToken,
      body: {
        claim_code:
          "LIVEY-AUTOMATED-INVALID-CODE",
      },
    });

  const errorMessage =
    result.body?.error;

  const passed =
    result.status === 404 &&
    errorMessage ===
      "This claim code was not found.";

  return {
    passed,
    detail: passed
      ? "Invalid claim code rejected with 404."
      : `Expected 404 claim-code rejection, received ${result.status}: ${errorMessage ?? "no error message"}`,
  };
}

async function testOwnerCannotClaimSecondVenue(
  accessToken,
) {
  /*
   * This deliberately uses an invalid code.
   *
   * The important security property is that an already-linked
   * dashboard account must be rejected BEFORE claim-code processing.
   *
   * Therefore the correct result is 409:
   * "This dashboard account is already linked to another venue."
   *
   * No valid claim code is consumed.
   */
  const result =
    await callDashboardFunction({
      functionName:
        "dashboard-complete-venue-claim",
      accessToken,
      body: {
        claim_code:
          "LIVEY-AUTOMATED-SECOND-CLAIM",
      },
    });

  const errorMessage =
    result.body?.error;

  const passed =
    result.status === 409 &&
    errorMessage ===
      "This dashboard account is already linked to another venue.";

  return {
    passed,
    detail: passed
      ? "Already-linked account rejected before claim-code processing."
      : `Expected 409 second-claim rejection, received ${result.status}: ${errorMessage ?? "no error message"}`,
  };
}

async function testCrossVenueAnalyticsBlocked(
  accessToken,
) {
  const result =
    await callDashboardFunction({
      functionName:
        "dashboard-get-venue-analytics",
      accessToken,
      body: {
        app_venue_id:
          foreignAppVenueId,
      },
    });

  const passed =
    result.status === 403;

  return {
    passed,
    detail: passed
      ? "Foreign venue analytics request rejected with 403."
      : `Expected 403 for foreign analytics access, received ${result.status}.`,
  };
}

async function testCrossVenueActivityMutationBlocked(
  accessToken,
) {
  const result =
    await callDashboardFunction({
      functionName:
        "dashboard-manage-venue-activity",
      accessToken,
      body: {
        action: "update",
        app_venue_id:
          foreignAppVenueId,
        event_id:
          "00000000-0000-4000-8000-000000000001",
        title:
          "SECURITY TEST - CROSS VENUE UPDATE",
      },
    });

  const errorMessage =
    result.body?.error;

  const passed =
    result.status === 403 &&
    errorMessage ===
      "This dashboard account does not have access to this venue.";

  return {
    passed,
    detail: passed
      ? "Cross-venue activity mutation rejected with 403."
      : `Expected 403 cross-venue activity rejection, received ${result.status}: ${errorMessage ?? "no error message"}`,
  };
}

async function testLockedProfileFieldBlocked(
  accessToken,
) {
  const result =
    await callDashboardFunction({
      functionName:
        "dashboard-update-venue-profile",
      accessToken,
      body: {
        app_venue_id:
          ownedAppVenueId,

        /*
         * name is intentionally a locked field.
         * The function must reject this request before
         * changing the venue.
         */
        name:
          "SECURITY TEST - LOCKED FIELD",
      },
    });

  const errorMessage =
    result.body?.error;

  const passed =
    result.status === 403 &&
    errorMessage ===
      "This venue detail is locked and cannot be changed from the dashboard.";

  return {
    passed,
    detail: passed
      ? "Locked venue profile field rejected with 403."
      : `Expected 403 locked-field rejection, received ${result.status}: ${errorMessage ?? "no error message"}`,
  };
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log("");
  console.log("LIVEY SECURITY TESTS");
  console.log("====================");
  console.log("");

  let consumerAuth;
  let dashboardUnlinkedAuth;
  let dashboardOwnerAuth;

  /* ---------------------------------------------------------------------- */
  /* Consumer authentication                                                */
  /* ---------------------------------------------------------------------- */

  try {
    consumerAuth =
      await signInConsumerTestUser();

    recordResult({
      name:
        "Consumer test-user authentication",
      passed: true,
      detail:
        "Signed in successfully.",
    });
  } catch (error) {
    recordResult({
      name:
        "Consumer test-user authentication",
      passed: false,
      detail:
        error instanceof Error
          ? error.message
          : String(error),
    });

    printSummary();
    process.exit(1);
  }

  await runTest(
    "Consumer account owns zero venues",
    async () => {
      await verifyConsumerOwnsNoVenues(
        consumerAuth.user.id,
      );

      return {
        passed: true,
        detail:
          "Test account has no venue ownership links.",
      };
    },
  );

  const consumerOwnershipCheck =
    results.find(
      (result) =>
        result.name ===
        "Consumer account owns zero venues",
    );

  if (
    !consumerOwnershipCheck?.passed
  ) {
    console.log("");
    console.log(
      "Stopping consumer mutation tests because the consumer security account is not a safe zero-ownership fixture.",
    );

    await consumerSupabase.auth.signOut();

    printSummary();
    process.exit(1);
  }

  /* ---------------------------------------------------------------------- */
  /* Consumer RLS                                                           */
  /* ---------------------------------------------------------------------- */

  await runTest(
    "Unauthorized venue_events INSERT",
    testUnauthorizedEventInsert,
  );

  await runTest(
    "Unauthorized venue_events UPDATE",
    testUnauthorizedEventUpdate,
  );

  await runTest(
    "Unauthorized venue_events soft delete",
    testUnauthorizedSoftDelete,
  );

  await runTest(
    "Unauthorized venues UPDATE",
    testUnauthorizedVenueUpdate,
  );

  /* ---------------------------------------------------------------------- */
  /* Dashboard authentication                                               */
  /* ---------------------------------------------------------------------- */

  try {
    dashboardUnlinkedAuth =
      await signInDashboardUnlinkedUser();

    recordResult({
      name:
        "Dashboard unlinked-user authentication",
      passed: true,
      detail:
        "Signed in successfully.",
    });
  } catch (error) {
    recordResult({
      name:
        "Dashboard unlinked-user authentication",
      passed: false,
      detail:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }

  try {
    dashboardOwnerAuth =
      await signInDashboardOwnerUser();

    recordResult({
      name:
        "Dashboard owner authentication",
      passed: true,
      detail:
        "Signed in successfully.",
    });
  } catch (error) {
    recordResult({
      name:
        "Dashboard owner authentication",
      passed: false,
      detail:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }

  if (
    !dashboardUnlinkedAuth ||
    !dashboardOwnerAuth
  ) {
    console.log("");
    console.log(
      "Stopping dashboard authorization tests because one or more dashboard fixtures could not authenticate.",
    );

    await Promise.allSettled([
      consumerSupabase.auth.signOut(),
      dashboardUnlinkedSupabase.auth.signOut(),
      dashboardOwnerSupabase.auth.signOut(),
    ]);

    printSummary();

    const failed =
      results.filter(
        (result) => !result.passed,
      );

    process.exit(
      failed.length > 0 ? 1 : 0,
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Dashboard fixture verification                                         */
  /* ---------------------------------------------------------------------- */

  await runTest(
    "Dashboard unlinked fixture",
    async () => {
      const result =
        await verifyDashboardUnlinkedFixture(
          dashboardUnlinkedAuth.user.id,
        );

      return {
        passed: true,
        detail:
          result.account
            ? "Dashboard account exists with zero venue links."
            : "No dashboard account or venue link exists yet.",
      };
    },
  );

  await runTest(
    "Dashboard owner fixture",
    async () => {
      await verifyDashboardOwnerFixture(
        dashboardOwnerAuth.user.id,
      );

      return {
        passed: true,
        detail:
          `Exactly one venue link exists for ${ownedAppVenueId}.`,
      };
    },
  );

  const unlinkedFixtureSafe =
    results.find(
      (result) =>
        result.name ===
        "Dashboard unlinked fixture",
    )?.passed;

  const ownerFixtureSafe =
    results.find(
      (result) =>
        result.name ===
        "Dashboard owner fixture",
    )?.passed;

  /* ---------------------------------------------------------------------- */
  /* Claim authorization                                                    */
  /* ---------------------------------------------------------------------- */

  if (unlinkedFixtureSafe) {
    await runTest(
      "Invalid dashboard claim code",
      () =>
        testInvalidClaimCode(
          dashboardUnlinkedAuth.session
            .access_token,
        ),
    );
  }

  if (ownerFixtureSafe) {
  const ownerAccessToken =
    dashboardOwnerAuth.session.access_token;

  await runTest(
    "Already-linked account second claim",
    () =>
      testOwnerCannotClaimSecondVenue(
        ownerAccessToken,
      ),
  );

  await runTest(
    "Cross-venue analytics access",
    () =>
      testCrossVenueAnalyticsBlocked(
        ownerAccessToken,
      ),
  );

  await runTest(
    "Cross-venue activity mutation",
    () =>
      testCrossVenueActivityMutationBlocked(
        ownerAccessToken,
      ),
  );

  await runTest(
    "Locked venue profile mutation",
    () =>
      testLockedProfileFieldBlocked(
        ownerAccessToken,
      ),
  );
}

  /* ---------------------------------------------------------------------- */
  /* Cleanup                                                                */
  /* ---------------------------------------------------------------------- */

  await Promise.allSettled([
    consumerSupabase.auth.signOut(),
    dashboardUnlinkedSupabase.auth.signOut(),
    dashboardOwnerSupabase.auth.signOut(),
  ]);

  printSummary();

  const failed =
    results.filter(
      (result) => !result.passed,
    );

  process.exit(
    failed.length > 0 ? 1 : 0,
  );
}

await main();