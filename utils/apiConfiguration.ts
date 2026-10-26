export const apiConfigurationMessage =
  'Set EXPO_PUBLIC_API_URL to a URL ending in /api/v1/. Release builds require HTTPS. URL credentials, query strings and fragments are not supported.';

export function normalizeApiUrl(
  raw: string | undefined,
  release = false,
): string | undefined {
  try {
    if (!raw?.trim() || /\s/.test(raw.trim())) return undefined;
    const url = new URL(raw.trim());
    const path = url.pathname.replace(/\/+$/, '');
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      (release && url.protocol !== 'https:') ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !path.endsWith('/api/v1')
    )
      return undefined;
    return `${url.origin}${path}/`;
  } catch {
    return undefined;
  }
}
