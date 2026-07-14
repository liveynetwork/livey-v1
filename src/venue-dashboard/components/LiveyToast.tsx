import { useEffect, useRef, useState } from "react";
import "./LiveyToast.css";

export type LiveyToastTone = "success" | "error";

type LiveyToastProps = {
  message: string;
  tone: LiveyToastTone;
  duration?: number;
  onDismiss: () => void;
};

const EXIT_DURATION = 220;

export function LiveyToast({
  message,
  tone,
  duration = 2800,
  onDismiss,
}: LiveyToastProps) {
  const [isClosing, setIsClosing] = useState(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    setIsClosing(false);

    const closeTimer = window.setTimeout(() => {
      setIsClosing(true);
    }, Math.max(duration - EXIT_DURATION, 0));

    const dismissTimer = window.setTimeout(() => {
      onDismissRef.current();
    }, duration);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [duration, message, tone]);

  function handleDismiss() {
    if (isClosing) return;

    setIsClosing(true);

    window.setTimeout(() => {
      onDismissRef.current();
    }, EXIT_DURATION);
  }

  return (
    <aside
      className={[
        "livey-toast",
        `livey-toast-${tone}`,
        isClosing ? "is-closing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <span
        className="livey-toast-icon"
        aria-hidden="true"
      >
        {tone === "success" ? (
          <svg
            viewBox="0 0 24 24"
            width="19"
            height="19"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="8.5"
              stroke="currentColor"
              strokeWidth="1.9"
            />

            <path
              d="m8.3 12.2 2.4 2.4 5.1-5.3"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="19"
            height="19"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="8.5"
              stroke="currentColor"
              strokeWidth="1.9"
            />

            <path
              d="M12 7.8v5.4"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />

            <circle
              cx="12"
              cy="16.5"
              r="1"
              fill="currentColor"
            />
          </svg>
        )}
      </span>

      <div className="livey-toast-copy">
        <strong>
          {tone === "success"
            ? "Update successful"
            : "Something went wrong"}
        </strong>

        <p>{message}</p>
      </div>

      <button
        className="livey-toast-close"
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss message"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m8 8 8 8M16 8l-8 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <span
        className="livey-toast-progress"
        style={{
          animationDuration: `${duration}ms`,
        }}
        aria-hidden="true"
      />
    </aside>
  );
}