const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function getImageUrl(
  url: string | undefined | null
): string | undefined {
  if (!url) return undefined;

  if (url.startsWith("http")) {
    return url;
  }

  return `${API_URL}${url}`;
}
