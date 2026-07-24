export function VenueSignupFooter() {
  return (
    <footer className="livey-venue-signup-footer">
      <img
        className="livey-venue-signup-footer-logo"
        src="/Livey-Logo.png"
        alt="Livey"
      />

      <p>Discover what’s happening around you.</p>

      <a
        className="livey-venue-signup-footer-email"
        href="mailto:support@livey.network"
      >
        support@livey.network
      </a>

      <nav className="livey-venue-signup-footer-links">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Use</a>
        <a href="mailto:support@livey.network">Contact</a>
      </nav>

      <small>© 2026 Livey. All rights reserved.</small>
    </footer>
  );
}