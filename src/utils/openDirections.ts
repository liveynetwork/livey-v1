type OpenDirectionsInput = {
  latitude: number;
  longitude: number;
  label?: string;
};

export function openDirections({
  latitude,
  longitude,
  label = "Destination",
}: OpenDirectionsInput) {
  const encodedLabel = encodeURIComponent(label);

  const isAppleDevice =
    /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) &&
    "ontouchend" in document;

  const appleMapsUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodedLabel}`;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=&travelmode=driving`;

  window.open(isAppleDevice ? appleMapsUrl : googleMapsUrl, "_blank");
}