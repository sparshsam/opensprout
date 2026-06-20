import { describe, it, expect } from "vitest";

describe("authenticateToken", () => {
  it("throws when SUPABASE_URL is missing", async () => {
    process.env = {};
    await expect(
      (await import("../supabase.js")).authenticateToken("test"),
    ).rejects.toThrow("Missing Supabase credentials");
  });
});
