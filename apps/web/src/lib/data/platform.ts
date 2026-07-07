/**
 * API routing utilities.
 *
 * On the web, Next.js API routes are available at relative paths.
 */

/** Resolve a relative API path to an absolute URL. */
export function resolveApiUrl(path: string): string {
  return path;
}

/** Production origin used for OAuth redirects and link construction. */
export const PRODUCTION_ORIGIN = "https://sprout.kovina.org";
