import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Client } from "../supabase.js";

const CARE_TYPES = [
  "water",
  "fertilize",
  "mist",
  "rotate",
  "prune",
  "repot",
  "inspect",
  "custom",
] as const;

export function registerCareTools(
  server: McpServer,
  getClient: () => Client,
  userId: string,
) {
  server.tool(
    "list_care_schedules",
    "List care schedules for a specific plant or all plants. Shows what care is needed, how often, and when each type of care is next due.",
    {
      plantId: z
        .string()
        .optional()
        .describe("Filter by plant ID (omit for all plants)"),
    },
    async ({ plantId }) => {
      let query = getClient()
        .from("opensprout_care_schedules")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .is("deleted_at", null);

      if (plantId) {
        query = query.eq("plant_id", plantId);
      }

      const { data, error } = await query.order("next_due_at");

      if (error) throw new Error("Failed to list care schedules: " + error.message);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );

  server.tool(
    "list_care_logs",
    "List recent care activity logs for a plant. Shows what care has been done, when, and any notes. Use this to check watering history or other care patterns.",
    {
      plantId: z.string().describe("The plant ID"),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Maximum number of logs to return"),
    },
    async ({ plantId, limit }) => {
      const { data, error } = await getClient()
        .from("opensprout_care_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("plant_id", plantId)
        .is("deleted_at", null)
        .order("occurred_at", { ascending: false })
        .limit(limit);

      if (error) throw new Error("Failed to list care logs: " + error.message);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );

  server.tool(
    "list_task_instances",
    "List pending or completed care tasks. Optionally filter by plant or status. Use this to check what care is due today or to review completed tasks.",
    {
      plantId: z
        .string()
        .optional()
        .describe("Filter by plant ID (omit for all plants)"),
      status: z
        .enum(["pending", "done", "skipped", "snoozed", "cancelled"])
        .optional()
        .describe("Filter by task status"),
    },
    async ({ plantId, status }) => {
      let query = getClient()
        .from("opensprout_task_instances")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null);

      if (plantId) query = query.eq("plant_id", plantId);
      if (status) query = query.eq("status", status);

      const { data, error } = await query.order("due_at");

      if (error) throw new Error("Failed to list task instances: " + error.message);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );

  server.tool(
    "log_care_activity",
    "Log a care activity for a plant, such as watering, fertilizing, or misting. Optionally marks a pending care task as complete. Use this to record every time you care for your plants.",
    {
      plantId: z.string().describe("The plant ID"),
      careType: z
        .enum(CARE_TYPES)
        .describe("Type of care activity performed"),
      notes: z.string().optional().describe("Optional notes about the activity"),
      amountMl: z
        .number()
        .optional()
        .describe("Water amount in milliliters (for watering)"),
      taskInstanceId: z
        .string()
        .optional()
        .describe("Optional task instance ID to mark complete"),
    },
    async ({ plantId, careType, notes, amountMl, taskInstanceId }) => {
      const c = getClient() as any;

      // Ownership check: verify plant belongs to this user
      const { data: plant, error: plantError } = await c
        .from("opensprout_plants")
        .select("id")
        .eq("id", plantId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();
      if (plantError || !plant) throw new Error("Plant not found or access denied");

      const { data: log, error: logError } = await c
        .from("opensprout_care_logs")
        .insert({
          plant_id: plantId,
          user_id: userId,
          care_type: careType,
          notes: notes ?? null,
          amount_ml: amountMl ?? null,
        })
        .select()
        .single();

      if (logError) throw new Error("Failed to log care activity: " + logError.message);

      if (taskInstanceId) {
        await c
          .from("opensprout_task_instances")
          .update({
            status: "done",
            completed_at: new Date().toISOString(),
          })
          .eq("id", taskInstanceId);
      }

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(log, null, 2) },
        ],
      };
    },
  );

  server.tool(
    "complete_task",
    "Mark a care task as done. This creates a care log entry and updates the task status. Use this when you've completed a scheduled care task without needing to log additional details.",
    {
      taskId: z.string().describe("The task instance ID to mark complete"),
      notes: z.string().optional().describe("Optional completion notes"),
    },
    async ({ taskId, notes }) => {
      const c = getClient() as any;

      const { data: tasks, error: taskError } = await c
        .from("opensprout_task_instances")
        .select("*")
        .eq("id", taskId)
        .eq("user_id", userId)
        .is("deleted_at", null);

      if (taskError) throw new Error("Failed to look up task: " + taskError.message);
      const task = tasks?.[0];
      if (!task) {
        throw new Error("Task not found");
      }

      const now = new Date().toISOString();

      const { data: log, error: logError } = await c
        .from("opensprout_care_logs")
        .insert({
          plant_id: task.plant_id,
          user_id: userId,
          care_type: task.care_type,
          notes: notes ?? null,
          task_instance_id: taskId,
        })
        .select()
        .single();

      if (logError) throw new Error("Failed to create care log for task completion: " + logError.message);

      await c
        .from("opensprout_task_instances")
        .update({
          status: "done",
          completed_at: now,
          completed_log_id: log.id,
        })
        .eq("id", taskId);

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(log, null, 2) },
        ],
      };
    },
  );

  // ── Create care schedule ───────────────────────────────────────────
  server.tool(
    "create_care_schedule",
    "Create a recurring care schedule for a plant. Specify the care type, how often it repeats, and when it starts.",
    {
      plantId: z.string().describe("The ID of the plant to schedule care for"),
      careType: z
        .enum(CARE_TYPES)
        .describe("Type of care to schedule"),
      cadenceValue: z
        .number()
        .int()
        .positive()
        .describe("How often the care repeats (e.g. 2 for every 2 days/weeks/months)"),
      cadenceUnit: z
        .enum(["day", "week", "month"])
        .describe("The time unit for the cadence"),
      startDate: z.string().describe("When the schedule starts (ISO 8601 date)"),
      notes: z.string().optional().describe("Optional notes about this care schedule"),
    },
    async ({ plantId, careType, cadenceValue, cadenceUnit, startDate, notes }) => {
      const c = getClient() as any;

      // Verify plant ownership
      const { data: plant, error: plantError } = await c
        .from("opensprout_plants")
        .select("id")
        .eq("id", plantId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      if (plantError || !plant) {
        throw new Error("Plant not found or access denied");
      }

      const { data, error } = await c
        .from("opensprout_care_schedules")
        .insert({
          plant_id: plantId,
          user_id: userId,
          care_type: careType,
          cadence_value: cadenceValue,
          cadence_unit: cadenceUnit,
          start_date: startDate,
          notes: notes ?? null,
          active: true,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create care schedule: ${error.message}`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    },
  );

  // ── Skip task ──────────────────────────────────────────────────────
  server.tool(
    "skip_task",
    "Skip a pending care task without marking it done. Optionally add a note explaining why.",
    {
      taskId: z.string().describe("The task instance ID to skip"),
      notes: z.string().optional().describe("Optional reason for skipping"),
    },
    async ({ taskId, notes }) => {
      const c = getClient() as any;

      // Ownership check
      const { data: task, error: taskError } = await c
        .from("opensprout_task_instances")
        .select("id")
        .eq("id", taskId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      if (taskError || !task) {
        throw new Error("Task not found or access denied");
      }

      const { error } = await c
        .from("opensprout_task_instances")
        .update({
          status: "skipped",
          skipped_at: new Date().toISOString(),
          notes: notes ?? null,
        })
        .eq("id", taskId);

      if (error) throw new Error(`Failed to skip task: ${error.message}`);
      return {
        content: [
          { type: "text" as const, text: `Task ${taskId} skipped successfully.` },
        ],
      };
    },
  );

  // ── Get upcoming tasks ──────────────────────────────────────────────
  server.tool(
    "get_upcoming_tasks",
    "Get care tasks that are due soon. Returns tasks due within the next N days (default 7), with the plant name and location included for context.",
    {
      days: z
        .number()
        .int()
        .positive()
        .optional()
        .default(7)
        .describe("Number of days ahead to look for upcoming tasks (default: 7)"),
    },
    async ({ days }) => {
      const futureDate = new Date(Date.now() + days * 86400000).toISOString();
      const { data, error } = await getClient()
        .from("opensprout_task_instances")
        .select("*, opensprout_plants!inner(name, location)")
        .eq("user_id", userId)
        .eq("status", "pending")
        .is("deleted_at", null)
        .lte("due_at", futureDate)
        .order("due_at");

      if (error) throw new Error("Failed to get upcoming tasks: " + error.message);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );

  // ── Snooze task ────────────────────────────────────────────────────
  server.tool(
    "snooze_task",
    "Snooze a pending care task until a specific date/time. The task will reappear as pending after that time.",
    {
      taskId: z.string().describe("The task instance ID to snooze"),
      until: z.string().describe("The date/time until which to snooze (ISO 8601)"),
    },
    async ({ taskId, until }) => {
      const c = getClient() as any;

      // Ownership check
      const { data: task, error: taskError } = await c
        .from("opensprout_task_instances")
        .select("id")
        .eq("id", taskId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      if (taskError || !task) {
        throw new Error("Task not found or access denied");
      }

      const { error } = await c
        .from("opensprout_task_instances")
        .update({
          status: "snoozed",
          snoozed_until: until,
        })
        .eq("id", taskId);

      if (error) throw new Error(`Failed to snooze task: ${error.message}`);
      return {
        content: [
          { type: "text" as const, text: `Task ${taskId} snoozed until ${until}.` },
        ],
      };
    },
  );
}
