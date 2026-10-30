export type RoutePoint = { latitude: number; longitude: number };

// Spherical approximation, retaining the original 6,371 km mean-radius model.
const earthRadiusMetres = 6371000;
const metresPerNauticalMile = 1852;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function isRoutePoint(value: unknown): value is RoutePoint {
  const point = value as Partial<RoutePoint> | null;
  return Boolean(
    point &&
      typeof point.latitude === 'number' &&
      Number.isFinite(point.latitude) &&
      point.latitude >= -90 &&
      point.latitude <= 90 &&
      typeof point.longitude === 'number' &&
      Number.isFinite(point.longitude) &&
      point.longitude >= -180 &&
      point.longitude <= 180,
  );
}

export function directDistanceNm(
  start: RoutePoint,
  end: RoutePoint,
): number | null {
  if (!isRoutePoint(start) || !isRoutePoint(end)) return null;
  const latitudeDelta = radians(end.latitude - start.latitude);
  const longitudeDelta = radians(end.longitude - start.longitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(start.latitude)) *
      Math.cos(radians(end.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  const clamped = Math.max(0, Math.min(1, haversine));
  const angle = 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped));
  return (earthRadiusMetres * angle) / metresPerNauticalMile;
}

export function parseFuelRate(value: string): number | null {
  const input = value.trim();
  if (input.length > 12 || !/^\d+(?:[.,]\d+)?$/.test(input)) return null;
  const rate = Number(input.replace(',', '.'));
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export function estimateFuelLitres(
  distanceNm: number | null,
  rateLitresPerNm: number | null,
): number | null {
  if (
    typeof distanceNm !== 'number' ||
    !Number.isFinite(distanceNm) ||
    distanceNm < 0 ||
    typeof rateLitresPerNm !== 'number' ||
    !Number.isFinite(rateLitresPerNm) ||
    rateLitresPerNm <= 0
  )
    return null;
  const litres = distanceNm * rateLitresPerNm;
  return Number.isFinite(litres) ? litres : null;
}
