// Deezer signs preview URLs with an expiring CDN token:
//   https://cdnt-preview.dzcdn.net/....mp3?hdnea=exp=<unix seconds>~acl=...~hmac=...
// Tokens last roughly a day; once expired the CDN answers 403.

const REFRESH_MARGIN_SECONDS = 10 * 60;

export function getPreviewUrlExpiry(previewUrl: string): number | null {
  let token: string | null;

  try {
    token = new URL(previewUrl).searchParams.get("hdnea");
  } catch {
    return null;
  }

  if (!token) {
    return null;
  }

  const expPart = token.split("~").find((part) => part.startsWith("exp="));
  if (!expPart) {
    return null;
  }

  const exp = Number(expPart.slice("exp=".length));
  return Number.isFinite(exp) ? exp : null;
}

export function isPreviewUrlStale(
  previewUrl: string | null,
  nowSeconds = Date.now() / 1000,
): boolean {
  if (!previewUrl) {
    return false;
  }

  const exp = getPreviewUrlExpiry(previewUrl);

  // Unsigned preview URLs are rejected by Deezer's CDN nowadays.
  if (exp === null) {
    return true;
  }

  return exp - REFRESH_MARGIN_SECONDS <= nowSeconds;
}
