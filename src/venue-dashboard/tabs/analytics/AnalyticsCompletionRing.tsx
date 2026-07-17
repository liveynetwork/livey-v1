import {
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
} from "react";
import {
  clampAnalyticsPercentage,
} from "./analyticsFormatters";

type AnalyticsCompletionRingProps = {
  percentage: number;
  ariaLabel?: string;
  animateWhenVisible?: boolean;
  animationKey?: string | number;
  size?: "default" | "large";
};

type CompletionRingStyle =
  CSSProperties & {
    "--profile-progress-offset": number;
  };

const ANIMATION_DURATION_MS = 900;

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE =
  2 * Math.PI * RING_RADIUS;

export function AnalyticsCompletionRing({
  percentage,
  ariaLabel,
  animateWhenVisible = true,
  animationKey = "default",
  size = "default",
}: AnalyticsCompletionRingProps) {
  const ringRef =
    useRef<HTMLDivElement | null>(null);

  const hasAnimatedRef =
    useRef(false);

  const [
    displayedPercentage,
    setDisplayedPercentage,
  ] = useState(0);

  const [
    animatedPercentage,
    setAnimatedPercentage,
  ] = useState(0);

  const finalPercentage =
    clampAnalyticsPercentage(
      percentage
    );

  useEffect(() => {
    hasAnimatedRef.current = false;
    setDisplayedPercentage(0);
    setAnimatedPercentage(0);

    const ringElement =
      ringRef.current;

    if (!ringElement) {
      return;
    }

    const prefersReducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    if (prefersReducedMotion) {
      hasAnimatedRef.current = true;

      setDisplayedPercentage(
        finalPercentage
      );

      setAnimatedPercentage(
        finalPercentage
      );

      return;
    }

    let animationFrameId = 0;

    function beginAnimation() {
      if (hasAnimatedRef.current) {
        return;
      }

      hasAnimatedRef.current = true;

      const startedAt =
        performance.now();

      function animate(
        currentTime: number
      ) {
        const elapsed =
          currentTime - startedAt;

        const rawProgress =
          Math.min(
            elapsed /
              ANIMATION_DURATION_MS,
            1
          );

        const easedProgress =
          1 -
          Math.pow(
            1 - rawProgress,
            3
          );

        const nextPercentage =
          finalPercentage *
          easedProgress;

        setAnimatedPercentage(
          nextPercentage
        );

        setDisplayedPercentage(
          Math.round(nextPercentage)
        );

        if (rawProgress < 1) {
          animationFrameId =
            window.requestAnimationFrame(
              animate
            );

          return;
        }

        setAnimatedPercentage(
          finalPercentage
        );

        setDisplayedPercentage(
          finalPercentage
        );
      }

      animationFrameId =
        window.requestAnimationFrame(
          animate
        );
    }

    if (!animateWhenVisible) {
      beginAnimation();

      return () => {
        window.cancelAnimationFrame(
          animationFrameId
        );
      };
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          if (!entry?.isIntersecting) {
            return;
          }

          beginAnimation();
          observer.disconnect();
        },
        {
          threshold: 0.35,
        }
      );

    observer.observe(ringElement);

    return () => {
      observer.disconnect();

      window.cancelAnimationFrame(
        animationFrameId
      );
    };
  }, [
    animateWhenVisible,
    animationKey,
    finalPercentage,
  ]);

  const progressOffset =
    RING_CIRCUMFERENCE *
    (1 -
      animatedPercentage / 100);

  const ringStyle: CompletionRingStyle = {
    "--profile-progress-offset":
      progressOffset,
  };

  return (
    <div
      ref={ringRef}
      className={[
        "venue-dashboard-analytics-profile-ring",
        size === "large"
          ? "is-large"
          : "",
        animatedPercentage > 0
          ? "has-progress"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={ringStyle}
      role="img"
      aria-label={
        ariaLabel ||
        `${finalPercentage}% profile completeness`
      }
    >
      <svg
        className="venue-dashboard-analytics-profile-ring-graphic"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <circle
          className="venue-dashboard-analytics-profile-ring-track"
          cx="50"
          cy="50"
          r={RING_RADIUS}
        />

        <circle
          className="venue-dashboard-analytics-profile-ring-progress"
          cx="50"
          cy="50"
          r={RING_RADIUS}
          pathLength={RING_CIRCUMFERENCE}
        />
      </svg>

      <div className="venue-dashboard-analytics-profile-ring-inner">
        <strong>
          {displayedPercentage}%
        </strong>

        <span>
          Complete
        </span>
      </div>
    </div>
  );
}