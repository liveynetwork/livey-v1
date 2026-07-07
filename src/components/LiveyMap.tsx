import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./LiveyMap.css";
import type { LiveyVenue, LiveyVenueCategory } from "./liveyVenues";
import { fetchLiveyVenues } from "../services/venues";
import { LiveyTopControls } from "./LiveyTopControls";
import { LiveyVenueSheet } from "./LiveyVenueSheet";
import { LiveyVenueDetailsCard } from "./LiveyVenueDetailsCard";

type MapMode = "live" | "all";

type LiveyMapProps = {
  onVenueSheetOpenChange?: (isOpen: boolean) => void;
  venueToOpenId?: string | null;
  onVenueOpened?: () => void;
};

export function LiveyMap({
  onVenueSheetOpenChange,
  venueToOpenId,
  onVenueOpened,
}: LiveyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [venues, setVenues] = useState<LiveyVenue[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<LiveyVenueCategory | "All">("All");
  const [mapMode, setMapMode] = useState<MapMode>("all");
  const [selectedVenue, setSelectedVenue] = useState<LiveyVenue | null>(null);
  const [detailsVenue, setDetailsVenue] = useState<LiveyVenue | null>(null);

  useEffect(() => {
    onVenueSheetOpenChange?.(Boolean(selectedVenue));
  }, [onVenueSheetOpenChange, selectedVenue]);

  useEffect(() => {
    let isMounted = true;

    async function loadVenues() {
      try {
        const supabaseVenues = await fetchLiveyVenues();

        if (!isMounted) return;

        setVenues(supabaseVenues);
      } catch (error) {
        console.warn("Livey could not load venues from Supabase.", error);

        if (isMounted) {
          setVenues([]);
          setSelectedVenue(null);
          setDetailsVenue(null);
        }
      }
    }

    loadVenues();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      const matchesMode = mapMode === "all" || venue.status === "Live now";

      const matchesCategory =
        selectedCategory === "All" || venue.category === selectedCategory;

      const search = searchValue.trim().toLowerCase();

      const matchesSearch =
        search.length === 0 ||
        venue.name.toLowerCase().includes(search) ||
        venue.area.toLowerCase().includes(search) ||
        venue.category.toLowerCase().includes(search) ||
        venue.eventTitle.toLowerCase().includes(search);

      return matchesMode && matchesCategory && matchesSearch;
    });
  }, [mapMode, searchValue, selectedCategory, venues]);

  const selectedVenueTravel = useMemo(() => {
    if (!selectedVenue) return null;

    return {
      driveTime: selectedVenue.driveTime,
      walkTime: selectedVenue.walkTime,
      distanceKm: undefined,
    };
  }, [selectedVenue]);

  const detailsVenueTravel = useMemo(() => {
    if (!detailsVenue) return null;

    return {
      driveTime: detailsVenue.driveTime,
      walkTime: detailsVenue.walkTime,
      distanceKm: undefined,
    };
  }, [detailsVenue]);

  useEffect(() => {
    if (!venueToOpenId) return;

    const venueToOpen = venues.find((venue) => venue.id === venueToOpenId);

    if (!venueToOpen) return;

    setSelectedVenue(venueToOpen);
    setDetailsVenue(null);
    setSearchValue("");
    setSelectedCategory("All");
    setMapMode("all");

    const map = mapRef.current;

    if (map) {
      map.flyTo({
        center: venueToOpen.coordinates,
        zoom: Math.max(map.getZoom(), 13.5),
        pitch: 0,
        bearing: 0,
        speed: 0.9,
        curve: 1.15,
        essential: true,
      });
    }

    onVenueOpened?.();
  }, [onVenueOpened, venueToOpenId, venues]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const liveyMapStyleUrl = import.meta.env.VITE_MAPBOX_STYLE_URL;
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

    if (!liveyMapStyleUrl || !mapboxToken) {
      console.warn("Missing Mapbox environment variables.");
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: liveyMapStyleUrl,
      center: [33.0472, 34.6786],
      zoom: 12.4,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      language: "en",
    });

    map.on("click", () => {
      setSelectedVenue(null);
      setDetailsVenue(null);
    });

    map.on("style.load", () => {
      try {
        map.setConfigProperty("basemap", "language", "en");
      } catch (error) {
        console.warn("Could not force Mapbox basemap language.", error);
      }
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    filteredVenues.forEach((venue) => {
      const markerElement = document.createElement("button");

      markerElement.type = "button";
      markerElement.className = [
        "livey-venue-marker",
        venue.status === "Live now" ? "livey-venue-marker-live" : "",
        selectedVenue?.id === venue.id ? "livey-venue-marker-selected" : "",
      ]
        .filter(Boolean)
        .join(" ");

      markerElement.setAttribute("aria-label", venue.name);

      const logo = document.createElement("img");
      logo.src = venue.logoUrl;
      logo.alt = venue.name;

      logo.onerror = () => {
        logo.style.display = "none";
        markerElement.textContent = venue.name.charAt(0);
        markerElement.classList.add("livey-venue-marker-fallback");
      };

      markerElement.appendChild(logo);

      markerElement.addEventListener("click", (event) => {
        event.stopPropagation();

        setSelectedVenue(venue);
        setDetailsVenue(null);

        map.flyTo({
          center: venue.coordinates,
          zoom: Math.max(map.getZoom(), 13.5),
          pitch: 0,
          bearing: 0,
          speed: 0.9,
          curve: 1.15,
          essential: true,
        });
      });

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat(venue.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });

    if (
      selectedVenue &&
      !filteredVenues.some((venue) => venue.id === selectedVenue.id)
    ) {
      setSelectedVenue(null);
      setDetailsVenue(null);
    }
  }, [filteredVenues, selectedVenue]);

  return (
    <main className="livey-map-screen">
      <div ref={mapContainerRef} className="livey-map" />

      <LiveyTopControls
        searchValue={searchValue}
        selectedCategory={selectedCategory}
        mapMode={mapMode}
        onSearchChange={setSearchValue}
        onCategoryChange={setSelectedCategory}
        onMapModeChange={setMapMode}
      />

      {selectedVenue && selectedVenueTravel && (
        <LiveyVenueSheet
          venue={selectedVenue}
          driveTime={selectedVenueTravel.driveTime}
          walkTime={selectedVenueTravel.walkTime}
          distanceKm={selectedVenueTravel.distanceKm}
          onClose={() => {
            setSelectedVenue(null);
            setDetailsVenue(null);
          }}
          onViewDetails={() => setDetailsVenue(selectedVenue)}
        />
      )}

      {detailsVenue && detailsVenueTravel && (
        <LiveyVenueDetailsCard
          venue={detailsVenue}
          driveTime={detailsVenueTravel.driveTime}
          walkTime={detailsVenueTravel.walkTime}
          distanceKm={detailsVenueTravel.distanceKm}
          onClose={() => setDetailsVenue(null)}
        />
      )}
    </main>
  );
}