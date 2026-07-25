import { supabase } from "../lib/supabase";
import { extractGoogleMapsCoordinates } from "../utils/googleMapsLink";
import { uploadVenueLogo } from "./venueLogoUpload";

export type VenueRequestCategory =
  | "Cafes"
  | "Restaurants"
  | "Bars"
  | "Clubs"
  | "Activities"
  | "Shopping"
  | "Beauty"
  | "Events";

export type VenueRequestCity =
  | "Limassol"
  | "Nicosia"
  | "Larnaca"
  | "Paphos"
  | "Famagusta"
  | "Kyrenia";

export type VenueRequestLiveStatus =
  | "Live now"
  | "Open now"
  | "Tonight"
  | "Weekend";

export type VenueRequestDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type VenueRequestOpeningHoursDay = {
  day: VenueRequestDay;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
};

export type VenueRequestContactMethod =
  | "Email"
  | "Phone"
  | "Instagram";

type ResolvedLocation = {
  latitude: number | null;
  longitude: number | null;
  locationSource: "manual" | "google_maps_link";
  locationResolutionError: string | null;
};

type ResolveGoogleMapsLinkResponse = {
  success: boolean;
  latitude: number | null;
  longitude: number | null;
  expandedUrl: string | null;
  error: string | null;
};

type SendVenueRequestEmailResponse = {
  success: boolean;
  venueEmailId: string | null;
  internalEmailId: string | null;
  error?: string;
};

export type SubmitVenueRequestInput = {
  venueName: string;
  category: VenueRequestCategory;
  description: string;
  logoFile: File | null;

  city: VenueRequestCity;
  area: string;
  address: string;
  googleMapsUrl: string;

  contactName: string;
  contactEmail: string;
  contactPhone: string;
  instagramUrl: string;
  websiteUrl: string;
  bestContactMethod: VenueRequestContactMethod;
  submitterConfirmedAccuracy: boolean;

  openingHoursSchedule: VenueRequestOpeningHoursDay[];

  /*
   * Legacy compatibility values retained for the current database columns,
   * email flow, Make.com scenario, Google Sheet, and approval workflow.
   */
  weekdayOpenTime: string;
  weekdayCloseTime: string;
  weekendOpenTime: string;
  weekendCloseTime: string;
  closedDays: VenueRequestDay[];

  openStatus: VenueRequestLiveStatus;

  firstEventTitle: string;
  firstEventDescription: string;
  firstEventStatus: VenueRequestLiveStatus;
  firstEventDisplayTime: string;
  firstEventStartsAt: string;
  firstEventEndsAt: string;
};

type LegacyOpeningHours = {
  weekdayOpenTime: string;
  weekdayCloseTime: string;
  weekendOpenTime: string;
  weekendCloseTime: string;
  closedDays: VenueRequestDay[];
};

function cleanOptional(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function formatOpeningHours(input: SubmitVenueRequestInput) {
  if (input.openingHoursSchedule.length > 0) {
    return input.openingHoursSchedule
      .map((day) => {
        if (day.isClosed) {
          return `${day.day}: Closed`;
        }

        return `${day.day}: ${day.openTime}–${day.closeTime}`;
      })
      .join(" • ");
  }

  const weekdayHours =
    input.weekdayOpenTime && input.weekdayCloseTime
      ? `Weekdays ${input.weekdayOpenTime}–${input.weekdayCloseTime}`
      : null;

  const weekendHours =
    input.weekendOpenTime && input.weekendCloseTime
      ? `Weekends ${input.weekendOpenTime}–${input.weekendCloseTime}`
      : null;

  const closedDays =
    input.closedDays.length > 0
      ? `Closed: ${input.closedDays.join(", ")}`
      : null;

  return [weekdayHours, weekendHours, closedDays]
    .filter(Boolean)
    .join(" • ");
}

function deriveLegacyOpeningHours(
  input: SubmitVenueRequestInput
): LegacyOpeningHours {
  if (input.openingHoursSchedule.length === 0) {
    return {
      weekdayOpenTime: input.weekdayOpenTime,
      weekdayCloseTime: input.weekdayCloseTime,
      weekendOpenTime: input.weekendOpenTime,
      weekendCloseTime: input.weekendCloseTime,
      closedDays: input.closedDays,
    };
  }

  const weekdayDays = input.openingHoursSchedule.filter(
    (day) =>
      day.day === "Monday" ||
      day.day === "Tuesday" ||
      day.day === "Wednesday" ||
      day.day === "Thursday" ||
      day.day === "Friday"
  );

  const weekendDays = input.openingHoursSchedule.filter(
    (day) =>
      day.day === "Saturday" ||
      day.day === "Sunday"
  );

  const firstOpenWeekday = weekdayDays.find(
    (day) => !day.isClosed
  );

  const firstOpenWeekend = weekendDays.find(
    (day) => !day.isClosed
  );

  return {
    weekdayOpenTime:
      firstOpenWeekday?.openTime ??
      input.weekdayOpenTime,

    weekdayCloseTime:
      firstOpenWeekday?.closeTime ??
      input.weekdayCloseTime,

    weekendOpenTime:
      firstOpenWeekend?.openTime ??
      input.weekendOpenTime,

    weekendCloseTime:
      firstOpenWeekend?.closeTime ??
      input.weekendCloseTime,

    closedDays: input.openingHoursSchedule
      .filter((day) => day.isClosed)
      .map((day) => day.day),
  };
}

async function resolveVenueLocation(
  googleMapsUrl: string
): Promise<ResolvedLocation> {
  const trimmedGoogleMapsUrl = googleMapsUrl.trim();

  if (!trimmedGoogleMapsUrl) {
    return {
      latitude: null,
      longitude: null,
      locationSource: "manual",
      locationResolutionError: null,
    };
  }

  const localCoordinates =
    extractGoogleMapsCoordinates(trimmedGoogleMapsUrl);

  if (localCoordinates) {
    return {
      latitude: localCoordinates.latitude,
      longitude: localCoordinates.longitude,
      locationSource: "google_maps_link",
      locationResolutionError: null,
    };
  }

  try {
    const { data, error } =
      await supabase.functions.invoke<ResolveGoogleMapsLinkResponse>(
        "resolve-google-maps-link",
        {
          body: {
            googleMapsUrl: trimmedGoogleMapsUrl,
          },
        }
      );

    if (error) {
      console.warn(
        "Google Maps link resolver failed:",
        error
      );

      return {
        latitude: null,
        longitude: null,
        locationSource: "manual",
        locationResolutionError:
          "Could not resolve Google Maps share link. Manual verification is required.",
      };
    }

    if (
      data?.success &&
      data.latitude !== null &&
      data.longitude !== null
    ) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        locationSource: "google_maps_link",
        locationResolutionError: null,
      };
    }

    return {
      latitude: null,
      longitude: null,
      locationSource: "manual",
      locationResolutionError:
        data?.error ??
        "Could not extract coordinates from Google Maps link. Manual verification is required.",
    };
  } catch (error) {
    console.warn(
      "Google Maps link resolver crashed:",
      error
    );

    return {
      latitude: null,
      longitude: null,
      locationSource: "manual",
      locationResolutionError:
        "Could not resolve Google Maps link. Manual verification is required.",
    };
  }
}

async function sendVenueRequestEmails({
  input,
  openingHours,
  resolvedLocation,
}: {
  input: SubmitVenueRequestInput;
  openingHours: string;
  resolvedLocation: ResolvedLocation;
}) {
  const hasFirstEvent =
    input.firstEventTitle.trim().length > 0;

  try {
    const { data, error } =
      await supabase.functions.invoke<SendVenueRequestEmailResponse>(
        "send-venue-request-email",
        {
          body: {
            venueName: input.venueName.trim(),
            category: input.category,
            city: input.city,
            area: cleanOptional(input.area),
            address: input.address.trim(),
            googleMapsUrl: cleanOptional(input.googleMapsUrl),

            contactName: input.contactName.trim(),
            contactEmail: input.contactEmail
              .trim()
              .toLowerCase(),
            contactPhone: cleanOptional(input.contactPhone),
            instagramUrl: cleanOptional(input.instagramUrl),
            websiteUrl: cleanOptional(input.websiteUrl),
            bestContactMethod: input.bestContactMethod,

            latitude: resolvedLocation.latitude,
            longitude: resolvedLocation.longitude,
            locationSource: resolvedLocation.locationSource,
            locationResolutionError:
              resolvedLocation.locationResolutionError,

            openingHours: cleanOptional(openingHours),
            openingHoursSchedule:
              input.openingHoursSchedule,
            openStatus: input.openStatus,

            firstEventTitle: hasFirstEvent
              ? input.firstEventTitle.trim()
              : null,

            firstEventDescription: hasFirstEvent
              ? cleanOptional(input.firstEventDescription)
              : null,

            firstEventStatus: hasFirstEvent
              ? input.firstEventStatus
              : null,

            firstEventDisplayTime: hasFirstEvent
              ? cleanOptional(input.firstEventDisplayTime)
              : null,

            firstEventStartsAt: hasFirstEvent
              ? cleanOptional(input.firstEventStartsAt)
              : null,

            firstEventEndsAt: hasFirstEvent
              ? cleanOptional(input.firstEventEndsAt)
              : null,
          },
        }
      );

    if (error) {
      console.warn(
        "Venue request email function failed:",
        error
      );
      return;
    }

    if (!data?.success) {
      console.warn(
        "Venue request email was not sent:",
        data?.error
      );
    }
  } catch (error) {
    console.warn(
      "Venue request email request crashed:",
      error
    );
  }
}

export async function submitVenueRequest(
  input: SubmitVenueRequestInput
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasFirstEvent =
    input.firstEventTitle.trim().length > 0;

  const openingHours = formatOpeningHours(input);

  const legacyOpeningHours =
    deriveLegacyOpeningHours(input);

  const resolvedLocation =
    await resolveVenueLocation(input.googleMapsUrl);

  const logoUrl = input.logoFile
    ? await uploadVenueLogo(input.logoFile)
    : null;

  const { error } = await supabase
    .from("venue_requests")
    .insert({
      owner_user_id: user?.id ?? null,

      venue_name: input.venueName.trim(),
      category: input.category,
      description: cleanOptional(input.description),
      logo_url: logoUrl,

      city: input.city,
      area: cleanOptional(input.area),
      address: input.address.trim(),
      google_maps_url: cleanOptional(
        input.googleMapsUrl
      ),
      latitude: resolvedLocation.latitude,
      longitude: resolvedLocation.longitude,
      location_source: resolvedLocation.locationSource,
      location_verified: false,
      location_resolution_error:
        resolvedLocation.locationResolutionError,

      contact_name: input.contactName.trim(),
      contact_email: input.contactEmail
        .trim()
        .toLowerCase(),
      contact_phone: cleanOptional(
        input.contactPhone
      ),
      instagram_url: cleanOptional(
        input.instagramUrl
      ),
      website_url: cleanOptional(
        input.websiteUrl
      ),
      best_contact_method:
        input.bestContactMethod,
      submitter_confirmed_accuracy:
        input.submitterConfirmedAccuracy,

      opening_hours_schedule:
        input.openingHoursSchedule,

      weekday_open_time: cleanOptional(
        legacyOpeningHours.weekdayOpenTime
      ),
      weekday_close_time: cleanOptional(
        legacyOpeningHours.weekdayCloseTime
      ),
      weekend_open_time: cleanOptional(
        legacyOpeningHours.weekendOpenTime
      ),
      weekend_close_time: cleanOptional(
        legacyOpeningHours.weekendCloseTime
      ),
      closed_days:
        legacyOpeningHours.closedDays,
      opening_hours: cleanOptional(
        openingHours
      ),
      open_status: input.openStatus,

      first_event_title: hasFirstEvent
        ? input.firstEventTitle.trim()
        : null,

      first_event_description: hasFirstEvent
        ? cleanOptional(
            input.firstEventDescription
          )
        : null,

      first_event_status: hasFirstEvent
        ? input.firstEventStatus
        : null,

      first_event_display_time: hasFirstEvent
        ? cleanOptional(
            input.firstEventDisplayTime
          )
        : null,

      first_event_starts_at: hasFirstEvent
        ? cleanOptional(
            input.firstEventStartsAt
          )
        : null,

      first_event_ends_at: hasFirstEvent
        ? cleanOptional(
            input.firstEventEndsAt
          )
        : null,

      status: "pending",
    });

  if (error) {
    console.error(
      "Failed to submit venue request:",
      error
    );

    throw new Error(
      "Could not submit your venue request. Please try again."
    );
  }

  await sendVenueRequestEmails({
    input,
    openingHours,
    resolvedLocation,
  });
}