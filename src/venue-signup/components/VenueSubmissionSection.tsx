import type {
  UpdateVenueSignupField,
  VenueSignupFormState,
} from "../venueSignupTypes";

type VenueSubmissionSectionProps = {
  form: VenueSignupFormState;
  updateField: UpdateVenueSignupField;
};

const submissionSteps = [
  {
    number: "01",
    title: "Request review",
    description:
      "Livey reviews the venue information you submitted.",
  },
  {
    number: "02",
    title: "Venue verification",
    description:
      "We verify the location and confirm the venue details.",
  },
  {
    number: "03",
    title: "Approval",
    description:
      "Once approved, your venue can appear across Livey.",
  },
  {
    number: "04",
    title: "Dashboard access",
    description:
      "You’ll manage your venue and activities from the venue dashboard.",
  },
];

export function VenueSubmissionSection({
  form,
  updateField,
}: VenueSubmissionSectionProps) {
  return (
    <section className="livey-venue-signup-section livey-venue-next-card">
      <div className="livey-venue-signup-section-heading">
        <p className="livey-venue-signup-section-kicker">
          Final step
        </p>

        <h2>What happens next?</h2>

        <p className="livey-venue-signup-section-note">
          Here’s what happens after you submit your venue for review.
        </p>
      </div>

      <div
        className="livey-venue-next-steps"
        aria-label="Venue approval process"
      >
        {submissionSteps.map((step) => (
          <div
            className="livey-venue-next-step"
            key={step.number}
          >
            <strong
              className="livey-venue-next-step-number"
              aria-hidden="true"
            >
              {step.number}
            </strong>

            <div className="livey-venue-next-step-copy">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <label
        className={`livey-venue-confirmation-row ${
          form.submitterConfirmedAccuracy
            ? "is-confirmed"
            : ""
        }`}
      >
        <input
          type="checkbox"
          checked={form.submitterConfirmedAccuracy}
          onChange={(event) =>
            updateField(
              "submitterConfirmedAccuracy",
              event.target.checked
            )
          }
        />

        <span
          className="livey-venue-confirmation-control"
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20">
            <path d="m4.5 10.5 3.2 3.2 7.8-7.8" />
          </svg>
        </span>

        <span className="livey-venue-confirmation-copy">
          <strong>Confirm venue information</strong>

          <span>
            I am allowed to submit this venue and confirm that
            the information provided is accurate.
          </span>
        </span>
      </label>
    </section>
  );
}