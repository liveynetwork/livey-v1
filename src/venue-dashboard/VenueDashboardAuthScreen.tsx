import { useEffect, useState, type FormEvent } from "react";
import { dashboardSupabase } from "../lib/dashboardSupabase";
import "./VenueDashboardAuthScreen.css";

type AuthMode = "sign-in" | "create-account";

type VerifiedVenue = {
  venue_id: string;
  venue_name: string;
  venue_area: string | null;
  venue_city: string | null;
  already_claimed: boolean;
};

type VerifyClaimCodePayload = {
  venue?: VerifiedVenue;
};

export function VenueDashboardAuthScreen() {
  const [mode, setMode] = useState<AuthMode>("sign-in");

  const [claimCode, setClaimCode] = useState("");
  const [verifiedVenue, setVerifiedVenue] =
    useState<VerifiedVenue | null>(null);

  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordFocused, setPasswordFocused] =
    useState(false);

  const [isVerifyingCode, setIsVerifyingCode] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isCreateAccount = mode === "create-account";

  const canShowAccountFields =
    !isCreateAccount || Boolean(verifiedVenue);

  /*
   * Normalize email values before comparing them or sending them
   * to Supabase.
   *
   * This prevents harmless differences such as capitalization or
   * surrounding whitespace from making matching addresses appear
   * different.
   */
  const normalizedEmail =
    email.trim().toLowerCase();

  const normalizedConfirmEmail =
    confirmEmail.trim().toLowerCase();

  const emailsMatch =
    normalizedConfirmEmail.length > 0 &&
    normalizedEmail === normalizedConfirmEmail;

  useEffect(() => {
    /*
     * Legacy cleanup.
     *
     * Older dashboard builds stored pending venue claim codes in
     * browser-wide localStorage.
     *
     * That was unsafe because the value could survive sign-out and
     * later be consumed by a different authenticated dashboard user.
     *
     * Venue claims are now tied exclusively to the authenticated
     * Supabase user's own auth metadata.
     */
    window.localStorage.removeItem(
      "livey:pendingVenueClaimCode"
    );
  }, []);

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordSecure =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.symbol;

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const canSubmit =
    !isSubmitting &&
    canShowAccountFields &&
    normalizedEmail.length > 0 &&
    password.trim().length > 0 &&
    (!isCreateAccount ||
      (Boolean(verifiedVenue) &&
        !verifiedVenue?.already_claimed &&
        normalizedConfirmEmail.length > 0 &&
        emailsMatch &&
        isPasswordSecure &&
        passwordsMatch));

  const shouldRenderPasswordStrength =
    isCreateAccount && password.length > 0;

  const shouldShowPasswordStrength =
    shouldRenderPasswordStrength &&
    passwordFocused;

  async function handleVerifyClaimCode() {
    if (!claimCode.trim()) {
      setErrorMessage(
        "Enter your venue claim code first."
      );
      return;
    }

    try {
      setIsVerifyingCode(true);
      setStatusMessage("");
      setErrorMessage("");
      setVerifiedVenue(null);

      const { data, error } =
        await dashboardSupabase.functions.invoke<VerifyClaimCodePayload>(
          "dashboard-verify-claim-code",
          {
            body: {
              claim_code: claimCode.trim(),
            },
          }
        );

      if (error) {
        throw error;
      }

      const venue = data?.venue ?? null;

      if (!venue) {
        setErrorMessage(
          "This claim code was not found or is not approved yet."
        );
        return;
      }

      if (venue.already_claimed) {
        setVerifiedVenue(venue);

        setErrorMessage(
          "This venue has already been claimed. Sign in or contact Livey support."
        );

        return;
      }

      /*
       * A fresh venue has now been verified.
       *
       * Clear account credentials before exposing the account
       * creation fields. This prevents credentials from a previous
       * sign-in or claim attempt from being carried into the newly
       * verified venue.
       */
      setEmail("");
      setConfirmEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPasswordFocused(false);

      setVerifiedVenue(venue);
      setStatusMessage("");
    } catch (error) {
      console.error(
        "Failed to verify venue claim code:",
        error
      );

      setErrorMessage(
        "We could not verify this claim code. Please try again."
      );
    } finally {
      setIsVerifyingCode(false);
    }
  }

  async function claimVenueForSignedInUser() {
    const {
      data: { user },
      error: userError,
    } = await dashboardSupabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error(
        "No authenticated dashboard user was found."
      );
    }

    /*
     * SECURITY RULE:
     *
     * Never use React claimCode state, localStorage, sessionStorage,
     * query parameters, or another browser-global value here.
     *
     * A venue claim may only be completed from the pending claim
     * code stored in THIS authenticated user's Supabase Auth
     * metadata.
     */
    const metadataClaimCode =
      typeof user.user_metadata
        ?.pending_venue_claim_code === "string"
        ? user.user_metadata.pending_venue_claim_code.trim()
        : "";

    if (!metadataClaimCode) {
      return;
    }

    const { error } =
      await dashboardSupabase.functions.invoke(
        "dashboard-complete-venue-claim",
        {
          body: {
            claim_code: metadataClaimCode,
          },
        }
      );

    if (error) {
      throw error;
    }

    /*
     * The claim completed successfully.
     *
     * Remove the pending marker from this authenticated user so
     * future normal sign-ins cannot attempt the claim again.
     */
    const { error: metadataUpdateError } =
      await dashboardSupabase.auth.updateUser({
        data: {
          pending_venue_claim_code: null,
        },
      });

    if (metadataUpdateError) {
      console.warn(
        "Venue was claimed, but pending claim metadata could not be cleared:",
        metadataUpdateError
      );
    }
  }

  async function ensureCleanSignupSession() {
    const {
      data: { session },
      error: sessionError,
    } = await dashboardSupabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      return;
    }

    /*
     * Creating a new venue-owner account must never happen while a
     * previous venue owner remains authenticated in this browser.
     */
    const { error: signOutError } =
      await dashboardSupabase.auth.signOut();

    if (signOutError) {
      throw signOutError;
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      if (isCreateAccount) {
        if (!verifiedVenue) {
          setErrorMessage(
            "Verify your venue claim code first."
          );
          return;
        }

        if (verifiedVenue.already_claimed) {
          setErrorMessage(
            "This venue has already been claimed."
          );
          return;
        }

        if (!normalizedEmail) {
          setErrorMessage(
            "Enter your email address."
          );
          return;
        }

        if (!normalizedConfirmEmail) {
          setErrorMessage(
            "Confirm your email address."
          );
          return;
        }

        if (!emailsMatch) {
          setErrorMessage(
            "Email addresses do not match."
          );
          return;
        }

        if (!isPasswordSecure) {
          setErrorMessage(
            "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol."
          );
          return;
        }

        if (password !== confirmPassword) {
          setErrorMessage(
            "Passwords do not match."
          );
          return;
        }

        /*
         * Account creation must start from a clean Supabase session.
         *
         * This prevents an existing venue owner's authenticated
         * session from being inherited by a new venue signup.
         */
        await ensureCleanSignupSession();

        const venueDashboardRedirectUrl =
          `${window.location.origin}/venue-dashboard`;

        const { data, error } =
          await dashboardSupabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo:
                venueDashboardRedirectUrl,
              data: {
                account_type: "venue_owner",
                signup_source:
                  "venue_dashboard",
                pending_venue_claim_code:
                  claimCode.trim(),
                verified_venue_id:
                  verifiedVenue.venue_id,
                verified_venue_name:
                  verifiedVenue.venue_name,
              },
            },
          });

        if (error) {
          throw error;
        }

        /*
         * Normally email confirmation means signup does not return
         * an authenticated session.
         *
         * If the Supabase configuration ever returns one
         * immediately, claimVenueForSignedInUser remains safe
         * because it reads the claim from this new authenticated
         * user's metadata only.
         */
        if (data.session) {
          await claimVenueForSignedInUser();

          window.dispatchEvent(
            new Event("livey:auth-changed")
          );

          setEmail("");
          setConfirmEmail("");
          setPassword("");
          setConfirmPassword("");

          setStatusMessage(
            "Venue account created successfully."
          );

          return;
        }

        setStatusMessage(
          `Check ${normalizedEmail} to confirm your Livey venue dashboard account, then sign in here.`
        );

        /*
         * Return to a completely clean sign-in state.
         *
         * Do not leave the signup email populated. This prevents
         * another create-account attempt from inheriting it.
         */
        setMode("sign-in");
        setClaimCode("");
        setVerifiedVenue(null);

        setEmail("");
        setConfirmEmail("");

        setPassword("");
        setConfirmPassword("");

        setShowPassword(false);
        setShowConfirmPassword(false);
        setPasswordFocused(false);

        return;
      }

      if (!normalizedEmail) {
        setErrorMessage(
          "Enter your email address."
        );
        return;
      }

      const { error } =
        await dashboardSupabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (error) {
        throw error;
      }

      /*
       * Ordinary sign-in is safe because this function does nothing
       * unless THIS authenticated user's own metadata contains a
       * pending venue claim.
       */
      await claimVenueForSignedInUser();

      window.dispatchEvent(
        new Event("livey:auth-changed")
      );

      setStatusMessage(
        "Signed in successfully."
      );
    } catch (error) {
      console.error(
        "Venue dashboard auth error:",
        error
      );

      setErrorMessage(
        getAuthErrorMessage(error)
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleMode() {
    setMode((currentMode) =>
      currentMode === "sign-in"
        ? "create-account"
        : "sign-in"
    );

    /*
     * SECURITY / ACCOUNT ISOLATION:
     *
     * Sign-in credentials must never carry into Create Account,
     * and Create Account credentials must never carry back into
     * Sign In.
     *
     * This directly prevents a previously entered venue-owner email
     * from silently becoming the email for a new venue account.
     */
    setClaimCode("");
    setVerifiedVenue(null);

    setEmail("");
    setConfirmEmail("");

    setPassword("");
    setConfirmPassword("");

    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordFocused(false);

    setStatusMessage("");
    setErrorMessage("");
  }

  return (
    <main className="venue-dashboard-auth-page">
      <section className="venue-dashboard-auth-card">
        <div className="venue-dashboard-auth-card-scroll">
          <img
            className="venue-dashboard-auth-logo"
            src="/Livey-Logo.png"
            alt="Livey"
          />

          <div className="venue-dashboard-auth-copy">
            <h1 key={verifiedVenue?.venue_id || mode}>
              {isCreateAccount &&
              verifiedVenue &&
              !verifiedVenue.already_claimed
                ? `Welcome, ${verifiedVenue.venue_name}.`
                : isCreateAccount
                  ? "Create your venue account."
                  : "Sign in to your venue."}
            </h1>
          </div>

          <form
            className="venue-dashboard-auth-form"
            onSubmit={handleSubmit}
            data-mode={mode}
            data-verified={Boolean(verifiedVenue)}
          >
            <div
              className={[
                "venue-dashboard-claim-wrap",
                isCreateAccount && !verifiedVenue
                  ? "venue-dashboard-claim-wrap-open"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-hidden={
                !isCreateAccount ||
                Boolean(verifiedVenue)
              }
            >
              <section className="venue-dashboard-claim-card">
                <label className="venue-dashboard-auth-field">
                  <span>
                    Venue claim code
                  </span>

                  <input
                    value={claimCode}
                    onChange={(event) => {
                      setClaimCode(
                        event.target.value
                      );

                      setVerifiedVenue(null);
                      setStatusMessage("");
                      setErrorMessage("");
                    }}
                    placeholder="LIVEY-XXXX-XXXX-XXXX"
                    autoComplete="off"
                    tabIndex={
                      isCreateAccount &&
                      !verifiedVenue
                        ? 0
                        : -1
                    }
                  />
                </label>

                <button
                  className="venue-dashboard-claim-button"
                  type="button"
                  onClick={
                    handleVerifyClaimCode
                  }
                  disabled={
                    isVerifyingCode
                  }
                  tabIndex={
                    isCreateAccount &&
                    !verifiedVenue
                      ? 0
                      : -1
                  }
                >
                  {isVerifyingCode
                    ? "Checking..."
                    : "Identify venue"}
                </button>
              </section>
            </div>

            <div
              className={[
                "venue-dashboard-account-fields-wrap",
                canShowAccountFields
                  ? "venue-dashboard-account-fields-wrap-open"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-hidden={
                !canShowAccountFields
              }
            >
              <div className="venue-dashboard-account-fields">
                <label className="venue-dashboard-auth-field">
                  <span>
                    Email address
                  </span>

                  <input
                    key={`venue-dashboard-email-${mode}`}
                    type="email"
                    name={
                      isCreateAccount
                        ? "venue-account-email"
                        : "venue-sign-in-email"
                    }
                    autoComplete={
                      isCreateAccount
                        ? "off"
                        : "email"
                    }
                    placeholder="venue@email.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(
                        event.target.value
                      );

                      if (errorMessage) {
                        setErrorMessage("");
                      }
                    }}
                    required={
                      canShowAccountFields
                    }
                    tabIndex={
                      canShowAccountFields
                        ? 0
                        : -1
                    }
                  />
                </label>

                <div
                  className={[
                    "venue-dashboard-confirm-wrap",
                    isCreateAccount
                      ? "venue-dashboard-confirm-wrap-open"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-hidden={
                    !isCreateAccount
                  }
                >
                  <label className="venue-dashboard-auth-field venue-dashboard-confirm-field">
                    <span>
                      Confirm email address
                    </span>

                    <input
                      key={`venue-dashboard-confirm-email-${mode}`}
                      type="email"
                      name="venue-account-confirm-email"
                      autoComplete="off"
                      placeholder="Confirm your email"
                      value={confirmEmail}
                      onChange={(event) => {
                        setConfirmEmail(
                          event.target.value
                        );

                        if (errorMessage) {
                          setErrorMessage("");
                        }
                      }}
                      required={
                        isCreateAccount
                      }
                      tabIndex={
                        isCreateAccount &&
                        canShowAccountFields
                          ? 0
                          : -1
                      }
                    />
                  </label>
                </div>

                <label className="venue-dashboard-auth-field">
                  <span>Password</span>

                  <div className="venue-dashboard-password-wrap">
                    <input
                      key={`venue-dashboard-password-${mode}`}
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name={
                        isCreateAccount
                          ? "venue-account-password"
                          : "venue-sign-in-password"
                      }
                      autoComplete={
                        isCreateAccount
                          ? "new-password"
                          : "current-password"
                      }
                      placeholder="Your password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      onFocus={() =>
                        setPasswordFocused(
                          true
                        )
                      }
                      onBlur={() =>
                        setPasswordFocused(
                          false
                        )
                      }
                      required={
                        canShowAccountFields
                      }
                      minLength={
                        isCreateAccount
                          ? 8
                          : 6
                      }
                      tabIndex={
                        canShowAccountFields
                          ? 0
                          : -1
                      }
                    />

                    <button
                      className="venue-dashboard-auth-eye"
                      type="button"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      onClick={() =>
                        setShowPassword(
                          (currentValue) =>
                            !currentValue
                        )
                      }
                      tabIndex={
                        canShowAccountFields
                          ? 0
                          : -1
                      }
                    >
                      {showPassword ? (
                        <EyeOpenIcon />
                      ) : (
                        <EyeClosedIcon />
                      )}
                    </button>
                  </div>

                  {shouldRenderPasswordStrength ? (
                    <small
                      className={[
                        "venue-dashboard-password-strength",
                        shouldShowPasswordStrength
                          ? "venue-dashboard-password-strength-visible"
                          : "",
                        isPasswordSecure
                          ? "venue-dashboard-password-strength-strong"
                          : "venue-dashboard-password-strength-weak",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {!isPasswordSecure ? (
                        <span>
                          Minimum 8
                          Characters - 1
                          Uppercase - 1
                          Number - 1 Symbol
                        </span>
                      ) : null}

                      <strong>
                        {isPasswordSecure
                          ? "Strong password"
                          : "Weak password"}
                      </strong>
                    </small>
                  ) : null}
                </label>

                <div
                  className={[
                    "venue-dashboard-confirm-wrap",
                    isCreateAccount
                      ? "venue-dashboard-confirm-wrap-open"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-hidden={
                    !isCreateAccount
                  }
                >
                  <label className="venue-dashboard-auth-field venue-dashboard-confirm-field">
                    <span>
                      Confirm password
                    </span>

                    <div className="venue-dashboard-password-wrap">
                      <input
                        key={`venue-dashboard-confirm-password-${mode}`}
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        name="venue-account-confirm-password"
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        value={
                          confirmPassword
                        }
                        onChange={(
                          event
                        ) =>
                          setConfirmPassword(
                            event.target
                              .value
                          )
                        }
                        required={
                          isCreateAccount
                        }
                        minLength={8}
                        tabIndex={
                          isCreateAccount &&
                          canShowAccountFields
                            ? 0
                            : -1
                        }
                      />

                      <button
                        className="venue-dashboard-auth-eye"
                        type="button"
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        onClick={() =>
                          setShowConfirmPassword(
                            (
                              currentValue
                            ) =>
                              !currentValue
                          )
                        }
                        tabIndex={
                          isCreateAccount &&
                          canShowAccountFields
                            ? 0
                            : -1
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOpenIcon />
                        ) : (
                          <EyeClosedIcon />
                        )}
                      </button>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {errorMessage ? (
              <p className="venue-dashboard-auth-error">
                {errorMessage}
              </p>
            ) : null}

            {statusMessage ? (
              <p className="venue-dashboard-auth-success">
                {statusMessage}
              </p>
            ) : null}

            {canShowAccountFields ? (
              <button
                className="venue-dashboard-auth-primary"
                type="submit"
                disabled={!canSubmit}
              >
                {isSubmitting
                  ? "Please wait..."
                  : isCreateAccount
                    ? "Create account"
                    : "Sign in"}
              </button>
            ) : null}
          </form>

          <button
            className="venue-dashboard-auth-switch"
            type="button"
            onClick={toggleMode}
          >
            {isCreateAccount
              ? "Already have a venue account? Sign in"
              : "Approved by Livey? Create account"}
          </button>

          <p className="venue-dashboard-auth-help">
            Need access? Contact{" "}
            <a href="mailto:support@livey.network">
              support@livey.network
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

function EyeOpenIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M12 4.25c5.15 0 9.28 3.57 10.75 7.75-1.47 4.18-5.6 7.75-10.75 7.75S2.72 16.18 1.25 12C2.72 7.82 6.85 4.25 12 4.25ZM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 14.9A2.9 2.9 0 1 1 12 9.1a2.9 2.9 0 0 1 0 5.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M3.28 2.22 21.78 20.72 20.72 21.78 17.35 18.41A10.6 10.6 0 0 1 12 19.75C6.85 19.75 2.72 16.18 1.25 12c.63-1.79 1.82-3.45 3.39-4.75L2.22 4.28 3.28 2.22ZM7.34 9.95A5 5 0 0 0 12 17a4.93 4.93 0 0 0 2.68-.78l-1.55-1.55A2.95 2.95 0 0 1 12 14.9 2.9 2.9 0 0 1 9.1 12c0-.39.08-.77.22-1.11L7.34 9.95ZM12 4.25c5.15 0 9.28 3.57 10.75 7.75a12.1 12.1 0 0 1-2.56 4.07l-2.73-2.73c.09-.43.09-.9.02-1.36A5.01 5.01 0 0 0 10.64 7l-2.1-2.1A10.6 10.6 0 0 1 12 4.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function getAuthErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    error.message
  ) {
    const message =
      error.message.toLowerCase();

    if (
      message.includes(
        "already registered"
      )
    ) {
      return "This email is already registered. Try signing in.";
    }

    if (
      message.includes(
        "invalid login credentials"
      )
    ) {
      return "Email or password is wrong.";
    }

    if (
      message.includes(
        "email not confirmed"
      )
    ) {
      return "Please confirm your venue dashboard email before signing in.";
    }

    if (
      message.includes(
        "already been claimed"
      )
    ) {
      return "This venue has already been claimed. Sign in or contact Livey support.";
    }

    if (
      message.includes(
        "already linked to another venue"
      )
    ) {
      return "This dashboard account is already connected to another venue.";
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
}