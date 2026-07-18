import {
  useEffect,
  useState,
} from "react";
import "./LiveyAnalyticsCardLoader.css";

type LiveyAnalyticsCardLoaderProps = {
  isReady: boolean;
  label: string;
  onComplete?: () => void;
};

const MAX_WAITING_PROGRESS = 92;
const COMPLETE_HOLD_TIME = 320;
const EXIT_DURATION = 220;

export function LiveyAnalyticsCardLoader({
  isReady,
  label,
  onComplete,
}: LiveyAnalyticsCardLoaderProps) {
  const [progress, setProgress] =
    useState(7);

  const [isExiting, setIsExiting] =
    useState(false);

  useEffect(() => {
    if (isReady) {
      return;
    }

    setProgress(7);
    setIsExiting(false);

    const progressTimer =
      window.setInterval(() => {
        setProgress(
          (currentProgress) => {
            if (
              currentProgress >=
              MAX_WAITING_PROGRESS
            ) {
              return MAX_WAITING_PROGRESS;
            }

            const remaining =
              MAX_WAITING_PROGRESS -
              currentProgress;

            const increase = Math.max(
              0.7,
              Math.min(
                4.5,
                remaining * 0.09
              )
            );

            return Math.min(
              MAX_WAITING_PROGRESS,
              currentProgress +
                increase
            );
          }
        );
      }, 150);

    return () => {
      window.clearInterval(
        progressTimer
      );
    };
  }, [isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    setProgress(100);

    const exitTimer =
      window.setTimeout(() => {
        setIsExiting(true);
      }, COMPLETE_HOLD_TIME);

    const completeTimer =
      window.setTimeout(() => {
        onComplete?.();
      }, COMPLETE_HOLD_TIME + EXIT_DURATION);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(
        completeTimer
      );
    };
  }, [isReady, onComplete]);

  return (
    <div
      className={[
        "livey-analytics-card-loader",
        isExiting
          ? "livey-analytics-card-loader-exiting"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={label}
      aria-live="polite"
    >
      <div className="livey-analytics-card-loader-content">
        <img
          className="livey-analytics-card-loader-logo"
          src="/Livey-Logo.png"
          alt="Livey"
        />

        <div
          className="livey-analytics-card-loader-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(
            progress
          )}
        >
          <span
            className={[
              "livey-analytics-card-loader-progress",
              isReady
                ? "livey-analytics-card-loader-progress-completing"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <span className="livey-analytics-card-loader-label">
          {label}
        </span>
      </div>
    </div>
  );
}