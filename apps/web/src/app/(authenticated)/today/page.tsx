"use client";

import { useState } from "react";
import { useApp } from "@/lib/context/app-context";
import { Loader2, Check, X, Clock, Calendar, Sprout, Flower2, Bell, RefreshCw, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompleteTaskInput } from "@/lib/data/tasks";
import type { TaskWithPlant } from "@/lib/data/tasks";
import { TaskCard } from "@/components/cards/task-card";
import { BottomSheet } from "@/components/sheets/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Skeleton } from "@/components/ui/skeleton";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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

  // ── Task action sheet state ──
  const [activeTask, setActiveTask] = useState<TaskWithPlant | null>(null);
  const [action, setAction] = useState<"pick" | "complete" | "snooze" | "reschedule">("pick");
  const [busyAction, setBusyAction] = useState(false);

  const [amountMl, setAmountMl] = useState("");
  const [fertName, setFertName] = useState("");
  const [fertStrength, setFertStrength] = useState("");
  const [taskNotes, setTaskNotes] = useState("");

  const [pickDate, setPickDate] = useState("");

  // ── Stats ──
  const totalDue = tasks.overdue.length + tasks.today.length;
  const healthyCount = data.plants.filter(
    (p) => p.health_status === "thriving" || p.health_status === "stable",
  ).length;
  const nextReminder = tasks.today[0] ?? tasks.upcoming[0] ?? null;

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
      {/* Greeting header */}
      <header className="pb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          {greeting()}!
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Here&apos;s what your plants need today.
        </p>
      </header>

      {/* Status banner */}
      {(error || notice) && (
        <div
          className={cn(
            "mb-8 rounded-2xl border px-5 py-4 text-base font-medium",
            error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{error ?? notice}</span>
            {error && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshDashboard}
                className="shrink-0 rounded-xl border-red-300 bg-white text-red-700 hover:bg-red-100"
              >
                <RefreshCw size={14} aria-hidden />
                Retry
              </Button>
            )}
          </div>
        </div>
      )}

      <section className="space-y-10">
        <PullToRefresh onRefresh={refreshDashboard}>
          {/* Metrics — full-width grid */}
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <MetricCard
              icon={<Sprout size={24} />}
              label="Tasks due today"
              value={String(totalDue)}
              color="primary"
            />
            <MetricCard
              icon={<Flower2 size={24} />}
              label="Total plants"
              value={String(data.plants.length)}
              color="emerald"
            />
            <MetricCard
              icon={<Check size={24} />}
              label="Healthy plants"
              value={String(healthyCount)}
              color="green"
            />
            <MetricCard
              icon={<Bell size={24} />}
              label="Next reminder"
              value={nextReminder ? formatTime(nextReminder.due_at) : "None"}
              color="amber"
            />
          </div>

          {dataLoading && tasks.overdue.length === 0 && tasks.today.length === 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-3xl" />
                ))}
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-32 rounded-lg" />
                <div className="grid gap-3 md:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-2 lg:gap-8">
              {/* Task columns */}
              <div className="space-y-8">
                {tasks.overdue.length > 0 && (
                  <TaskGroupSection
                    label="Overdue"
                    count={tasks.overdue.length}
                    color="text-red-600"
                    tasks={tasks.overdue}
                    onTaskClick={openSheet}
                  />
                )}

                <TaskGroupSection
                  label="Due today"
                  count={tasks.today.length}
                  color="text-primary"
                  tasks={tasks.today}
                  onTaskClick={openSheet}
                />

                {tasks.upcoming.length > 0 && (
                  <TaskGroupSection
                    label="Upcoming"
                    count={tasks.upcoming.length}
                    color="text-muted-foreground"
                    tasks={tasks.upcoming.slice(0, 8)}
                    onTaskClick={openSheet}
                  />
                )}
              </div>

              {/* Right column — plant spotlight */}
              <div className="mt-8 lg:mt-0">
                {data.plants.length > 0 && (
                  <>
                    <h2 className="mb-4 text-xl font-bold">Your plants</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                      {data.plants.slice(0, 6).map((plant) => {
                        const plantTasks = [...tasks.overdue, ...tasks.today, ...tasks.upcoming].filter(
                          (t) => t.plant_id === plant.id
                        );
                        return (
                          <PlantSpotlightCard
                            key={plant.id}
                            name={plant.name}
                            species={plant.species}
                            health={plant.health_status}
                            location={plant.location}
                            nextTask={plantTasks[0]?.care_type ?? null}
                            nextDue={plantTasks[0]?.due_at ?? null}
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!dataLoading &&
            tasks.overdue.length === 0 && tasks.today.length === 0 && tasks.upcoming.length === 0 &&
            data.plants.length === 0 && (
            <div className="rounded-3xl bg-white px-8 pb-12 pt-16 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-md">
                <Sprout size={36} className="text-primary-foreground" aria-hidden />
              </div>
              <h2 className="mt-6 text-3xl font-bold">Welcome to OpenSprout</h2>
              <p className="mx-auto mt-3 max-w-md text-lg text-muted-foreground">
                Add your first plant to get started tracking care, schedules, and more.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <a href="/plants">
                  <Button className="rounded-xl px-6 py-3 text-base font-semibold">
                    <Sprout size={18} aria-hidden />
                    Add your first plant
                  </Button>
                </a>
                <a href="/identify">
                  <Button variant="outline" className="rounded-xl px-6 py-3 text-base font-semibold">
                    <Flower2 size={18} aria-hidden />
                    Identify a plant
                  </Button>
                </a>
              </div>
            </div>
          )}
        </PullToRefresh>
      </section>

      {/* Task Action Sheet */}
      <BottomSheet
        open={activeTask !== null}
        onClose={closeSheet}
        title={activeTask ? `${activeTask.plantName}` : undefined}
      >
        {activeTask && action === "pick" && (
          <div className="space-y-4">
            <p className="text-base text-muted-foreground capitalize">
              {activeTask.care_type} care &middot; Due {activeTask.due_at?.slice(0, 10)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ActionButton
                icon={<Check size={20} />}
                label="Complete"
                variant="primary"
                onClick={() => setAction("complete")}
              />
              <ActionButton
                icon={<X size={20} />}
                label="Skip"
                variant="danger"
                onClick={doSkip}
                disabled={busyAction}
              />
              <ActionButton
                icon={<Clock size={20} />}
                label="Snooze"
                variant="outline"
                onClick={() => setAction("snooze")}
              />
              <ActionButton
                icon={<Calendar size={20} />}
                label="Reschedule"
                variant="outline"
                onClick={() => setAction("reschedule")}
              />
            </div>
          </div>
        )}

        {activeTask && action === "complete" && (
          <div className="space-y-4">
            <p className="text-base font-semibold text-muted-foreground">Log care details (optional)</p>
            <label className="text-base font-semibold block">
              Water amount (ml)
              <Input className="mt-1 text-base" type="number" min={0} placeholder="e.g. 200" value={amountMl} onChange={(e) => setAmountMl(e.target.value)} />
            </label>
            <label className="text-base font-semibold block">
              Fertilizer name
              <Input className="mt-1 text-base" placeholder="e.g. 20-20-20 liquid" value={fertName} onChange={(e) => setFertName(e.target.value)} />
            </label>
            <label className="text-base font-semibold block">
              Notes
              <textarea className="mt-1 min-h-24 w-full rounded-2xl border border-input bg-white px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring" placeholder="Any observations..." value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} />
            </label>
            <div className="flex gap-3">
              <Button onClick={doComplete} disabled={busyAction} className="rounded-xl px-5 py-2.5">
                {busyAction ? <Loader2 className="animate-spin" size={16} aria-hidden /> : <Check size={16} aria-hidden />}
                Complete
              </Button>
              <Button variant="outline" onClick={() => setAction("pick")} className="rounded-xl px-5">Back</Button>
            </div>
          </div>
        )}

        {activeTask && action === "snooze" && (
          <div className="space-y-4">
            <p className="text-base text-muted-foreground">Snooze until:</p>
            <Input type="datetime-local" value={pickDate} onChange={(e) => setPickDate(e.target.value)} className="text-base" />
            <div className="flex gap-3">
              <Button onClick={doSnooze} disabled={busyAction || !pickDate} className="rounded-xl px-5 py-2.5">Snooze</Button>
              <Button variant="outline" onClick={() => setAction("pick")} className="rounded-xl px-5">Back</Button>
            </div>
          </div>
        )}

        {activeTask && action === "reschedule" && (
          <div className="space-y-4">
            <p className="text-base text-muted-foreground">New due date:</p>
            <Input type="datetime-local" value={pickDate} onChange={(e) => setPickDate(e.target.value)} className="text-base" />
            <div className="flex gap-3">
              <Button onClick={doReschedule} disabled={busyAction || !pickDate} className="rounded-xl px-5 py-2.5">Reschedule</Button>
              <Button variant="outline" onClick={() => setAction("pick")} className="rounded-xl px-5">Back</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

// ── Sub-components ──

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm transition active:scale-[0.98]">
      <div className={cn(
        "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl",
        color === "primary" && "bg-primary/10 text-primary",
        color === "emerald" && "bg-emerald-100 text-emerald-600",
        color === "green" && "bg-green-100 text-green-600",
        color === "amber" && "bg-amber-100 text-amber-600",
      )}>
        {icon}
      </div>
      <p className="text-4xl font-bold tracking-tight md:text-5xl">{value}</p>
      <p className="mt-1.5 text-base text-muted-foreground">{label}</p>
    </div>
  );
}

function PlantSpotlightCard({
  name,
  species,
  health,
  location,
  nextTask,
  nextDue,
}: {
  name: string;
  species: string | null;
  health: string | null;
  location: string | null;
  nextTask: string | null;
  nextDue: string | null;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold">{name}</p>
          {species && <p className="text-sm text-muted-foreground italic">{species}</p>}
        </div>
        <div className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold",
          health === "thriving" || health === "stable"
            ? "bg-green-100 text-green-700"
            : health === "watch" || health === "struggling"
            ? "bg-amber-100 text-amber-700"
            : "bg-muted text-muted-foreground",
        )}>
          {health ? health.charAt(0).toUpperCase() : "?"}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
        {location && <span>{location}</span>}
        {nextTask && (
          <span className="flex items-center gap-1">
            <Droplets size={14} aria-hidden />
            {nextTask} {nextDue ? `• ${formatTime(nextDue)}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

function TaskGroupSection({
  label,
  count,
  color,
  tasks,
  onTaskClick,
}: {
  label: string;
  count: number;
  color: string;
  tasks: TaskWithPlant[];
  onTaskClick: (task: TaskWithPlant) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h2 className={cn("text-xl font-bold", color)}>{label}</h2>
        <span className={cn(
          "rounded-full px-3 py-0.5 text-sm font-bold",
          color.replace("text-", "bg-").replace("600", "100"),
          color.replace("text-", "text-").replace("600", "800"),
        )}>
          {count}
        </span>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  variant,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  variant: "primary" | "danger" | "outline";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border p-4 text-base font-semibold transition active:scale-[0.97]",
        variant === "primary" && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "danger" && "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        variant === "outline" && "border-border bg-white text-foreground hover:bg-muted",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffHrs = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHrs < 0) return "Overdue";
  if (diffHrs < 24) return `In ${diffHrs}h`;
  const diffDays = Math.round(diffHrs / 24);
  return `In ${diffDays}d`;
}
