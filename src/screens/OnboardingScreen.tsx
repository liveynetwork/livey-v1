import { useState, type FormEvent } from "react";
import { completeCurrentUserOnboarding } from "../services/profile";
import "./OnboardingScreen.css";

type OnboardingScreenProps = {
  onComplete: () => void;
};

type SetupStep = 0 | 1;

const cyprusCities = [
  "Limassol",
  "Nicosia",
  "Larnaca",
  "Paphos",
  "Famagusta",
  "Kyrenia",
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [setupStep, setSetupStep] = useState<SetupStep>(0);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("Limassol");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cleanedUsername = username.trim().toLowerCase().replace(/^@/, "");
  const liveyIdPreview = cleanedUsername ? `@${cleanedUsername}` : "@yourid";

  const canContinueFromIdentity = cleanedUsername.length >= 3 && city.trim();
  const canComplete = displayName.trim().length > 0;

  function handleUsernameChange(value: string) {
    const nextUsername = value
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9._]/g, "")
      .slice(0, 24);

    setUsername(nextUsername);
  }

  function goToNextStep() {
    setErrorMessage(null);

    if (!canContinueFromIdentity) {
      setErrorMessage("Choose a Livey ID and city to continue.");
      return;
    }

    setSetupStep(1);
  }

  function goToPreviousStep() {
    setErrorMessage(null);
    setSetupStep(0);
  }

  function handleAvatarChange(file: File | null) {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setAvatarFile(file);
    setAvatarPreview(previewUrl);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    if (!canComplete) {
      setErrorMessage("Add your display name to finish setting up Livey.");
      return;
    }

    setBusy(true);
    setErrorMessage(null);

    try {
      const profile = await completeCurrentUserOnboarding({
        displayName,
        username,
        city,
        avatarFile,
      });

      if (profile?.onboarding_completed) {
        onComplete();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="livey-onboarding-screen">
      <section className="livey-onboarding-card" aria-label="Livey setup">
        <div className="livey-onboarding-progress" aria-hidden="true">
          {[0, 1].map((progressStep) => (
            <span
              key={progressStep}
              className={
                progressStep <= setupStep
                  ? "livey-onboarding-progress-dot livey-onboarding-progress-dot-active"
                  : "livey-onboarding-progress-dot"
              }
            />
          ))}
        </div>

        <img
          className="livey-onboarding-logo"
          src="/Livey-Logo.png"
          alt="Livey"
        />

        {setupStep === 0 && (
          <div className="livey-onboarding-step">
            <div className="livey-onboarding-copy">
              <p>Your Livey ID</p>
              <h1>Choose how people find you.</h1>
              <span>
                Your Livey ID is how people and venues recognize you.
              </span>
            </div>

            <form
              className="livey-onboarding-form"
              onSubmit={(event) => {
                event.preventDefault();
                goToNextStep();
              }}
            >
              <label className="livey-onboarding-field">
                <span>Livey ID</span>

                <div className="livey-onboarding-username-wrap">
                  <strong>@</strong>
                  <input
                    type="text"
                    placeholder="Livey ID"
                    value={username}
                    onChange={(event) =>
                      handleUsernameChange(event.target.value)
                    }
                    minLength={3}
                    maxLength={24}
                    autoComplete="username"
                    required
                  />
                </div>
              </label>

              <label className="livey-onboarding-field">
                <span>City</span>

                <div className="livey-onboarding-select-wrap">
                  <select
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    required
                  >
                    {cyprusCities.map((cyprusCity) => (
                      <option key={cyprusCity} value={cyprusCity}>
                        {cyprusCity}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <div className="livey-onboarding-id-preview">
  <small>Your Livey profile</small>
  <strong>{liveyIdPreview}</strong>
</div>

              {errorMessage && (
                <p className="livey-onboarding-error">{errorMessage}</p>
              )}

              <button
                className="livey-onboarding-primary"
                type="submit"
                disabled={!canContinueFromIdentity}
              >
                Continue
              </button>
            </form>
          </div>
        )}

        {setupStep === 1 && (
          <div className="livey-onboarding-step">
            <div className="livey-onboarding-copy">
              <p>Your profile</p>
              <h1>Set your identity.</h1>
              <span>This is how your profile appears inside Livey.</span>
            </div>

            <form className="livey-onboarding-form" onSubmit={handleSubmit}>
              <div className="livey-onboarding-avatar-preview">
                <div className="livey-onboarding-avatar">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" />
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </div>

                <div>
                  <strong>{displayName.trim() || "Your name"}</strong>
                  <small>{liveyIdPreview}</small>
                </div>
              </div>

              <label className="livey-onboarding-field">
                <span>Display name</span>
                <input
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={40}
                  autoComplete="name"
                  required
                />
              </label>

              <label className="livey-onboarding-photo-button">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) =>
                    handleAvatarChange(event.target.files?.[0] ?? null)
                  }
                />
                Upload photo
              </label>

              {errorMessage && (
                <p className="livey-onboarding-error">{errorMessage}</p>
              )}

              <div className="livey-onboarding-actions">
                <button
                  className="livey-onboarding-secondary"
                  type="button"
                  onClick={goToPreviousStep}
                  disabled={busy}
                >
                  Back
                </button>

                <button
                  className="livey-onboarding-primary"
                  type="submit"
                  disabled={busy || !canComplete}
                >
                  {busy ? "Setting up..." : "Enter Livey"}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}