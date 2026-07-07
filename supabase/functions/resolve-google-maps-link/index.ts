type GoogleMapsCoordinates = {
  latitude: number;
  longitude: number;
};

type CoordinateOrder = "lat-lng" | "lng-lat";

type CoordinatePattern = {
  pattern: RegExp;
  order: CoordinateOrder;
};

type ResolveGoogleMapsLinkResponse = {
  success: boolean;
  latitude: number | null;
  longitude: number | null;
  expandedUrl: string | null;
  error: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: ResolveGoogleMapsLinkResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

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

function toCoordinates(
  latitudeText: string,
  longitudeText: string
): GoogleMapsCoordinates | null {
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

function extractGoogleMapsCoordinates(
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

function isAllowedGoogleMapsUrl(urlText: string) {
  try {
    const url = new URL(urlText);
    const hostname = url.hostname.toLowerCase();

    return (
      hostname === "maps.app.goo.gl" ||
      hostname === "goo.gl" ||
      hostname === "google.com" ||
      hostname === "www.google.com" ||
      hostname === "maps.google.com"
    );
  } catch {
    return false;
  }
}

async function expandGoogleMapsUrl(urlText: string) {
  const response = await fetch(urlText, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; LiveyLocationResolver/1.0; +https://livey.network)",
    },
  });

  return response.url || urlText;
}

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          latitude: null,
          longitude: null,
          expandedUrl: null,
          error: "Method not allowed.",
        },
        405
      );
    }

    try {
      const body = await req.json().catch(() => null);
      const googleMapsUrl =
        typeof body?.googleMapsUrl === "string" ? body.googleMapsUrl.trim() : "";

      if (!googleMapsUrl) {
        return jsonResponse(
          {
            success: false,
            latitude: null,
            longitude: null,
            expandedUrl: null,
            error: "Google Maps URL is required.",
          },
          400
        );
      }

      if (!isAllowedGoogleMapsUrl(googleMapsUrl)) {
        return jsonResponse(
          {
            success: false,
            latitude: null,
            longitude: null,
            expandedUrl: null,
            error: "Only Google Maps links are supported.",
          },
          400
        );
      }

      const directCoordinates = extractGoogleMapsCoordinates(googleMapsUrl);

      if (directCoordinates) {
        return jsonResponse({
          success: true,
          latitude: directCoordinates.latitude,
          longitude: directCoordinates.longitude,
          expandedUrl: googleMapsUrl,
          error: null,
        });
      }

      const expandedUrl = await expandGoogleMapsUrl(googleMapsUrl);
      const expandedCoordinates = extractGoogleMapsCoordinates(expandedUrl);

      if (expandedCoordinates) {
        return jsonResponse({
          success: true,
          latitude: expandedCoordinates.latitude,
          longitude: expandedCoordinates.longitude,
          expandedUrl,
          error: null,
        });
      }

      return jsonResponse({
        success: false,
        latitude: null,
        longitude: null,
        expandedUrl,
        error:
          "Could not extract coordinates from this Google Maps link. Manual verification is required.",
      });
    } catch (error) {
      console.error("Failed to resolve Google Maps link:", error);

      return jsonResponse(
        {
          success: false,
          latitude: null,
          longitude: null,
          expandedUrl: null,
          error: "Could not resolve Google Maps link.",
        },
        500
      );
    }
  },
};