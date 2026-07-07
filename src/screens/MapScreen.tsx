import { LiveyMap } from "../components/LiveyMap";

type MapScreenProps = {
  onVenueSheetOpenChange: (isOpen: boolean) => void;
  venueToOpenId: string | null;
  onVenueOpened: () => void;
};

export function MapScreen({
  onVenueSheetOpenChange,
  venueToOpenId,
  onVenueOpened,
}: MapScreenProps) {
  return (
    <LiveyMap
      onVenueSheetOpenChange={onVenueSheetOpenChange}
      venueToOpenId={venueToOpenId}
      onVenueOpened={onVenueOpened}
    />
  );
}