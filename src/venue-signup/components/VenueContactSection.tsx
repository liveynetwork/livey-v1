import type { VenueRequestContactMethod } from "../../services/venueRequests";
import { contactMethods } from "../venueSignupConfig";
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
    <section className="livey-venue-signup-section">
      <div>
        <p className="livey-venue-signup-section-kicker">Step 3</p>
        <h2>Contact</h2>

        <p className="livey-venue-signup-section-note">
          Use the email of the person who should manage this venue on Livey
          later.
        </p>
      </div>

      <label>
        Contact person
        <input
          value={form.contactName}
          onChange={(event) => updateField("contactName", event.target.value)}
          placeholder="Owner or manager name"
          autoComplete="name"
        />
      </label>

      <label>
        Contact email
        <input
          value={form.contactEmail}
          onChange={(event) => updateField("contactEmail", event.target.value)}
          placeholder="name@venue.com"
          type="email"
          autoComplete="email"
        />
      </label>

      <label>
        Phone
        <input
          value={form.contactPhone}
          onChange={(event) => updateField("contactPhone", event.target.value)}
          placeholder="+357..."
          type="tel"
          autoComplete="tel"
        />
      </label>

      <label>
        Instagram
        <input
          value={form.instagramUrl}
          onChange={(event) => updateField("instagramUrl", event.target.value)}
          placeholder="https://instagram.com/yourvenue"
          inputMode="url"
        />
      </label>

      <label>
        Website
        <input
          value={form.websiteUrl}
          onChange={(event) => updateField("websiteUrl", event.target.value)}
          placeholder="https://yourvenue.com"
          inputMode="url"
        />
      </label>

      <label>
        Best way to contact you
        <select
          value={form.bestContactMethod}
          onChange={(event) =>
            updateField(
              "bestContactMethod",
              event.target.value as VenueRequestContactMethod
            )
          }
        >
          {contactMethods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}