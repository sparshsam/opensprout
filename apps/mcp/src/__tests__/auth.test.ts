import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────
// Mock createClient before any imports of supabase.ts
const mockFrom = vi.fn();
const mockAdminClient = {
  from: mockFrom,
};
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockAdminClient),
}));

/**
 * Build a full query chain that properly supports await.
 * The key requirement: chaining methods (.select, .eq, etc.) must return
 * a thenable object so that `await chain.eq(...)` actually resolves.
 */
function buildQueryChain(resolvedValue: unknown) {
  // The actual thenable — this is what `await query` resolves to
  const thenFn = (resolve: (v: unknown) => unknown) => resolve(resolvedValue);

  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    // The await-able then — called by the JS runtime on `await chain`
    then: thenFn,
    // Allow calling chain.then(resolve) which returns undefined (void)
  };

  // Override mockReturnThis to return the chain (which is thenable)
  for (const key of Object.keys(chain)) {
    if (key === "then" || key === "single") continue;
    (chain as any)[key].mockReturnValue(chain);
  }
  // single returns a Promise-like too
  chain.single.mockReturnValue({
    then: vi.fn((resolve: (v: unknown) => unknown) => resolve(resolvedValue)),
  });

  return chain;
}

describe("authenticateToken", () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  // ── Test 1: Missing Supabase credentials ──────────────────────────────────────
  it("throws missing Supabase credentials when URL and key are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_ANON_KEY;

    // Clear module cache so env vars are read fresh
    vi.resetModules();
    const { authenticateToken } = await import("../supabase.js");
    await expect(authenticateToken("test-token")).rejects.toThrow(
      "Missing Supabase credentials",
    );
  });

  // ── Test 2: Missing service role key ──────────────────────────────────────────
  it("throws missing service role key when SERVICE_ROLE_KEY is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    vi.resetModules();
    const { authenticateToken } = await import("../supabase.js");
    await expect(authenticateToken("test-token")).rejects.toThrow(
      "Missing SUPABASE_SERVICE_ROLE_KEY",
    );
  });

  // ── Test 3: Valid token returns client + userId ───────────────────────────────
  it("returns {client, userId} on valid token with matching hash", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    const record = {
      user_id: "user-abc-123",
      id: "token-id-1",
      revoked_at: null,
    };

    // The lookup query returns the record
    const lookupChain = buildQueryChain({ data: [record], error: null });
    // The update query (last_used_at) succeeds
    const updateChain = buildQueryChain({ data: null, error: null });

    // Configure .from to return the right chain based on which query is being built
    // Both queries use "mcp_tokens", but we can use call counters to differentiate
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return lookupChain;
      return updateChain;
    });

    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    const { authenticateToken } = await import("../supabase.js");
    const result = await authenticateToken("test-token");

    expect(result).toHaveProperty("client");
    expect(result).toHaveProperty("userId");
    expect(result.userId).toBe("user-abc-123");
  });

  // ── Test 4: Invalid token — no match in DB ────────────────────────────────────
  it('throws "Invalid access token" when hash has no match in DB', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    const emptyChain = buildQueryChain({ data: [], error: null });
    mockFrom.mockReturnValue(emptyChain);

    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    const { authenticateToken } = await import("../supabase.js");
    await expect(authenticateToken("bad-token")).rejects.toThrow(
      "Invalid access token",
    );
  });

  // ── Test 5: Revoked token ────────────────────────────────────────────────────
  it('throws "This access token has been revoked" when revoked_at is set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    const revokedChain = buildQueryChain({
      data: [
        {
          user_id: "user-1",
          id: "token-revoked",
          revoked_at: "2024-01-01T00:00:00Z",
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(revokedChain);

    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    const { authenticateToken } = await import("../supabase.js");
    await expect(authenticateToken("revoked-token")).rejects.toThrow(
      "revoked",
    );
  });

  // ── Test 6: SHA-256 hash computation ──────────────────────────────────────────
  it("SHA-256 hash computation — verify the hash is hex-encoded correctly", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    const token = "hello-world";

    // Compute expected hash
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(token),
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Capture the hash that authenticateToken computes by spying on .eq("token_hash", ...)
    let capturedHash: string | null = null;

    const record = {
      user_id: "user-1",
      id: "token-id",
      revoked_at: null,
    };

    // Build the lookup chain with a capturing .eq
    const lookupResolvedValue = { data: [record], error: null };
    const lookupThen = (resolve: (v: unknown) => unknown) =>
      resolve(lookupResolvedValue);

    const capturingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn((field: string, value: string) => {
        if (field === "token_hash") {
          capturedHash = value;
        }
        return capturingChain;
      }),
      update: vi.fn().mockReturnThis(),
      then: lookupThen,
    };
    // Make select also return the chain
    capturingChain.select.mockReturnValue(capturingChain);
    capturingChain.update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        then: vi.fn((resolve: (v: unknown) => unknown) =>
          resolve({ data: null, error: null }),
        ),
      }),
    });

    // Two calls to .from — first returns the lookup chain, second returns the update chain
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return capturingChain;
      // Second call is for the update
      const updateResolved = { data: null, error: null };
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: (v: unknown) => unknown) =>
          resolve(updateResolved),
        ),
      };
    });

    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    const { authenticateToken } = await import("../supabase.js");
    await authenticateToken(token);

    expect(capturedHash).not.toBeNull();
    expect(capturedHash).toBe(expectedHash);
    // Verify it's a hex string (64 chars for SHA-256)
    expect(capturedHash).toMatch(/^[0-9a-f]{64}$/);
  });
});
