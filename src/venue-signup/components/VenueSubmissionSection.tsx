import type {
  UpdateVenueSignupField,
  VenueSignupFormState,
} from "../venueSignupTypes";

type VenueSubmissionSectionProps = {
  form: VenueSignupFormState;
  updateField: UpdateVenueSignupField;
};

export function VenueSubmissionSection({
  form,
  updateField,
}: VenueSubmissionSectionProps) {
  return (
    <section className="livey-venue-signup-section livey-venue-next-card">
      <div>
        <p className="livey-venue-signup-section-kicker">Final step</p>
        <h2>What happens next?</h2>
      </div>

      <div className="livey-venue-next-steps">
        <div>
          <strong>1</strong>
          <span>Livey reviews your venue request.</span>
        </div>

        <div>
          <strong>2</strong>
          <span>We verify the location and venue details.</span>
        </div>

        <div>
          <strong>3</strong>
          <span>Once approved, your venue can appear on the map.</span>
        </div>

        <div>
          <strong>4</strong>
          <span>You’ll later manage activity from your venue dashboard.</span>
        </div>
      </div>

      <label className="livey-venue-confirmation-row">
        <input
          type="checkbox"
          checked={form.submitterConfirmedAccuracy}
          onChange={(event) =>
            updateField("submitterConfirmedAccuracy", event.target.checked)
          }
        />

        <span>
          I confirm I am allowed to submit this venue and that the information
          is accurate.
        </span>
      </label>
    </section>
  );
}