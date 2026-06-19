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
    "List care schedules for a specific plant or all plants. Shows what care is needed and how often.",
    {
      plantId: z
        .string()
        .optional()
        .describe("Filter by plant ID (omit for all plants)"),
    },
    async ({ plantId }) => {
      let query = getClient()
        .from("care_schedules")
        .select("*")
        .eq("active", true)
        .is("deleted_at", null);

      if (plantId) {
        query = query.eq("plant_id", plantId);
      }

      const { data, error } = await query.order("next_due_at");

      if (error) throw error;
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );

  server.tool(
    "list_care_logs",
    "List recent care activity logs for a plant. Shows what care has been done and when.",
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
        .from("care_logs")
        .select("*")
        .eq("plant_id", plantId)
        .is("deleted_at", null)
        .order("occurred_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );

  server.tool(
    "list_task_instances",
    "List pending or completed care tasks. Optionally filter by plant or status.",
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
        .from("task_instances")
        .select("*")
        .is("deleted_at", null);

      if (plantId) query = query.eq("plant_id", plantId);
      if (status) query = query.eq("status", status);

      const { data, error } = await query.order("due_at");

      if (error) throw error;
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );

  server.tool(
    "log_care_activity",
    "Log a care activity (e.g., watering, fertilizing) for a plant. Optionally marks a task as complete.",
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

      const { data: log, error: logError } = await c
        .from("care_logs")
        .insert({
          plant_id: plantId,
          user_id: userId,
          care_type: careType,
          notes: notes ?? null,
          amount_ml: amountMl ?? null,
        })
        .select()
        .single();

      if (logError) throw logError;

      if (taskInstanceId) {
        await c
          .from("task_instances")
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
    "Mark a care task as done without logging additional care details.",
    {
      taskId: z.string().describe("The task instance ID to mark complete"),
      notes: z.string().optional().describe("Optional completion notes"),
    },
    async ({ taskId, notes }) => {
      const c = getClient() as any;

      const { data: tasks, error: taskError } = await c
        .from("task_instances")
        .select("*")
        .eq("id", taskId)
        .is("deleted_at", null);

      if (taskError) throw taskError;
      const task = tasks?.[0];
      if (!task) {
        throw new Error("Task not found");
      }

      const now = new Date().toISOString();

      const { data: log, error: logError } = await c
        .from("care_logs")
        .insert({
          plant_id: task.plant_id,
          user_id: userId,
          care_type: task.care_type,
          notes: notes ?? null,
          task_instance_id: taskId,
        })
        .select()
        .single();

      if (logError) throw logError;

      await c
        .from("task_instances")
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
}
