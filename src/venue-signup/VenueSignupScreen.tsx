import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { submitVenueRequest } from "../services/venueRequests";
import { supabase } from "../lib/supabase";
import { extractGoogleMapsCoordinates } from "../utils/googleMapsLink";
import { LiveyImageCropper } from "../components/image-crop/LiveyImageCropper";
import { VenueContactSection } from "./components/VenueContactSection";
import { VenueLocationSection } from "./components/VenueLocationSection";
import { VenueOpeningInfoSection } from "./components/VenueOpeningInfoSection";
import { VenueProfileSection } from "./components/VenueProfileSection";
import { VenueSubmissionSection } from "./components/VenueSubmissionSection";
import { VenueSignupFooter } from "./components/VenueSignupFooter";
import { VenueSignupHero } from "./components/VenueSignupHero";
import { VenueSignupSuccess } from "./components/VenueSignupSuccess";
import {
  createInitialVenueSignupForm,
  initialForm,
} from "./venueSignupConfig";
import type {
  LocationPreviewState,
  ResolveGoogleMapsLinkResponse,
  VenueOpeningHoursDay,
  VenueSignupFormState,
} from "./venueSignupTypes";
import "./VenueSignupScreen.css";

export function VenueSignupScreen() {
  const [form, setForm] =
    useState<VenueSignupFormState>(initialForm);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] =
    useState<string | null>(null);
  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const [logoFile, setLogoFile] =
    useState<File | null>(null);

  const [logoPreviewUrl, setLogoPreviewUrl] =
    useState<string | null>(null);

  const [imageToCropSrc, setImageToCropSrc] =
    useState<string | null>(null);

  const [imageToCropName, setImageToCropName] =
    useState("");

  const [locationPreviewState, setLocationPreviewState] =
    useState<LocationPreviewState>("idle");

  const [hasSubmitted, setHasSubmitted] =
    useState(false);

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

    const localCoordinates =
      extractGoogleMapsCoordinates(googleMapsUrl);

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
        console.warn(
          "Google Maps preview resolver failed:",
          error
        );

        if (!isCancelled) {
          setLocationPreviewState("manual");
        }
      }
    }

    const timeoutId = window.setTimeout(
      checkShareLink,
      600
    );

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [form.googleMapsUrl]);

  function updateField<
    Key extends keyof VenueSignupFormState,
  >(
    key: Key,
    value: VenueSignupFormState[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateOpeningHoursDay(
    dayIndex: number,
    updates: Partial<VenueOpeningHoursDay>
  ) {
    setForm((current) => {
      const openingHoursSchedule =
        current.openingHoursSchedule.map(
          (day, index) =>
            index === dayIndex
              ? {
                  ...day,
                  ...updates,
                }
              : day
        );

      const weekdayDays =
        openingHoursSchedule.filter(
          (day) =>
            day.day === "Monday" ||
            day.day === "Tuesday" ||
            day.day === "Wednesday" ||
            day.day === "Thursday" ||
            day.day === "Friday"
        );

      const weekendDays =
        openingHoursSchedule.filter(
          (day) =>
            day.day === "Saturday" ||
            day.day === "Sunday"
        );

      const firstOpenWeekday =
        weekdayDays.find(
          (day) => !day.isClosed
        );

      const firstOpenWeekend =
        weekendDays.find(
          (day) => !day.isClosed
        );

      const closedDays =
        openingHoursSchedule
          .filter((day) => day.isClosed)
          .map((day) => day.day);

      return {
        ...current,
        openingHoursSchedule,

        weekdayOpenTime:
          firstOpenWeekday?.openTime ??
          current.weekdayOpenTime,

        weekdayCloseTime:
          firstOpenWeekday?.closeTime ??
          current.weekdayCloseTime,

        weekendOpenTime:
          firstOpenWeekend?.openTime ??
          current.weekendOpenTime,

        weekendCloseTime:
          firstOpenWeekend?.closeTime ??
          current.weekendCloseTime,

        closedDays,
      };
    });
  }

  function handleLogoPreview(file: File | null) {
    setSubmitError(null);

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSubmitError(
        "Please upload an image file for your venue logo."
      );
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

  function handleSaveLogoCrop(
    file: File,
    previewUrl: string
  ) {
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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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

      setForm(createInitialVenueSignupForm());
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
    return <VenueSignupSuccess />;
  }

  return (
    <>
      {imageToCropSrc ? (
        <LiveyImageCropper
          imageSrc={imageToCropSrc}
          fileName={
            imageToCropName || "venue-logo"
          }
          title="Crop venue logo"
          description="Move and zoom the image until your venue logo looks clean and centered."
          onCancel={handleCancelLogoCrop}
          onSave={handleSaveLogoCrop}
        />
      ) : null}

      <main className="livey-venue-signup-screen">
        <VenueSignupHero />

        <form
          className="livey-venue-signup-form"
          onSubmit={handleSubmit}
        >
          <VenueProfileSection
            form={form}
            logoFile={logoFile}
            logoPreviewUrl={logoPreviewUrl}
            updateField={updateField}
            onLogoSelected={handleLogoPreview}
          />

          <VenueLocationSection
            form={form}
            locationPreviewState={
              locationPreviewState
            }
            updateField={updateField}
          />

          <VenueContactSection
            form={form}
            updateField={updateField}
          />

          <VenueOpeningInfoSection
            form={form}
            updateField={updateField}
            onUpdateOpeningHoursDay={
              updateOpeningHoursDay
            }
          />

          <VenueSubmissionSection
            form={form}
            updateField={updateField}
          />

          {submitError ? (
            <p className="livey-venue-signup-alert error">
              {submitError}
            </p>
          ) : null}

          {submitMessage ? (
            <p className="livey-venue-signup-alert success">
              {submitMessage}
            </p>
          ) : null}

          <button
            className="livey-venue-signup-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : "Submit for approval"}
          </button>

          <p className="livey-venue-signup-disclaimer">
            Submitting this form does not publish your
            venue immediately. Livey reviews every venue
            before it appears on the map.
          </p>
        </form>

        <VenueSignupFooter />
      </main>
    </>
  );
}