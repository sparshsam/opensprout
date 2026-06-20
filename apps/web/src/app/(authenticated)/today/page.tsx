"use client";

import { useState } from "react";
import { useApp } from "@/lib/context/app-context";
import { Loader2, Check, X, Clock, Calendar, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompleteTaskInput } from "@/lib/data/tasks";
import type { TaskWithPlant } from "@/lib/data/tasks";
import { TaskCard } from "@/components/cards/task-card";
import { BottomSheet } from "@/components/sheets/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Skeleton } from "@/components/ui/skeleton";

export default function TodayPage() {
  const {
    user,
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

  // Complete form
  const [amountMl, setAmountMl] = useState("");
  const [fertName, setFertName] = useState("");
  const [fertStrength, setFertStrength] = useState("");
  const [taskNotes, setTaskNotes] = useState("");

  // Snooze/reschedule
  const [pickDate, setPickDate] = useState("");

  // ── Stats ──
  const totalDue = tasks.overdue.length + tasks.today.length;
  const healthyCount = data.plants.filter(
    (p) => p.health_status === "thriving" || p.health_status === "stable",
  ).length;

  // ── Actions ──
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
      <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground">
            Today
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user?.email}
          </p>
        </div>
      </header>

      {/* Status banner */}
      {(error || notice) && (
        <div
          className={cn(
            "mt-4 rounded-md border px-4 py-3 text-sm font-medium",
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
                className="shrink-0 border-red-300 bg-white text-red-700 hover:bg-red-100"
              >
                <RefreshCw size={14} aria-hidden />
                Retry
              </Button>
            )}
          </div>
        </div>
      )}

      <section className="space-y-6 py-6">
        <PullToRefresh onRefresh={refreshDashboard}>
        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Due" value={String(totalDue)} sub={`${data.plants.length} plants`} />
          <StatCard label="Overdue" value={String(tasks.overdue.length)} sub="Needs attention" />
          <StatCard label="Today" value={String(tasks.today.length)} sub="Due today" />
          <StatCard label="Healthy" value={String(healthyCount)} sub={`${data.plants.length} total`} />
        </div>

        {dataLoading && tasks.overdue.length === 0 && tasks.today.length === 0 ? (
          <div className="space-y-6">
            {/* Skeleton stat cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-md" />
              ))}
            </div>
            {/* Skeleton task group */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-24 rounded-md" />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-md" />
              ))}
            </div>
            {/* Second skeleton task group */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-28 rounded-md" />
              {[...Array(2)].map((_, i) => (
                <Skeleton key={`t2-${i}`} className="h-20 w-full rounded-md" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Overdue */}
            {tasks.overdue.length > 0 && (
              <TaskGroupSection
                label="Overdue"
                count={tasks.overdue.length}
                color="text-red-600"
                tasks={tasks.overdue}
                onTaskClick={openSheet}
              />
            )}

            {/* Today */}
            <TaskGroupSection
              label="Due today"
              count={tasks.today.length}
              color="text-amber-600"
              tasks={tasks.today}
              onTaskClick={openSheet}
            />

            {/* Upcoming (compact) */}
            {tasks.upcoming.length > 0 && (
              <TaskGroupSection
                label="Upcoming"
                count={tasks.upcoming.length}
                color="text-muted-foreground"
                tasks={tasks.upcoming.slice(0, 8)}
                onTaskClick={openSheet}
              />
            )}

            {/* Empty state */}
            {tasks.overdue.length === 0 && tasks.today.length === 0 && tasks.upcoming.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center shadow-panel">
                <Check size={40} className="mx-auto text-emerald-400" aria-hidden />
                <h2 className="mt-4 text-lg font-bold">All caught up</h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                  No care tasks due. Add a plant with a watering or fertilizing
                  schedule to create tasks here.
                </p>
              </div>
            )}
          </>
        )}
        </PullToRefresh>
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
              {activeTask.care_type} care · Due {activeTask.due_at?.slice(0, 10)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ActionButton
                icon={<Check size={18} />}
                label="Complete"
                variant="primary"
                onClick={() => setAction("complete")}
              />
              <ActionButton
                icon={<X size={18} />}
                label="Skip"
                variant="danger"
                onClick={doSkip}
                disabled={busyAction}
              />
              <ActionButton
                icon={<Clock size={18} />}
                label="Snooze"
                variant="outline"
                onClick={() => setAction("snooze")}
              />
              <ActionButton
                icon={<Calendar size={18} />}
                label="Reschedule"
                variant="outline"
                onClick={() => setAction("reschedule")}
              />
            </div>
          </div>
        )}

        {activeTask && action === "complete" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground">Log care details (optional)</p>
            <label className="text-sm font-semibold block">
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
            <label className="text-sm font-semibold block">
              Fertilizer name
              <Input
                className="mt-1"
                placeholder="e.g. 20-20-20 liquid"
                value={fertName}
                onChange={(e) => setFertName(e.target.value)}
              />
            </label>
            <label className="text-sm font-semibold block">
              Fertilizer strength
              <Input
                className="mt-1"
                placeholder="e.g. Half-strength"
                value={fertStrength}
                onChange={(e) => setFertStrength(e.target.value)}
              />
            </label>
            <label className="text-sm font-semibold block">
              Notes
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                placeholder="Any observations..."
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
              />
            </label>
            <div className="flex gap-2">
              <Button onClick={doComplete} disabled={busyAction}>
                {busyAction ? <Loader2 className="animate-spin" size={16} aria-hidden /> : <Check size={16} aria-hidden />}
                Complete
              </Button>
              <Button variant="outline" onClick={() => setAction("pick")}>Back</Button>
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
              <Button variant="outline" onClick={() => setAction("pick")}>Back</Button>
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
              <Button onClick={doReschedule} disabled={busyAction || !pickDate}>
                Reschedule
              </Button>
              <Button variant="outline" onClick={() => setAction("pick")}>Back</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

// ── Sub-components ──

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-panel">
      <p className="text-xs font-bold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
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
      <div className="mb-3 flex items-center gap-2">
        <h2 className={cn("text-lg font-bold", color)}>{label}</h2>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", color.replace("text-", "bg-").replace("600", "100"), color.replace("text-", "text-").replace("600", "800"))}>
          {count}
        </span>
      </div>
      <div className="space-y-2">
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
        "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition active:scale-[0.97]",
        variant === "primary" &&
          "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "danger" &&
          "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        variant === "outline" &&
          "border-border bg-white text-foreground hover:bg-muted",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
