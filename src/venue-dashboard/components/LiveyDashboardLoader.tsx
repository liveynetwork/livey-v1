import { useEffect, useState } from "react";
import "./LiveyDashboardLoader.css";

type LiveyDashboardLoaderProps = {
  isReady: boolean;
};

const MAX_WAITING_PROGRESS = 92;
const COMPLETE_HOLD_TIME = 620;
const EXIT_DURATION = 360;

export function LiveyDashboardLoader({
  isReady,
}: LiveyDashboardLoaderProps) {
  const [progress, setProgress] = useState(7);
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isReady) return;

    const progressTimer = window.setInterval(() => {
      setProgress((currentProgress) => {
        if (currentProgress >= MAX_WAITING_PROGRESS) {
          return MAX_WAITING_PROGRESS;
        }

        const remaining =
          MAX_WAITING_PROGRESS - currentProgress;

        const increase = Math.max(
          0.7,
          Math.min(4.5, remaining * 0.09)
        );

        return Math.min(
          MAX_WAITING_PROGRESS,
          currentProgress + increase
        );
      });
    }, 150);

    return () => {
      window.clearInterval(progressTimer);
    };
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;

    setProgress(100);

    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, COMPLETE_HOLD_TIME);

    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, COMPLETE_HOLD_TIME + EXIT_DURATION);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, [isReady]);

  if (!isVisible) {
    return null;
  }

  return (
    <main
      className={[
        "livey-dashboard-loader",
        isExiting
          ? "livey-dashboard-loader-exiting"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Loading Livey venue dashboard"
      aria-live="polite"
    >
      <div className="livey-dashboard-loader-content">
        <img
          className="livey-dashboard-loader-logo"
          src="/Livey-Logo.png"
          alt="Livey"
        />

        <div
          className="livey-dashboard-loader-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <span
            className={[
              "livey-dashboard-loader-progress",
              isReady
                ? "livey-dashboard-loader-progress-completing"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </main>
  );
}