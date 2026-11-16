// Deezer preview URLs carry an expiring CDN token (?hdnea=exp=<unix>~...).
// Mirrors apps/api/src/lib/preview-url.ts; the margin covers fetching the
// whole 30-second file after play() starts.

const REFRESH_MARGIN_SECONDS = 120;

export function isPreviewUrlStale(
  previewUrl: string,
  nowSeconds = Date.now() / 1000,
): boolean {
  let token: string | null;

  try {
    token = new URL(previewUrl).searchParams.get("hdnea");
  } catch {
    return true;
  }

  const expPart = token?.split("~").find((part) => part.startsWith("exp="));
  if (!expPart) {
    return true;
  }

  const exp = Number(expPart.slice("exp=".length));
  return !Number.isFinite(exp) || exp - REFRESH_MARGIN_SECONDS <= nowSeconds;
}
