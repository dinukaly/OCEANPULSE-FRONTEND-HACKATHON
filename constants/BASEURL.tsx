const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const normalizedUrl = configuredUrl?.replace(/\/+$/, "");
const isValidApiUrl = Boolean(
  normalizedUrl &&
  /^https?:\/\/[^/\s]+(?:\/[^\s]*)?$/i.test(normalizedUrl) &&
  normalizedUrl.endsWith("/api/v1")
);

export default function getBaseUrl(): string | undefined {
  return isValidApiUrl ? `${normalizedUrl}/` : undefined;
}

export function assertApiConfigured(): void {
  if (!isValidApiUrl) {
    throw new Error(
      "Set EXPO_PUBLIC_API_URL to a reachable http(s) URL ending in /api/v1/"
    );
  }
}
