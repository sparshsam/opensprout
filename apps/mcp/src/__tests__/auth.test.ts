import { describe, it, expect } from "vitest";
import { createSupabaseClient } from "../supabase.js";

describe("createSupabaseClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws when SUPABASE_URL is missing", () => {
    process.env = {};
    expect(() => createSupabaseClient("test-token")).toThrow(
      "Missing Supabase credentials",
    );
  });

  it("throws when SUPABASE_ANON_KEY is missing", () => {
    process.env = { NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co" };
    expect(() => createSupabaseClient("test-token")).toThrow(
      "Missing Supabase credentials",
    );
  });

  it("returns a client when both env vars are set", () => {
    process.env = {
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
    };
    const client = createSupabaseClient("test-token");
    expect(client).toBeDefined();
    expect(client.from).toBeDefined();
  });

  it("falls back to alternate env var names", () => {
    process.env = {
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_ANON_KEY: "test-anon-key",
    };
    const client = createSupabaseClient("test-token");
    expect(client).toBeDefined();
  });
});
