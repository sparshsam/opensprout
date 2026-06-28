"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Check,
  X,
  Clock,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskWithPlant, CompleteTaskInput } from "@/lib/data/tasks";
import { TaskCard } from "@/components/cards/task-card";
import { BottomSheet } from "@/components/sheets/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PullToRefresh } from "@/components/pull-to-refresh";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/data/types";

type Client = SupabaseClient<Database>;

// ── Helpers ───────────────────────────────────

function getMonthDays(year: number, month: number): (number | null)[] {
  // month is 0-indexed (Jan = 0)
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];

  // Padding for days before the 1st
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(null);
  }

  // Actual day numbers
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return cells;
}

function formatMonthLabel(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatAgendaLabel(dateKey: string): string {
  const d = new Date(dateKey + "T12:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (d.toDateString() === today.toDateString()) return `Today — ${dateStr}`;
  if (d.toDateString() === tomorrow.toDateString())
    return `Tomorrow — ${dateStr}`;
  if (d.toDateString() === yesterday.toDateString())
    return `Yesterday — ${dateStr}`;
  return dateStr;
}

// ── Data fetch ────────────────────────────────

async function fetchMonthTasks(
  client: Client,
  userId: string,
  year: number,
  month: number,
): Promise<Map<string, TaskWithPlant[]>> {
  const startStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const endStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}T23:59:59`;

  const { data: plants } = await client
    .from("opensprout_plants")
    .select("id, name, location")
    .eq("user_id", userId)
    .is("deleted_at", null);

  const plantMap = new Map(
    (plants ?? []).map((p) => [p.id, { name: p.name, location: p.location }]),
  );

  const { data: tasks, error } = await client
    .from("opensprout_task_instances")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "snoozed"])
    .is("deleted_at", null)
    .gte("due_at", startStr)
    .lte("due_at", endStr)
    .order("due_at", { ascending: true });

  if (error) throw error;
  if (!tasks) return new Map();

  const grouped = new Map<string, TaskWithPlant[]>();
  for (const t of tasks) {
    const task: TaskWithPlant = {
      ...t,
      plantName: plantMap.get(t.plant_id)?.name ?? "Unknown plant",
      plantLocation: plantMap.get(t.plant_id)?.location ?? null,
    };
    const dateKey = (t.due_at ?? "").slice(0, 10);
    if (!dateKey) continue;
    const arr = grouped.get(dateKey) ?? [];
    arr.push(task);
    grouped.set(dateKey, arr);
  }
  return grouped;
}

// ── Colors for care-type badges ──────────────

const careDotColors: Record<string, string> = {
  water: "bg-sky-500",
  fertilize: "bg-emerald-500",
  mist: "bg-cyan-500",
  rotate: "bg-violet-500",
  prune: "bg-orange-500",
  repot: "bg-rose-500",
  inspect: "bg-amber-500",
  custom: "bg-slate-500",
};

function getCareColor(careType: string): string {
  return careDotColors[careType] ?? careDotColors.custom;
}

// ── Page ──────────────────────────────────────

export default function CalendarPage() {
  const { supabase, user, handleCompleteTask, handleSkipTask, handleSnoozeTask, handleRescheduleTask } = useApp();

  // Month navigation
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed

  // Selected day for agenda
  const [selectedDate, setSelectedDate] = useState(todayKey());

  // Tasks grouped by date for the visible month
  const [monthTasks, setMonthTasks] = useState<Map<string, TaskWithPlant[]>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Task action sheet state
  const [activeTask, setActiveTask] = useState<TaskWithPlant | null>(null);
  const [action, setAction] = useState<"pick" | "complete" | "snooze" | "reschedule">("pick");
  const [busyAction, setBusyAction] = useState(false);
  const [amountMl, setAmountMl] = useState("");
  const [fertName, setFertName] = useState("");
  const [fertStrength, setFertStrength] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [pickDate, setPickDate] = useState("");

  // ── Derived ──

  const gridDays = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthLabel = useMemo(
    () => formatMonthLabel(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const agendaTasks = useMemo(
    () => monthTasks.get(selectedDate) ?? [],
    [monthTasks, selectedDate],
  );

  // ── Data fetching ──

  const loadMonth = useCallback(async () => {
    const client = supabase;
    if (!client || !user) return;
    setLoading(true);
    setError(null);
    try {
      const tasks = await fetchMonthTasks(client, user.id, viewYear, viewMonth);
      setMonthTasks(tasks);

      // If selected date is no longer in the visible month, jump to today
      const [y, m] = selectedDate.split("-").map(Number);
      if (y !== viewYear || m - 1 !== viewMonth) {
        setSelectedDate(todayKey());
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [supabase, user, viewYear, viewMonth, selectedDate]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  // ── Navigation ──

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToToday() {
    const d = new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDate(todayKey());
  }

  // ── Task action sheet ──

  function openSheet(task: TaskWithPlant) {
    setActiveTask(task);
    setAction("pick");
    setAmountMl("");
    setFertName("");
    setFertStrength("");
    setTaskNotes("");
    setPickDate("");
    setBusyAction(false);
  }

  function closeSheet() {
    setActiveTask(null);
    setAction("pick");
  }

  async function doComplete() {
    if (!activeTask) return;
    setBusyAction(true);
    const input: CompleteTaskInput = {};
    if (amountMl) input.amount_ml = Number(amountMl);
    if (fertName) input.fertilizer_name = fertName;
    if (fertStrength) input.fertilizer_strength = fertStrength;
    if (taskNotes) input.notes = taskNotes;
    await handleCompleteTask(activeTask.id, input);
    // Refresh month data
    if (supabase && user) {
      const tasks = await fetchMonthTasks(supabase, user.id, viewYear, viewMonth);
      setMonthTasks(tasks);
    }
    closeSheet();
  }

  async function doSkip() {
    if (!activeTask) return;
    setBusyAction(true);
    await handleSkipTask(activeTask.id);
    if (supabase && user) {
      const tasks = await fetchMonthTasks(supabase, user.id, viewYear, viewMonth);
      setMonthTasks(tasks);
    }
    closeSheet();
  }

  async function doSnooze() {
    if (!activeTask || !pickDate) return;
    setBusyAction(true);
    await handleSnoozeTask(activeTask.id, new Date(pickDate).toISOString());
    if (supabase && user) {
      const tasks = await fetchMonthTasks(supabase, user.id, viewYear, viewMonth);
      setMonthTasks(tasks);
    }
    closeSheet();
  }

  async function doReschedule() {
    if (!activeTask || !pickDate) return;
    setBusyAction(true);
    await handleRescheduleTask(activeTask.id, new Date(pickDate).toISOString());
    if (supabase && user) {
      const tasks = await fetchMonthTasks(supabase, user.id, viewYear, viewMonth);
      setMonthTasks(tasks);
    }
    closeSheet();
  }

  // ── Render ──

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly view of care tasks
          </p>
        </div>
      </header>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMonth}
              className="shrink-0 border-red-300 bg-white text-red-700 hover:bg-red-100 dark:bg-muted dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <RefreshCw size={14} aria-hidden />
              Retry
            </Button>
          </div>
        </div>
      )}

      <PullToRefresh onRefresh={loadMonth}>

      {/* ── Month Navigation ── */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="min-w-[180px] text-center text-lg font-bold text-foreground">
            {monthLabel}
          </h2>
          <button
            onClick={nextMonth}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-95"
        >
          Today
        </button>
      </div>

      {/* ── Month Grid ── */}
      <section className="mt-4">
        {loading ? (
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} className="py-2 text-center text-xs font-bold uppercase text-muted-foreground/50">{d}</div>
              ))}
              {[...Array(35)].map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Day-of-week headers */}
            <div className="mb-1 grid grid-cols-7 text-center text-xs font-bold uppercase text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid cells */}
            <div className="grid grid-cols-7">
              {gridDays.map((day, i) => {
                if (day === null) {
                  return (
                    <div
                      key={`pad-${i}`}
                      className="aspect-square border border-transparent"
                    />
                  );
                }

                const dateKey = toDateKey(viewYear, viewMonth, day);
                const tasksOnDay = monthTasks.get(dateKey);
                const taskCount = tasksOnDay?.length ?? 0;
                const isToday = dateKey === todayKey();
                const isSelected = dateKey === selectedDate;
                const careTypes = tasksOnDay?.map((t) => t.care_type) ?? [];

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(dateKey)}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm font-semibold transition active:scale-95",
                      isSelected && "bg-primary text-primary-foreground",
                      !isSelected && isToday && "border border-primary text-primary",
                      !isSelected &&
                        !isToday &&
                        "text-foreground hover:bg-muted",
                    )}
                  >
                    <span>{day}</span>

                    {/* Task count badge */}
                    {taskCount > 0 && !isSelected && (
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white",
                          isToday ? "bg-primary" : "bg-muted-foreground/40",
                        )}
                      >
                        {taskCount}
                      </span>
                    )}

                    {/* Colored care-type dots */}
                    {taskCount > 0 && isSelected && (
                      <span className="mt-0.5 text-[10px] font-bold text-primary-foreground/80">
                        {taskCount} task{taskCount > 1 ? "s" : ""}
                      </span>
                    )}

                    {taskCount > 0 && !isSelected && careTypes.length <= 3 && (
                      <div className="mt-0.5 flex gap-0.5">
                        {[...new Set(careTypes)].slice(0, 3).map((ct) => (
                          <span
                            key={ct}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              getCareColor(ct),
                            )}
                          />
                        ))}
                      </div>
                    )}

                    {taskCount > 3 && !isSelected && (
                      <div className="mt-0.5 flex gap-0.5">
                        {[...new Set(careTypes)].slice(0, 2).map((ct) => (
                          <span
                            key={ct}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              getCareColor(ct),
                            )}
                          />
                        ))}
                        <span className="text-[8px] leading-[6px] text-muted-foreground">
                          +
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ── Agenda ── */}
      <section className="mt-6">
        <h3 className="mb-3 text-base font-bold text-foreground">
          {formatAgendaLabel(selectedDate)}
        </h3>

        {agendaTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center shadow-panel">
            <CalendarDays
              size={36}
              className="mx-auto text-muted-foreground/40"
              aria-hidden
            />
            <p className="mt-3 text-sm text-muted-foreground">
              No care tasks for this day
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {agendaTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => openSheet(task)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Task Action Sheet ── */}
      <BottomSheet
        open={activeTask !== null}
        onClose={closeSheet}
        title={activeTask ? `${activeTask.plantName}` : undefined}
      >
        {activeTask && action === "pick" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground capitalize">
              {activeTask.care_type} care · Due{" "}
              {activeTask.due_at?.slice(0, 10)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAction("complete")}
                className="flex flex-col items-center gap-2 rounded-xl border border-primary bg-primary p-4 text-sm font-semibold text-primary-foreground transition active:scale-[0.97]"
              >
                <Check size={18} /> Complete
              </button>
              <button
                onClick={doSkip}
                disabled={busyAction}
                className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 transition active:scale-[0.97]"
              >
                <X size={18} /> Skip
              </button>
              <button
                onClick={() => setAction("snooze")}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 text-sm font-semibold text-foreground transition active:scale-[0.97] hover:bg-muted dark:bg-muted"
              >
                <Clock size={18} /> Snooze
              </button>
              <button
                onClick={() => setAction("reschedule")}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 text-sm font-semibold text-foreground transition active:scale-[0.97] hover:bg-muted dark:bg-muted"
              >
                <Calendar size={18} /> Reschedule
              </button>
            </div>
          </div>
        )}

        {activeTask && action === "complete" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground">
              Log care details (optional)
            </p>
            <label className="block text-sm font-semibold">
              Water amount (ml)
              <Input
                className="mt-1"
                type="number"
                min={0}
                placeholder="e.g. 200"
                value={amountMl}
                onChange={(e) => setAmountMl(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Fertilizer name
              <Input
                className="mt-1"
                placeholder="e.g. 20-20-20 liquid"
                value={fertName}
                onChange={(e) => setFertName(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Fertilizer strength
              <Input
                className="mt-1"
                placeholder="e.g. Half-strength"
                value={fertStrength}
                onChange={(e) => setFertStrength(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Notes
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring dark:bg-muted"
                placeholder="Any observations..."
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
              />
            </label>
            <div className="flex gap-2">
              <Button onClick={doComplete} disabled={busyAction}>
                {busyAction ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden />
                ) : (
                  <Check size={16} aria-hidden />
                )}
                Complete
              </Button>
              <Button variant="outline" onClick={() => setAction("pick")}>
                Back
              </Button>
            </div>
          </div>
        )}

        {activeTask && action === "snooze" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Snooze until:</p>
            <Input
              type="datetime-local"
              value={pickDate}
              onChange={(e) => setPickDate(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={doSnooze} disabled={busyAction || !pickDate}>
                Snooze
              </Button>
              <Button variant="outline" onClick={() => setAction("pick")}>
                Back
              </Button>
            </div>
          </div>
        )}

        {activeTask && action === "reschedule" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">New due date:</p>
            <Input
              type="datetime-local"
              value={pickDate}
              onChange={(e) => setPickDate(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                onClick={doReschedule}
                disabled={busyAction || !pickDate}
              >
                Reschedule
              </Button>
              <Button variant="outline" onClick={() => setAction("pick")}>
                Back
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
      </PullToRefresh>
    </>
  );
}
