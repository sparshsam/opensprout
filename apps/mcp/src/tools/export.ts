import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Client } from "../supabase.js";

export function registerExportTools(
  server: McpServer,
  getClient: () => Client,
  userId: string,
) {
  server.tool(
    "export_data",
    "Export all your OpenSprout data as JSON. Returns your plants, care schedules, care logs, task instances, and journal entries in a structured format suitable for backup or transfer.",
    {},
    async () => {
      const c = getClient();

      const [plants, careSchedules, careLogs, taskInstances, journalEntries] =
        await Promise.all([
          c
            .from("opensprout_plants")
            .select("*")
            .eq("user_id", userId)
            .is("deleted_at", null),
          c
            .from("opensprout_care_schedules")
            .select("*")
            .eq("user_id", userId)
            .is("deleted_at", null),
          c
            .from("opensprout_care_logs")
            .select("*")
            .eq("user_id", userId)
            .is("deleted_at", null),
          c
            .from("opensprout_task_instances")
            .select("*")
            .eq("user_id", userId)
            .is("deleted_at", null),
          c
            .from("opensprout_journal_entries")
            .select("*")
            .eq("user_id", userId)
            .is("deleted_at", null),
        ]);

      for (const [label, result] of Object.entries({
        plants,
        care_schedules: careSchedules,
        care_logs: careLogs,
        task_instances: taskInstances,
        journal_entries: journalEntries,
      })) {
        if (result.error) {
          throw new Error(`Failed to export ${label}: ${result.error.message}`);
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                plants: plants.data ?? [],
                care_schedules: careSchedules.data ?? [],
                care_logs: careLogs.data ?? [],
                task_instances: taskInstances.data ?? [],
                journal_entries: journalEntries.data ?? [],
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
