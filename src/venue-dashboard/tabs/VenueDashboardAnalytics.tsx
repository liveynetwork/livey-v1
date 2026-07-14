import type {
  VenueDashboardAnalytics as VenueDashboardAnalyticsData,
  VenueDashboardEvent,
} from "../venueDashboardService";

type VenueDashboardAnalyticsProps = {
  venueName: string;
  analytics: VenueDashboardAnalyticsData;
};

export function VenueDashboardAnalytics({
  venueName,
  analytics,
}: VenueDashboardAnalyticsProps) {
  const activityCoverage =
    analytics.totalActivities > 0
      ? Math.round(
          (analytics.visibleActivities /
            analytics.totalActivities) *
            100
        )
      : 0;

  const historyShare =
    analytics.totalActivities > 0
      ? Math.round(
          (analytics.historyActivities /
            analytics.totalActivities) *
            100
        )
      : 0;

  const upcomingShare =
    analytics.totalActivities > 0
      ? Math.round(
          (analytics.upcomingActivities /
            analytics.totalActivities) *
            100
        )
      : 0;

  return (
    <section className="venue-dashboard-analytics">
      <section className="venue-dashboard-analytics-hero">
        <div className="venue-dashboard-analytics-hero-copy">
          <p className="venue-dashboard-eyebrow">
            Venue performance
          </p>

          <h2>
            A clearer view of how {venueName} is performing.
          </h2>

          <p>
            Review your activity visibility, publishing health,
            upcoming schedule, and venue profile readiness.
          </p>
        </div>

        <div className="venue-dashboard-analytics-hero-status">
          <span>Analytics V1</span>
          <strong>Live</strong>
        </div>
      </section>

      <section
        className="venue-dashboard-analytics-summary-grid"
        aria-label="Venue analytics summary"
      >
        <AnalyticsMetricCard
          label="Total activity"
          value={analytics.totalActivities}
          description="All activity created for this venue."
          icon={<ActivityMetricIcon />}
        />

        <AnalyticsMetricCard
          label="Visible now"
          value={analytics.visibleActivities}
          description="Current or upcoming activity visible on Livey."
          icon={<VisibilityMetricIcon />}
          emphasized
        />

        <AnalyticsMetricCard
          label="Upcoming"
          value={analytics.upcomingActivities}
          description="Scheduled activity that has not started yet."
          icon={<CalendarMetricIcon />}
        />

        <AnalyticsMetricCard
          label="Profile ready"
          value={`${analytics.profileCompleteness}%`}
          description="How complete your public venue profile is."
          icon={<ProfileMetricIcon />}
        />
      </section>

      <section className="venue-dashboard-analytics-main-grid">
        <section className="venue-dashboard-analytics-card venue-dashboard-analytics-health-card">
          <AnalyticsSectionHeading
            eyebrow="Activity health"
            title="Your Livey activity overview"
            description="A truthful breakdown based on the activity currently stored for your venue."
          />

          <div className="venue-dashboard-analytics-health-list">
            <AnalyticsProgressRow
              label="Visible activity"
              value={analytics.visibleActivities}
              total={analytics.totalActivities}
              percentage={activityCoverage}
              tone="orange"
            />

            <AnalyticsProgressRow
              label="Upcoming activity"
              value={analytics.upcomingActivities}
              total={analytics.totalActivities}
              percentage={upcomingShare}
              tone="cream"
            />

            <AnalyticsProgressRow
              label="History"
              value={analytics.historyActivities}
              total={analytics.totalActivities}
              percentage={historyShare}
              tone="muted"
            />
          </div>

          <div className="venue-dashboard-analytics-health-summary">
            <div>
              <span>Live now</span>
              <strong>{analytics.liveNowActivities}</strong>
            </div>

            <div>
              <span>Hidden</span>
              <strong>{analytics.hiddenActivities}</strong>
            </div>

            <div>
              <span>Expired</span>
              <strong>{analytics.expiredActivities}</strong>
            </div>

            <div>
              <span>Removed</span>
              <strong>{analytics.removedActivities}</strong>
            </div>
          </div>
        </section>

        <section className="venue-dashboard-analytics-card venue-dashboard-analytics-profile-card">
          <AnalyticsSectionHeading
            eyebrow="Profile health"
            title={`${analytics.profileCompleteness}% complete`}
            description="A complete venue profile helps people understand where you are and what your venue offers."
          />

          <div
            className="venue-dashboard-analytics-profile-ring"
            style={
              {
                "--profile-progress":
                  `${analytics.profileCompleteness * 3.6}deg`,
              } as React.CSSProperties
            }
            aria-label={`${analytics.profileCompleteness}% profile completeness`}
          >
            <div>
              <strong>{analytics.profileCompleteness}%</strong>
              <span>Complete</span>
            </div>
          </div>

          {analytics.profileMissingFields.length > 0 ? (
            <div className="venue-dashboard-analytics-missing-fields">
              <span>Still missing</span>

              <div>
                {analytics.profileMissingFields.map((field) => (
                  <small key={field}>{field}</small>
                ))}
              </div>
            </div>
          ) : (
            <div className="venue-dashboard-analytics-profile-complete">
              <ProfileCompleteIcon />

              <div>
                <strong>Your venue profile is complete.</strong>
                <span>
                  All core public details are currently available.
                </span>
              </div>
            </div>
          )}
        </section>
      </section>

      <section className="venue-dashboard-analytics-schedule-grid">
        <AnalyticsActivityCard
          eyebrow="Live activity"
          title="Happening now"
          event={analytics.currentLiveActivity}
          emptyTitle="Nothing is live right now"
          emptyDescription="When an activity is currently running, it will appear here."
        />

        <AnalyticsActivityCard
          eyebrow="Next activity"
          title="Coming up"
          event={analytics.nextActivity}
          emptyTitle="No upcoming activity"
          emptyDescription="Create or schedule activity to build your upcoming venue calendar."
        />
      </section>

      <section className="venue-dashboard-analytics-card venue-dashboard-analytics-audience-card">
        <div className="venue-dashboard-analytics-audience-icon">
          <AudienceMetricIcon />
        </div>

        <div className="venue-dashboard-analytics-audience-copy">
          <p className="venue-dashboard-eyebrow">
            Audience insights
          </p>

          <h2>More customer signals are being prepared.</h2>

          <p>
            Followers, map impressions, venue opens, activity taps,
            and directions requests will appear here after secure
            interaction tracking is connected.
          </p>
        </div>

        <div className="venue-dashboard-analytics-audience-status">
          <span />
          Collecting soon
        </div>
      </section>
    </section>
  );
}

function AnalyticsMetricCard({
  label,
  value,
  description,
  icon,
  emphasized = false,
}: {
  label: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <article
      className={
        emphasized
          ? "venue-dashboard-analytics-metric-card is-emphasized"
          : "venue-dashboard-analytics-metric-card"
      }
    >
      <div className="venue-dashboard-analytics-metric-icon">
        {icon}
      </div>

      <span>{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}

function AnalyticsSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="venue-dashboard-analytics-section-heading">
      <p className="venue-dashboard-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

function AnalyticsProgressRow({
  label,
  value,
  total,
  percentage,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  percentage: number;
  tone: "orange" | "cream" | "muted";
}) {
  return (
    <div className="venue-dashboard-analytics-progress-row">
      <div className="venue-dashboard-analytics-progress-copy">
        <span>{label}</span>

        <strong>
          {value}
          <small> / {total}</small>
        </strong>
      </div>

      <div
        className="venue-dashboard-analytics-progress-track"
        aria-hidden="true"
      >
        <span
          className={`is-${tone}`}
          style={{
            width: `${Math.max(0, Math.min(percentage, 100))}%`,
          }}
        />
      </div>
    </div>
  );
}

function AnalyticsActivityCard({
  eyebrow,
  title,
  event,
  emptyTitle,
  emptyDescription,
}: {
  eyebrow: string;
  title: string;
  event: VenueDashboardEvent | null;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <article className="venue-dashboard-analytics-card venue-dashboard-analytics-activity-card">
      <p className="venue-dashboard-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>

      {event ? (
        <div className="venue-dashboard-analytics-activity-content">
          <div>
            <strong>{event.title}</strong>

            <p>
              {event.display_time ||
                formatActivityDate(event.starts_at)}
            </p>
          </div>

          <span className="venue-dashboard-status-pill">
            {event.status}
          </span>
        </div>
      ) : (
        <div className="venue-dashboard-analytics-activity-empty">
          <ActivityEmptyIcon />

          <div>
            <strong>{emptyTitle}</strong>
            <p>{emptyDescription}</p>
          </div>
        </div>
      )}
    </article>
  );
}

function formatActivityDate(value: string | null) {
  if (!value) {
    return "Time not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ActivityMetricIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h4l2.5-5.5L14 17l2.4-5H20" />
    </svg>
  );
}

function VisibilityMetricIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 12s3.2-5 8.5-5 8.5 5 8.5 5-3.2 5-8.5 5-8.5-5-8.5-5Z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

function CalendarMetricIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="14" rx="3" />
      <path d="M8 3.5v4M16 3.5v4M4 9.5h16" />
    </svg>
  );
}

function ProfileMetricIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19c.8-3.6 3-5.4 6.5-5.4s5.7 1.8 6.5 5.4" />
    </svg>
  );
}

function AudienceMetricIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 18V13M9.3 18V9M14.7 18v-6M20 18V6" />
    </svg>
  );
}

function ProfileCompleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="m8.5 12.2 2.2 2.2 4.9-5.1" />
    </svg>
  );
}

function ActivityEmptyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.7 1.7" />
    </svg>
  );
}