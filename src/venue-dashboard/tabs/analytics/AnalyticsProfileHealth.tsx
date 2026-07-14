import type { CSSProperties } from "react";
import type {
  VenueDashboardAnalytics,
} from "../../venueDashboardService";
import { ProfileCompleteIcon } from "./AnalyticsIcons";
import { AnalyticsSectionHeading } from "./AnalyticsSectionHeading";
import { clampAnalyticsPercentage } from "./analyticsFormatters";

type AnalyticsProfileHealthProps = {
  analytics: VenueDashboardAnalytics;
};

type ProfileProgressStyle = CSSProperties & {
  "--profile-progress": string;
};

export function AnalyticsProfileHealth({
  analytics,
}: AnalyticsProfileHealthProps) {
  const profileCompleteness =
    clampAnalyticsPercentage(
      analytics.profileCompleteness
    );

  const profileProgressStyle: ProfileProgressStyle = {
    "--profile-progress":
      `${profileCompleteness * 3.6}deg`,
  };

  return (
    <section className="venue-dashboard-analytics-card venue-dashboard-analytics-profile-card">
      <AnalyticsSectionHeading
        eyebrow="Profile health"
        title={`${profileCompleteness}% complete`}
        description="A complete venue profile helps people understand where you are and what your venue offers."
      />

      <div
        className="venue-dashboard-analytics-profile-ring"
        style={profileProgressStyle}
        aria-label={`${profileCompleteness}% profile completeness`}
      >
        <div>
          <strong>{profileCompleteness}%</strong>
          <span>Complete</span>
        </div>
      </div>

      {analytics.profileMissingFields.length > 0 ? (
        <div className="venue-dashboard-analytics-missing-fields">
          <span>Still missing</span>

          <div>
            {analytics.profileMissingFields.map(
              (field) => (
                <small key={field}>{field}</small>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="venue-dashboard-analytics-profile-complete">
          <ProfileCompleteIcon />

          <div>
            <strong>
              Your venue profile is complete.
            </strong>

            <span>
              All core public details are currently
              available.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}