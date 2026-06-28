"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/context/app-context";
import { useAtmosphere } from "@/lib/hooks/use-atmosphere";
import {
  Check, X, Clock, Calendar, Sprout, ArrowRight, Droplets,
  Leaf, Plus, Scan, BookOpen, AlertTriangle, ChevronRight,
  Sun, FlaskConical, Scissors, RotateCw, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompleteTaskInput, TaskWithPlant } from "@/lib/data/tasks";
import type { CareType } from "@/lib/data/types";
import { BottomSheet } from "@/components/sheets/bottom-sheet";
import { InsightCards } from "@/components/insights/insight-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// ── Helpers ──

const CARE_ICONS: Record<string, React.ElementType> = {
  water: Droplets,
  fertilize: FlaskConical,
  mist: Sun,
  rotate: RotateCw,
  prune: Scissors,
  repot: Sprout,
  inspect: Search,
  custom: Leaf,
};

function formatRelTime(d: string): string {
  const dt = new Date(d);
  const now = new Date();
  const diff = dt.getTime() - now.getTime();
  const h = Math.round(diff / (1000 * 60 * 60));
  if (h < 0) return "Overdue";
  if (h < 1) return "Soon";
  if (h < 24) return `In ${h}h`;
  return `In ${Math.round(h / 24)}d`;
}

function formatTimeAgo(d: string): string {
  const dt = new Date(d);
  const m = Math.round((Date.now() - dt.getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** Days since epoch — used to decide "this week". */
function daysSinceEpoch(d: string): number {
  return Math.floor(new Date(d).getTime() / 86_400_000);
}

// ── Types for plant care summary ──

type PlantCareSummary = {
  id: string;
  name: string;
  species: string | null;
  coverPhotoPath: string | null;
  healthStatus: string | null;
  nextCareType: CareType | null;
  nextDueAt: string | null;
  taskCount: number;
};

// ── Page ──

export default function HomePage() {
  const { data, tasks, dataLoading, error, notice, handleCompleteTask, handleSkipTask, handleSnoozeTask, handleRescheduleTask, refreshDashboard } = useApp();
  const { greeting, headline, tagline } = useAtmosphere();

  const [activeTask, setActiveTask] = useState<TaskWithPlant | null>(null);
  const [action, setAction] = useState<"pick" | "complete" | "snooze" | "reschedule">("pick");
  const [busy, setBusy] = useState(false);
  const [amountMl, setAmountMl] = useState("");
  const [fertName, setFertName] = useState("");
  const [fertStrength, setFertStrength] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [pickDate, setPickDate] = useState("");

  // ── Computed ──

  const totalDue = tasks.overdue.length + tasks.today.length;
  const allUpcoming = [...tasks.overdue, ...tasks.today, ...tasks.upcoming];

  const recentLogs = useMemo(
    () => [...data.logs].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()),
    [data.logs],
  );

  const weeklyLogCount = useMemo(
    () => data.logs.filter((l) => daysSinceEpoch(l.occurred_at) >= daysSinceEpoch(new Date().toISOString()) - 7).length,
    [data.logs],
  );

  const isLoading = dataLoading && tasks.overdue.length === 0 && tasks.today.length === 0;
  const hasPlants = data.plants.length > 0;
  const hasTasks = totalDue > 0 || tasks.upcoming.length > 0;

  // Build per-plant care summaries from schedules + tasks
  const plantSummaries = useMemo((): PlantCareSummary[] => {
    return data.plants
      .map((plant) => {
        // Find the next upcoming task for this plant
        const plantTasks = allUpcoming.filter((t) => t.plant_id === plant.id);
        const nextTask = plantTasks[0] ?? null;
        return {
          id: plant.id,
          name: plant.name,
          species: plant.species,
          coverPhotoPath: plant.cover_photo_path,
          healthStatus: plant.health_status,
          nextCareType: nextTask?.care_type ?? null,
          nextDueAt: nextTask?.due_at ?? null,
          taskCount: plantTasks.length,
        };
      })
      .filter((p) => p.taskCount > 0 || !hasTasks) // show all plants when no tasks
      .slice(0, 8);
  }, [data.plants, allUpcoming, hasTasks]);

  // Contextual next action text
  const contextualAction = useMemo((): { text: string; plantId?: string } | null => {
    if (tasks.overdue.length > 0) {
      const t = tasks.overdue[0];
      return { text: `${t.plantName} needs ${t.care_type} — it's overdue`, plantId: t.plant_id };
    }
    if (tasks.today.length > 0) {
      const t = tasks.today[0];
      return { text: `Time to ${t.care_type} ${t.plantName}`, plantId: t.plant_id };
    }
    if (tasks.upcoming.length > 0) {
      const t = tasks.upcoming[0];
      return { text: `Next up: ${t.care_type} ${t.plantName} ${t.due_at ? formatRelTime(t.due_at) : ""}`, plantId: t.plant_id };
    }
    if (hasPlants && weeklyLogCount > 0) {
      return { text: "All caught up! Great work keeping up with care." };
    }
    if (hasPlants) {
      return { text: "No care due today — your plants are happy." };
    }
    return null;
  }, [tasks, hasPlants, weeklyLogCount]);

  function openSheet(task: TaskWithPlant) { setActiveTask(task); setAction("pick"); setAmountMl(""); setFertName(""); setFertStrength(""); setTaskNotes(""); setPickDate(""); setBusy(false); }
  function closeSheet() { setActiveTask(null); setAction("pick"); }
  async function doComplete() { if (!activeTask) return; setBusy(true); const i: CompleteTaskInput = {}; if (amountMl) i.amount_ml = Number(amountMl); if (fertName) i.fertilizer_name = fertName; if (fertStrength) i.fertilizer_strength = fertStrength; if (taskNotes) i.notes = taskNotes; await handleCompleteTask(activeTask.id, i); closeSheet(); }
  async function doSkip() { if (!activeTask) return; setBusy(true); await handleSkipTask(activeTask.id); closeSheet(); }
  async function doSnooze() { if (!activeTask || !pickDate) return; setBusy(true); await handleSnoozeTask(activeTask.id, new Date(pickDate).toISOString()); closeSheet(); }
  async function doReschedule() { if (!activeTask || !pickDate) return; setBusy(true); await handleRescheduleTask(activeTask.id, new Date(pickDate).toISOString()); closeSheet(); }

  return (
    <>
      {/* ── Status ── */}
      {(error || notice) && (
        <div className={cn("mb-16 rounded-full px-6 py-3 text-sm font-semibold", error ? "bg-destructive/10 text-destructive" : "bg-primary-light text-primary")}>
          <div className="flex items-center justify-between gap-3">
            <span>{error ?? notice}</span>
            {error && <button onClick={refreshDashboard} className="rounded-full bg-destructive/20 px-4 py-1.5 text-xs font-bold tracking-wider uppercase">Retry</button>}
          </div>
        </div>
      )}

      <PullToRefresh onRefresh={refreshDashboard}>
        {isLoading ? (
          <div className="space-y-20">
            <div className="space-y-6"><Skeleton className="h-6 w-48 rounded-full" /><Skeleton className="h-16 w-full max-w-2xl rounded-full" /><Skeleton className="h-12 w-44 rounded-full" /></div>
          </div>
        ) : (
          <>
            {/* ═══════════════════════════════════════ */}
            {/* Hero — atmospheric brand moment         */}
            {/* ═══════════════════════════════════════ */}
            <section className="mb-16 sm:mb-20">
              <p className="text-label mb-5 text-primary">{greeting}</p>
              <h1 className="text-hero mb-6 max-w-3xl text-foreground leading-[1.05]">
                {headline}
              </h1>
              <p className="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                {tagline}
              </p>

              {/* Contextual CTA */}
              <div className="flex flex-wrap gap-3">
                {totalDue > 0 ? (
                  <button onClick={() => document.getElementById("care-section")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110">
                    {totalDue} plant{totalDue !== 1 ? "s" : ""} need care
                  </button>
                ) : hasPlants ? (
                  <div className="rounded-full bg-primary/10 px-8 py-3.5 text-sm font-semibold text-primary">All caught up</div>
                ) : (
                  <Link href="/plants" className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110">Add your first plant</Link>
                )}
              </div>
            </section>

            {hasPlants ? (
              <>
                {/* ═══════════════════════════════════════ */}
                {/* Contextual next action — smart prompt   */}
                {/* ═══════════════════════════════════════ */}
                {contextualAction && (
                  <section className="mb-12">
                    <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Sprout size={18} />
                        </div>
                        <p className="text-sm font-semibold text-foreground flex-1">
                          {contextualAction.text}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* ═══════════════════════════════════════ */}
                {/* Overdue tasks                            */}
                {/* ═══════════════════════════════════════ */}
                {tasks.overdue.length > 0 && (
                  <section id="care-section" className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle size={12} className="text-destructive" />
                      </div>
                      <p className="text-label text-destructive">
                        Overdue
                      </p>
                      <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
                        {tasks.overdue.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {tasks.overdue.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => openSheet(t)}
                          className="flex w-full items-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/[0.02] px-5 py-4 text-left transition hover:bg-destructive/[0.05] active:scale-[0.99]"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <Droplets size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">{t.plantName}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground capitalize">{t.care_type}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="block text-xs font-bold text-destructive">Overdue</span>
                            {t.due_at && (
                              <span className="text-[11px] text-destructive/70">
                                {new Date(t.due_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* ═══════════════════════════════════════ */}
                {/* Today's tasks                            */}
                {/* ═══════════════════════════════════════ */}
                {tasks.today.length > 0 ? (
                  <section className="mb-10">
                    <p className="text-label mb-5 text-muted-foreground">
                      Due today
                      {tasks.today.length > 1 && (
                        <span className="ml-2 text-xs text-muted-foreground">({tasks.today.length})</span>
                      )}
                    </p>
                    <div className="space-y-2">
                      {tasks.today.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => openSheet(t)}
                          className="flex w-full items-center gap-4 rounded-2xl border border-border/50 bg-white px-5 py-4 text-left transition hover:bg-muted/30 active:scale-[0.99] dark:bg-muted"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Droplets size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">{t.plantName}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground capitalize">{t.care_type}</p>
                          </div>
                          <div className="shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); openSheet(t); }}
                              className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110"
                            >
                              Mark done
                            </button>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ) : tasks.overdue.length === 0 && (
                  /* ── Nothing due today ── */
                  <section className="mb-10">
                    <div className="rounded-3xl border border-border/50 bg-muted/20 px-8 py-12 text-center">
                      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/8">
                        <Check size={28} className="text-primary" />
                      </div>
                      <p className="text-display mb-2 text-foreground">Nothing due today</p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        All care tasks for today are complete. Check back tomorrow or browse your plants to see upcoming needs.
                      </p>
                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link href="/plants" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110">
                          Browse plants
                        </Link>
                        <Link href="/journal" className="rounded-full bg-muted px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/80">
                          Journal entry
                        </Link>
                      </div>
                    </div>
                  </section>
                )}

                {/* ═══════════════════════════════════════ */}
                {/* Upcoming tasks                           */}
                {/* ═══════════════════════════════════════ */}
                {tasks.upcoming.length > 0 && (
                  <section className="mb-10">
                    <p className="text-label mb-5 text-muted-foreground">Upcoming</p>
                    <div className="space-y-2">
                      {tasks.upcoming.slice(0, 5).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => openSheet(t)}
                          className="flex w-full items-center gap-4 rounded-2xl border border-border/30 bg-white/50 px-5 py-3.5 text-left transition hover:bg-muted/30 active:scale-[0.99] dark:bg-muted/30"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Droplets size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-muted-foreground">{t.plantName}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground/70 capitalize">{t.care_type}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-xs text-muted-foreground">{t.due_at ? formatRelTime(t.due_at) : ""}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {tasks.upcoming.length > 5 && (
                      <Link href="/calendar" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        View all in calendar <ArrowRight size={14} />
                      </Link>
                    )}
                  </section>
                )}

                {/* ═══════════════════════════════════════ */}
                {/* Stats row — compact, moved below tasks   */}
                {/* ═══════════════════════════════════════ */}
                <section className="mb-10">
                  <div className="border-t border-border pt-8">
                    <div className="flex flex-wrap gap-x-16 gap-y-6">
                      <StatFigure value={data.plants.length} label="Plants" icon={Leaf} />
                      <StatFigure value={totalDue} label={totalDue === 1 ? "Task due" : "Tasks due"} icon={Droplets} />
                      <StatFigure value={weeklyLogCount} label={weeklyLogCount === 1 ? "Care log this week" : "Care logs this week"} icon={Check} />
                    </div>
                  </div>
                </section>

                {/* ═══════════════════════════════════════ */}
                {/* Quick actions — improved                 */}
                {/* ═══════════════════════════════════════ */}
                <section className="mb-10">
                  <p className="text-label mb-5 text-muted-foreground">Quick actions</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/plants" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                      <Plus size={16} /> New plant
                    </Link>
                    <Link href="/identify" className="inline-flex items-center gap-2 rounded-full bg-muted px-7 py-3.5 text-sm font-semibold text-foreground transition hover:bg-muted/80">
                      <Scan size={16} /> Identify
                    </Link>
                    <Link href="/journal" className="inline-flex items-center gap-2 rounded-full bg-muted px-7 py-3.5 text-sm font-semibold text-foreground transition hover:bg-muted/80">
                      <BookOpen size={16} /> Journal
                    </Link>
                    <Link href="/calendar" className="inline-flex items-center gap-2 rounded-full bg-muted px-7 py-3.5 text-sm font-semibold text-foreground transition hover:bg-muted/80">
                      <Calendar size={16} /> Calendar
                    </Link>
                  </div>
                </section>

                {/* ═══════════════════════════════════════ */}
                {/* Insight cards — smart care insights      */}
                {/* ═══════════════════════════════════════ */}
                <InsightCards />

                {/* ═══════════════════════════════════════ */}
                {/* Plant care summaries                     */}
                {/* ═══════════════════════════════════════ */}
                {plantSummaries.length > 0 && (
                  <section className="mb-10">
                    <div className="flex items-center justify-between mb-5">
                      <p className="text-label text-muted-foreground">Your plants</p>
                      <Link href="/plants" className="rounded-full bg-muted px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80">View all</Link>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {plantSummaries.map((summary) => (
                        <Link
                          key={summary.id}
                          href={`/plants/${summary.id}`}
                          className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-white p-4 transition hover:shadow-sm active:scale-[0.99] dark:bg-muted"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                            <Sprout size={22} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {summary.name}
                            </p>
                            {summary.nextCareType ? (
                              <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                                {summary.nextCareType}
                                {summary.nextDueAt && (
                                  <span className="ml-1">
                                    · {formatRelTime(summary.nextDueAt)}
                                  </span>
                                )}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-xs text-muted-foreground">All caught up</p>
                            )}
                          </div>
                          <ChevronRight size={14} className="shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition" />
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* ═══════════════════════════════════════ */}
                {/* Recent care — activity log              */}
                {/* ═══════════════════════════════════════ */}
                {recentLogs.length > 0 && (
                  <section className="mb-12">
                    <p className="text-label mb-5 text-muted-foreground">Recent care</p>
                    <div className="space-y-2">
                      {recentLogs.slice(0, 5).map((log) => {
                        const plant = data.plants.find((p) => p.id === log.plant_id);
                        const Icon = CARE_ICONS[log.care_type] ?? Droplets;
                        return (
                          <div key={log.id} className="flex items-center gap-4 rounded-full bg-muted/50 px-6 py-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Icon size={14} aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground">
                                <span className="capitalize">{log.care_type}</span> — {plant?.name ?? "Unknown plant"}
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
              /* ── Empty state ── */
              <section className="pt-20">
                <div className="mx-auto max-w-lg text-center">
                  <p className="text-label mb-4 text-primary">{greeting}</p>
                  <h2 className="text-hero mb-6 text-foreground">Welcome to OpenSprout</h2>
                  <p className="mb-8 max-w-md mx-auto text-base leading-relaxed text-muted-foreground">
                    Track watering, log care, and keep your plants thriving. Add your first plant to start.
                  </p>
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Link href="/plants" className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110">
                      Add your first plant
                    </Link>
                    <Link href="/identify" className="rounded-full bg-muted px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/80">
                      Identify a plant
                    </Link>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </PullToRefresh>

      {/* ── Task Action Sheet ── */}
      <BottomSheet open={activeTask !== null} onClose={closeSheet} title={activeTask?.plantName}>
        {activeTask && action === "pick" && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground capitalize">{activeTask.care_type} care · {activeTask.due_at?.slice(0, 10)}</p>
            <div className="grid grid-cols-2 gap-3">
              <ActionButton icon={<Check size={22} />} label="Complete" variant="primary" onClick={() => setAction("complete")} />
              <ActionButton icon={<X size={22} />} label="Skip" variant="danger" onClick={doSkip} disabled={busy} />
              <ActionButton icon={<Clock size={22} />} label="Snooze" variant="outline" onClick={() => setAction("snooze")} />
              <ActionButton icon={<Calendar size={22} />} label="Reschedule" variant="outline" onClick={() => setAction("reschedule")} />
            </div>
          </div>
        )}
        {activeTask && action === "complete" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground">Log care details (optional)</p>
            <label className="block text-sm font-semibold">Water amount (ml)<Input className="mt-1 rounded-full text-sm" type="number" min={0} placeholder="e.g. 200" value={amountMl} onChange={(e) => setAmountMl(e.target.value)} /></label>
            <label className="block text-sm font-semibold">Fertilizer name<Input className="mt-1 rounded-full text-sm" placeholder="e.g. 20-20-20 liquid" value={fertName} onChange={(e) => setFertName(e.target.value)} /></label>
            <label className="block text-sm font-semibold">Notes<textarea className="mt-1 min-h-24 w-full rounded-2xl bg-muted px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Any observations..." value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} /></label>
            <div className="flex gap-3"><Button onClick={doComplete} disabled={busy}><Check size={16} /> Complete</Button><Button variant="outline" onClick={() => setAction("pick")}>Back</Button></div>
          </div>
        )}
        {activeTask && action === "snooze" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Snooze until:</p>
            <Input type="datetime-local" value={pickDate} onChange={(e) => setPickDate(e.target.value)} className="rounded-full text-sm" />
            <div className="flex gap-3"><Button onClick={doSnooze} disabled={busy || !pickDate}>Snooze</Button><Button variant="outline" onClick={() => setAction("pick")}>Back</Button></div>
          </div>
        )}
        {activeTask && action === "reschedule" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">New due date:</p>
            <Input type="datetime-local" value={pickDate} onChange={(e) => setPickDate(e.target.value)} className="rounded-full text-sm" />
            <div className="flex gap-3"><Button onClick={doReschedule} disabled={busy || !pickDate}>Reschedule</Button><Button variant="outline" onClick={() => setAction("pick")}>Back</Button></div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

// ── Stat figure — icon | number + label ──
function StatFigure({ value, label, icon: Icon }: { value: string | number; label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-display text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── Action button ──
function ActionButton({ icon, label, variant, onClick, disabled }: { icon: React.ReactNode; label: string; variant: "primary" | "danger" | "outline"; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={cn("flex flex-col items-center gap-2 rounded-2xl border p-5 text-sm font-semibold transition active:scale-[0.97]", variant === "primary" && "border-primary bg-primary text-primary-foreground hover:brightness-110", variant === "danger" && "border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10", variant === "outline" && "border-border bg-white text-foreground hover:bg-muted dark:bg-muted", disabled && "opacity-40 pointer-events-none")}>{icon}{label}</button>
  );
}
