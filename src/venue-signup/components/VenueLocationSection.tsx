import type { VenueRequestCity } from "../../services/venueRequests";
import { cities } from "../venueSignupConfig";
import type {
  LocationPreviewState,
  UpdateVenueSignupField,
  VenueSignupFormState,
} from "../venueSignupTypes";

type VenueLocationSectionProps = {
  form: VenueSignupFormState;
  locationPreviewState: LocationPreviewState;
  updateField: UpdateVenueSignupField;
};

export function VenueLocationSection({
  form,
  locationPreviewState,
  updateField,
}: VenueLocationSectionProps) {
  const hasGoogleMapsLink = form.googleMapsUrl.trim().length > 0;

  return (
    <section className="livey-venue-signup-section">
      <div>
        <p className="livey-venue-signup-section-kicker">Step 2</p>
        <h2>Location</h2>

        <p className="livey-venue-signup-section-note">
          Paste your Google Maps link if you have one. Livey will try to detect
          the exact pin, and we will still verify it before approval.
        </p>
      </div>

      <label>
        City
        <select
          value={form.city}
          onChange={(event) =>
            updateField("city", event.target.value as VenueRequestCity)
          }
        >
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      <label>
        Area
        <input
          value={form.area}
          onChange={(event) => updateField("area", event.target.value)}
          placeholder="Example: Old Town, Marina, Kato Paphos"
        />
      </label>

      <label>
        Full address
        <input
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
          placeholder="Street, number, area"
          autoComplete="street-address"
        />
      </label>

      <label>
        Google Maps link
        <input
          value={form.googleMapsUrl}
          onChange={(event) =>
            updateField("googleMapsUrl", event.target.value)
          }
          placeholder="Paste your Google Maps location link"
          inputMode="url"
        />
      </label>

      {hasGoogleMapsLink ? (
        <div
          className={`livey-location-detection-card ${locationPreviewState}`}
        >
          <p>
            {locationPreviewState === "detected"
              ? "Location detected from Google Maps link."
              : locationPreviewState === "resolved"
                ? "Location detected from Google Maps share link."
                : locationPreviewState === "checking"
                  ? "Checking Google Maps share link..."
                  : "We could not read the exact pin from this link."}
          </p>

          <span>
            {locationPreviewState === "detected" ||
            locationPreviewState === "resolved"
              ? "Livey found the coordinates, but we’ll still verify them before approval."
              : locationPreviewState === "checking"
                ? "This usually takes a moment. You can continue filling the form."
                : "No problem — Livey will manually verify the location before approval."}
          </span>
        </div>
      ) : null}
    </section>
  );
}