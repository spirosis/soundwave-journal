const AUTH_PATHS = ["/login", "/register"];

// Only same-origin, absolute-path targets are accepted: "//host" and "/\host"
// are protocol-relative URLs in browsers, and anything not starting with "/"
// could point off-site.
export function sanitizeNextPath(candidate: string | null | undefined): string {
  if (!candidate || !candidate.startsWith("/")) return "/";
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return "/";

  const pathname = candidate.split(/[?#]/)[0];
  if (AUTH_PATHS.includes(pathname)) return "/";

  return candidate;
}

/** Where to go after a successful login/register, read from `?next=`. */
export function getPostAuthPath(): string {
  if (typeof window === "undefined") return "/";
  return sanitizeNextPath(new URLSearchParams(window.location.search).get("next"));
}
