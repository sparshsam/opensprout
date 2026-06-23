"use client";

import { useState } from "react";
import { useApp } from "@/lib/context/app-context";
import { useAtmosphere } from "@/lib/hooks/use-atmosphere";
import {
  Check, X, Clock, Calendar, Sprout, ArrowRight, Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompleteTaskInput } from "@/lib/data/tasks";
import type { TaskWithPlant } from "@/lib/data/tasks";
import { BottomSheet } from "@/components/sheets/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Skeleton } from "@/components/ui/skeleton";

function formatRelTime(d: string): string {
  const dt = new Date(d);
  const now = new Date();
  const h = Math.round((dt.getTime() - now.getTime()) / (1000 * 60 * 60));
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

export default function HomePage() {
  const { data, tasks, dataLoading, error, notice, handleCompleteTask, handleSkipTask, handleSnoozeTask, handleRescheduleTask, refreshDashboard } = useApp();
  const { greeting, headline, tagline, season } = useAtmosphere();

  const [activeTask, setActiveTask] = useState<TaskWithPlant | null>(null);
  const [action, setAction] = useState<"pick" | "complete" | "snooze" | "reschedule">("pick");
  const [busy, setBusy] = useState(false);
  const [amountMl, setAmountMl] = useState("");
  const [fertName, setFertName] = useState("");
  const [fertStrength, setFertStrength] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [pickDate, setPickDate] = useState("");

  const totalDue = tasks.overdue.length + tasks.today.length;
  const allUpcoming = [...tasks.overdue, ...tasks.today, ...tasks.upcoming];
  const recentLogs = [...data.logs].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  const nextTask = allUpcoming[0] ?? null;
  const isLoading = dataLoading && tasks.overdue.length === 0 && tasks.today.length === 0;
  const hasContent = data.plants.length > 0 || totalDue > 0 || tasks.upcoming.length > 0;

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
        ) : hasContent ? (
          <>
            {/* ════════════════════════════════════ */}
            {/* Hero — atmospheric brand moment     */}
            {/* ════════════════════════════════════ */}
            <section className="mb-28 sm:mb-36">
              <p className="text-label mb-5 text-primary">{greeting}</p>
              <h1 className="text-hero mb-6 max-w-3xl text-foreground leading-[1.05]">
                {headline}
              </h1>
              <p className="mb-10 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                {tagline}
              </p>
              <div className="flex flex-wrap gap-3">
                {totalDue > 0 ? (
                  <>
                    <button onClick={() => document.getElementById("care-section")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110">
                      {totalDue} plant{totalDue !== 1 ? "s" : ""} need care
                    </button>
                    <a href="/plants" className="rounded-full bg-muted px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/80">View collection</a>
                  </>
                ) : data.plants.length > 0 ? (
                  <>
                    <div className="rounded-full bg-primary/10 px-8 py-3.5 text-sm font-semibold text-primary">All caught up</div>
                    <a href="/plants" className="rounded-full bg-muted px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/80">Your collection</a>
                  </>
                ) : (
                  <>
                    <a href="/plants" className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110">Add your first plant</a>
                    <a href="/identify" className="rounded-full bg-muted px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/80">Identify a plant</a>
                  </>
                )}
              </div>
            </section>

            {/* ════════════════════════════════════ */}
            {/* Today's care — next action          */}
            {/* ════════════════════════════════════ */}
            {nextTask && (
              <section id="care-section" className="mb-28 sm:mb-36">
                <p className="text-label mb-8 text-muted-foreground">Today&apos;s care</p>
                <div className="border-t border-border pt-10">
                  <div className="flex items-start justify-between gap-8">
                    <div className="min-w-0 max-w-xl">
                      <p className="text-display mb-3 text-foreground">{nextTask.plantName}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold tracking-wider uppercase text-primary">{nextTask.care_type}</span>
                        <span>{nextTask.due_at ? formatRelTime(nextTask.due_at) : ""}</span>
                      </div>
                      <button onClick={() => openSheet(nextTask)} className="mt-8 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110">
                        Mark as done
                      </button>
                    </div>
                    <div className="hidden shrink-0 sm:block">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/8 text-primary">
                        <Sprout size={36} aria-hidden />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ════════════════════════════════════ */}
            {/* Upcoming                             */}
            {/* ════════════════════════════════════ */}
            {(tasks.upcoming.length > 0 || totalDue > 0) && (
              <section className="mb-28 sm:mb-36">
                <p className="text-label mb-8 text-muted-foreground">Upcoming</p>
                <div className="space-y-3">
                  {tasks.overdue.slice(0, 3).map((t) => <ReminderRow key={t.id} task={t} overdue onClick={() => openSheet(t)} />)}
                  {tasks.today.slice(0, 4).map((t) => <ReminderRow key={t.id} task={t} onClick={() => openSheet(t)} />)}
                  {tasks.upcoming.slice(0, 3).map((t) => <ReminderRow key={t.id} task={t} subdued onClick={() => openSheet(t)} />)}
                </div>
              </section>
            )}

            {/* ════════════════════════════════════ */}
            {/* Collection                           */}
            {/* ════════════════════════════════════ */}
            {data.plants.length > 0 && (
              <section className="mb-28 sm:mb-36">
                <div className="flex items-center justify-between mb-8">
                  <p className="text-label text-muted-foreground">{data.plants.length} plant{data.plants.length !== 1 ? "s" : ""}</p>
                  <a href="/plants" className="rounded-full bg-muted px-5 py-2 text-xs font-semibold text-foreground hover:bg-muted/80">View all</a>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {data.plants.slice(0, 6).map((plant) => (
                    <PlantCard key={plant.id} name={plant.name} species={plant.species} health={plant.health_status} location={plant.location} />
                  ))}
                </div>
                {data.plants.length > 6 && (
                  <a href="/plants" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">View all {data.plants.length} plants <ArrowRight size={14} /></a>
                )}
              </section>
            )}

            {/* ════════════════════════════════════ */}
            {/* Recent care                           */}
            {/* ════════════════════════════════════ */}
            {recentLogs.length > 0 && (
              <section className="mb-12">
                <p className="text-label mb-8 text-muted-foreground">Recent care</p>
                <div className="space-y-3">
                  {recentLogs.slice(0, 5).map((log) => {
                    const plant = data.plants.find((p) => p.id === log.plant_id);
                    return (
                      <div key={log.id} className="flex items-center gap-4 rounded-full bg-muted/50 px-6 py-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Droplets size={14} aria-hidden /></div>
                        <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-foreground"><span className="capitalize">{log.care_type}</span> — {plant?.name ?? "Unknown plant"}</p></div>
                        <time className="shrink-0 text-xs font-semibold text-muted-foreground">{formatTimeAgo(log.occurred_at)}</time>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        ) : (
          /* ── Empty state ── */
          <section className="pt-28 sm:pt-36">
            <div className="mx-auto max-w-lg text-center">
              <p className="text-label mb-4 text-primary">{greeting}</p>
              <h2 className="text-hero mb-6 text-foreground">Welcome to OpenSprout</h2>
              <p className="mb-8 max-w-md mx-auto text-base leading-relaxed text-muted-foreground">Track watering, log care, and keep your plants thriving. Add your first plant to start.</p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a href="/plants" className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110">Add your first plant</a>
                <a href="/identify" className="rounded-full bg-muted px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/80">Identify a plant</a>
              </div>
            </div>
          </section>
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

// ── Reminder row ──
function ReminderRow({ task, overdue, subdued, onClick }: { task: TaskWithPlant; overdue?: boolean; subdued?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-4 rounded-full px-6 py-4 text-left transition hover:bg-muted/70 active:scale-[0.99]", overdue && "bg-destructive/5", !overdue && !subdued && "bg-muted/30")}>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", overdue ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}><Droplets size={16} aria-hidden /></div>
      <div className="min-w-0 flex-1"><p className={cn("text-sm font-semibold", overdue && "text-destructive", subdued && "text-muted-foreground/70")}>{task.plantName}</p><p className="mt-0.5 text-xs text-muted-foreground capitalize">{task.care_type}</p></div>
      <div className="shrink-0 text-right"><span className={cn("block text-sm font-semibold", overdue && "text-destructive", subdued && "text-muted-foreground/50")}>{task.due_at ? formatRelTime(task.due_at) : ""}</span>{overdue && <span className="text-xs font-bold text-destructive">Overdue</span>}</div>
    </button>
  );
}

// ── Plant card ──
function PlantCard({ name, species, health, location }: { name: string; species: string | null; health: string | null; location: string | null }) {
  return (
    <a href="/plants" className="group block rounded-3xl border border-border/50 bg-white p-6 transition hover:shadow-sm active:scale-[0.99]">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/8 text-primary mb-5">
        <Sprout size={32} aria-hidden />
      </div>
      <p className="text-lg font-bold text-foreground">{name}</p>
      {species && <p className="mt-0.5 text-sm italic text-muted-foreground">{species}</p>}
      {location && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />{location}</p>}
    </a>
  );
}

// ── Action button ──
function ActionButton({ icon, label, variant, onClick, disabled }: { icon: React.ReactNode; label: string; variant: "primary" | "danger" | "outline"; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={cn("flex flex-col items-center gap-2 rounded-2xl border p-5 text-sm font-semibold transition active:scale-[0.97]", variant === "primary" && "border-primary bg-primary text-primary-foreground hover:brightness-110", variant === "danger" && "border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10", variant === "outline" && "border-border bg-white text-foreground hover:bg-muted", disabled && "opacity-40 pointer-events-none")}>{icon}{label}</button>
  );
}
