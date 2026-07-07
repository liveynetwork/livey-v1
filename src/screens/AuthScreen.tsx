import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import "./AuthScreen.css";

export function AuthScreen() {
  const [mode, setMode] = useState<"sign-in" | "create-account">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const isCreateAccount = mode === "create-account";

  function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    const message = error.message.toLowerCase();

    if (message.includes("already registered")) {
      return "This email is already registered. Try signing in.";
    }

    if (message.includes("invalid login credentials")) {
      return "Email or password is wrong.";
    }

    if (message.includes("email not confirmed")) {
      return "Please confirm your email before signing in.";
    }

    if (message.includes("password")) {
      return error.message;
    }

    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

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
    confirmPassword.length > 0 && password === confirmPassword;

  const canSubmit =
    !authBusy && (!isCreateAccount || (isPasswordSecure && passwordsMatch));

  const shouldRenderPasswordStrength =
    isCreateAccount && password.length > 0;

  const shouldShowPasswordStrength =
    shouldRenderPasswordStrength && passwordFocused;

  const passwordStrengthLabel = isPasswordSecure
    ? "Strong password"
    : "Weak password";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (authBusy) return;

    setAuthBusy(true);
    setAuthMessage(null);
    setAuthError(null);

    try {
      if (isCreateAccount) {
        if (!isPasswordSecure) {
          setAuthError(
            "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol."
          );
          return;
        }

        if (password !== confirmPassword) {
          setAuthError("Passwords do not match.");
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        setAuthMessage("Check your email to confirm your Livey account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        setAuthMessage("Signed in.");
      }
    } catch (error) {
  console.error("Livey auth error:", error);
  setAuthError(getAuthErrorMessage(error));
} finally {
  setAuthBusy(false);
}
  }

  function toggleMode() {
    setMode((currentMode) =>
      currentMode === "sign-in" ? "create-account" : "sign-in"
    );

    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAuthMessage(null);
    setAuthError(null);
  }

  return (
    <main className="livey-auth-screen">
      <section className="livey-auth-card" aria-label="Livey authentication">
        <img className="livey-auth-logo" src="/Livey-Logo.png" alt="Livey" />

        <div className="livey-auth-copy">
          <h1>
            {isCreateAccount
              ? "Create your Livey account."
              : "Sign in to Livey."}
          </h1>
        </div>

        <form
          className="livey-auth-form"
          onSubmit={handleSubmit}
          data-mode={mode}
        >
          <label className="livey-auth-field">
            <span>Email address</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="livey-auth-field">
            <span>Password</span>

            <div className="livey-auth-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={
                  isCreateAccount ? "new-password" : "current-password"
                }
                placeholder="Your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                minLength={isCreateAccount ? 8 : 6}
              />

              <button
                className="livey-auth-eye"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() =>
                  setShowPassword((currentValue) => !currentValue)
                }
              >
                {showPassword ? (
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
                ) : (
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
                )}
              </button>
            </div>

            {shouldRenderPasswordStrength && (
              <small
                className={[
                  "livey-auth-password-strength",
                  shouldShowPasswordStrength
                    ? "livey-auth-password-strength-visible"
                    : "",
                  isPasswordSecure
                    ? "livey-auth-password-strength-strong"
                    : "livey-auth-password-strength-weak",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {!isPasswordSecure && (
                  <span>
                    Minimum 8 Characters - 1 Uppercase - 1 Number - 1 Symbol
                  </span>
                )}

                <strong>{passwordStrengthLabel}</strong>
              </small>
            )}
          </label>

          <div
            className={[
              "livey-auth-confirm-wrap",
              isCreateAccount ? "livey-auth-confirm-wrap-open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden={!isCreateAccount}
          >
            <label className="livey-auth-field livey-auth-confirm-field">
              <span>Confirm password</span>

              <div className="livey-auth-password-wrap">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required={isCreateAccount}
                  minLength={8}
                  tabIndex={isCreateAccount ? 0 : -1}
                />

                <button
                  className="livey-auth-eye"
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  onClick={() =>
                    setShowConfirmPassword((currentValue) => !currentValue)
                  }
                  tabIndex={isCreateAccount ? 0 : -1}
                >
                  {showConfirmPassword ? (
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
                  ) : (
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
                  )}
                </button>
              </div>
            </label>
          </div>

          {authError && <p className="livey-auth-error">{authError}</p>}
          {authMessage && <p className="livey-auth-message">{authMessage}</p>}

          <button
            className="livey-auth-primary"
            type="submit"
            disabled={!canSubmit}
          >
            {authBusy
              ? "Please wait..."
              : isCreateAccount
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <button
          className="livey-auth-switch"
          type="button"
          onClick={toggleMode}
        >
          {isCreateAccount
            ? "Already have an account? Sign in"
            : "New to Livey? Create account"}
        </button>
      </section>
    </main>
  );
}