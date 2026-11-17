const publicPaths = new Set([
  "/",
  "/home",
  "/auth",
  "/request-access",
  "/admin-guide",
  "/privacy-policy",
  "/terms-and-conditions",
  "/refund-policy",
  "/cookie-policy",
  "/disclaimer",
  "/shipping-policy",
]);

export function isPublicPage(pathname: string) {
  return publicPaths.has(pathname.replace(/\/$/, "") || "/");
}

/** Only return to local pages; never trust a URL supplied in the login query. */
export function authReturnPath(search: string): string | null {
  const next = new URLSearchParams(search).get("next");
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    /[\\\s]/.test(next) ||
    Array.from(next).some((character) => character.charCodeAt(0) < 32)
  )
    return null;
  try {
    const url = new URL(next, "https://local.invalid");
    const pathname = decodeURIComponent(url.pathname).replace(/\/$/, "");
    if (
      url.origin !== "https://local.invalid" ||
      pathname.startsWith("//") ||
      pathname.includes("\\") ||
      ["/auth", "/request-access"].includes(pathname)
    )
      return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function loginHref(next: string) {
  return `/auth?${new URLSearchParams({ next })}#login`;
}
