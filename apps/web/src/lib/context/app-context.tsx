"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { buildCareTasks, formatDueDate } from "@/lib/data/care";
import {
  createPlant,
  deletePlant,
  listDashboardData,
  markCareDone,
  updatePlant,
  type DashboardData,
  type PlantFormValues,
} from "@/lib/data/plants";
import { listPlantSpecies } from "@/lib/data/species";
import type {
  CareType,
  PlantRow,
  PlantSpeciesRow,
} from "@/lib/data/types";
import { ValidationError } from "@/lib/data/validation";
import { signOut } from "@/lib/data/auth";
import {
  ensureTaskInstances,
  listTasks,
  completeTask,
  skipTask,
  snoozeTask,
  rescheduleTask,
  type CompleteTaskInput,
  type TaskWithPlant,
} from "@/lib/data/tasks";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/data/types";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type Client = SupabaseClient<Database>;

export interface AppState {
  supabase: Client | null;
  user: User | null;
  data: DashboardData;
  speciesList: PlantSpeciesRow[];
  sessionLoading: boolean;
  dataLoading: boolean;
  error: string | null;
  notice: string | null;
  tasks: { overdue: TaskWithPlant[]; today: TaskWithPlant[]; upcoming: TaskWithPlant[] };
  setError: (err: string | null) => void;
  setNotice: (msg: string | null) => void;
  refreshDashboard: () => Promise<void>;
  handleCreatePlant: (values: PlantFormValues) => Promise<PlantRow>;
  handleUpdatePlant: (
    plantId: string,
    values: PlantFormValues,
  ) => Promise<void>;
  handleDeletePlant: (plant: PlantRow) => Promise<void>;
  handleMarkCare: (
    plantId: string,
    careType: CareType,
    plantName: string,
  ) => Promise<void>;
  handleCompleteTask: (taskId: string, input?: CompleteTaskInput) => Promise<void>;
  handleSkipTask: (taskId: string) => Promise<void>;
  handleSnoozeTask: (taskId: string, snoozeUntil: string) => Promise<void>;
  handleRescheduleTask: (taskId: string, newDueAt: string) => Promise<void>;
  handleSignOut: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

// ──────────────────────────────────────────────
// Error helper
// ──────────────────────────────────────────────

function errorMessage(error: unknown) {
  console.error(error);
  if (error instanceof ValidationError) return error.message;
  return "Something went wrong. Please try again.";
}

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo<Client | null>(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardData>({
    plants: [],
    schedules: [],
    logs: [],
  });
  const [speciesList, setSpeciesList] = useState<PlantSpeciesRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tasks, setTasks] = useState<{ overdue: TaskWithPlant[]; today: TaskWithPlant[]; upcoming: TaskWithPlant[] }>({
    overdue: [],
    today: [],
    upcoming: [],
  });

  // Session listener
  useEffect(() => {
    const client = supabase;
    if (!client) {
      setSessionLoading(false);
      return;
    }
    let mounted = true;

    client.auth.getSession().then(({ data: authData }) => {
      if (!mounted) return;
      setUser(authData.session?.user ?? null);
      setSessionLoading(false);
    });

    const { data: listener } = client.auth.onAuthStateChange(
      (_event, nextSession: Session | null) => {
        setUser(nextSession?.user ?? null);
        setError(null);
        setNotice(null);
        if (!nextSession) {
          setData({ plants: [], schedules: [], logs: [] });
        }
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Refresh dashboard data
  const refreshDashboard = useCallback(async () => {
    const client = supabase;
    if (!user || !client) return;

    setDataLoading(true);
    setError(null);
    try {
      const [nextData] = await Promise.all([
        listDashboardData(client, user.id),
        ensureTaskInstances(client, user.id),
      ]);
      setData(nextData);
      const taskResult = await listTasks(client, user.id);
      setTasks(taskResult);
    } catch (refreshError) {
      setError(errorMessage(refreshError));
    } finally {
      setDataLoading(false);
    }
  }, [supabase, user]);

  // Load dashboard on user change
  useEffect(() => {
    if (user) {
      void refreshDashboard();
    }
  }, [refreshDashboard, user]);

  // Load species templates
  useEffect(() => {
    const client = supabase;
    if (!user || !client) return;

    let mounted = true;
    listPlantSpecies(client)
      .then((templates) => {
        if (mounted) setSpeciesList(templates);
      })
      .catch((speciesError) => {
        if (mounted) setError(errorMessage(speciesError));
      });

    return () => {
      mounted = false;
    };
  }, [supabase, user]);

  const handleCreatePlant = useCallback(
    async (values: PlantFormValues) => {
      const client = supabase;
      if (!user || !client) throw new Error("Not authenticated");
      setError(null);
      const created = await createPlant(client, user.id, values);
      setNotice(`${created.name} added.`);
      await refreshDashboard();
      return created;
    },
    [supabase, user, refreshDashboard],
  );

  const handleUpdatePlant = useCallback(
    async (plantId: string, values: PlantFormValues) => {
      const client = supabase;
      if (!user || !client) throw new Error("Not authenticated");
      setError(null);
      const updated = await updatePlant(client, user.id, plantId, values);
      setNotice(`${updated.name} updated.`);
      await refreshDashboard();
    },
    [supabase, user, refreshDashboard],
  );

  const handleDeletePlant = useCallback(
    async (plant: PlantRow) => {
      const client = supabase;
      if (!user || !client) return;
      setError(null);
      await deletePlant(client, user.id, plant.id);
      setNotice(`${plant.name} deleted.`);
      await refreshDashboard();
    },
    [supabase, user, refreshDashboard],
  );

  const handleMarkCare = useCallback(
    async (plantId: string, careType: CareType, plantName: string) => {
      const client = supabase;
      if (!user || !client) return;
      setError(null);
      await markCareDone(client, user.id, plantId, careType);
      setNotice(
        `${plantName} marked ${careType === "water" ? "watered" : "fertilized"}.`,
      );
      await refreshDashboard();
    },
    [supabase, user, refreshDashboard],
  );

  const handleSignOut = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    await signOut(client);
  }, [supabase]);

  const handleCompleteTask = useCallback(
    async (taskId: string, input?: CompleteTaskInput) => {
      const client = supabase;
      if (!user || !client) return;
      setError(null);
      await completeTask(client, user.id, taskId, input);
      setNotice("Task completed.");
      await refreshDashboard();
    },
    [supabase, user, refreshDashboard],
  );

  const handleSkipTask = useCallback(
    async (taskId: string) => {
      const client = supabase;
      if (!user || !client) return;
      setError(null);
      await skipTask(client, user.id, taskId);
      setNotice("Task skipped.");
      await refreshDashboard();
    },
    [supabase, user, refreshDashboard],
  );

  const handleSnoozeTask = useCallback(
    async (taskId: string, snoozeUntil: string) => {
      const client = supabase;
      if (!user || !client) return;
      setError(null);
      await snoozeTask(client, user.id, taskId, snoozeUntil);
      setNotice("Task snoozed.");
      await refreshDashboard();
    },
    [supabase, user, refreshDashboard],
  );

  const handleRescheduleTask = useCallback(
    async (taskId: string, newDueAt: string) => {
      const client = supabase;
      if (!user || !client) return;
      setError(null);
      await rescheduleTask(client, user.id, taskId, newDueAt);
      setNotice("Task rescheduled.");
      await refreshDashboard();
    },
    [supabase, user, refreshDashboard],
  );

  const value = useMemo<AppState>(
    () => ({
      supabase,
      user: user,
      data,
      speciesList,
      sessionLoading,
      dataLoading,
      error,
      notice,
      tasks,
      setError,
      setNotice,
      refreshDashboard,
      handleCreatePlant,
      handleUpdatePlant,
      handleDeletePlant,
      handleMarkCare,
      handleCompleteTask,
      handleSkipTask,
      handleSnoozeTask,
      handleRescheduleTask,
      handleSignOut,
    }),
    [
      supabase,
      user,
      data,
      speciesList,
      sessionLoading,
      dataLoading,
      error,
      notice,
      tasks,
      refreshDashboard,
      handleCreatePlant,
      handleUpdatePlant,
      handleDeletePlant,
      handleMarkCare,
      handleCompleteTask,
      handleSkipTask,
      handleSnoozeTask,
      handleRescheduleTask,
      handleSignOut,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}

// Re-export care helpers for convenience
export { buildCareTasks, formatDueDate };
