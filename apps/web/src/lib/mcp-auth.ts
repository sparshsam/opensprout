/**
 * MCP Auth utilities — duplicated in the web app for API route use
 * (see MCP Build Guide approach 1: shared functions in web app lib)
 */

/**
 * Computes the SHA-256 hex digest of a string.
 */
export async function sha256Hex(input: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a cryptographically random MCP access token.
 * Format: osp_<32-random-hex-chars>
 */
export function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "osp_";
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  for (let i = 0; i < 32; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}
