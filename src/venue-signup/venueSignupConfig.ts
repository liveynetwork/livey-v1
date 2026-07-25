import type {
  VenueRequestCategory,
  VenueRequestCity,
  VenueRequestContactMethod,
  VenueRequestDay,
  VenueRequestLiveStatus,
} from "../services/venueRequests";
import type {
  VenueOpeningHoursDay,
  VenueSignupFormState,
} from "./venueSignupTypes";

export const categories: VenueRequestCategory[] = [
  "Cafes",
  "Restaurants",
  "Bars",
  "Clubs",
  "Activities",
  "Shopping",
  "Beauty",
  "Events",
];

export const cities: VenueRequestCity[] = [
  "Limassol",
  "Nicosia",
  "Larnaca",
  "Paphos",
  "Famagusta",
  "Kyrenia",
];

export const liveStatuses: VenueRequestLiveStatus[] = [
  "Open now",
  "Live now",
  "Tonight",
  "Weekend",
];

export const contactMethods: VenueRequestContactMethod[] = [
  "Email",
  "Phone",
  "Instagram",
];

export const days: VenueRequestDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const openingStatusOptions = [
  "Open",
  "Closed",
];

export const timeOptions = [
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

export const initialOpeningHoursSchedule: VenueOpeningHoursDay[] = [
  {
    day: "Monday",
    isClosed: false,
    openTime: "09:00",
    closeTime: "18:00",
  },
  {
    day: "Tuesday",
    isClosed: false,
    openTime: "09:00",
    closeTime: "18:00",
  },
  {
    day: "Wednesday",
    isClosed: false,
    openTime: "09:00",
    closeTime: "18:00",
  },
  {
    day: "Thursday",
    isClosed: false,
    openTime: "09:00",
    closeTime: "18:00",
  },
  {
    day: "Friday",
    isClosed: false,
    openTime: "09:00",
    closeTime: "18:00",
  },
  {
    day: "Saturday",
    isClosed: false,
    openTime: "10:00",
    closeTime: "22:00",
  },
  {
    day: "Sunday",
    isClosed: false,
    openTime: "10:00",
    closeTime: "22:00",
  },
];

export function createInitialVenueSignupForm(): VenueSignupFormState {
  return {
    venueName: "",
    category: "Restaurants",
    description: "",

    city: "Limassol",
    area: "",
    address: "",
    googleMapsUrl: "",

    contactName: "",
    contactEmail: "",
    contactPhone: "",
    instagramUrl: "",
    websiteUrl: "",
    bestContactMethod: "Email",
    submitterConfirmedAccuracy: false,

    openingHoursSchedule: initialOpeningHoursSchedule.map((day) => ({
      ...day,
    })),

    weekdayOpenTime: "09:00",
    weekdayCloseTime: "18:00",
    weekendOpenTime: "10:00",
    weekendCloseTime: "22:00",
    closedDays: [],
    openStatus: "Open now",

    firstEventTitle: "",
    firstEventDescription: "",
    firstEventStatus: "Tonight",
    firstEventDisplayTime: "",
    firstEventStartsAt: "",
    firstEventEndsAt: "",
  };
}

export const initialForm: VenueSignupFormState =
  createInitialVenueSignupForm();