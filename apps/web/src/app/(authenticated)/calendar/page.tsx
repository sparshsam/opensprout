"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import { CalendarDays, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarDayGroup, TaskWithPlant } from "@/lib/data/tasks";
import { listUpcomingByDate } from "@/lib/data/tasks";
import { TaskCard } from "@/components/cards/task-card";
import { BottomSheet } from "@/components/sheets/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Clock, Calendar } from "lucide-react";
import type { CompleteTaskInput } from "@/lib/data/tasks";

export default function CalendarPage() {
  const { supabase, user, handleCompleteTask, handleSkipTask, handleSnoozeTask, handleRescheduleTask } = useApp();
  const [groups, setGroups] = useState<CalendarDayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskWithPlant | null>(null);
  const [action, setAction] = useState<"pick" | "complete" | "snooze" | "reschedule">("pick");
  const [busyAction, setBusyAction] = useState(false);
  const [amountMl, setAmountMl] = useState("");
  const [fertName, setFertName] = useState("");
  const [fertStrength, setFertStrength] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [pickDate, setPickDate] = useState("");

  useEffect(() => {
    const client = supabase;
    if (!client || !user) return;
    setLoading(true);
    listUpcomingByDate(client, user.id)
      .then(setGroups)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [supabase, user]);

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
    // Refresh
    const client = supabase;
    if (client && user) {
      const g = await listUpcomingByDate(client, user.id);
      setGroups(g);
    }
    closeSheet();
  }

  async function doSkip() {
    if (!activeTask) return;
    setBusyAction(true);
    await handleSkipTask(activeTask.id);
    closeSheet();
  }

  async function doSnooze() {
    if (!activeTask || !pickDate) return;
    setBusyAction(true);
    await handleSnoozeTask(activeTask.id, new Date(pickDate).toISOString());
    closeSheet();
  }

  async function doReschedule() {
    if (!activeTask || !pickDate) return;
    setBusyAction(true);
    await handleRescheduleTask(activeTask.id, new Date(pickDate).toISOString());
    closeSheet();
  }

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upcoming care tasks grouped by date.
          </p>
        </div>
      </header>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      <section className="py-6 space-y-6">
        {loading ? (
          <div className="grid min-h-40 place-items-center text-muted-foreground">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Loader2 className="animate-spin" size={18} aria-hidden />
              Loading calendar
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center shadow-panel">
            <CalendarDays size={48} className="mx-auto text-muted-foreground/40" aria-hidden />
            <h2 className="mt-4 text-lg font-bold">All clear</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              No upcoming care tasks. Add schedules to your plants to see them here.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className={cn(
                  "text-lg font-bold",
                  group.date === "today" ? "text-amber-600" : "text-foreground",
                )}>
                  {group.label}
                </h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                  {group.tasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {group.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => openSheet(task)} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Task action sheet (same as Today) */}
      <BottomSheet open={activeTask !== null} onClose={closeSheet} title={activeTask?.plantName}>
        {activeTask && action === "pick" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground capitalize">
              {activeTask.care_type} care · Due {activeTask.due_at?.slice(0, 10)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setAction("complete")}
                className="flex flex-col items-center gap-2 rounded-xl border border-primary bg-primary p-4 text-sm font-semibold text-primary-foreground transition active:scale-[0.97]">
                <Check size={18} /> Complete
              </button>
              <button onClick={doSkip} disabled={busyAction}
                className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 transition active:scale-[0.97]">
                <X size={18} /> Skip
              </button>
              <button onClick={() => setAction("snooze")}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 text-sm font-semibold text-foreground transition active:scale-[0.97] hover:bg-muted">
                <Clock size={18} /> Snooze
              </button>
              <button onClick={() => setAction("reschedule")}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 text-sm font-semibold text-foreground transition active:scale-[0.97] hover:bg-muted">
                <Calendar size={18} /> Reschedule
              </button>
            </div>
          </div>
        )}
        {activeTask && action === "complete" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground">Log care details (optional)</p>
            <label className="text-sm font-semibold block">Water amount (ml)
              <Input className="mt-1" type="number" min={0} placeholder="e.g. 200" value={amountMl} onChange={(e) => setAmountMl(e.target.value)} />
            </label>
            <label className="text-sm font-semibold block">Fertilizer name
              <Input className="mt-1" placeholder="e.g. 20-20-20 liquid" value={fertName} onChange={(e) => setFertName(e.target.value)} />
            </label>
            <label className="text-sm font-semibold block">Fertilizer strength
              <Input className="mt-1" placeholder="e.g. Half-strength" value={fertStrength} onChange={(e) => setFertStrength(e.target.value)} />
            </label>
            <label className="text-sm font-semibold block">Notes
              <textarea className="mt-1 min-h-20 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring" placeholder="Any observations..." value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} />
            </label>
            <div className="flex gap-2">
              <Button onClick={doComplete} disabled={busyAction}>Complete</Button>
              <Button variant="outline" onClick={() => setAction("pick")}>Back</Button>
            </div>
          </div>
        )}
        {activeTask && action === "snooze" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Snooze until:</p>
            <Input type="datetime-local" value={pickDate} onChange={(e) => setPickDate(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={doSnooze} disabled={busyAction || !pickDate}>Snooze</Button>
              <Button variant="outline" onClick={() => setAction("pick")}>Back</Button>
            </div>
          </div>
        )}
        {activeTask && action === "reschedule" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">New due date:</p>
            <Input type="datetime-local" value={pickDate} onChange={(e) => setPickDate(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={doReschedule} disabled={busyAction || !pickDate}>Reschedule</Button>
              <Button variant="outline" onClick={() => setAction("pick")}>Back</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
