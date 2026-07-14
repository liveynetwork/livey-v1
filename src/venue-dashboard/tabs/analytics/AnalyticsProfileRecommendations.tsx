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

  return (
    <section className="venue-dashboard-analytics-card venue-dashboard-analytics-recommendations-card">
      <AnalyticsSectionHeading
        eyebrow="Recommended actions"
        title="Improve your Livey presence"
        description="Complete the details that help customers recognise and understand your venue."
      />

      {recommendations.length > 0 ? (
        <div className="venue-dashboard-analytics-recommendations-list">
          {recommendations.map(
            (recommendation, index) => (
              <article key={recommendation.id}>
                <span>{index + 1}</span>

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
          <ProfileCompleteIcon />

          <div>
            <strong>
              Your core venue profile is complete.
            </strong>

            <p>
              Continue publishing relevant activity
              to keep your Livey presence useful.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}