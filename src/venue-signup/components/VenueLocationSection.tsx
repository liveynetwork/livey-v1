import type { VenueAddressSuggestion } from "../../services/mapboxAddressSearch";
import { VenueAddressSearch } from "./VenueAddressSearch";
import { VenueCityDropdown } from "./VenueCityDropdown";
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

  function handleAddressSelected(
    suggestion: VenueAddressSuggestion
  ) {
    updateField("address", suggestion.fullAddress);

    if (suggestion.area) {
      updateField("area", suggestion.area);
    }

    if (suggestion.city) {
      updateField("city", suggestion.city);
    }
  }

  return (
    <section className="livey-venue-signup-section livey-venue-location-section">
      <div className="livey-venue-signup-section-heading">
        <p className="livey-venue-signup-section-kicker">Step 2</p>

        <h2>Location</h2>

        <p className="livey-venue-signup-section-note">
          Search for your address, check the detected area, then add a
          Google Maps link for the most precise venue pin.
        </p>
      </div>

      <div className="livey-venue-city-field">
        <span className="livey-venue-city-label">City</span>

        <VenueCityDropdown
          value={form.city}
          onChange={(city) => updateField("city", city)}
        />
      </div>

      <label>
        Area

        <input
          value={form.area}
          onChange={(event) =>
            updateField("area", event.target.value)
          }
          placeholder="Automatically filled after selecting an address"
          autoComplete="address-level2"
        />
      </label>

      <div className="livey-venue-address-field">
        <span className="livey-venue-address-label">
          Full address
        </span>

        <VenueAddressSearch
          value={form.address}
          city={form.city}
          onValueChange={(address) =>
            updateField("address", address)
          }
          onSelect={handleAddressSelected}
        />

        <p className="livey-venue-address-help">
          Select a result to automatically fill the full address and
          detected area.
        </p>
      </div>

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