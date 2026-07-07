export type LiveyVenueStatus = "Live now" | "Open now" | "Tonight" | "Weekend";

export type LiveyVenueCategory =
  | "Cafes"
  | "Restaurants"
  | "Bars"
  | "Clubs"
  | "Activities"
  | "Shopping"
  | "Beauty"
  | "Events";

export type LiveyVenue = {
  id: string;
  name: string;
  category: LiveyVenueCategory;
  area: string;
  status: LiveyVenueStatus;
  eventTitle: string;
  time: string;
  description: string;
  verified: boolean;
  coordinates: [number, number];
  logoUrl: string;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
  mediaLabel?: string | null;
  driveTime: string;
  walkTime: string;
  openStatus: string;
  openingHours: string;
};

export const liveyVenues: LiveyVenue[] = [];