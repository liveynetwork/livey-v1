import {
  useState,
} from "react";
import type {
  KeyboardEvent,
} from "react";
import type {
  VenueDashboardAnalytics,
} from "../../venueDashboardService";
import { ProfileCompleteIcon } from "./AnalyticsIcons";
import { AnalyticsCompletionRing } from "./AnalyticsCompletionRing";
import {
  AnalyticsProfileHealthModal,
  type EditableProfileFocusTarget,
} from "./AnalyticsProfileHealthModal";
import { AnalyticsSectionHeading } from "./AnalyticsSectionHeading";
import {
  clampAnalyticsPercentage,
} from "./analyticsFormatters";

type AnalyticsProfileHealthProps = {
  analytics: VenueDashboardAnalytics;
  onOpenAccountSettings: (
    target: EditableProfileFocusTarget
  ) => void;
};

export function AnalyticsProfileHealth({
  analytics,
  onOpenAccountSettings,
}: AnalyticsProfileHealthProps) {
  const [
    isDetailsOpen,
    setIsDetailsOpen,
  ] = useState(false);

  const profileCompleteness =
    clampAnalyticsPercentage(
      analytics.profileCompleteness
    );

  function openDetails() {
    setIsDetailsOpen(true);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLElement>
  ) {
    if (
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }

    event.preventDefault();
    openDetails();
  }

  function handleFixField(
  target: EditableProfileFocusTarget
) {
  onOpenAccountSettings(target);
}

  return (
    <>
      <section
        className="venue-dashboard-analytics-card venue-dashboard-analytics-profile-card"
        role="button"
        tabIndex={0}
        aria-label={`Open venue profile health details. Current completion is ${profileCompleteness}%`}
        onClick={openDetails}
        onKeyDown={handleKeyDown}
      >
        <AnalyticsSectionHeading
          eyebrow="Profile health"
          title={`${profileCompleteness}% complete`}
          description="A complete venue profile helps people understand where you are and what your venue offers."
        />

        <AnalyticsCompletionRing
          percentage={
            profileCompleteness
          }
          ariaLabel={`${profileCompleteness}% profile completeness`}
        />

        {analytics
          .profileMissingFields
          .length > 0 ? (
          <div className="venue-dashboard-analytics-missing-fields">
            <span>
              Still missing
            </span>

            <div>
              {analytics.profileMissingFields.map(
                (field) => (
                  <small key={field}>
                    {field}
                  </small>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="venue-dashboard-analytics-profile-complete">
            <ProfileCompleteIcon />

            <div>
              <strong>
                Your venue profile is
                complete.
              </strong>

              <span>
                All editable public details
                are currently available.
              </span>
            </div>
          </div>
        )}

        <div className="venue-dashboard-analytics-profile-card-action">
          <span>
            View profile details
          </span>

          <span aria-hidden="true">
            →
          </span>
        </div>
      </section>

      {isDetailsOpen ? (
        <AnalyticsProfileHealthModal
          percentage={
            profileCompleteness
          }
          completedFields={
            analytics.profileCompletedFields
          }
          missingFields={
            analytics.profileMissingFields
          }
          onClose={() =>
            setIsDetailsOpen(false)
          }
          onFixField={
            handleFixField
          }
        />
      ) : null}
    </>
  );
}