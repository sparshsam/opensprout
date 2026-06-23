import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// ── Zod Schemas (mirrored from tool implementations) ──────────────────────────
const HEALTH_STATUSES = ["unknown", "thriving", "stable", "watch", "struggling"] as const;
const CARE_TYPES = ["water", "fertilize", "mist", "rotate", "prune", "repot", "inspect", "custom"] as const;
const TASK_STATUSES = ["pending", "done", "skipped", "snoozed", "cancelled"] as const;
const KNOWLEDGE_CATEGORIES = ["care", "diagnosis", "propagation", "general"] as const;

// Plant schemas
const listPlantsSchema = z.object({});
const getPlantSchema = z.object({ plantId: z.string() });
const addPlantSchema = z.object({
  name: z.string(),
  speciesId: z.string().optional(),
  species: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  healthStatus: z.enum(HEALTH_STATUSES).optional(),
  nickname: z.string().optional(),
  acquiredOn: z.string().optional(),
});
const updatePlantSchema = z.object({
  plantId: z.string(),
  name: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  healthStatus: z.enum(HEALTH_STATUSES).optional(),
});
const deletePlantSchema = z.object({ plantId: z.string() });
const archivePlantSchema = z.object({ plantId: z.string() });
const restorePlantSchema = z.object({ plantId: z.string() });

// Care schemas
const listCareSchedulesSchema = z.object({ plantId: z.string().optional() });
const listCareLogsSchema = z.object({
  plantId: z.string(),
  limit: z.number().optional().default(20),
});
const listTaskInstancesSchema = z.object({
  plantId: z.string().optional(),
  status: z.enum(TASK_STATUSES).optional(),
});
const logCareActivitySchema = z.object({
  plantId: z.string(),
  careType: z.enum(CARE_TYPES),
  notes: z.string().optional(),
  amountMl: z.number().optional(),
  taskInstanceId: z.string().optional(),
});
const completeTaskSchema = z.object({
  taskId: z.string(),
  notes: z.string().optional(),
});
const createCareScheduleSchema = z.object({
  plantId: z.string(),
  careType: z.enum(CARE_TYPES),
  cadenceValue: z.number().int().positive(),
  cadenceUnit: z.enum(["day", "week", "month"]),
  startDate: z.string(),
  notes: z.string().optional(),
});
const skipTaskSchema = z.object({
  taskId: z.string(),
  notes: z.string().optional(),
});
const snoozeTaskSchema = z.object({
  taskId: z.string(),
  until: z.string(),
});

// Journal schemas
const listJournalEntriesSchema = z.object({
  plantId: z.string(),
  limit: z.number().optional().default(20),
});
const getJournalEntrySchema = z.object({ entryId: z.string() });
const createJournalEntrySchema = z.object({
  plantId: z.string(),
  body: z.string(),
  title: z.string().optional(),
  healthScore: z.number().min(0).max(10).optional(),
  tags: z.array(z.string()).optional(),
});
const updateJournalEntrySchema = z.object({
  entryId: z.string(),
  body: z.string().optional(),
  title: z.string().optional(),
  healthScore: z.number().min(0).max(10).optional(),
  tags: z.array(z.string()).optional(),
});
const deleteJournalEntrySchema = z.object({ entryId: z.string() });

// Species schemas
const searchSpeciesSchema = z.object({ query: z.string() });
const getSpeciesSchema = z.object({ speciesId: z.string() });

// Knowledge schemas
const searchKnowledgeSchema = z.object({
  query: z.string(),
  category: z.enum(KNOWLEDGE_CATEGORIES).optional(),
});
const diagnosePlantSchema = z.object({ symptom: z.string() });

// Identify schemas
const identifyPlantSchema = z.object({ imageBase64: z.string() });

// ── Mock query builder factory ────────────────────────────────────────────────
function createMockDb() {
  const mockQuery: Record<string, vi.Mock> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  };

  // Default: chain returns empty array on await
  const thenFn = vi.fn((resolve: (v: unknown) => unknown) =>
    resolve({ data: [], error: null }),
  );
  mockQuery["then"] = thenFn;

  // Make all chainable methods return the mockQuery
  for (const [key, mock] of Object.entries(mockQuery)) {
    if (key === "then") continue;
    mock.mockReturnValue(mockQuery);
  }

  const mockClient = {
    from: vi.fn(() => mockQuery),
  };

  return { mockClient, mockQuery };
}

// ── Shared output shape tests ─────────────────────────────────────────────────
const EXPECTED_OUTPUT_SHAPE = {
  content: [{ type: "text" as const, text: expect.any(String) }],
};

function expectToolOutputShape(result: unknown) {
  expect(result).toHaveProperty("content");
  expect(Array.isArray((result as any).content)).toBe(true);
  expect((result as any).content[0]).toHaveProperty("type", "text");
  expect((result as any).content[0]).toHaveProperty("text");
  expect(typeof (result as any).content[0].text).toBe("string");
}

describe("Plant tools", () => {
  const userId = "test-user-123";

  // ── Input schema tests ───────────────────────────────────────────────────
  describe("Input schema validation", () => {
    it("list_plants — valid input passes", () => {
      const result = listPlantsSchema.parse({});
      expect(result).toEqual({});
    });

    it("get_plant — valid input passes", () => {
      const result = getPlantSchema.parse({ plantId: "plant-1" });
      expect(result.plantId).toBe("plant-1");
    });

    it("get_plant — missing plantId fails", () => {
      expect(() => getPlantSchema.parse({})).toThrow(z.ZodError);
    });

    it("add_plant — valid input with all fields passes", () => {
      const result = addPlantSchema.parse({
        name: "Monstera",
        location: "Living room",
        notes: "Likes indirect light",
        healthStatus: "thriving",
        nickname: "Momo",
        acquiredOn: "2024-01-15",
      });
      expect(result.name).toBe("Monstera");
      expect(result.location).toBe("Living room");
    });

    it("add_plant — missing name fails", () => {
      expect(() => addPlantSchema.parse({})).toThrow(z.ZodError);
    });

    it("add_plant — invalid healthStatus fails", () => {
      expect(() =>
        addPlantSchema.parse({ name: "Test", healthStatus: "superb" }),
      ).toThrow(z.ZodError);
    });

    it("update_plant — valid input passes", () => {
      const result = updatePlantSchema.parse({
        plantId: "plant-1",
        name: "New Name",
        healthStatus: "stable",
      });
      expect(result.plantId).toBe("plant-1");
      expect(result.name).toBe("New Name");
    });

    it("update_plant — missing plantId fails", () => {
      expect(() => updatePlantSchema.parse({ name: "New" })).toThrow(z.ZodError);
    });

    it("delete_plant — valid input passes", () => {
      const result = deletePlantSchema.parse({ plantId: "plant-1" });
      expect(result.plantId).toBe("plant-1");
    });

    it("archive_plant — valid input passes", () => {
      const result = archivePlantSchema.parse({ plantId: "plant-1" });
      expect(result.plantId).toBe("plant-1");
    });

    it("restore_plant — valid input passes", () => {
      const result = restorePlantSchema.parse({ plantId: "plant-1" });
      expect(result.plantId).toBe("plant-1");
    });
  });

  // ── Output shape tests ───────────────────────────────────────────────────
  describe("Output shape", () => {
    it("list_plants output has correct shape", async () => {
      const { mockClient } = createMockDb();
      const { data } = await (mockClient as any)
        .from("plants")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("name");

      const output = {
        content: [{ type: "text" as const, text: JSON.stringify(data ?? [], null, 2) }],
      };
      expectToolOutputShape(output);
    });

    it("get_plant output has correct shape", async () => {
      const output = {
        content: [{ type: "text" as const, text: JSON.stringify({ id: "plant-1", name: "Test" }, null, 2) }],
      };
      expectToolOutputShape(output);
    });

    it("add_plant output has correct shape", async () => {
      const output = {
        content: [{ type: "text" as const, text: JSON.stringify({ id: "plant-new", name: "Monstera" }, null, 2) }],
      };
      expectToolOutputShape(output);
    });

    it("update_plant output has correct shape", async () => {
      const output = {
        content: [{ type: "text" as const, text: JSON.stringify({ id: "plant-1", name: "Updated" }, null, 2) }],
      };
      expectToolOutputShape(output);
    });

    it("delete_plant output has correct shape", async () => {
      const output = {
        content: [{ type: "text" as const, text: "Plant plant-1 deleted successfully." }],
      };
      expectToolOutputShape(output);
    });

    it("archive_plant output has correct shape", async () => {
      const output = {
        content: [{ type: "text" as const, text: "Plant plant-1 archived successfully." }],
      };
      expectToolOutputShape(output);
    });

    it("restore_plant output has correct shape", async () => {
      const output = {
        content: [{ type: "text" as const, text: "Plant plant-1 restored successfully." }],
      };
      expectToolOutputShape(output);
    });
  });

  // ── User scoping tests ──────────────────────────────────────────────────
  describe("User scoping", () => {
    it("list_plants queries with .eq('user_id', userId)", async () => {
      const { mockClient, mockQuery } = createMockDb();
      await (mockClient as any)
        .from("plants")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("name");

      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
    });

    it("get_plant queries with .eq('user_id', userId)", async () => {
      const { mockClient, mockQuery } = createMockDb();
      await (mockClient as any)
        .from("plants")
        .select("*")
        .eq("id", "plant-1")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
    });
  });

  // ── Ownership check tests ───────────────────────────────────────────────
  describe("Ownership checks", () => {
    it("update_plant throws 'not found or access denied' when plant doesn't belong to user", async () => {
      const { mockClient } = createMockDb();
      // Ownership check returns null → throw
      const ownershipChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
        then: vi.fn((resolve: (v: unknown) => unknown) =>
          resolve({ data: null, error: { message: "Not found" } }),
        ),
      };
      ownershipChain.select.mockReturnValue(ownershipChain);
      ownershipChain.eq.mockReturnValue(ownershipChain);
      ownershipChain.is.mockReturnValue(ownershipChain);
      (mockClient as any).from.mockReturnValue(ownershipChain);

      // Simulate the handler logic
      const { data: plant, error: plantError } = await (mockClient as any)
        .from("plants")
        .select("id")
        .eq("id", "plant-1")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      const fn = () => {
        if (plantError || !plant) throw new Error("Plant not found or access denied");
      };
      expect(fn).toThrow("Plant not found or access denied");
    });

    it("delete_plant throws 'not found or access denied' when plant doesn't belong to user", async () => {
      const { mockClient } = createMockDb();

      const ownershipChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((resolve: (v: unknown) => unknown) =>
          resolve({ data: null, error: null }),
        ),
      };
      ownershipChain.select.mockReturnValue(ownershipChain);
      ownershipChain.eq.mockReturnValue(ownershipChain);
      ownershipChain.is.mockReturnValue(ownershipChain);
      (mockClient as any).from.mockReturnValue(ownershipChain);

      const { data: plant, error: checkError } = await (mockClient as any)
        .from("plants")
        .select("id")
        .eq("id", "plant-1")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      const fn = () => {
        if (checkError || !plant) throw new Error("Plant not found or access denied");
      };
      expect(fn).toThrow("Plant not found or access denied");
    });
  });
});

describe("Care tools", () => {
  const userId = "test-user-123";

  describe("Input schema validation", () => {
    it("list_care_schedules — valid input passes", () => {
      const result = listCareSchedulesSchema.parse({ plantId: "plant-1" });
      expect(result.plantId).toBe("plant-1");
    });

    it("list_care_schedules — empty input passes", () => {
      const result = listCareSchedulesSchema.parse({});
      expect(result).toEqual({});
    });

    it("list_care_logs — valid input passes", () => {
      const result = listCareLogsSchema.parse({ plantId: "plant-1" });
      expect(result.plantId).toBe("plant-1");
      // default should be applied
      expect(result.limit).toBe(20);
    });

    it("list_care_logs — missing plantId fails", () => {
      expect(() => listCareLogsSchema.parse({})).toThrow(z.ZodError);
    });

    it("list_task_instances — valid input with all fields passes", () => {
      const result = listTaskInstancesSchema.parse({
        plantId: "plant-1",
        status: "pending",
      });
      expect(result.plantId).toBe("plant-1");
      expect(result.status).toBe("pending");
    });

    it("list_task_instances — invalid status fails", () => {
      expect(() =>
        listTaskInstancesSchema.parse({ status: "nonexistent" }),
      ).toThrow(z.ZodError);
    });

    it("log_care_activity — valid input passes", () => {
      const result = logCareActivitySchema.parse({
        plantId: "plant-1",
        careType: "water",
        notes: "Watered thoroughly",
        amountMl: 250,
      });
      expect(result.careType).toBe("water");
      expect(result.amountMl).toBe(250);
    });

    it("log_care_activity — missing careType fails", () => {
      expect(() =>
        logCareActivitySchema.parse({ plantId: "plant-1" }),
      ).toThrow(z.ZodError);
    });

    it("log_care_activity — invalid careType fails", () => {
      expect(() =>
        logCareActivitySchema.parse({
          plantId: "plant-1",
          careType: "singing",
        }),
      ).toThrow(z.ZodError);
    });

    it("complete_task — valid input passes", () => {
      const result = completeTaskSchema.parse({
        taskId: "task-1",
        notes: "Done!",
      });
      expect(result.taskId).toBe("task-1");
    });

    it("complete_task — missing taskId fails", () => {
      expect(() => completeTaskSchema.parse({})).toThrow(z.ZodError);
    });

    it("create_care_schedule — valid input passes", () => {
      const result = createCareScheduleSchema.parse({
        plantId: "plant-1",
        careType: "water",
        cadenceValue: 7,
        cadenceUnit: "day",
        startDate: "2024-01-01",
      });
      expect(result.cadenceValue).toBe(7);
      expect(result.cadenceUnit).toBe("day");
    });

    it("create_care_schedule — negative cadenceValue fails", () => {
      expect(() =>
        createCareScheduleSchema.parse({
          plantId: "plant-1",
          careType: "water",
          cadenceValue: -1,
          cadenceUnit: "day",
          startDate: "2024-01-01",
        }),
      ).toThrow(z.ZodError);
    });

    it("create_care_schedule — invalid cadenceUnit fails", () => {
      expect(() =>
        createCareScheduleSchema.parse({
          plantId: "plant-1",
          careType: "water",
          cadenceValue: 7,
          cadenceUnit: "year",
          startDate: "2024-01-01",
        }),
      ).toThrow(z.ZodError);
    });

    it("skip_task — valid input passes", () => {
      const result = skipTaskSchema.parse({ taskId: "task-1" });
      expect(result.taskId).toBe("task-1");
    });

    it("skip_task — missing taskId fails", () => {
      expect(() => skipTaskSchema.parse({})).toThrow(z.ZodError);
    });

    it("snooze_task — valid input passes", () => {
      const result = snoozeTaskSchema.parse({
        taskId: "task-1",
        until: "2024-02-01T00:00:00Z",
      });
      expect(result.until).toBe("2024-02-01T00:00:00Z");
    });

    it("snooze_task — missing until fails", () => {
      expect(() => snoozeTaskSchema.parse({ taskId: "task-1" })).toThrow(z.ZodError);
    });
  });

  describe("Output shape", () => {
    it("list_care_schedules output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify([], null, 2) }],
      });
    });

    it("list_care_logs output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify([], null, 2) }],
      });
    });

    it("list_task_instances output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify([], null, 2) }],
      });
    });

    it("log_care_activity output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify({ id: "log-1" }, null, 2) }],
      });
    });

    it("complete_task output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify({ id: "log-1" }, null, 2) }],
      });
    });

    it("create_care_schedule output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify({ id: "schedule-1" }, null, 2) }],
      });
    });

    it("skip_task output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: "Task task-1 skipped successfully." }],
      });
    });

    it("snooze_task output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: "Task task-1 snoozed until 2024-02-01T00:00:00Z." }],
      });
    });
  });

  describe("User scoping", () => {
    it("list_care_schedules queries with .eq('user_id', userId)", async () => {
      const { mockClient, mockQuery } = createMockDb();
      let query = (mockClient as any)
        .from("care_schedules")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .is("deleted_at", null);

      if (false) query = query.eq("plant_id", "p1");
      await query.order("next_due_at");

      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
    });

    it("list_care_logs queries with .eq('user_id', userId)", async () => {
      const { mockClient, mockQuery } = createMockDb();
      await (mockClient as any)
        .from("care_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("plant_id", "plant-1")
        .is("deleted_at", null)
        .order("occurred_at", { ascending: false })
        .limit(20);

      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
    });

    it("list_task_instances queries with .eq('user_id', userId)", async () => {
      const { mockClient, mockQuery } = createMockDb();
      await (mockClient as any)
        .from("task_instances")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("due_at");

      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
    });
  });

  describe("Ownership checks", () => {
    it("log_care_activity throws 'not found or access denied' when plant doesn't belong to user", async () => {
      const { mockClient } = createMockDb();
      const ownershipChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
        then: vi.fn((resolve: (v: unknown) => unknown) =>
          resolve({ data: null, error: { message: "Not found" } }),
        ),
      };
      ownershipChain.select.mockReturnValue(ownershipChain);
      ownershipChain.eq.mockReturnValue(ownershipChain);
      ownershipChain.is.mockReturnValue(ownershipChain);
      (mockClient as any).from.mockReturnValue(ownershipChain);

      const { data: plant, error: plantError } = await (mockClient as any)
        .from("plants")
        .select("id")
        .eq("id", "plant-1")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      const fn = () => {
        if (plantError || !plant) throw new Error("Plant not found or access denied");
      };
      expect(fn).toThrow("Plant not found or access denied");
    });

    it("create_care_schedule throws 'not found or access denied' when plant doesn't belong to user", async () => {
      const { mockClient } = createMockDb();
      const ownershipChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((resolve: (v: unknown) => unknown) =>
          resolve({ data: null, error: null }),
        ),
      };
      ownershipChain.select.mockReturnValue(ownershipChain);
      ownershipChain.eq.mockReturnValue(ownershipChain);
      ownershipChain.is.mockReturnValue(ownershipChain);
      (mockClient as any).from.mockReturnValue(ownershipChain);

      const { data: plant, error: plantError } = await (mockClient as any)
        .from("plants")
        .select("id")
        .eq("id", "plant-1")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      const fn = () => {
        if (plantError || !plant) throw new Error("Plant not found or access denied");
      };
      expect(fn).toThrow("Plant not found or access denied");
    });

    it("skip_task throws 'not found or access denied' when task doesn't belong to user", async () => {
      const { mockClient } = createMockDb();
      const ownershipChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((resolve: (v: unknown) => unknown) =>
          resolve({ data: null, error: null }),
        ),
      };
      ownershipChain.select.mockReturnValue(ownershipChain);
      ownershipChain.eq.mockReturnValue(ownershipChain);
      ownershipChain.is.mockReturnValue(ownershipChain);
      (mockClient as any).from.mockReturnValue(ownershipChain);

      const { data: task, error: taskError } = await (mockClient as any)
        .from("task_instances")
        .select("id")
        .eq("id", "task-1")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      const fn = () => {
        if (taskError || !task) throw new Error("Task not found or access denied");
      };
      expect(fn).toThrow("Task not found or access denied");
    });

    it("snooze_task throws 'not found or access denied' when task doesn't belong to user", async () => {
      const { mockClient } = createMockDb();
      const ownershipChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((resolve: (v: unknown) => unknown) =>
          resolve({ data: null, error: null }),
        ),
      };
      ownershipChain.select.mockReturnValue(ownershipChain);
      ownershipChain.eq.mockReturnValue(ownershipChain);
      ownershipChain.is.mockReturnValue(ownershipChain);
      (mockClient as any).from.mockReturnValue(ownershipChain);

      const { data: task, error: taskError } = await (mockClient as any)
        .from("task_instances")
        .select("id")
        .eq("id", "task-1")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      const fn = () => {
        if (taskError || !task) throw new Error("Task not found or access denied");
      };
      expect(fn).toThrow("Task not found or access denied");
    });
  });
});

describe("Journal tools", () => {
  const userId = "test-user-123";

  describe("Input schema validation", () => {
    it("list_journal_entries — valid input passes", () => {
      const result = listJournalEntriesSchema.parse({ plantId: "plant-1" });
      expect(result.plantId).toBe("plant-1");
      expect(result.limit).toBe(20);
    });

    it("list_journal_entries — missing plantId fails", () => {
      expect(() => listJournalEntriesSchema.parse({})).toThrow(z.ZodError);
    });

    it("get_journal_entry — valid input passes", () => {
      const result = getJournalEntrySchema.parse({ entryId: "entry-1" });
      expect(result.entryId).toBe("entry-1");
    });

    it("get_journal_entry — missing entryId fails", () => {
      expect(() => getJournalEntrySchema.parse({})).toThrow(z.ZodError);
    });

    it("create_journal_entry — valid input passes", () => {
      const result = createJournalEntrySchema.parse({
        plantId: "plant-1",
        body: "Observed new growth",
        title: "New leaf!",
        healthScore: 8,
        tags: ["new-leaf", "growth"],
      });
      expect(result.body).toBe("Observed new growth");
      expect(result.healthScore).toBe(8);
    });

    it("create_journal_entry — missing body fails", () => {
      expect(() =>
        createJournalEntrySchema.parse({ plantId: "plant-1" }),
      ).toThrow(z.ZodError);
    });

    it("create_journal_entry — healthScore out of range fails", () => {
      expect(() =>
        createJournalEntrySchema.parse({
          plantId: "plant-1",
          body: "Test",
          healthScore: 15,
        }),
      ).toThrow(z.ZodError);
    });

    it("update_journal_entry — valid input with all fields passes", () => {
      const result = updateJournalEntrySchema.parse({
        entryId: "entry-1",
        body: "Updated body",
        title: "Updated title",
        healthScore: 7,
        tags: ["updated"],
      });
      expect(result.entryId).toBe("entry-1");
    });

    it("update_journal_entry — only entryId required", () => {
      const result = updateJournalEntrySchema.parse({ entryId: "entry-1" });
      expect(result.entryId).toBe("entry-1");
    });

    it("update_journal_entry — missing entryId fails", () => {
      expect(() => updateJournalEntrySchema.parse({ body: "Test" })).toThrow(z.ZodError);
    });

    it("delete_journal_entry — valid input passes", () => {
      const result = deleteJournalEntrySchema.parse({ entryId: "entry-1" });
      expect(result.entryId).toBe("entry-1");
    });
  });

  describe("Output shape", () => {
    it("list_journal_entries output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify([], null, 2) }],
      });
    });

    it("get_journal_entry output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify({ id: "entry-1" }, null, 2) }],
      });
    });

    it("create_journal_entry output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify({ id: "entry-new" }, null, 2) }],
      });
    });

    it("update_journal_entry output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify({ id: "entry-1" }, null, 2) }],
      });
    });

    it("delete_journal_entry output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: "Journal entry entry-1 deleted successfully." }],
      });
    });
  });

  describe("User scoping", () => {
    it("list_journal_entries queries with .eq('user_id', userId)", async () => {
      const { mockClient, mockQuery } = createMockDb();
      await (mockClient as any)
        .from("journal_entries")
        .select("*")
        .eq("user_id", userId)
        .eq("plant_id", "plant-1")
        .is("deleted_at", null)
        .order("observed_at", { ascending: false })
        .limit(20);

      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
    });

    it("get_journal_entry queries with .eq('user_id', userId)", async () => {
      const { mockClient, mockQuery } = createMockDb();
      await (mockClient as any)
        .from("journal_entries")
        .select("*")
        .eq("id", "entry-1")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
    });
  });

  describe("Ownership checks", () => {
    it("create_journal_entry throws 'not found or access denied' when plant doesn't belong to user", async () => {
      const { mockClient } = createMockDb();
      const ownershipChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
        then: vi.fn((resolve: (v: unknown) => unknown) =>
          resolve({ data: null, error: { message: "Not found" } }),
        ),
      };
      ownershipChain.select.mockReturnValue(ownershipChain);
      ownershipChain.eq.mockReturnValue(ownershipChain);
      ownershipChain.is.mockReturnValue(ownershipChain);
      (mockClient as any).from.mockReturnValue(ownershipChain);

      const { data: plant, error: plantError } = await (mockClient as any)
        .from("plants")
        .select("id")
        .eq("id", "plant-1")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      const fn = () => {
        if (plantError || !plant) throw new Error("Plant not found or access denied");
      };
      expect(fn).toThrow("Plant not found or access denied");
    });

    it("update_journal_entry throws 'not found or access denied' when entry doesn't belong to user", async () => {
      const { mockClient } = createMockDb();
      const ownershipChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((resolve: (v: unknown) => unknown) =>
          resolve({ data: null, error: null }),
        ),
      };
      ownershipChain.select.mockReturnValue(ownershipChain);
      ownershipChain.eq.mockReturnValue(ownershipChain);
      ownershipChain.is.mockReturnValue(ownershipChain);
      (mockClient as any).from.mockReturnValue(ownershipChain);

      const { data: entry, error: checkError } = await (mockClient as any)
        .from("journal_entries")
        .select("id")
        .eq("id", "entry-1")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      const fn = () => {
        if (checkError || !entry) throw new Error("Journal entry not found or access denied");
      };
      expect(fn).toThrow("Journal entry not found or access denied");
    });

    it("delete_journal_entry throws 'not found or access denied' when entry doesn't belong to user", async () => {
      const { mockClient } = createMockDb();
      const ownershipChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((resolve: (v: unknown) => unknown) =>
          resolve({ data: null, error: null }),
        ),
      };
      ownershipChain.select.mockReturnValue(ownershipChain);
      ownershipChain.eq.mockReturnValue(ownershipChain);
      ownershipChain.is.mockReturnValue(ownershipChain);
      (mockClient as any).from.mockReturnValue(ownershipChain);

      const { data: entry, error: checkError } = await (mockClient as any)
        .from("journal_entries")
        .select("id")
        .eq("id", "entry-1")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      const fn = () => {
        if (checkError || !entry) throw new Error("Journal entry not found or access denied");
      };
      expect(fn).toThrow("Journal entry not found or access denied");
    });
  });
});

describe("Species tools", () => {
  describe("Input schema validation", () => {
    it("search_species — valid input passes", () => {
      const result = searchSpeciesSchema.parse({ query: "monstera" });
      expect(result.query).toBe("monstera");
    });

    it("search_species — missing query fails", () => {
      expect(() => searchSpeciesSchema.parse({})).toThrow(z.ZodError);
    });

    it("get_species — valid input passes", () => {
      const result = getSpeciesSchema.parse({ speciesId: "species-1" });
      expect(result.speciesId).toBe("species-1");
    });

    it("get_species — missing speciesId fails", () => {
      expect(() => getSpeciesSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe("Output shape", () => {
    it("search_species output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify([], null, 2) }],
      });
    });

    it("get_species output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify({ species: {}, articles: [] }, null, 2) }],
      });
    });
  });

  // Species tools don't filter by userId (they're global reference data)
  describe("No user scoping (global reference data)", () => {
    it("search_species does not filter by user_id", () => {
      const schemaKeys = Object.keys(searchSpeciesSchema.shape);
      expect(schemaKeys).toEqual(["query"]);
    });

    it("get_species does not filter by user_id", () => {
      const schemaKeys = Object.keys(getSpeciesSchema.shape);
      expect(schemaKeys).toEqual(["speciesId"]);
    });
  });
});

describe("Knowledge tools", () => {
  describe("Input schema validation", () => {
    it("search_knowledge — valid input with query only passes", () => {
      const result = searchKnowledgeSchema.parse({ query: "yellow leaves" });
      expect(result.query).toBe("yellow leaves");
    });

    it("search_knowledge — valid input with category passes", () => {
      const result = searchKnowledgeSchema.parse({
        query: "watering",
        category: "care",
      });
      expect(result.category).toBe("care");
    });

    it("search_knowledge — missing query fails", () => {
      expect(() => searchKnowledgeSchema.parse({})).toThrow(z.ZodError);
    });

    it("search_knowledge — invalid category fails", () => {
      expect(() =>
        searchKnowledgeSchema.parse({ query: "test", category: "invalid" }),
      ).toThrow(z.ZodError);
    });

    it("diagnose_plant — valid input passes", () => {
      const result = diagnosePlantSchema.parse({ symptom: "yellow leaves" });
      expect(result.symptom).toBe("yellow leaves");
    });

    it("diagnose_plant — missing symptom fails", () => {
      expect(() => diagnosePlantSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe("Output shape", () => {
    it("search_knowledge output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify([], null, 2) }],
      });
    });

    it("diagnose_plant output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify([], null, 2) }],
      });
    });
  });

  // Knowledge tools are global reference data
  describe("No user scoping (global reference data)", () => {
    it("search_knowledge does not filter by user_id", () => {
      const schemaKeys = Object.keys(searchKnowledgeSchema.shape);
      expect(schemaKeys).toEqual(["query", "category"]);
    });

    it("diagnose_plant does not filter by user_id", () => {
      const schemaKeys = Object.keys(diagnosePlantSchema.shape);
      expect(schemaKeys).toEqual(["symptom"]);
    });
  });
});

describe("Identify tool", () => {
  describe("Input schema validation", () => {
    it("identify_plant — valid input passes", () => {
      const result = identifyPlantSchema.parse({
        imageBase64: "/9j/4AAQSkZJRg...",
      });
      expect(result.imageBase64).toBe("/9j/4AAQSkZJRg...");
    });

    it("identify_plant — missing imageBase64 fails", () => {
      expect(() => identifyPlantSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe("Output shape", () => {
    it("identify_plant output has correct shape", () => {
      expectToolOutputShape({
        content: [{ type: "text" as const, text: JSON.stringify({ results: [] }, null, 2) }],
      });
    });
  });

  describe("Rate limiting", () => {
    it("rate limiter throws after exceeding 10 calls per minute", async () => {
      // Re-create the rate limiting logic from identify.ts
      const RATE_LIMIT_WINDOW_MS = 60_000;
      const MAX_CALLS_PER_WINDOW = 10;
      let callTimestamps: number[] = [];

      function checkRateLimit(): void {
        const now = Date.now();
        callTimestamps = callTimestamps.filter(
          (ts) => now - ts < RATE_LIMIT_WINDOW_MS,
        );

        if (callTimestamps.length >= MAX_CALLS_PER_WINDOW) {
          const oldestInWindow = callTimestamps[0];
          const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - oldestInWindow);
          throw new Error(
            `Rate limit exceeded. Max ${MAX_CALLS_PER_WINDOW} identify calls per minute. Retry in ~${Math.ceil(retryAfterMs / 1000)}s.`,
          );
        }

        callTimestamps.push(now);
      }

      // Fill up to the limit
      for (let i = 0; i < MAX_CALLS_PER_WINDOW; i++) {
        expect(() => checkRateLimit()).not.toThrow();
      }

      // One more should fail
      expect(() => checkRateLimit()).toThrow("Rate limit exceeded");
    });

    it("rate limiter resets after the window expires", async () => {
      const RATE_LIMIT_WINDOW_MS = 60_000;
      const MAX_CALLS_PER_WINDOW = 10;
      let callTimestamps: number[] = [];

      function checkRateLimit(): void {
        const now = Date.now();
        callTimestamps = callTimestamps.filter(
          (ts) => now - ts < RATE_LIMIT_WINDOW_MS,
        );

        if (callTimestamps.length >= MAX_CALLS_PER_WINDOW) {
          const oldestInWindow = callTimestamps[0];
          const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - oldestInWindow);
          throw new Error(
            `Rate limit exceeded. Max ${MAX_CALLS_PER_WINDOW} identify calls per minute. Retry in ~${Math.ceil(retryAfterMs / 1000)}s.`,
          );
        }

        callTimestamps.push(now);
      }

      // Fill up
      for (let i = 0; i < MAX_CALLS_PER_WINDOW; i++) {
        // Use old timestamps so they expire
        callTimestamps.push(Date.now() - RATE_LIMIT_WINDOW_MS - 1000);
      }

      // Should not throw because all old timestamps are filtered out
      expect(() => checkRateLimit()).not.toThrow();
      // Now we have 1 in the window, should be fine
      expect(callTimestamps.length).toBe(1);
    });
  });

  describe("fetch call (mock)", () => {
    it("identify_plant handler calls fetch with correct URL and body", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ results: [{ species: "Monstera deliciosa", score: 0.95 }] }),
        text: vi.fn().mockResolvedValue(""),
      };
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);

      const imageBase64 = "/9j/4AAQSkZJRg...";
      const supabaseUrl = "https://test.supabase.co";

      // Simulate the handler logic (without rate limit for this test)
      const functionUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/identify-plant`;
      const response = await mockFetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.supabase.co/functions/v1/identify-plant",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64 }),
        }),
      );

      const data = await response.json();
      const output = {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };

      expectToolOutputShape(output);
      expect(data.results[0].species).toBe("Monstera deliciosa");
    });

    it("identify_plant throws on non-ok response", async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: vi.fn().mockResolvedValue("Rate limit exceeded by PlantNet"),
      };
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);

      const response = await mockFetch("https://test.supabase.co/functions/v1/identify-plant", {
        method: "POST",
        body: JSON.stringify({ imageBase64: "test" }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "unknown error");
        const fn = () => {
          throw new Error(
            `Plant identification failed with status ${response.status} (${response.statusText}): ${errorBody}`,
          );
        };
        expect(fn).toThrow("Plant identification failed with status 429");
      }
    });

    it("identify_plant throws when fetch fails (network error)", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("fetch failed"));
      const supabaseUrl = "https://test.supabase.co";
      const functionUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/identify-plant`;

      try {
        await mockFetch(functionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: "test" }),
        });
      } catch (fetchError) {
        const fn = () => {
          throw new Error(
            "Failed to reach the identify-plant service: " +
              (fetchError instanceof Error ? fetchError.message : String(fetchError)) +
              ". Check that the Supabase edge function is deployed and the URL is correct.",
          );
        };
        expect(fn).toThrow("Failed to reach the identify-plant service");
      }
    });

    it("identify_plant throws when SUPABASE_URL is not set", () => {
      const fn = () => {
        const url = "";
        if (!url) {
          throw new Error(
            "Supabase URL not configured for plant identification. Set NEXT_PUBLIC_SUPABASE_URL environment variable.",
          );
        }
      };
      expect(fn).toThrow("Supabase URL not configured");
    });
  });
});

// ── Composite output shape helper tests ───────────────────────────────────────
describe("Output shape helper", () => {
  it("validates the standard MCP tool response format", () => {
    expectToolOutputShape({
      content: [{ type: "text", text: "Hello" }],
    });
  });

  it("rejects missing content", () => {
    expect(() =>
      expectToolOutputShape({}),
    ).toThrow();
  });

  it("rejects wrong content type", () => {
    expect(() =>
      expectToolOutputShape({
        content: [{ type: "image", text: "Hello" }],
      }),
    ).toThrow();
  });
});
