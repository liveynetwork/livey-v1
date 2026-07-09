type AccountSupportSessionCardProps = {
  onSignOut: () => void;
};

export function AccountSupportSessionCard({
  onSignOut,
}: AccountSupportSessionCardProps) {
  return (
    <section className="venue-dashboard-card venue-dashboard-support-session-card">
      <div>
        <p className="venue-dashboard-eyebrow">Support & session</p>
        <h2>Need help with locked details?</h2>
        <p>
          Contact Livey support for location, category, address, or account
          changes.
        </p>
      </div>

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
          onClick={onSignOut}
        >
          Sign out
        </button>
      </div>
    </section>
  );
}