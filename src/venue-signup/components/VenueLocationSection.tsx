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

  const isLocationConfirmed =
    locationPreviewState === "detected" ||
    locationPreviewState === "resolved";

  const isCheckingLocation = locationPreviewState === "checking";

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

  function getLocationStatusTitle() {
    if (isLocationConfirmed) {
      return "Location confirmed";
    }

    if (isCheckingLocation) {
      return "Finding your location";
    }

    return "We’ll verify the location";
  }

  function getLocationStatusDescription() {
    if (isLocationConfirmed) {
      return "We found the venue pin and will verify it before approval.";
    }

    if (isCheckingLocation) {
      return "Livey is checking the Google Maps link.";
    }

    return "The exact pin could not be detected, but your request can still be submitted.";
  }

  return (
    <section className="livey-venue-signup-section livey-venue-location-section">
      <div className="livey-venue-signup-section-heading">
        <p className="livey-venue-signup-section-kicker">Step 2</p>

        <h2>Location</h2>

        <p className="livey-venue-signup-section-note">
          Help people find your venue and place it accurately on the Livey map.
        </p>
      </div>

      <div className="livey-venue-city-field">
        <span className="livey-venue-city-label">City</span>

        <VenueCityDropdown
          value={form.city}
          onChange={(city) => updateField("city", city)}
        />
      </div>

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
          role="status"
          aria-live="polite"
        >
          <div className="livey-location-detection-icon" aria-hidden="true">
            {isLocationConfirmed ? (
              <svg viewBox="0 0 24 24">
                <path d="m6.5 12.5 3.4 3.4 7.6-7.8" />
              </svg>
            ) : isCheckingLocation ? (
              <span className="livey-location-detection-spinner" />
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" />
                <circle cx="12" cy="10" r="2" />
              </svg>
            )}
          </div>

          <div className="livey-location-detection-copy">
            <p>{getLocationStatusTitle()}</p>
            <span>{getLocationStatusDescription()}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}