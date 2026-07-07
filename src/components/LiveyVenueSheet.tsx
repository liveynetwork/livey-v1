import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { LiveyVenue } from "./liveyVenues";
import { openDirections } from "../utils/openDirections";
import {
  checkVenueFollowed,
  followVenue,
  unfollowVenue,
} from "../services/profile";

type LiveyVenueSheetProps = {
  venue: LiveyVenue;
  driveTime: string;
  walkTime: string;
  distanceKm?: string;
  onClose: () => void;
  onViewDetails: () => void;
};

export function LiveyVenueSheet({
  venue,
  driveTime,
  walkTime,
  distanceKm,
  onClose,
  onViewDetails,
}: LiveyVenueSheetProps) {
  const dragStartYRef = useRef(0);
  const latestDragOffsetRef = useRef(0);

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    dragStartYRef.current = event.clientY;
    latestDragOffsetRef.current = 0;

    setDragOffset(0);
    setIsDragging(true);

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  async function handleFollowToggle() {
  if (followBusy) return;

  setFollowBusy(true);

  try {
    if (isFollowed) {
      await unfollowVenue(venue.id);
      setIsFollowed(false);
      window.dispatchEvent(new Event("livey:venue-follows-changed"));
      return;
    }

    const follow = await followVenue(venue.id);

    if (follow) {
      setIsFollowed(true);
      window.dispatchEvent(new Event("livey:venue-follows-changed"));
    }
  } catch (error) {
    console.error("Failed to update venue follow:", error);
  } finally {
    setFollowBusy(false);
  }
}

  useEffect(() => {
  let isMounted = true;

  async function loadFollowState() {
    setIsFollowed(false);
    setFollowBusy(false);

    try {
      const followed = await checkVenueFollowed(venue.id);

      if (isMounted) {
        setIsFollowed(followed);
      }
    } catch (error) {
      console.error("Failed to check venue follow state:", error);
    }
  }

  loadFollowState();

  return () => {
    isMounted = false;
  };
}, [venue.id]);

  useEffect(() => {
    if (!isDragging) return;

    function handlePointerMove(event: globalThis.PointerEvent) {
      const nextOffset = Math.max(0, event.clientY - dragStartYRef.current);

      latestDragOffsetRef.current = nextOffset;
      setDragOffset(nextOffset);
    }

    function handlePointerUp() {
      const shouldClose = latestDragOffsetRef.current > 90;

      setIsDragging(false);
      setDragOffset(0);
      latestDragOffsetRef.current = 0;

      if (shouldClose) {
        onClose();
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDragging, onClose]);

  return (
    <section
      className={
        isDragging
          ? "livey-venue-sheet livey-venue-sheet-dragging"
          : "livey-venue-sheet"
      }
      aria-label={venue.name}
      style={
        dragOffset > 0
          ? { transform: `translateY(${dragOffset}px)` }
          : undefined
      }
    >
      <button
        type="button"
        className="livey-sheet-handle-button"
        aria-label="Drag down to close venue details"
        onPointerDown={handlePointerDown}
      >
        <span className="livey-sheet-handle" />
      </button>

      <div className="livey-sheet-identity">
        <img src={venue.logoUrl} alt={venue.name} className="livey-sheet-logo" />

        <div className="livey-sheet-heading">
          <div className="livey-sheet-title-row">
            <h2>{venue.name}</h2>

            {venue.verified && (
              <span className="livey-verified-badge">Verified</span>
            )}
          </div>

          <p className="livey-sheet-meta">
            {venue.category} · {venue.area}
          </p>
        </div>
      </div>

      <div className="livey-travel-row" aria-label="Travel time">
        <div className="livey-travel-pill">
          <span className="livey-travel-icon">🚗</span>
          <span>{driveTime}</span>
        </div>

        <div className="livey-travel-pill">
          <span className="livey-travel-icon">🚶</span>
          <span>{walkTime}</span>
        </div>

        {distanceKm && (
          <div className="livey-distance-pill">
            <span>{distanceKm} away</span>
          </div>
        )}
      </div>

      <div className="livey-moment-card">
        {venue.status === "Live now" && (
          <div className="livey-moment-top">
            <span className="livey-status-pill livey-status-pill-live">
              Live now
            </span>
          </div>
        )}

        <h3>{venue.eventTitle}</h3>
        <p>{venue.description}</p>
      </div>

      <div className="livey-hours-row">
        <span>{venue.openStatus}</span>
        <strong>{venue.openingHours}</strong>
      </div>

      <div className="livey-sheet-actions">
        <button
          type="button"
          className="livey-primary-action"
          onClick={() =>
            openDirections({
              latitude: venue.coordinates[1],
              longitude: venue.coordinates[0],
              label: venue.name,
            })
          }
        >
          Directions
        </button>

        <button
  type="button"
  className={[
    "livey-secondary-action",
    isFollowed ? "livey-secondary-action-following" : "",
  ]
    .filter(Boolean)
    .join(" ")}
  onClick={handleFollowToggle}
  disabled={followBusy}
  aria-pressed={isFollowed}
>
{isFollowed ? "Following" : "Follow"}</button>

<button
  type="button"
  className="livey-details-action"
  onClick={onViewDetails}
>
  View details
</button>
      </div>
    </section>
  );
}