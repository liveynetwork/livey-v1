import { VenueSignupFooter } from "./VenueSignupFooter";

export function VenueSignupSuccess() {
  return (
    <main className="livey-venue-signup-screen">
      <section className="livey-venue-thank-you-card">
        <img
          className="livey-venue-thank-you-logo"
          src="/Livey-Logo.png"
          alt="Livey"
        />

        <h1>Thank you for submitting your venue.</h1>

        <p>
          We received your request and will review your venue details before it
          appears on Livey.
        </p>

        <span>
          If we need anything else, we’ll contact you using the details you
          provided.
        </span>
      </section>

      <VenueSignupFooter />
    </main>
  );
}