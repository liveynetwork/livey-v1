import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  submitVenueRequest,
  type VenueRequestCategory,
  type VenueRequestCity,
  type VenueRequestContactMethod,
  type VenueRequestDay,
  type VenueRequestLiveStatus,
} from "../services/venueRequests";
import { supabase } from "../lib/supabase";
import { extractGoogleMapsCoordinates } from "../utils/googleMapsLink";
import { LiveyImageCropper } from "../components/image-crop/LiveyImageCropper";
import "./VenueSignupScreen.css";

type LocationPreviewState =
  | "idle"
  | "detected"
  | "checking"
  | "resolved"
  | "manual";

type ResolveGoogleMapsLinkResponse = {
  success: boolean;
  latitude: number | null;
  longitude: number | null;
  expandedUrl: string | null;
  error: string | null;
};

const categories: VenueRequestCategory[] = [
  "Cafes",
  "Restaurants",
  "Bars",
  "Clubs",
  "Activities",
  "Shopping",
  "Beauty",
  "Events",
];

const cities: VenueRequestCity[] = [
  "Limassol",
  "Nicosia",
  "Larnaca",
  "Paphos",
  "Famagusta",
  "Kyrenia",
];

const liveStatuses: VenueRequestLiveStatus[] = [
  "Open now",
  "Live now",
  "Tonight",
  "Weekend",
];

const contactMethods: VenueRequestContactMethod[] = [
  "Email",
  "Phone",
  "Instagram",
];

const days: VenueRequestDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timeOptions = [
  "Closed",
  "00:00",
  "00:30",
  "01:00",
  "01:30",
  "02:00",
  "02:30",
  "03:00",
  "03:30",
  "04:00",
  "04:30",
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
];

const initialForm = {
  venueName: "",
  category: "Restaurants" as VenueRequestCategory,
  description: "",

  city: "Limassol" as VenueRequestCity,
  area: "",
  address: "",
  googleMapsUrl: "",

  contactName: "",
  contactEmail: "",
  contactPhone: "",
  instagramUrl: "",
  websiteUrl: "",
  bestContactMethod: "Email" as VenueRequestContactMethod,
  submitterConfirmedAccuracy: false,

  weekdayOpenTime: "09:00",
  weekdayCloseTime: "18:00",
  weekendOpenTime: "10:00",
  weekendCloseTime: "22:00",
  closedDays: [] as VenueRequestDay[],
  openStatus: "Open now" as VenueRequestLiveStatus,

  firstEventTitle: "",
  firstEventDescription: "",
  firstEventStatus: "Tonight" as VenueRequestLiveStatus,
  firstEventDisplayTime: "",
  firstEventStartsAt: "",
  firstEventEndsAt: "",
};

function VenueSignupFooter() {
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

export function VenueSignupScreen() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [imageToCropSrc, setImageToCropSrc] = useState<string | null>(null);
  const [imageToCropName, setImageToCropName] = useState("");
  const [locationPreviewState, setLocationPreviewState] =
    useState<LocationPreviewState>("idle");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const hasGoogleMapsLink = form.googleMapsUrl.trim().length > 0;

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }

      if (imageToCropSrc) {
        URL.revokeObjectURL(imageToCropSrc);
      }
    };
  }, [logoPreviewUrl, imageToCropSrc]);

  useEffect(() => {
    const googleMapsUrl = form.googleMapsUrl.trim();

    if (!googleMapsUrl) {
      setLocationPreviewState("idle");
      return;
    }

    const localCoordinates = extractGoogleMapsCoordinates(googleMapsUrl);

    if (localCoordinates) {
      setLocationPreviewState("detected");
      return;
    }

    const isLikelyGoogleMapsShareLink =
      googleMapsUrl.includes("maps.app.goo.gl") ||
      googleMapsUrl.includes("goo.gl/maps");

    if (!isLikelyGoogleMapsShareLink) {
      setLocationPreviewState("manual");
      return;
    }

    let isCancelled = false;

    async function checkShareLink() {
      setLocationPreviewState("checking");

      try {
        const { data, error } =
          await supabase.functions.invoke<ResolveGoogleMapsLinkResponse>(
            "resolve-google-maps-link",
            {
              body: {
                googleMapsUrl,
              },
            }
          );

        if (isCancelled) {
          return;
        }

        if (
          !error &&
          data?.success &&
          data.latitude !== null &&
          data.longitude !== null
        ) {
          setLocationPreviewState("resolved");
          return;
        }

        setLocationPreviewState("manual");
      } catch (error) {
        console.warn("Google Maps preview resolver failed:", error);

        if (!isCancelled) {
          setLocationPreviewState("manual");
        }
      }
    }

    const timeoutId = window.setTimeout(checkShareLink, 600);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [form.googleMapsUrl]);

  function updateField<Key extends keyof typeof form>(
    key: Key,
    value: (typeof form)[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleClosedDay(day: VenueRequestDay) {
    setForm((current) => {
      const isSelected = current.closedDays.includes(day);

      return {
        ...current,
        closedDays: isSelected
          ? current.closedDays.filter((closedDay) => closedDay !== day)
          : [...current.closedDays, day],
      };
    });
  }

  function handleLogoPreview(file: File | null) {
    setSubmitError(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSubmitError("Please upload an image file for your venue logo.");
      return;
    }

    const cropUrl = URL.createObjectURL(file);

    setImageToCropSrc((currentCropUrl) => {
      if (currentCropUrl) {
        URL.revokeObjectURL(currentCropUrl);
      }

      return cropUrl;
    });

    setImageToCropName(file.name);
  }

  function handleCancelLogoCrop() {
    setImageToCropSrc((currentCropUrl) => {
      if (currentCropUrl) {
        URL.revokeObjectURL(currentCropUrl);
      }

      return null;
    });

    setImageToCropName("");
  }

  function handleSaveLogoCrop(file: File, previewUrl: string) {
    setLogoFile(file);

    setLogoPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return previewUrl;
    });

    setImageToCropSrc((currentCropUrl) => {
      if (currentCropUrl) {
        URL.revokeObjectURL(currentCropUrl);
      }

      return null;
    });

    setImageToCropName("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitMessage(null);
    setSubmitError(null);

    if (!form.venueName.trim()) {
      setSubmitError("Add your venue name.");
      return;
    }

    if (!form.address.trim()) {
      setSubmitError("Add your venue address.");
      return;
    }

    if (!form.contactName.trim()) {
      setSubmitError("Add a contact person.");
      return;
    }

    if (!form.contactEmail.trim()) {
      setSubmitError("Add a contact email.");
      return;
    }

    if (!form.submitterConfirmedAccuracy) {
      setSubmitError(
        "Please confirm that you are allowed to submit this venue and that the information is accurate."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await submitVenueRequest({
        ...form,
        logoFile,
      });

      setForm(initialForm);
      setLogoFile(null);
      setImageToCropName("");
      setLocationPreviewState("idle");
      setHasSubmitted(true);

      setLogoPreviewUrl((currentPreviewUrl) => {
        if (currentPreviewUrl) {
          URL.revokeObjectURL(currentPreviewUrl);
        }

        return null;
      });

      setImageToCropSrc((currentCropUrl) => {
        if (currentCropUrl) {
          URL.revokeObjectURL(currentCropUrl);
        }

        return null;
      });

      setSubmitMessage(
        "Your venue request was sent. We’ll review it before it appears on Livey."
      );
    } catch (error) {
      console.error(error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not submit your venue request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (hasSubmitted) {
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
            We received your request and will review your venue details before
            it appears on Livey.
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

  return (
    <>
      {imageToCropSrc ? (
        <LiveyImageCropper
          imageSrc={imageToCropSrc}
          fileName={imageToCropName || "venue-logo"}
          title="Crop venue logo"
          description="Move and zoom the image until your venue logo looks clean and centered."
          onCancel={handleCancelLogoCrop}
          onSave={handleSaveLogoCrop}
        />
      ) : null}

      <main className="livey-venue-signup-screen">
        <section className="livey-venue-signup-hero">
          <img
            className="livey-venue-signup-logo"
            src="/Livey-Logo.png"
            alt="Livey"
          />

          <h1>Build your venue profile for Livey.</h1>

          <p className="livey-venue-signup-eyebrow">Livey for venues</p>

          <p>
            Add your venue details, location, opening info, and first Livey
            activity. Your venue will only appear after review and approval.
          </p>
        </section>

        <form className="livey-venue-signup-form" onSubmit={handleSubmit}>
          <section className="livey-venue-signup-section">
            <div>
              <p className="livey-venue-signup-section-kicker">Step 1</p>
              <h2>Venue profile</h2>
            </div>

            <label>
              Venue name
              <input
                value={form.venueName}
                onChange={(event) =>
                  updateField("venueName", event.target.value)
                }
                placeholder="Example: Livey Bar"
                autoComplete="organization"
              />
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
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Tell people what your venue is about."
                rows={4}
              />
            </label>

            <div className="livey-venue-logo-upload-card">
              <div className="livey-venue-logo-preview">
                {logoPreviewUrl ? (
                  <img src={logoPreviewUrl} alt="Venue logo preview" />
                ) : (
                  <span>Logo</span>
                )}
              </div>

              <div className="livey-venue-logo-upload-copy">
                <h3>Venue logo or profile picture</h3>
                <p>
                  Add the image people will recognize on Livey. You can crop it
                  before submitting.
                </p>

                <label className="livey-venue-logo-upload-button">
                  {logoFile ? "Change cropped image" : "Choose and crop image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      handleLogoPreview(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="livey-venue-signup-section">
            <div>
              <p className="livey-venue-signup-section-kicker">Step 2</p>
              <h2>Location</h2>
              <p className="livey-venue-signup-section-note">
                Paste your Google Maps link if you have one. Livey will try to
                detect the exact pin, and we will still verify it before
                approval.
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

          <section className="livey-venue-signup-section">
            <div>
              <p className="livey-venue-signup-section-kicker">Step 3</p>
              <h2>Contact</h2>
              <p className="livey-venue-signup-section-note">
                Use the email of the person who should manage this venue on
                Livey later.
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

          <section className="livey-venue-signup-section">
            <div>
              <p className="livey-venue-signup-section-kicker">Step 4</p>
              <h2>Opening info</h2>
              <p className="livey-venue-signup-section-note">
                Choose your usual opening times. You can mark closed days
                separately.
              </p>
            </div>

            <div className="livey-venue-time-grid">
              <label>
                Weekday opens
                <select
                  value={form.weekdayOpenTime}
                  onChange={(event) =>
                    updateField("weekdayOpenTime", event.target.value)
                  }
                >
                  {timeOptions.map((time) => (
                    <option
                      key={`weekday-open-${time}`}
                      value={time === "Closed" ? "" : time}
                    >
                      {time}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Weekday closes
                <select
                  value={form.weekdayCloseTime}
                  onChange={(event) =>
                    updateField("weekdayCloseTime", event.target.value)
                  }
                >
                  {timeOptions.map((time) => (
                    <option
                      key={`weekday-close-${time}`}
                      value={time === "Closed" ? "" : time}
                    >
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="livey-venue-time-grid">
              <label>
                Weekend opens
                <select
                  value={form.weekendOpenTime}
                  onChange={(event) =>
                    updateField("weekendOpenTime", event.target.value)
                  }
                >
                  {timeOptions.map((time) => (
                    <option
                      key={`weekend-open-${time}`}
                      value={time === "Closed" ? "" : time}
                    >
                      {time}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Weekend closes
                <select
                  value={form.weekendCloseTime}
                  onChange={(event) =>
                    updateField("weekendCloseTime", event.target.value)
                  }
                >
                  {timeOptions.map((time) => (
                    <option
                      key={`weekend-close-${time}`}
                      value={time === "Closed" ? "" : time}
                    >
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="livey-venue-closed-days">
              <p>Closed days</p>

              <div className="livey-venue-closed-day-grid">
                {days.map((day) => {
                  const isSelected = form.closedDays.includes(day);

                  return (
                    <button
                      className={`livey-venue-closed-day ${
                        isSelected ? "selected" : ""
                      }`}
                      key={day}
                      type="button"
                      onClick={() => toggleClosedDay(day)}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <label>
              Current status
              <select
                value={form.openStatus}
                onChange={(event) =>
                  updateField(
                    "openStatus",
                    event.target.value as VenueRequestLiveStatus
                  )
                }
              >
                {liveStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="livey-venue-signup-section">
            <div>
              <p className="livey-venue-signup-section-kicker">Step 5</p>
              <h2>First Livey activity</h2>
              <p className="livey-venue-signup-section-note">
                Optional for now. Add what people should see first on your Livey
                venue card.
              </p>
            </div>

            <label>
              Activity title
              <input
                value={form.firstEventTitle}
                onChange={(event) =>
                  updateField("firstEventTitle", event.target.value)
                }
                placeholder="Example: Friday cocktails, DJ night, brunch menu"
              />
            </label>

            <label>
              Activity description
              <textarea
                value={form.firstEventDescription}
                onChange={(event) =>
                  updateField("firstEventDescription", event.target.value)
                }
                placeholder="Describe what is happening."
                rows={4}
              />
            </label>

            <label>
              Activity status
              <select
                value={form.firstEventStatus}
                onChange={(event) =>
                  updateField(
                    "firstEventStatus",
                    event.target.value as VenueRequestLiveStatus
                  )
                }
              >
                {liveStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Display time
              <input
                value={form.firstEventDisplayTime}
                onChange={(event) =>
                  updateField("firstEventDisplayTime", event.target.value)
                }
                placeholder="Example: Tonight from 21:00"
              />
            </label>

            <label>
              Starts at
              <input
                value={form.firstEventStartsAt}
                onChange={(event) =>
                  updateField("firstEventStartsAt", event.target.value)
                }
                type="datetime-local"
              />
            </label>

            <label>
              Ends at
              <input
                value={form.firstEventEndsAt}
                onChange={(event) =>
                  updateField("firstEventEndsAt", event.target.value)
                }
                type="datetime-local"
              />
            </label>
          </section>

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
                <span>
                  You’ll later manage activity from your venue dashboard.
                </span>
              </div>
            </div>

            <label className="livey-venue-confirmation-row">
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

              <span>
                I confirm I am allowed to submit this venue and that the
                information is accurate.
              </span>
            </label>
          </section>

          {submitError ? (
            <p className="livey-venue-signup-alert error">{submitError}</p>
          ) : null}

          {submitMessage ? (
            <p className="livey-venue-signup-alert success">{submitMessage}</p>
          ) : null}

          <button
            className="livey-venue-signup-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit for approval"}
          </button>

          <p className="livey-venue-signup-disclaimer">
            Submitting this form does not publish your venue immediately. Livey
            reviews every venue before it appears on the map.
          </p>
        </form>

        <VenueSignupFooter />
      </main>
    </>
  );
}