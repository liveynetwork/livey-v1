import type { ChangeEvent } from "react";
import type { VenueRequestCategory } from "../../services/venueRequests";
import { categories } from "../venueSignupConfig";
import type {
  UpdateVenueSignupField,
  VenueSignupFormState,
} from "../venueSignupTypes";

const VENUE_NAME_MAX_LENGTH = 50;
const VENUE_DESCRIPTION_MAX_LENGTH = 200;

type VenueProfileSectionProps = {
  form: VenueSignupFormState;
  logoFile: File | null;
  logoPreviewUrl: string | null;
  updateField: UpdateVenueSignupField;
  onLogoSelected: (file: File | null) => void;
};

export function VenueProfileSection({
  form,
  logoFile,
  logoPreviewUrl,
  updateField,
  onLogoSelected,
}: VenueProfileSectionProps) {
  function handleLogoInputChange(event: ChangeEvent<HTMLInputElement>) {
    onLogoSelected(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  const venueNameLength = form.venueName.length;
  const descriptionLength = form.description.length;

  return (
    <section className="livey-venue-signup-section livey-venue-profile-section">
      <div className="livey-venue-signup-section-heading">
        <p className="livey-venue-signup-section-kicker">Step 1</p>
        <h2>Venue profile</h2>
      </div>

      <label>
        Venue name

        <div className="livey-venue-field-shell">
          <input
            value={form.venueName}
            onChange={(event) =>
              updateField("venueName", event.target.value)
            }
            placeholder="Example: Livey Bar"
            autoComplete="organization"
            maxLength={VENUE_NAME_MAX_LENGTH}
          />

          <span
            className={`livey-venue-field-counter ${
              venueNameLength >= 45 ? "is-near-limit" : ""
            }`}
          >
            {venueNameLength}/{VENUE_NAME_MAX_LENGTH}
          </span>
        </div>
      </label>

      <label>
        Category

        <select
          value={form.category}
          onChange={(event) =>
            updateField(
              "category",
              event.target.value as VenueRequestCategory
            )
          }
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label>
        Short description

        <div className="livey-venue-field-shell livey-venue-textarea-shell">
          <textarea
            value={form.description}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            placeholder="Tell people what your venue is about."
            rows={4}
            maxLength={VENUE_DESCRIPTION_MAX_LENGTH}
          />

          <span
            className={`livey-venue-field-counter livey-venue-textarea-counter ${
              descriptionLength >= 180 ? "is-near-limit" : ""
            }`}
          >
            {descriptionLength}/{VENUE_DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
      </label>

      <div className="livey-venue-logo-upload-card">
        <div className="livey-venue-logo-upload-copy">
          <h3>Venue logo or profile picture</h3>

          <p>
            Add the image people will recognize on Livey. You can crop it before
            submitting.
          </p>
        </div>

        <div className="livey-venue-logo-preview">
          {logoPreviewUrl ? (
            <img src={logoPreviewUrl} alt="Venue logo preview" />
          ) : (
            <span>Logo</span>
          )}
        </div>

        <label className="livey-venue-logo-upload-button">
          Choose Image

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleLogoInputChange}
          />
        </label>

        {logoFile ? (
          <span className="livey-venue-logo-selected-note">
            Cropped image ready
          </span>
        ) : null}
      </div>
    </section>
  );
}