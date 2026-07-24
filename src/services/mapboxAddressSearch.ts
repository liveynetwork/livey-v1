import type { VenueRequestCity } from "./venueRequests";

const MAPBOX_FORWARD_GEOCODING_URL =
  "https://api.mapbox.com/search/geocode/v6/forward";

const CITY_PROXIMITY: Record<VenueRequestCity, [number, number]> = {
  Limassol: [33.0472, 34.6786],
  Nicosia: [33.3823, 35.1856],
  Larnaca: [33.6233, 34.9167],
  Paphos: [32.4297, 34.772],
  Famagusta: [33.9389, 35.1174],
  Kyrenia: [33.3192, 35.3417],
};

type MapboxContextElement = {
  id?: string;
  name?: string;
  name_preferred?: string;
};

type MapboxFeatureContext = {
  address?: MapboxContextElement;
  street?: MapboxContextElement;
  neighborhood?: MapboxContextElement;
  locality?: MapboxContextElement;
  place?: MapboxContextElement;
  district?: MapboxContextElement;
  region?: MapboxContextElement;
  postcode?: MapboxContextElement;
  country?: MapboxContextElement;
};

type MapboxFeatureProperties = {
  mapbox_id?: string;
  feature_type?: string;
  name?: string;
  name_preferred?: string;
  full_address?: string;
  place_formatted?: string;
  context?: MapboxFeatureContext;
  coordinates?: {
    longitude?: number;
    latitude?: number;
    accuracy?: string;
  };
};

type MapboxFeature = {
  id?: string;
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: [number, number];
  };
  properties?: MapboxFeatureProperties;
};

type MapboxForwardResponse = {
  type?: string;
  features?: MapboxFeature[];
  attribution?: string;
};

export type VenueAddressSuggestion = {
  id: string;
  title: string;
  subtitle: string;
  fullAddress: string;
  area: string;
  city: VenueRequestCity | null;
  latitude: number | null;
  longitude: number | null;
};

type SearchVenueAddressesOptions = {
  query: string;
  city: VenueRequestCity;
  signal?: AbortSignal;
};

function getContextName(element?: MapboxContextElement) {
  return (
    element?.name_preferred?.trim() ||
    element?.name?.trim() ||
    ""
  );
}

function normalizeLocationName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchSupportedCity(
  ...possibleNames: Array<string | undefined>
): VenueRequestCity | null {
  const aliases: Record<string, VenueRequestCity> = {
    limassol: "Limassol",
    lemesos: "Limassol",

    nicosia: "Nicosia",
    lefkosia: "Nicosia",

    larnaca: "Larnaca",
    larnaka: "Larnaca",

    paphos: "Paphos",
    pafos: "Paphos",

    famagusta: "Famagusta",
    ammochostos: "Famagusta",

    kyrenia: "Kyrenia",
    keryneia: "Kyrenia",
    girne: "Kyrenia",
  };

  for (const possibleName of possibleNames) {
    if (!possibleName) {
      continue;
    }

    const normalizedName = normalizeLocationName(possibleName);

    if (aliases[normalizedName]) {
      return aliases[normalizedName];
    }

    for (const [alias, city] of Object.entries(aliases)) {
      if (
        normalizedName.includes(alias) ||
        alias.includes(normalizedName)
      ) {
        return city;
      }
    }
  }

  return null;
}

function buildArea(
  context: MapboxFeatureContext | undefined,
  matchedCity: VenueRequestCity | null
) {
  if (!context) {
    return "";
  }

  const candidates = [
    getContextName(context.neighborhood),
    getContextName(context.locality),
    getContextName(context.district),
  ].filter(Boolean);

  const area = candidates.find((candidate) => {
    const candidateCity = matchSupportedCity(candidate);

    return !candidateCity || candidateCity !== matchedCity;
  });

  return area ?? "";
}

function createSuggestion(
  feature: MapboxFeature,
  index: number
): VenueAddressSuggestion | null {
  const properties = feature.properties;
  const context = properties?.context;

  if (!properties) {
    return null;
  }

  const title =
    properties.name_preferred?.trim() ||
    properties.name?.trim() ||
    getContextName(context?.address) ||
    getContextName(context?.street);

  const fullAddress =
    properties.full_address?.trim() ||
    [title, properties.place_formatted?.trim()]
      .filter(Boolean)
      .join(", ");

  if (!title || !fullAddress) {
    return null;
  }

  const placeName = getContextName(context?.place);
  const localityName = getContextName(context?.locality);
  const districtName = getContextName(context?.district);

  const matchedCity = matchSupportedCity(
    placeName,
    localityName,
    districtName,
    fullAddress
  );

  const area = buildArea(context, matchedCity);

  const geometryCoordinates = feature.geometry?.coordinates;
  const longitude =
    properties.coordinates?.longitude ??
    geometryCoordinates?.[0] ??
    null;
  const latitude =
    properties.coordinates?.latitude ??
    geometryCoordinates?.[1] ??
    null;

  const subtitleParts = [
    area,
    placeName || localityName,
    getContextName(context?.postcode),
  ].filter(
    (value, valueIndex, values) =>
      Boolean(value) && values.indexOf(value) === valueIndex
  );

  return {
    id:
      properties.mapbox_id ||
      feature.id ||
      `${fullAddress}-${index}`,
    title,
    subtitle:
      subtitleParts.join(" • ") ||
      properties.place_formatted?.trim() ||
      fullAddress,
    fullAddress,
    area,
    city: matchedCity,
    latitude:
      typeof latitude === "number" ? latitude : null,
    longitude:
      typeof longitude === "number" ? longitude : null,
  };
}

export async function searchVenueAddresses({
  query,
  city,
  signal,
}: SearchVenueAddressesOptions): Promise<VenueAddressSuggestion[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 3) {
    return [];
  }

  const accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

  if (!accessToken) {
    throw new Error("Missing VITE_MAPBOX_TOKEN.");
  }

  const [longitude, latitude] = CITY_PROXIMITY[city];

  const parameters = new URLSearchParams({
    q: `${trimmedQuery}, ${city}, Cyprus`,
    access_token: accessToken,
    country: "cy",
    language: "en",
    autocomplete: "true",
    permanent: "true",
    limit: "6",
    types: "address,street",
    proximity: `${longitude},${latitude}`,
  });

  const response = await fetch(
    `${MAPBOX_FORWARD_GEOCODING_URL}?${parameters.toString()}`,
    {
      method: "GET",
      signal,
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Mapbox address search failed with status ${response.status}.`
    );
  }

  const data = (await response.json()) as MapboxForwardResponse;

  return (data.features ?? [])
    .map(createSuggestion)
    .filter(
      (
        suggestion
      ): suggestion is VenueAddressSuggestion => suggestion !== null
    );
}