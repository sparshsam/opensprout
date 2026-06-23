"use client";

import { useState } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  Check,
  X,
  Clock,
  Calendar,
  Sprout,
  ArrowRight,
  Droplets,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompleteTaskInput } from "@/lib/data/tasks";
import type { TaskWithPlant } from "@/lib/data/tasks";
import { TaskCard } from "@/components/cards/task-card";
import { BottomSheet } from "@/components/sheets/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Skeleton } from "@/components/ui/skeleton";

function formatRelTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffHrs = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHrs < 0) return "Overdue";
  if (diffHrs < 1) return "Soon";
  if (diffHrs < 24) return `In ${diffHrs}h`;
  return `In ${Math.round(diffHrs / 24)}d`;
}

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - d.getTime()) / (1000 * 60));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.round(diffHrs / 24)}d ago`;
}

export default function HomePage() {
  const {
    data,
    tasks,
    dataLoading,
    error,
    notice,
    handleCompleteTask,
    handleSkipTask,
    handleSnoozeTask,
    handleRescheduleTask,
    refreshDashboard,
  } = useApp();

  const [activeTask, setActiveTask] = useState<TaskWithPlant | null>(null);
  const [action, setAction] = useState<"pick" | "complete" | "snooze" | "reschedule">("pick");
  const [busyAction, setBusyAction] = useState(false);
  const [amountMl, setAmountMl] = useState("");
  const [fertName, setFertName] = useState("");
  const [fertStrength, setFertStrength] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [pickDate, setPickDate] = useState("");

  const totalDue = tasks.overdue.length + tasks.today.length;
  const allUpcoming = [...tasks.overdue, ...tasks.today, ...tasks.upcoming];
  const recentLogs = [...data.logs].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );
  const nextTask = allUpcoming[0] ?? null;

  function openSheet(task: TaskWithPlant) {
    setActiveTask(task);
    setAction("pick");
    setAmountMl(""); setFertName(""); setFertStrength(""); setTaskNotes(""); setPickDate("");
    setBusyAction(false);
  }
  function closeSheet() { setActiveTask(null); setAction("pick"); }
  async function doComplete() {
    if (!activeTask) return; setBusyAction(true);
    const input: CompleteTaskInput = {};
    if (amountMl) input.amount_ml = Number(amountMl);
    if (fertName) input.fertilizer_name = fertName;
    if (fertStrength) input.fertilizer_strength = fertStrength;
    if (taskNotes) input.notes = taskNotes;
    await handleCompleteTask(activeTask.id, input);
    closeSheet();
  }
  async function doSkip() { if (!activeTask) return; setBusyAction(true); await handleSkipTask(activeTask.id); closeSheet(); }
  async function doSnooze() { if (!activeTask || !pickDate) return; setBusyAction(true); await handleSnoozeTask(activeTask.id, new Date(pickDate).toISOString()); closeSheet(); }
  async function doReschedule() { if (!activeTask || !pickDate) return; setBusyAction(true); await handleRescheduleTask(activeTask.id, new Date(pickDate).toISOString()); closeSheet(); }

  const isLoading = dataLoading && tasks.overdue.length === 0 && tasks.today.length === 0;
  const hasContent = data.plants.length > 0 || totalDue > 0 || tasks.upcoming.length > 0;

  return (
    <>
      {/* ── Status ── */}
      {(error || notice) && (
        <div
          className={cn(
            "mb-16 rounded-full px-6 py-3 text-sm font-semibold",
            error
              ? "bg-destructive/10 text-destructive"
              : "bg-primary-light text-primary",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{error ?? notice}</span>
            {error && (
              <button
                onClick={refreshDashboard}
                className="rounded-full bg-destructive/20 px-4 py-1.5 text-xs font-bold tracking-wider uppercase"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      <PullToRefresh onRefresh={refreshDashboard}>
        {isLoading ? (
          <div className="space-y-20">
            <div className="space-y-6">
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-16 w-full max-w-xl rounded-full" />
              <Skeleton className="h-12 w-44 rounded-full" />
            </div>
          </div>
        ) : hasContent ? (
          <>
            {/* ════════════════════════════════════ */}
            {/* Hero — brand statement              */}
            {/* ════════════════════════════════════ */}
            <section className="mb-20 sm:mb-28">
              <p className="text-label mb-4 text-primary">OpenSprout</p>
              <h1 className="text-hero mb-6 max-w-2xl text-foreground">
                Track, care, and grow.
              </h1>
              <p className="mb-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Your personal plant care station. Know what every plant needs,
                when it needs it.
              </p>
              <div className="flex flex-wrap gap-3">
                {totalDue > 0 ? (
                  <>
                    <button
                      onClick={() =>
                        document
                          .getElementById("care-section")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                    >
                      {totalDue} plant{totalDue !== 1 ? "s" : ""} need care
                    </button>
                    <a
                      href="/plants"
                      className="rounded-full bg-muted px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/80"
                    >
                      View collection
                    </a>
                  </>
                ) : data.plants.length > 0 ? (
                  <>
                    <div className="rounded-full bg-primary/10 px-8 py-3.5 text-sm font-semibold text-primary">
                      All caught up
                    </div>
                    <a
                      href="/plants"
                      className="rounded-full bg-muted px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/80"
                    >
                      Check on your plants
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href="/plants"
                      className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                    >
                      Add your first plant
                    </a>
                    <a
                      href="/identify"
                      className="rounded-full bg-muted px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/80"
                    >
                      Identify a plant
                    </a>
                  </>
                )}
              </div>
            </section>

            {/* ════════════════════════════════════ */}
            {/* Today's Care                        */}
            {/* ════════════════════════════════════ */}
            {nextTask && (
              <section id="care-section" className="mb-20 sm:mb-28">
                <p className="text-label mb-6 text-muted-foreground">Next care</p>

                <div className="border-t border-border pt-8">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <p className="text-display mb-2 text-foreground">
                        {nextTask.plantName}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold tracking-wider uppercase text-primary">
                          {nextTask.care_type}
                        </span>
                        <span>
                          {nextTask.due_at ? formatRelTime(nextTask.due_at) : ""}
                        </span>
                      </div>
                      <button
                        onClick={() => openSheet(nextTask)}
                        className="mt-6 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                      >
                        Mark as done
                      </button>
                    </div>
                    <div className="hidden shrink-0 sm:block">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Sprout size={28} aria-hidden />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ════════════════════════════════════ */}
            {/* Upcoming reminders                  */}
            {/* ════════════════════════════════════ */}
            {(tasks.upcoming.length > 0 || totalDue > 0) && (
              <section className="mb-20 sm:mb-28">
                <p className="text-label mb-6 text-muted-foreground">Upcoming</p>

                <div className="space-y-3">
                  {tasks.overdue.slice(0, 3).map((task) => (
                    <ReminderRow
                      key={task.id}
                      task={task}
                      overdue
                      onClick={() => openSheet(task)}
                    />
                  ))}
                  {tasks.today.slice(0, 4).map((task) => (
                    <ReminderRow
                      key={task.id}
                      task={task}
                      onClick={() => openSheet(task)}
                    />
                  ))}
                  {tasks.upcoming.slice(0, 3).map((task) => (
                    <ReminderRow
                      key={task.id}
                      task={task}
                      subdued
                      onClick={() => openSheet(task)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ════════════════════════════════════ */}
            {/* Collection snapshot                 */}
            {/* ════════════════════════════════════ */}
            {data.plants.length > 0 && (
              <section className="mb-20 sm:mb-28">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-label text-muted-foreground">
                    {data.plants.length} plant{data.plants.length !== 1 ? "s" : ""}
                  </p>
                  <a
                    href="/plants"
                    className="rounded-full bg-muted px-5 py-2 text-xs font-semibold text-foreground hover:bg-muted/80"
                  >
                    View all
                  </a>
                </div>
                <div className="space-y-3">
                  {data.plants.slice(0, 6).map((plant) => (
                    <PlantCollectionRow
                      key={plant.id}
                      name={plant.name}
                      species={plant.species}
                      health={plant.health_status}
                      location={plant.location}
                    />
                  ))}
                </div>
                {data.plants.length > 6 && (
                  <a
                    href="/plants"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                  >
                    View all {data.plants.length} plants <ArrowRight size={14} />
                  </a>
                )}
              </section>
            )}

            {/* ════════════════════════════════════ */}
            {/* Recent care                         */}
            {/* ════════════════════════════════════ */}
            {recentLogs.length > 0 && (
              <section className="mb-8">
                <p className="text-label mb-6 text-muted-foreground">Recent care</p>
                <div className="space-y-2">
                  {recentLogs.slice(0, 5).map((log) => {
                    const plant = data.plants.find((p) => p.id === log.plant_id);
                    return (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 rounded-full bg-muted/50 px-6 py-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Droplets size={14} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            <span className="capitalize">{log.care_type}</span>
                            {" — "}
                            {plant?.name ?? "Unknown plant"}
                          </p>
                        </div>
                        <time className="shrink-0 text-xs font-semibold text-muted-foreground">
                          {formatTimeAgo(log.occurred_at)}
                        </time>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        ) : (
          /* ── Empty state (first visit) ── */
          <section className="pt-20 sm:pt-28">
            <div className="mx-auto max-w-lg text-center">
              <p className="text-label mb-4 text-primary">OpenSprout</p>
              <h2 className="text-hero mb-6 text-foreground">
                Welcome to OpenSprout
              </h2>
              <p className="mb-8 max-w-md mx-auto text-base leading-relaxed text-muted-foreground">
                Track watering, log care, and keep your plants thriving. Add your first plant to start.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a
                  href="/plants"
                  className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                >
                  Add your first plant
                </a>
                <a
                  href="/identify"
                  className="rounded-full bg-muted px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/80"
                >
                  Identify a plant
                </a>
              </div>
            </div>
          </section>
        )}
      </PullToRefresh>

      {/* ── Task Action Sheet ── */}
      <BottomSheet open={activeTask !== null} onClose={closeSheet} title={activeTask ? `${activeTask.plantName}` : undefined}>
        {activeTask && action === "pick" && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground capitalize">
              {activeTask.care_type} care &middot; {activeTask.due_at?.slice(0, 10)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ActionButton icon={<Check size={22} />} label="Complete" variant="primary" onClick={() => setAction("complete")} />
              <ActionButton icon={<X size={22} />} label="Skip" variant="danger" onClick={doSkip} disabled={busyAction} />
              <ActionButton icon={<Clock size={22} />} label="Snooze" variant="outline" onClick={() => setAction("snooze")} />
              <ActionButton icon={<Calendar size={22} />} label="Reschedule" variant="outline" onClick={() => setAction("reschedule")} />
            </div>
          </div>
        )}
        {activeTask && action === "complete" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground">Log care details (optional)</p>
            <label className="block text-sm font-semibold">
              Water amount (ml)
              <Input className="mt-1 rounded-full text-sm" type="number" min={0} placeholder="e.g. 200" value={amountMl} onChange={(e) => setAmountMl(e.target.value)} />
            </label>
            <label className="block text-sm font-semibold">
              Fertilizer name
              <Input className="mt-1 rounded-full text-sm" placeholder="e.g. 20-20-20 liquid" value={fertName} onChange={(e) => setFertName(e.target.value)} />
            </label>
            <label className="block text-sm font-semibold">
              Notes
              <textarea className="mt-1 min-h-24 w-full rounded-2xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Any observations..." value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} />
            </label>
            <div className="flex gap-3">
              <Button onClick={doComplete} disabled={busyAction}><Check size={16} /> Complete</Button>
              <Button variant="outline" onClick={() => setAction("pick")}>Back</Button>
            </div>
          </div>
        )}
        {activeTask && action === "snooze" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Snooze until:</p>
            <Input type="datetime-local" value={pickDate} onChange={(e) => setPickDate(e.target.value)} className="rounded-full text-sm" />
            <div className="flex gap-3">
              <Button onClick={doSnooze} disabled={busyAction || !pickDate}>Snooze</Button>
              <Button variant="outline" onClick={() => setAction("pick")}>Back</Button>
            </div>
          </div>
        )}
        {activeTask && action === "reschedule" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">New due date:</p>
            <Input type="datetime-local" value={pickDate} onChange={(e) => setPickDate(e.target.value)} className="rounded-full text-sm" />
            <div className="flex gap-3">
              <Button onClick={doReschedule} disabled={busyAction || !pickDate}>Reschedule</Button>
              <Button variant="outline" onClick={() => setAction("pick")}>Back</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

// ── Sub-components ──

function ReminderRow({ task, overdue, subdued, onClick }: {
  task: TaskWithPlant; overdue?: boolean; subdued?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-full px-6 py-3.5 text-left transition hover:bg-muted/70 active:scale-[0.99]",
        overdue && "bg-destructive/5",
        !overdue && !subdued && "bg-muted/30",
      )}
    >
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        overdue ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
      )}>
        <Droplets size={16} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold", overdue && "text-destructive", subdued && "text-muted-foreground/70")}>
          {task.plantName}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground capitalize">{task.care_type}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className={cn("block text-sm font-semibold", overdue && "text-destructive", subdued && "text-muted-foreground/50")}>
          {task.due_at ? formatRelTime(task.due_at) : ""}
        </span>
        {overdue && <span className="text-xs font-bold text-destructive">Overdue</span>}
      </div>
    </button>
  );
}

function PlantCollectionRow({ name, species, health, location }: {
  name: string; species: string | null; health: string | null; location: string | null;
}) {
  return (
    <a href="/plants" className="flex items-center gap-4 rounded-full bg-muted/30 px-6 py-3.5 transition hover:bg-muted/70">
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        health === "thriving" || health === "stable"
          ? "bg-primary/10 text-primary"
          : health === "watch" || health === "struggling"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground",
      )}>
        {health ? health.charAt(0).toUpperCase() : "?"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        {species && <p className="text-xs text-muted-foreground">{species}</p>}
      </div>
      {location && <span className="shrink-0 text-xs text-muted-foreground">{location}</span>}
    </a>
  );
}

function ActionButton({ icon, label, variant, onClick, disabled }: {
  icon: React.ReactNode; label: string; variant: "primary" | "danger" | "outline"; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border p-5 text-sm font-semibold transition active:scale-[0.97]",
        variant === "primary" && "border-primary bg-primary text-primary-foreground hover:brightness-110",
        variant === "danger" && "border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10",
        variant === "outline" && "border-border bg-white text-foreground hover:bg-muted",
        disabled && "opacity-40 pointer-events-none",
      )}>
      {icon}{label}
    </button>
  );
}
