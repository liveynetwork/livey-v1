type Coordinates = {
  latitude: number;
  longitude: number;
};

type TravelTimesInput = {
  from: Coordinates;
  to: Coordinates;
};

type TravelTimes = {
  distanceKm: string;
  driveTime: string;
  walkTime: string;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function formatMinutes(totalMinutes: number) {
  const roundedMinutes = Math.max(1, Math.round(totalMinutes));

  if (roundedMinutes < 60) {
    return `${roundedMinutes} min`;
  }

  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

export function calculateTravelTimes({
  from,
  to,
}: TravelTimesInput): TravelTimes {
  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(to.latitude - from.latitude);
  const longitudeDifference = toRadians(to.longitude - from.longitude);

  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversineValue =
    Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDifference / 2) *
      Math.sin(longitudeDifference / 2);

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  const straightLineDistanceKm = earthRadiusKm * centralAngle;

  const walkingSpeedKmPerHour = 4.8;
  const cityDrivingSpeedKmPerHour = 32;

  const walkingMinutes = (straightLineDistanceKm / walkingSpeedKmPerHour) * 60;

  const drivingMinutes =
    (straightLineDistanceKm / cityDrivingSpeedKmPerHour) * 60 + 3;

  return {
    distanceKm: formatDistance(straightLineDistanceKm),
    driveTime: formatMinutes(drivingMinutes),
    walkTime: formatMinutes(walkingMinutes),
  };
}