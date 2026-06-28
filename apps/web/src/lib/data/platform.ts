/**
 * Platform detection and API routing utilities for Capacitor/web.
 *
 * In Capacitor native mode, the app runs from an https://localhost WebView
 * with static HTML. Next.js API routes are NOT available — absolute URLs
 * to the production origin must be used instead.
 */

/** Runtime platform identifier. */
export type RuntimePlatform = "web" | "capacitor";

/** Detect whether the code is running in Capacitor native. */
export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as typeof window & {
    Capacitor?: { isNativePlatform?: () => boolean };
  };
  return !!win.Capacitor?.isNativePlatform?.();
}

/** Get the current runtime platform. */
export function getPlatform(): RuntimePlatform {
  return isCapacitorNative() ? "capacitor" : "web";
}

/**
 * Resolve the correct origin for API calls.
 *
 * - Web (Next.js SSR): returns empty string so relative URLs like
 *   "/api/identify" resolve against the same origin.
 * - Capacitor native: returns the production origin, because the
 *   app runs from https://localhost and API routes are not bundled
 *   in the static export.
 */
export function getApiOrigin(): string {
  if (isCapacitorNative()) {
    return "https://sprout.kovina.org";
  }
  return "";
}

/**
 * Resolve a relative API path to an absolute URL.
 *
 * Example:
 *   resolveApiUrl("/api/identify")
 *   → "/api/identify" on web
 *   → "https://sprout.kovina.org/api/identify" on Capacitor
 */
export function resolveApiUrl(path: string): string {
  const origin = getApiOrigin();
  return `${origin}${path}`;
}

/**
 * Production origin used for OAuth redirects and absolute URL construction.
 */
export const PRODUCTION_ORIGIN = "https://sprout.kovina.org";
