import type {
  VenueRequestCategory,
  VenueRequestCity,
  VenueRequestContactMethod,
  VenueRequestDay,
  VenueRequestLiveStatus,
} from "../services/venueRequests";

export type LocationPreviewState =
  | "idle"
  | "detected"
  | "checking"
  | "resolved"
  | "manual";

export type ResolveGoogleMapsLinkResponse = {
  success: boolean;
  latitude: number | null;
  longitude: number | null;
  expandedUrl: string | null;
  error: string | null;
};

export type VenueSignupFormState = {
  venueName: string;
  category: VenueRequestCategory;
  description: string;

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

export type UpdateVenueSignupField = <
  Key extends keyof VenueSignupFormState,
>(
  key: Key,
  value: VenueSignupFormState[Key]
) => void;