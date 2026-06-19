// Type definitions for Supabase database schema
// Extracted from apps/web/src/lib/data/types.ts for MCP server use

export type HealthStatus =
  | "unknown"
  | "thriving"
  | "stable"
  | "watch"
  | "struggling";
export type TaskStatus =
  | "pending"
  | "done"
  | "skipped"
  | "snoozed"
  | "cancelled";
export type CareType =
  | "water"
  | "fertilize"
  | "mist"
  | "rotate"
  | "prune"
  | "repot"
  | "inspect"
  | "custom";

export type Database = {
  public: {
    Tables: {
      plants: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          species_id: string | null;
          species: string | null;
          cultivar: string | null;
          nickname: string | null;
          location: string | null;
          acquired_on: string | null;
          notes: string | null;
          cover_photo_path: string | null;
          health_status: HealthStatus | null;
          archived_at: string | null;
          client_id: string | null;
          client_created_at: string | null;
          client_updated_at: string | null;
          sync_version: number;
          last_modified_at: string;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          species_id?: string | null;
          species?: string | null;
          cultivar?: string | null;
          nickname?: string | null;
          location?: string | null;
          acquired_on?: string | null;
          notes?: string | null;
          cover_photo_path?: string | null;
          health_status?: HealthStatus | null;
          archived_at?: string | null;
          client_id?: string | null;
          client_created_at?: string | null;
          client_updated_at?: string | null;
          sync_version?: number;
          last_modified_at?: string;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      plant_species: {
        Row: {
          id: string;
          common_name: string;
          scientific_name: string | null;
          aliases: string[];
          category: string | null;
          light_preference: string | null;
          watering_min_days: number | null;
          watering_max_days: number | null;
          fertilizing_frequency_days: number | null;
          humidity_preference: string | null;
          soil_notes: string | null;
          toxicity: string | null;
          difficulty: "beginner" | "easy" | "moderate" | "advanced" | null;
          care_summary: string | null;
          common_problems: string[];
          propagation_methods: string[];
          pruning_notes: string | null;
          repotting_notes: string | null;
          dormancy_period: string | null;
          source_name: string | null;
          source_url: string | null;
          native_region: string | null;
          growth_rate: "slow" | "moderate" | "fast" | null;
          mature_height: string | null;
          bloom_time: string | null;
          pet_safe: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      care_schedules: {
        Row: {
          id: string;
          user_id: string;
          plant_id: string;
          care_type: CareType;
          custom_label: string | null;
          cadence_value: number;
          cadence_unit: "day" | "week" | "month";
          start_date: string;
          due_time: string | null;
          timezone: string;
          active: boolean;
          notes: string | null;
          last_completed_at: string | null;
          next_due_at: string | null;
          client_id: string | null;
          client_created_at: string | null;
          client_updated_at: string | null;
          sync_version: number;
          last_modified_at: string;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      care_logs: {
        Row: {
          id: string;
          user_id: string;
          plant_id: string;
          schedule_id: string | null;
          task_instance_id: string | null;
          care_type: CareType;
          occurred_at: string;
          amount_ml: number | null;
          fertilizer_name: string | null;
          fertilizer_strength: string | null;
          notes: string | null;
          client_id: string | null;
          client_created_at: string | null;
          client_updated_at: string | null;
          sync_version: number;
          last_modified_at: string;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          plant_id: string;
          user_id: string;
          care_type: CareType;
          notes?: string | null;
          amount_ml?: number | null;
          task_instance_id?: string | null;
        };
      };
      task_instances: {
        Row: {
          id: string;
          user_id: string;
          plant_id: string;
          schedule_id: string | null;
          care_type: CareType;
          due_at: string;
          status: TaskStatus;
          completed_log_id: string | null;
          completed_at: string | null;
          skipped_at: string | null;
          snoozed_until: string | null;
          schedule_version: number | null;
          notes: string | null;
          client_id: string | null;
          client_created_at: string | null;
          client_updated_at: string | null;
          sync_version: number;
          last_modified_at: string;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          plant_id: string;
          title: string | null;
          body: string | null;
          observed_at: string;
          health_score: number | null;
          tags: string[];
          client_id: string | null;
          client_created_at: string | null;
          client_updated_at: string | null;
          sync_version: number;
          last_modified_at: string;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          plant_id: string;
          user_id: string;
          body: string;
          title?: string | null;
          health_score?: number | null;
          tags?: string[];
        };
      };
      knowledge_articles: {
        Row: {
          id: string;
          species_id: string;
          title: string;
          body: string;
          category: "care" | "diagnosis" | "propagation" | "general";
          tags: string[];
          source_name: string | null;
          source_url: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
      };
      diagnosis_entries: {
        Row: {
          id: string;
          species_id: string;
          symptom: string;
          cause: string;
          solution: string;
          severity: "minor" | "moderate" | "severe";
          category:
            | "watering"
            | "light"
            | "pests"
            | "disease"
            | "nutrient"
            | "environment";
          sort_order: number;
          created_at: string;
        };
      };
    };
  };
};
