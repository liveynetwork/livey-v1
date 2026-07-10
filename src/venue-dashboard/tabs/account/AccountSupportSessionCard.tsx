import { useEffect, useRef, useState } from "react";

type AccountSupportSessionCardProps = {
  onSignOut: () => void;
};

const MODAL_CLOSE_DURATION = 180;

export function AccountSupportSessionCard({
  onSignOut,
}: AccountSupportSessionCardProps) {
  const [isSignOutModalMounted, setIsSignOutModalMounted] = useState(false);
  const [isSignOutModalClosing, setIsSignOutModalClosing] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isSignOutModalMounted) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeSignOutModal();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSignOutModalMounted]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  function openSignOutModal() {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setIsSignOutModalClosing(false);
    setIsSignOutModalMounted(true);
  }

  function closeSignOutModal() {
    if (!isSignOutModalMounted || isSignOutModalClosing) return;

    setIsSignOutModalClosing(true);

    closeTimeoutRef.current = window.setTimeout(() => {
      setIsSignOutModalMounted(false);
      setIsSignOutModalClosing(false);
      closeTimeoutRef.current = null;
    }, MODAL_CLOSE_DURATION);
  }

  function handleConfirmSignOut() {
    onSignOut();
  }

  return (
    <>
      <section className="venue-dashboard-card venue-dashboard-support-session-card">
        <div className="venue-dashboard-support-content">
          <p className="venue-dashboard-eyebrow">Support & session</p>

          <h2>Need help with locked details?</h2>

          <p className="venue-dashboard-support-description">
            Contact Livey support for location, category, address, or account
            changes.
          </p>

          <div className="venue-dashboard-support-actions">
            <a
              className="venue-dashboard-secondary-button"
              href="mailto:support@livey.network"
            >
              Contact support
            </a>

            <button
              className="venue-dashboard-danger-button"
              type="button"
              onClick={openSignOutModal}
            >
              Sign out
            </button>
          </div>

          <img
            className="venue-dashboard-support-logo"
            src="/Livey-Logo.png"
            alt="Livey"
          />
        </div>
      </section>

      {isSignOutModalMounted ? (
        <div
          className={`venue-dashboard-signout-modal-backdrop ${
            isSignOutModalClosing ? "is-closing" : ""
          }`}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSignOutModal();
            }
          }}
        >
          <section
            className={`venue-dashboard-signout-modal ${
              isSignOutModalClosing ? "is-closing" : ""
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="venue-dashboard-signout-title"
          >
            <div className="venue-dashboard-signout-modal-logo-shell">
              <img src="/Livey-Logo.png" alt="" />
            </div>

            <p className="venue-dashboard-eyebrow">End session</p>

            <h2 id="venue-dashboard-signout-title">
              Sign out of your dashboard?
            </h2>

            <p>
              You will need to sign in again before managing your venue,
              activities, or account settings.
            </p>

            <div className="venue-dashboard-signout-modal-actions">
              <button
                className="venue-dashboard-secondary-button"
                type="button"
                onClick={closeSignOutModal}
              >
                Stay signed in
              </button>

              <button
                className="venue-dashboard-danger-button"
                type="button"
                onClick={handleConfirmSignOut}
              >
                Sign out
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}