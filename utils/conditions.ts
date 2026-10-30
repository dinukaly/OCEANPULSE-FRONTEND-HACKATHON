export type Coordinates = { latitude: number; longitude: number };
type Source = { name: string; url: string; attribution: string };
export type WeatherConditions = {
  kind: 'current-weather'; requestedLocation: { city: string } | Coordinates;
  location: Coordinates & { name: string | null; country: string | null; utcOffsetSeconds: number | null };
  source: Source; fetchedAt: string; dataTime: string | null; staleAfter: string | null; available: boolean;
  units: { temperature: '°C'; windSpeed: 'm/s'; humidity: '%'; cloudCover: '%' };
  temperatureC: number | null; humidityPercent: number | null; cloudCoverPercent: number | null;
  windSpeedMps: number | null; description: string | null; icon: string | null;
};
export type WaveEntry = { time: string; waveHeightM: number | null };
export type MarineConditions = {
  kind: 'marine-forecast'; requestedLocation: Coordinates; location: Coordinates; source: Source;
  units: { waveHeight: 'm'; time: 'UTC' }; fetchedAt: string; refreshAfter: string;
  modelIssuedAt: null; available: boolean; validFrom: string | null; validTo: string | null; hourly: WaveEntry[];
};

export const validCoordinates = (value: any): value is Coordinates =>
  typeof value?.latitude === 'number' && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90 &&
  typeof value?.longitude === 'number' && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;
const instant = (value: any) => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
const nullableNumber = (value: any, min = -Infinity, max = Infinity) => value === null ||
  (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max);
const sourceValid = (value: any) => typeof value?.name === 'string' && typeof value.url === 'string' && typeof value.attribution === 'string';
const nullableText = (value: any) => value === null || typeof value === 'string';

export const readWeather = (response: any): WeatherConditions => {
  const data = response?.data;
  if (!response?.success || data?.kind !== 'current-weather' || !validCoordinates(data.location) ||
      !sourceValid(data.source) || !instant(data.fetchedAt) || typeof data.available !== 'boolean' ||
      (data.dataTime !== null && !instant(data.dataTime)) || (data.staleAfter !== null && !instant(data.staleAfter)) ||
      !nullableNumber(data.temperatureC) || !nullableNumber(data.humidityPercent, 0, 100) ||
      !nullableNumber(data.cloudCoverPercent, 0, 100) || !nullableNumber(data.windSpeedMps, 0) ||
      data.units?.temperature !== '°C' || data.units?.windSpeed !== 'm/s' ||
      data.units?.humidity !== '%' || data.units?.cloudCover !== '%' ||
      !nullableText(data.location.name) || !nullableText(data.location.country) || !nullableText(data.description) ||
      !(data.icon === null || (typeof data.icon === 'string' && /^\d{2}[dn]$/.test(data.icon))) ||
      !nullableNumber(data.location.utcOffsetSeconds, -86400, 86400) ||
      !(validCoordinates(data.requestedLocation) || typeof data.requestedLocation?.city === 'string')) throw new Error('Weather data is unavailable or invalid');
  return data;
};

export const readMarine = (response: any): MarineConditions => {
  const data = response?.data;
  if (!response?.success || data?.kind !== 'marine-forecast' || !validCoordinates(data.location) ||
      !validCoordinates(data.requestedLocation) || !sourceValid(data.source) || !instant(data.fetchedAt) ||
      !instant(data.refreshAfter) || data.modelIssuedAt !== null || typeof data.available !== 'boolean' ||
      data.units?.waveHeight !== 'm' || data.units?.time !== 'UTC' || !Array.isArray(data.hourly) || data.hourly.length > 192 ||
      data.hourly.some((entry: any, index: number) => !instant(entry?.time) || !nullableNumber(entry.waveHeightM, 0) ||
        (index && Date.parse(entry.time) - Date.parse(data.hourly[index - 1].time) !== 3_600_000)) ||
      (data.validFrom !== null && !instant(data.validFrom)) || (data.validTo !== null && !instant(data.validTo))) {
    throw new Error('Marine forecast is unavailable or invalid');
  }
  return data;
};

export const weatherFreshness = (data: WeatherConditions, now: number): 'unknown' | 'stale' | 'recent' => {
  if (!data.dataTime || !data.staleAfter || Date.parse(data.dataTime) > now) return 'unknown';
  return now >= Date.parse(data.staleAfter) ? 'stale' : 'recent';
};

export const selectForecast = (hourly: WaveEntry[], selectedTime: number) => {
  const index = hourly.findIndex(entry => {
    const start = Date.parse(entry.time);
    return start <= selectedTime && selectedTime < start + 3_600_000;
  });
  return { selected: index < 0 ? null : hourly[index], next: index < 0 ? [] : hourly.slice(index + 1, index + 4) };
};

export const selectedInstant = (value: string | undefined, now: number) => {
  if (value === undefined) return now;
  if (!/(Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) return NaN;
  return Date.parse(value);
};
export const formatUtc = (value: string) => `${new Date(value).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
export const formatValue = (value: number | null, unit: string) => value === null ? 'Unavailable' : `${value.toFixed(1)} ${unit}`;

type LocationProvider = {
  Accuracy: { Balanced: number };
  requestForegroundPermissionsAsync: () => Promise<{ status: string }>;
  getCurrentPositionAsync: (options: { accuracy: number }) => Promise<{ coords: Coordinates }>;
};
export const marineCoordinates = async (latitude: number | undefined, longitude: number | undefined, location: LocationProvider): Promise<Coordinates> => {
  if (latitude !== undefined || longitude !== undefined) {
    const value = { latitude, longitude };
    if (!validCoordinates(value)) throw new Error('A valid latitude and longitude are required');
    return value;
  }
  const permission = await location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Location permission is required for a local marine forecast. No default location was used.');
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      location.getCurrentPositionAsync({ accuracy: location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('Location lookup timed out. Check location services and retry.')), 15_000); }),
    ]);
    if (!validCoordinates(result.coords)) throw new Error('Current location is unavailable');
    return { latitude: result.coords.latitude, longitude: result.coords.longitude };
  } finally { if (timeout !== undefined) clearTimeout(timeout); }
};
