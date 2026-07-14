import type {
  VenueDashboardVenue,
} from "../../venueDashboardService";
import { AnalyticsSectionHeading } from "./AnalyticsSectionHeading";
import { ProfileCompleteIcon } from "./AnalyticsIcons";
import { buildProfileRecommendations } from "./analyticsInsights";

type AnalyticsProfileRecommendationsProps = {
  venue: VenueDashboardVenue;
};

export function AnalyticsProfileRecommendations({
  venue,
}: AnalyticsProfileRecommendationsProps) {
  const recommendations =
    buildProfileRecommendations(venue);

    if (recommendations.length === 0) {
  return null;
}

  const hasRecommendations =
    recommendations.length > 0;

  return (
    <section className="venue-dashboard-analytics-card venue-dashboard-analytics-recommendations-card">
      <AnalyticsSectionHeading
        eyebrow={
          hasRecommendations
            ? "Recommended actions"
            : "Profile status"
        }
        title={
          hasRecommendations
            ? "Improve your Livey presence"
            : "Your venue is ready"
        }
        description={
          hasRecommendations
            ? "Complete the details that help customers recognise and understand your venue."
            : "Your essential venue details are complete and ready for people to discover on Livey."
        }
      />

      {hasRecommendations ? (
        <div className="venue-dashboard-analytics-recommendations-list">
          {recommendations.map(
            (recommendation, index) => (
              <article key={recommendation.id}>
                <span
                  className="venue-dashboard-analytics-recommendation-number"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(
                    2,
                    "0"
                  )}
                </span>

                <div>
                  <strong>
                    {recommendation.title}
                  </strong>

                  <p>
                    {recommendation.description}
                  </p>
                </div>
              </article>
            )
          )}
        </div>
      ) : (
        <div className="venue-dashboard-analytics-recommendations-complete">
          <span className="venue-dashboard-analytics-recommendations-complete-icon">
            <ProfileCompleteIcon />
          </span>

          <div>
            <span className="venue-dashboard-analytics-recommendations-complete-label">
              Profile complete
            </span>

            <strong>
              Your core venue details are ready.
            </strong>

            <p>
              Keep your Livey presence active by
              publishing clear, relevant activity.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}