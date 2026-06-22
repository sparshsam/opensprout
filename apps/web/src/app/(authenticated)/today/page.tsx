"use client";

import { useState } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  Loader2,
  Check,
  X,
  Clock,
  Calendar,
  Sprout,
  Flower2,
  Droplets,
  ArrowRight,
  Leaf,
  Sparkles,
  Heart,
  Timer,
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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function headline() {
  const h = new Date().getHours();
  if (h < 5) return "Your plants are sleeping too.";
  if (h < 12) return "Your plants are waking up.";
  return "Your plants are waiting.";
}

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
  const healthyCount = data.plants.filter(
    (p) => p.health_status === "thriving" || p.health_status === "stable",
  ).length;
  const nextTask = allUpcoming[0] ?? null;
  const recentLogs = [...data.logs].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );

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
      {/* ── Status banners ── */}
      {(error || notice) && (
        <div
          className={cn(
            "mb-10 rounded-2xl border px-5 py-4 text-base font-medium",
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
                <Loader2 size={14} aria-hidden /> Retry
              </Button>
            )}
          </div>
        </div>
      )}

      <PullToRefresh onRefresh={refreshDashboard}>
        {isLoading ? (
          /* ── Loading skeleton ── */
          <div className="space-y-16">
            <div className="space-y-6">
              <Skeleton className="h-12 w-48 rounded-lg" />
              <Skeleton className="h-24 w-full max-w-xl rounded-2xl" />
              <Skeleton className="h-14 w-44 rounded-xl" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : hasContent ? (
          /* ── Authenticated content ── */
          <>
            {/* ════════════════════════════════════ */}
            {/* Hero — editorial headline + CTA     */}
            {/* ════════════════════════════════════ */}
            <section className="relative mb-24">
              <div className="relative z-10">
                {/* Greeting */}
                <p className="mb-3 text-base font-semibold tracking-wide text-primary uppercase">
                  {greeting()}
                </p>

                {/* Massive headline */}
                <h1 className="text-hero mb-6 max-w-4xl text-foreground">
                  {headline()}
                </h1>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-4">
                  {totalDue > 0 ? (
                    <>
                      <button
                        onClick={() =>
                          document
                            .getElementById("care-section")
                            ?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="inline-flex items-center gap-2.5 rounded-[16px] bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-[0.97]"
                      >
                        <Sprout size={20} aria-hidden />
                        {totalDue} plant{totalDue !== 1 ? "s" : ""} need care today
                        <ArrowRight size={18} aria-hidden />
                      </button>
                      <a
                        href="/plants"
                        className="inline-flex items-center gap-2 rounded-[16px] border border-border/60 bg-white px-6 py-4 text-base font-semibold text-foreground/70 transition hover:border-border hover:text-foreground active:scale-[0.97]"
                      >
                        View my collection
                      </a>
                    </>
                  ) : data.plants.length > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-2 rounded-[16px] bg-primary/8 px-7 py-4 text-base font-semibold text-primary">
                        <Sparkles size={20} aria-hidden />
                        All caught up!
                      </span>
                      <a
                        href="/plants"
                        className="inline-flex items-center gap-2 rounded-[16px] border border-border/60 bg-white px-6 py-4 text-base font-semibold text-foreground/70 transition hover:border-border hover:text-foreground active:scale-[0.97]"
                      >
                        Check on your plants
                      </a>
                    </>
                  ) : (
                    <>
                      <a
                        href="/plants"
                        className="inline-flex items-center gap-2.5 rounded-[16px] bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-[0.97]"
                      >
                        <Sprout size={20} aria-hidden />
                        Add your first plant
                        <ArrowRight size={18} aria-hidden />
                      </a>
                      <a
                        href="/identify"
                        className="inline-flex items-center gap-2 rounded-[16px] border border-border/60 bg-white px-6 py-4 text-base font-semibold text-foreground/70 transition hover:border-border hover:text-foreground active:scale-[0.97]"
                      >
                        <Leaf size={18} aria-hidden />
                        Identify a plant
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Sprout illustration — decorative */}
              <div className="pointer-events-none absolute right-0 top-0 select-none opacity-[0.06] dark:opacity-[0.08]">
                <Sprout size={320} className="text-primary" aria-hidden />
              </div>
            </section>

            {/* ════════════════════════════════════ */}
            {/* Featured plant / next care action   */}
            {/* ════════════════════════════════════ */}
            {nextTask && (
              <section id="care-section" className="mb-24">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/8 text-primary">
                    <Heart size={20} aria-hidden />
                  </div>
                  <h2 className="text-display text-foreground">Next up</h2>
                </div>

                <div className="group relative overflow-hidden rounded-[28px] border border-border/30 bg-white p-8 shadow-sm transition hover:shadow-md md:p-10">
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-2xl font-bold tracking-tight text-foreground">
                          {nextTask.plantName}
                        </p>
                      </div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-primary/8 text-primary">
                        <Droplets size={28} aria-hidden />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3 text-base text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary/8 px-3.5 py-1.5 text-sm font-semibold text-primary">
                        {nextTask.care_type}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Timer size={14} aria-hidden />
                        {formatRelTime(nextTask.due_at!)}
                      </span>
                    </div>

                    <button
                      onClick={() => openSheet(nextTask)}
                      className="mt-8 inline-flex items-center gap-2 rounded-[14px] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 active:scale-[0.97]"
                    >
                      <Check size={16} aria-hidden />
                      Mark as done
                    </button>
                  </div>

                  {/* Decorative sprout */}
                  <div className="pointer-events-none absolute -bottom-6 -right-6 select-none opacity-[0.04]">
                    <Sprout size={160} className="text-primary" aria-hidden />
                  </div>
                </div>
              </section>
            )}

            {/* ════════════════════════════════════ */}
            {/* Upcoming reminders                   */}
            {/* ════════════════════════════════════ */}
            {(tasks.upcoming.length > 0 || totalDue > 0) && (
              <section className="mb-24">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/8 text-primary">
                      <Clock size={20} aria-hidden />
                    </div>
                    <h2 className="text-display text-foreground">Upcoming</h2>
                  </div>
                  {totalDue > 0 && (
                    <span className="hidden rounded-[10px] bg-primary/8 px-4 py-1.5 text-sm font-semibold text-primary sm:inline-block">
                      {totalDue} due today
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Overdue first — prominent */}
                  {tasks.overdue.slice(0, 3).map((task) => (
                    <ReminderRow
                      key={task.id}
                      task={task}
                      overdue
                      onClick={() => openSheet(task)}
                    />
                  ))}

                  {/* Today */}
                  {tasks.today.slice(0, 4).map((task) => (
                    <ReminderRow
                      key={task.id}
                      task={task}
                      onClick={() => openSheet(task)}
                    />
                  ))}

                  {/* Upcoming */}
                  {tasks.upcoming.slice(0, 3).map((task) => (
                    <ReminderRow
                      key={task.id}
                      task={task}
                      subdued
                      onClick={() => openSheet(task)}
                    />
                  ))}
                </div>

                {(tasks.overdue.length > 3 || tasks.today.length > 4 || tasks.upcoming.length > 3) && (
                  <a
                    href="/today"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:gap-2"
                  >
                    View all reminders <ArrowRight size={14} aria-hidden />
                  </a>
                )}
              </section>
            )}

            {/* ════════════════════════════════════ */}
            {/* Recent activity                      */}
            {/* ════════════════════════════════════ */}
            {recentLogs.length > 0 && (
              <section className="mb-24">
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/8 text-primary">
                    <Flower2 size={20} aria-hidden />
                  </div>
                  <h2 className="text-display text-foreground">Activity</h2>
                </div>

                <div className="space-y-3">
                  {recentLogs.slice(0, 5).map((log) => {
                    const plant = data.plants.find((p) => p.id === log.plant_id);
                    return (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 rounded-[16px] bg-white/50 px-5 py-4 transition hover:bg-white"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/8 text-primary">
                          <Droplets size={18} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-foreground">
                            <span className="capitalize">{log.care_type}</span>
                            {" — "}
                            {plant?.name ?? "Unknown plant"}
                          </p>
                          {log.notes && (
                            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                              {log.notes}
                            </p>
                          )}
                        </div>
                        <time className="shrink-0 text-sm text-muted-foreground">
                          {formatTimeAgo(log.occurred_at)}
                        </time>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ════════════════════════════════════ */}
            {/* Supporting metrics — large statements */}
            {/* ════════════════════════════════════ */}
            {data.plants.length > 0 && (
              <section className="mb-8">
                <div className="grid gap-8 md:grid-cols-3">
                  {/* Only show meaningful metrics */}
                  {totalDue > 0 && (
                    <MetricStatement
                      icon={<Sprout size={28} aria-hidden />}
                      value={String(totalDue)}
                      label={totalDue === 1 ? "plant needs care today" : "plants need care today"}
                      accent
                    />
                  )}
                  <MetricStatement
                    icon={<Leaf size={28} aria-hidden />}
                    value={String(healthyCount)}
                    label={
                      healthyCount === 1
                        ? "thriving plant"
                        : `thriving of ${data.plants.length} total`
                    }
                  />
                  {recentLogs.length > 0 && (
                    <MetricStatement
                      icon={<Heart size={28} aria-hidden />}
                      value={String(recentLogs.length)}
                      label="care actions logged"
                    />
                  )}
                </div>
              </section>
            )}

            {/* ════════════════════════════════════ */}
            {/* Collection preview (if many plants)  */}
            {/* ════════════════════════════════════ */}
            {data.plants.length > 0 && !nextTask && (
              <section className="mb-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-display text-foreground">Your collection</h2>
                  <a
                    href="/plants"
                    className="hidden text-sm font-semibold text-primary transition hover:gap-2 sm:inline-flex sm:items-center sm:gap-1.5"
                  >
                    View all <ArrowRight size={14} aria-hidden />
                  </a>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.plants.slice(0, 6).map((plant) => (
                    <PlantCard
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
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary sm:hidden"
                  >
                    View all {data.plants.length} plants <ArrowRight size={14} />
                  </a>
                )}
              </section>
            )}

            {/* ════════════════════════════════════ */}
            {/* Empty state — first-time user        */}
            {/* ════════════════════════════════════ */}
          </>
        ) : (
          /* ── Empty state (no plants, no nothing) ── */
          <section className="pt-16">
            <div className="mx-auto max-w-lg text-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[32px] bg-primary shadow-xl shadow-primary/20">
                <Sprout size={56} className="text-primary-foreground" aria-hidden />
              </div>
              <p className="mt-4 text-base font-semibold tracking-wide text-primary uppercase">
                {greeting()}
              </p>
              <h2 className="mt-4 text-hero text-foreground">
                Welcome to OpenSprout
              </h2>
              <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
                Track watering, log care, and keep your plants thriving.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <a
                  href="/plants"
                  className="inline-flex items-center gap-2.5 rounded-[16px] bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-[0.97]"
                >
                  <Sprout size={20} aria-hidden />
                  Add your first plant
                  <ArrowRight size={18} aria-hidden />
                </a>
                <a
                  href="/identify"
                  className="inline-flex items-center gap-2 rounded-[16px] border border-border/60 bg-white px-7 py-4 text-base font-semibold text-foreground/70 transition hover:border-border hover:text-foreground active:scale-[0.97]"
                >
                  <Leaf size={18} aria-hidden />
                  Identify a plant
                </a>
              </div>
            </div>
          </section>
        )}
      </PullToRefresh>

      {/* ── Task Action Sheet ── */}
      <BottomSheet
        open={activeTask !== null}
        onClose={closeSheet}
        title={activeTask ? `${activeTask.plantName}` : undefined}
      >
        {activeTask && action === "pick" && (
          <div className="space-y-5">
            <p className="text-base text-muted-foreground capitalize">
              {activeTask.care_type} care &middot;{" "}
              {activeTask.due_at?.slice(0, 10)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ActionButton
                icon={<Check size={22} />}
                label="Complete"
                variant="primary"
                onClick={() => setAction("complete")}
              />
              <ActionButton
                icon={<X size={22} />}
                label="Skip"
                variant="danger"
                onClick={doSkip}
                disabled={busyAction}
              />
              <ActionButton
                icon={<Clock size={22} />}
                label="Snooze"
                variant="outline"
                onClick={() => setAction("snooze")}
              />
              <ActionButton
                icon={<Calendar size={22} />}
                label="Reschedule"
                variant="outline"
                onClick={() => setAction("reschedule")}
              />
            </div>
          </div>
        )}
        {activeTask && action === "complete" && (
          <div className="space-y-4">
            <p className="text-base font-semibold text-muted-foreground">
              Log care details (optional)
            </p>
            <label className="block text-base font-semibold">
              Water amount (ml)
              <Input
                className="mt-1 rounded-xl text-base"
                type="number"
                min={0}
                placeholder="e.g. 200"
                value={amountMl}
                onChange={(e) => setAmountMl(e.target.value)}
              />
            </label>
            <label className="block text-base font-semibold">
              Fertilizer name
              <Input
                className="mt-1 rounded-xl text-base"
                placeholder="e.g. 20-20-20 liquid"
                value={fertName}
                onChange={(e) => setFertName(e.target.value)}
              />
            </label>
            <label className="block text-base font-semibold">
              Notes
              <textarea
                className="mt-1 min-h-24 w-full rounded-[20px] border border-input bg-white px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                placeholder="Any observations..."
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
              />
            </label>
            <div className="flex gap-3">
              <Button
                onClick={doComplete}
                disabled={busyAction}
                className="rounded-[14px] px-6 py-2.5"
              >
                <Check size={16} aria-hidden /> Complete
              </Button>
              <Button
                variant="outline"
                onClick={() => setAction("pick")}
                className="rounded-[14px] px-6"
              >
                Back
              </Button>
            </div>
          </div>
        )}
        {activeTask && action === "snooze" && (
          <div className="space-y-4">
            <p className="text-base text-muted-foreground">Snooze until:</p>
            <Input
              type="datetime-local"
              value={pickDate}
              onChange={(e) => setPickDate(e.target.value)}
              className="rounded-xl text-base"
            />
            <div className="flex gap-3">
              <Button
                onClick={doSnooze}
                disabled={busyAction || !pickDate}
                className="rounded-[14px] px-6 py-2.5"
              >
                Snooze
              </Button>
              <Button
                variant="outline"
                onClick={() => setAction("pick")}
                className="rounded-[14px] px-6"
              >
                Back
              </Button>
            </div>
          </div>
        )}
        {activeTask && action === "reschedule" && (
          <div className="space-y-4">
            <p className="text-base text-muted-foreground">New due date:</p>
            <Input
              type="datetime-local"
              value={pickDate}
              onChange={(e) => setPickDate(e.target.value)}
              className="rounded-xl text-base"
            />
            <div className="flex gap-3">
              <Button
                onClick={doReschedule}
                disabled={busyAction || !pickDate}
                className="rounded-[14px] px-6 py-2.5"
              >
                Reschedule
              </Button>
              <Button
                variant="outline"
                onClick={() => setAction("pick")}
                className="rounded-[14px] px-6"
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

// ── Sub-components ──

/** Large statement-style metric — no card, just text */
function MetricStatement({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className={cn(accent && "md:col-span-1")}>
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-[12px]",
            accent
              ? "bg-primary text-primary-foreground"
              : "bg-primary/8 text-primary",
          )}
        >
          {icon}
        </div>
      </div>
      <p className="text-stat text-foreground">{value}</p>
      <p className="mt-2 text-lg text-muted-foreground">{label}</p>
    </div>
  );
}

/** Minimal reminder row */
function ReminderRow({
  task,
  overdue,
  subdued,
  onClick,
}: {
  task: TaskWithPlant;
  overdue?: boolean;
  subdued?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-[16px] px-5 py-4 text-left transition hover:bg-white active:scale-[0.99]",
        overdue && "bg-red-50/60",
        !overdue && !subdued && "bg-white/50",
        subdued && "bg-transparent",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]",
          overdue
            ? "bg-red-100 text-red-600"
            : "bg-primary/8 text-primary",
        )}
      >
        <Droplets size={18} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-base font-semibold",
            overdue && "text-red-700",
            subdued && "text-muted-foreground",
            !overdue && !subdued && "text-foreground",
          )}
        >
          {task.plantName}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground capitalize">
          {task.care_type}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span
          className={cn(
            "block text-sm font-semibold",
            overdue && "text-red-600",
            subdued && "text-muted-foreground/60",
            !overdue && !subdued && "text-foreground",
          )}
        >
          {task.due_at ? formatRelTime(task.due_at) : ""}
        </span>
        {overdue && (
          <span className="text-xs font-semibold text-red-500">Overdue</span>
        )}
      </div>
    </button>
  );
}

/** Minimal plant card for collection preview */
function PlantCard({
  name,
  species,
  health,
  location,
}: {
  name: string;
  species: string | null;
  health: string | null;
  location: string | null;
}) {
  return (
    <a
      href="/plants"
      className="group block rounded-[20px] border border-border/20 bg-white p-6 transition hover:shadow-sm active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-foreground">{name}</p>
          {species && (
            <p className="mt-0.5 text-sm italic text-muted-foreground">
              {species}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm",
            health === "thriving" || health === "stable"
              ? "bg-green-100 text-green-700"
              : health === "watch" || health === "struggling"
                ? "bg-amber-100 text-amber-700"
                : "bg-muted text-muted-foreground",
          )}
        >
          {health ? health.charAt(0).toUpperCase() : "?"}
        </div>
      </div>
      {location && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-primary/40" />
          {location}
        </p>
      )}
    </a>
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
        "flex flex-col items-center gap-2 rounded-[20px] border p-5 text-base font-semibold transition active:scale-[0.97]",
        variant === "primary" &&
          "border-primary bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        variant === "danger" &&
          "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        variant === "outline" &&
          "border-border bg-white text-foreground hover:bg-muted",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
