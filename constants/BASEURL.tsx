import {
  normalizeApiUrl,
  apiConfigurationMessage,
} from "@/utils/apiConfiguration";

const apiUrl = normalizeApiUrl(
  process.env.EXPO_PUBLIC_API_URL,
  process.env.NODE_ENV === "production",
);

export default function getBaseUrl(): string | undefined {
  return apiUrl;
}

export function assertApiConfigured(): void {
  if (!apiUrl) {
    throw new Error(apiConfigurationMessage);
  }
}
