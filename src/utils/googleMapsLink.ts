export type GoogleMapsCoordinates = {
  latitude: number;
  longitude: number;
};

type CoordinateOrder = "lat-lng" | "lng-lat";

type CoordinatePattern = {
  pattern: RegExp;
  order: CoordinateOrder;
};

function isValidCoordinate(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function toCoordinates(latitudeText: string, longitudeText: string) {
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);

  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function safelyDecodeInput(input: string) {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

function extractCoordinatesByPattern(
  input: string,
  { pattern, order }: CoordinatePattern
): GoogleMapsCoordinates | null {
  const matches = [...input.matchAll(pattern)];
  let lastValidCoordinates: GoogleMapsCoordinates | null = null;

  for (const match of matches) {
    if (!match?.[1] || !match?.[2]) {
      continue;
    }

    const coordinates =
      order === "lng-lat"
        ? toCoordinates(match[2], match[1])
        : toCoordinates(match[1], match[2]);

    if (coordinates) {
      lastValidCoordinates = coordinates;
    }
  }

  return lastValidCoordinates;
}

export function extractGoogleMapsCoordinates(
  urlText: string
): GoogleMapsCoordinates | null {
  const input = urlText.trim();

  if (!input) {
    return null;
  }

  const decodedInput = safelyDecodeInput(input);

  const coordinatePatterns: CoordinatePattern[] = [
    {
      pattern: /!1d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/g,
      order: "lng-lat",
    },
    {
      pattern: /!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/g,
      order: "lng-lat",
    },
    {
      pattern: /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g,
      order: "lat-lng",
    },
    {
      pattern: /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/g,
      order: "lat-lng",
    },
    {
      pattern: /[?&]ll=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/g,
      order: "lat-lng",
    },
    {
      pattern: /[?&]center=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/g,
      order: "lat-lng",
    },
    {
      pattern: /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/g,
      order: "lat-lng",
    },
  ];

  for (const coordinatePattern of coordinatePatterns) {
    const coordinates = extractCoordinatesByPattern(
      decodedInput,
      coordinatePattern
    );

    if (coordinates) {
      return coordinates;
    }
  }

  return null;
}