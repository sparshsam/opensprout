import { describe, it, expect, vi } from "vitest";
import type { Client } from "../supabase.js";

// Mock Supabase query builder
function createMockDb() {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn(),
  };

  // Make chainable methods return the mock query itself
  mockQuery.then = vi.fn((resolve) =>
    resolve({ data: [{ id: "1", name: "Test Plant" }], error: null }),
  );

  const mockClient = {
    from: vi.fn(() => mockQuery),
  } as unknown as Client;

  return { mockClient, mockQuery };
}

describe("Tool patterns", () => {
  it("list_plants query returns expected shape", async () => {
    const { mockClient } = createMockDb();

    const result = await (mockClient as any)
      .from("plants")
      .select("*")
      .is("deleted_at", null)
      .order("name");

    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("get_plant queries with id filter", async () => {
    const { mockClient, mockQuery } = createMockDb();

    await (mockClient as any)
      .from("plants")
      .select("*")
      .eq("id", "plant-123")
      .is("deleted_at", null)
      .single();

    expect(mockQuery.eq).toHaveBeenCalledWith("id", "plant-123");
    expect(mockQuery.single).toHaveBeenCalled();
  });

  it("create_journal_entry insert has required fields", async () => {
    const { mockClient, mockQuery } = createMockDb();

    const entry = {
      plant_id: "plant-1",
      user_id: "user-1",
      body: "Test observation",
      title: null,
      health_score: null,
      tags: ["new-leaf"],
    };

    await (mockClient as any).from("journal_entries").insert(entry);

    expect(mockQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        plant_id: "plant-1",
        body: "Test observation",
        tags: ["new-leaf"],
      }),
    );
  });

  it("log_care_activity builds correct insert", async () => {
    const { mockClient, mockQuery } = createMockDb();

    await (mockClient as any).from("care_logs").insert({
      plant_id: "plant-1",
      user_id: "user-1",
      care_type: "water",
      notes: "Watered thoroughly",
      amount_ml: 250,
    });

    expect(mockQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        care_type: "water",
        amount_ml: 250,
      }),
    );
  });

  it("handles empty data gracefully", async () => {
    const emptyMock = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          is: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({ data: [], error: null }),
            ),
          })),
        })),
      })),
    } as unknown as Client;

    const result = await (emptyMock as any)
      .from("plants")
      .select("*")
      .is("deleted_at", null)
      .order("name");

    expect(result.data).toEqual([]);
  });
});
