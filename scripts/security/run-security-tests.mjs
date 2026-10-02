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
  "SECURITY_CROWD_TEST_VENUE_ID",
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

const crowdTestVenueId =
  process.env.SECURITY_CROWD_TEST_VENUE_ID;

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
    `${status.padEnd(6)} ${name}${detail ? ` Ã¢â‚¬â€ ${detail}` : ""}`,
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


async function callConsumerFunction({
  functionName,
  accessToken,
  body,
  includeAuthorization = true,
}) {
  const headers = {
    "Content-Type":
      "application/json",
    apikey: consumerAnonKey,
  };

  if (
    includeAuthorization &&
    accessToken
  ) {
    headers.Authorization =
      `Bearer ${accessToken}`;
  }

  const response = await fetch(
    `${consumerSupabaseUrl}/functions/v1/${functionName}`,
    {
      method: "POST",
      headers,
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
/* Crowd Status database protections                                          */
/* -------------------------------------------------------------------------- */

function looksLikePermissionBlock(error) {
  return (
    error?.code === "42501" ||
    error?.message
      ?.toLowerCase()
      .includes("permission denied") ||
    error?.message
      ?.toLowerCase()
      .includes("row-level security")
  );
}

async function testDirectCrowdRpcBlocked(
  userId,
) {
  const {
    data,
    error,
  } = await consumerSupabase.rpc(
    "submit_crowd_status_atomic",
    {
      p_user_id: userId,
      p_venue_id: crowdTestVenueId,
      p_crowd: "busy",
      p_queue: null,
    },
  );

  if (!error) {
    return {
      passed: false,
      detail:
        `Authenticated client unexpectedly executed atomic Crowd Status RPC: ${JSON.stringify(data)}`,
    };
  }

  const passed =
    looksLikePermissionBlock(error);

  return {
    passed,
    detail: passed
      ? "Authenticated client cannot execute the service-role Crowd Status RPC."
      : `Expected permission rejection, received ${error.code ?? "unknown"}: ${error.message}`,
  };
}

async function testDirectWalletWriteBlocked(
  userId,
) {
  const {
    data,
    error,
  } = await consumerSupabase
    .from("livey_wallets")
    .upsert(
      {
        user_id: userId,
        points_balance: 999999,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )
    .select("user_id, points_balance");

  const rows = data ?? [];

  if (rows.length > 0) {
    return {
      passed: false,
      detail:
        "Authenticated client unexpectedly wrote directly to livey_wallets.",
    };
  }

  const passed =
    Boolean(error) &&
    looksLikePermissionBlock(error);

  return {
    passed,
    detail: passed
      ? "RLS rejected direct wallet mutation."
      : error
        ? `Expected RLS rejection, received ${error.code ?? "unknown"}: ${error.message}`
        : "Wallet mutation returned no rows but was not explicitly rejected.",
  };
}

async function testDirectPointTransactionWriteBlocked(
  userId,
) {
  const {
    data,
    error,
  } = await consumerSupabase
    .from("livey_point_transactions")
    .insert({
      user_id: userId,
      amount: 999999,
      transaction_type: "earn",
      source_type: "security_direct_write",
      source_id: crypto.randomUUID(),
      venue_id: crowdTestVenueId,
      description:
        "SECURITY TEST - DIRECT POINT MINT",
    })
    .select("id, amount");

  const rows = data ?? [];

  if (rows.length > 0) {
    return {
      passed: false,
      detail:
        "Authenticated client unexpectedly minted a point transaction directly.",
    };
  }

  const passed =
    Boolean(error) &&
    looksLikePermissionBlock(error);

  return {
    passed,
    detail: passed
      ? "RLS rejected direct point-transaction creation."
      : error
        ? `Expected RLS rejection, received ${error.code ?? "unknown"}: ${error.message}`
        : "Point transaction returned no rows but was not explicitly rejected.",
  };
}


/* -------------------------------------------------------------------------- */
/* Crowd Status live Edge Function tests                                      */
/* -------------------------------------------------------------------------- */

const crowdEdgeState = {
  venue: null,
  baselineBalance: null,
  baselineRewardCount: null,
  submissionMode: null,
  afterSubmissionBalance: null,
  afterSubmissionRewardCount: null,
};

async function loadCrowdTestVenue() {
  const {
    data,
    error,
  } = await consumerSupabase
    .from("venues")
    .select(
      "id, latitude, longitude, is_active, approval_status",
    )
    .eq(
      "id",
      crowdTestVenueId,
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not load Crowd Status test venue: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      "Crowd Status test venue does not exist or is not readable.",
    );
  }

  if (
    data.is_active !== true ||
    data.approval_status !== "approved"
  ) {
    throw new Error(
      "Crowd Status test venue must be active and approved.",
    );
  }

  if (
    typeof data.latitude !== "number" ||
    typeof data.longitude !== "number"
  ) {
    throw new Error(
      "Crowd Status test venue is missing valid coordinates.",
    );
  }

  return data;
}

async function getLiveyWalletBalance(
  userId,
) {
  const {
    data,
    error,
  } = await consumerSupabase
    .from("livey_wallets")
    .select("points_balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not read Livey Wallet balance: ${error.message}`,
    );
  }

  return data?.points_balance ?? 0;
}

async function getCrowdRewardTransactions(
  userId,
) {
  const {
    data,
    error,
  } = await consumerSupabase
    .from("livey_point_transactions")
    .select(
      "id, amount, source_type, source_id, venue_id, created_at",
    )
    .eq("user_id", userId)
    .eq("source_type", "crowd_status")
    .eq("venue_id", crowdTestVenueId)
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (error) {
    throw new Error(
      `Could not read Crowd Status reward transactions: ${error.message}`,
    );
  }

  return data ?? [];
}

async function testCrowdStatusNoAuth(
  venue,
) {
  const result =
    await callConsumerFunction({
      functionName:
        "submit-live-report",
      accessToken: null,
      includeAuthorization:
        false,
      body: {
        venue_id:
          venue.id,
        crowd:
          "busy",
        queue:
          "short",
        latitude:
          venue.latitude,
        longitude:
          venue.longitude,
        accuracy_meters:
          10,
      },
    });

  const passed =
    result.status === 401;

  return {
    passed,
    detail: passed
      ? "Unauthenticated Crowd Status submission rejected with 401."
      : `Expected 401 without authentication, received ${result.status}: ${result.body?.error ?? "no error message"}`,
  };
}

async function testCrowdStatusInvalidCrowd(
  accessToken,
  venue,
) {
  const result =
    await callConsumerFunction({
      functionName:
        "submit-live-report",
      accessToken,
      body: {
        venue_id:
          venue.id,
        crowd:
          "impossibly_busy",
        latitude:
          venue.latitude,
        longitude:
          venue.longitude,
        accuracy_meters:
          10,
      },
    });

  const passed =
    result.status === 400;

  return {
    passed,
    detail: passed
      ? "Invalid crowd value rejected with 400."
      : `Expected 400 for invalid crowd value, received ${result.status}: ${result.body?.error ?? "no error message"}`,
  };
}

async function testCrowdStatusPoorAccuracy(
  accessToken,
  venue,
) {
  const result =
    await callConsumerFunction({
      functionName:
        "submit-live-report",
      accessToken,
      body: {
        venue_id:
          venue.id,
        crowd:
          "busy",
        latitude:
          venue.latitude,
        longitude:
          venue.longitude,
        accuracy_meters:
          101,
      },
    });

  const passed =
    result.status === 400;

  return {
    passed,
    detail: passed
      ? "GPS accuracy worse than 100 m rejected with 400."
      : `Expected 400 for poor GPS accuracy, received ${result.status}: ${result.body?.error ?? "no error message"}`,
  };
}

async function testCrowdStatusFarAway(
  accessToken,
  venue,
) {
  const farLatitude =
    venue.latitude >= 0
      ? venue.latitude - 1
      : venue.latitude + 1;

  const result =
    await callConsumerFunction({
      functionName:
        "submit-live-report",
      accessToken,
      body: {
        venue_id:
          venue.id,
        crowd:
          "busy",
        latitude:
          farLatitude,
        longitude:
          venue.longitude,
        accuracy_meters:
          10,
      },
    });

  const passed =
    result.status === 403;

  return {
    passed,
    detail: passed
      ? "Coordinates far outside the 150 m venue radius rejected with 403."
      : `Expected 403 for far-away coordinates, received ${result.status}: ${result.body?.error ?? "no error message"}`,
  };
}

async function verifyNegativeCrowdTestsDidNotReward(
  userId,
) {
  const balance =
    await getLiveyWalletBalance(
      userId,
    );

  const rewards =
    await getCrowdRewardTransactions(
      userId,
    );

  const passed =
    balance ===
      crowdEdgeState.baselineBalance &&
    rewards.length ===
      crowdEdgeState.baselineRewardCount;

  return {
    passed,
    detail: passed
      ? "Rejected Crowd Status requests created no wallet reward."
      : `Rejected requests changed reward state. Balance ${crowdEdgeState.baselineBalance} -> ${balance}; reward count ${crowdEdgeState.baselineRewardCount} -> ${rewards.length}.`,
  };
}

async function testNearbyCrowdStatusSubmission(
  accessToken,
  userId,
  venue,
) {
  const result =
    await callConsumerFunction({
      functionName:
        "submit-live-report",
      accessToken,
      body: {
        venue_id:
          venue.id,
        crowd:
          "busy",
        queue:
          "short",
        latitude:
          venue.latitude,
        longitude:
          venue.longitude,
        accuracy_meters:
          10,
      },
    });

  if (result.status === 200) {
    const passed =
      result.body?.success === true &&
      result.body?.reward?.awarded ===
        true &&
      result.body?.reward
        ?.points_awarded === 1 &&
      result.body?.contribution
        ?.crowd === "busy" &&
      result.body?.contribution
        ?.queue === "short";

    if (passed) {
      crowdEdgeState.submissionMode =
        "accepted";
    }

    return {
      passed,
      detail: passed
        ? "Nearby crowd + queue submission accepted with exactly +1 point."
        : `Nearby submission returned 200 but the response contract was unexpected: ${JSON.stringify(result.body)}`,
    };
  }

  if (result.status === 429) {
    const rewards =
      await getCrowdRewardTransactions(
        userId,
      );

    const twentyMinutesAgo =
      Date.now() -
      20 * 60 * 1000;

    const recentReward =
      rewards.find(
        (reward) =>
          reward.amount === 1 &&
          new Date(
            reward.created_at,
          ).getTime() >=
            twentyMinutesAgo,
      );

    const passed =
      Boolean(recentReward);

    if (passed) {
      crowdEdgeState.submissionMode =
        "existing-cooldown";
    }

    return {
      passed,
      detail: passed
        ? "Fixture is already inside the 20-minute cooldown; a recent +1 Crowd Status reward confirms the prior accepted submission."
        : "Received 429 but no recent +1 Crowd Status reward exists for this test fixture.",
    };
  }

  return {
    passed: false,
    detail:
      `Expected 200 accepted submission or a verified existing 429 cooldown, received ${result.status}: ${result.body?.error ?? "no error message"}`,
  };
}

async function verifyCrowdStatusRewardAccounting(
  userId,
) {
  const balance =
    await getLiveyWalletBalance(
      userId,
    );

  const rewards =
    await getCrowdRewardTransactions(
      userId,
    );

  crowdEdgeState.afterSubmissionBalance =
    balance;

  crowdEdgeState.afterSubmissionRewardCount =
    rewards.length;

  if (
    crowdEdgeState.submissionMode ===
    "accepted"
  ) {
    const passed =
      balance ===
        crowdEdgeState.baselineBalance +
          1 &&
      rewards.length ===
        crowdEdgeState.baselineRewardCount +
          1 &&
      rewards[0]?.amount === 1;

    return {
      passed,
      detail: passed
        ? "Crowd + queue created exactly one +1 ledger transaction and increased the wallet by exactly one point."
        : `Expected exactly one +1 reward. Balance ${crowdEdgeState.baselineBalance} -> ${balance}; reward count ${crowdEdgeState.baselineRewardCount} -> ${rewards.length}.`,
    };
  }

  if (
    crowdEdgeState.submissionMode ===
    "existing-cooldown"
  ) {
    const passed =
      balance ===
        crowdEdgeState.baselineBalance &&
      rewards.length ===
        crowdEdgeState.baselineRewardCount;

    return {
      passed,
      detail: passed
        ? "Cooldown replay created no duplicate reward."
        : `Cooldown replay changed reward state. Balance ${crowdEdgeState.baselineBalance} -> ${balance}; reward count ${crowdEdgeState.baselineRewardCount} -> ${rewards.length}.`,
    };
  }

  return {
    passed: false,
    detail:
      "Nearby Crowd Status submission did not establish a valid test mode.",
  };
}

async function testImmediateCrowdStatusRepeat(
  accessToken,
  userId,
  venue,
) {
  const beforeBalance =
    await getLiveyWalletBalance(
      userId,
    );

  const beforeRewards =
    await getCrowdRewardTransactions(
      userId,
    );

  const result =
    await callConsumerFunction({
      functionName:
        "submit-live-report",
      accessToken,
      body: {
        venue_id:
          venue.id,
        crowd:
          "packed",
        queue:
          "long",
        latitude:
          venue.latitude,
        longitude:
          venue.longitude,
        accuracy_meters:
          10,
      },
    });

  const afterBalance =
    await getLiveyWalletBalance(
      userId,
    );

  const afterRewards =
    await getCrowdRewardTransactions(
      userId,
    );

  const passed =
    result.status === 429 &&
    Boolean(
      result.body
        ?.next_allowed_at,
    ) &&
    afterBalance ===
      beforeBalance &&
    afterRewards.length ===
      beforeRewards.length;

  return {
    passed,
    detail: passed
      ? "Immediate repeat rejected with 429 and created no additional point."
      : `Expected 429 with unchanged wallet/reward count. Status ${result.status}; balance ${beforeBalance} -> ${afterBalance}; rewards ${beforeRewards.length} -> ${afterRewards.length}.`,
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
  /* Crowd Status database protections                                      */
  /* ---------------------------------------------------------------------- */

  await runTest(
    "Direct Crowd Status atomic RPC",
    () =>
      testDirectCrowdRpcBlocked(
        consumerAuth.user.id,
      ),
  );

  await runTest(
    "Direct Livey Wallet mutation",
    () =>
      testDirectWalletWriteBlocked(
        consumerAuth.user.id,
      ),
  );

  await runTest(
    "Direct Livey point mint",
    () =>
      testDirectPointTransactionWriteBlocked(
        consumerAuth.user.id,
      ),
  );


  /* ---------------------------------------------------------------------- */
  /* Crowd Status live Edge Function                                       */
  /* ---------------------------------------------------------------------- */

  await runTest(
    "Crowd Status live fixture",
    async () => {
      const venue =
        await loadCrowdTestVenue();

      const baselineBalance =
        await getLiveyWalletBalance(
          consumerAuth.user.id,
        );

      const baselineRewards =
        await getCrowdRewardTransactions(
          consumerAuth.user.id,
        );

      crowdEdgeState.venue =
        venue;

      crowdEdgeState.baselineBalance =
        baselineBalance;

      crowdEdgeState.baselineRewardCount =
        baselineRewards.length;

      return {
        passed: true,
        detail:
          `Active approved test venue loaded. Starting balance ${baselineBalance}; ${baselineRewards.length} prior Crowd Status reward(s) for this fixture.`,
      };
    },
  );

  const crowdLiveFixtureSafe =
    results.find(
      (result) =>
        result.name ===
        "Crowd Status live fixture",
    )?.passed;

  if (crowdLiveFixtureSafe) {
    const crowdVenue =
      crowdEdgeState.venue;

    const consumerAccessToken =
      consumerAuth.session.access_token;

    await runTest(
      "Crowd Status no authentication",
      () =>
        testCrowdStatusNoAuth(
          crowdVenue,
        ),
    );

    await runTest(
      "Crowd Status invalid crowd value",
      () =>
        testCrowdStatusInvalidCrowd(
          consumerAccessToken,
          crowdVenue,
        ),
    );

    await runTest(
      "Crowd Status poor GPS accuracy",
      () =>
        testCrowdStatusPoorAccuracy(
          consumerAccessToken,
          crowdVenue,
        ),
    );

    await runTest(
      "Crowd Status far-away coordinates",
      () =>
        testCrowdStatusFarAway(
          consumerAccessToken,
          crowdVenue,
        ),
    );

    await runTest(
      "Rejected Crowd Status requests do not reward",
      () =>
        verifyNegativeCrowdTestsDidNotReward(
          consumerAuth.user.id,
        ),
    );

    await runTest(
      "Nearby Crowd Status crowd + queue",
      () =>
        testNearbyCrowdStatusSubmission(
          consumerAccessToken,
          consumerAuth.user.id,
          crowdVenue,
        ),
    );

    const nearbySubmissionSafe =
      results.find(
        (result) =>
          result.name ===
          "Nearby Crowd Status crowd + queue",
      )?.passed;

    if (nearbySubmissionSafe) {
      await runTest(
        "Crowd Status reward accounting",
        () =>
          verifyCrowdStatusRewardAccounting(
            consumerAuth.user.id,
          ),
      );

      await runTest(
        "Crowd Status immediate repeat cooldown",
        () =>
          testImmediateCrowdStatusRepeat(
            consumerAccessToken,
            consumerAuth.user.id,
            crowdVenue,
          ),
      );
    }
  }

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
