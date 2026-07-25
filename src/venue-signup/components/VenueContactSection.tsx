import { VenueContactMethodDropdown } from "./VenueContactMethodDropdown";
import type {
  UpdateVenueSignupField,
  VenueSignupFormState,
} from "../venueSignupTypes";

type VenueContactSectionProps = {
  form: VenueSignupFormState;
  updateField: UpdateVenueSignupField;
};

export function VenueContactSection({
  form,
  updateField,
}: VenueContactSectionProps) {
  return (
    <section className="livey-venue-signup-section livey-venue-contact-section">
      <div className="livey-venue-signup-section-heading">
        <p className="livey-venue-signup-section-kicker">Step 3</p>

        <h2>Contact</h2>

        <p className="livey-venue-signup-section-note">
          Add the contact details Livey can use to review and confirm your
          venue.
        </p>
      </div>

      <label>
        Contact person

        <input
          value={form.contactName}
          onChange={(event) =>
            updateField("contactName", event.target.value)
          }
          placeholder="Owner or manager name"
          autoComplete="name"
        />
      </label>

      <label>
        Contact email

        <input
          value={form.contactEmail}
          onChange={(event) =>
            updateField("contactEmail", event.target.value)
          }
          placeholder="name@venue.com"
          type="email"
          autoComplete="email"
        />
      </label>

      <label>
        Phone

        <input
          value={form.contactPhone}
          onChange={(event) =>
            updateField("contactPhone", event.target.value)
          }
          placeholder="+357..."
          type="tel"
          autoComplete="tel"
        />
      </label>

      <label>
        Instagram

        <input
          value={form.instagramUrl}
          onChange={(event) =>
            updateField("instagramUrl", event.target.value)
          }
          placeholder="https://instagram.com/yourvenue"
          inputMode="url"
          autoComplete="url"
        />
      </label>

      <label>
        Website

        <input
          value={form.websiteUrl}
          onChange={(event) =>
            updateField("websiteUrl", event.target.value)
          }
          placeholder="https://yourvenue.com"
          inputMode="url"
          autoComplete="url"
        />
      </label>

      <div className="livey-venue-contact-method-field">
        <span className="livey-venue-contact-method-label">
          Best way to contact you
        </span>

        <VenueContactMethodDropdown
          value={form.bestContactMethod}
          onChange={(method) =>
            updateField("bestContactMethod", method)
          }
        />
      </div>
    </section>
  );
}