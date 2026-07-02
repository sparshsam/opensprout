"use client";

import {
  CalendarDays,
  CloudOff,
  Download,
  Droplets,
  FileUp,
  Home,
  Leaf,
  Loader2,
  LogOut,
  NotebookTabs,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Sprout,
  Trash2,
} from "lucide-react";
import type { Session, User } from "@supabase/supabase-js";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithEmail, signOut, signUpWithEmail } from "@/lib/data/auth";
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
import type { CareScheduleRow, CareType, HealthStatus, PlantRow, PlantSpeciesRow } from "@/lib/data/types";
import { ValidationError } from "@/lib/data/validation";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: Home },
  { label: "Plants", icon: Leaf },
  { label: "Calendar", icon: CalendarDays },
  { label: "Journal", icon: NotebookTabs },
  { label: "Backups", icon: Download },
];

const careStyles: Record<CareType, string> = {
  water: "bg-sky-100 text-sky-800",
  fertilize: "bg-emerald-100 text-emerald-800",
  mist: "bg-cyan-100 text-cyan-800",
  rotate: "bg-violet-100 text-violet-800",
  prune: "bg-orange-100 text-orange-800",
  repot: "bg-rose-100 text-rose-800",
  inspect: "bg-amber-100 text-amber-800",
  custom: "bg-slate-100 text-slate-800",
};

const healthOptions: HealthStatus[] = ["thriving", "stable", "watch", "struggling", "unknown"];
const plantImages = ["/plant-monstera.svg", "/plant-pothos.svg", "/plant-calathea.svg"];

const emptyForm: PlantFormValues = {
  name: "",
  species_id: "",
  species: "",
  location: "",
  notes: "",
  health_status: "stable",
};

export function AppShell() {
  const supabase = useMemo(() => createClient(), []);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardData>({ plants: [], schedules: [], logs: [] });
  const [speciesList, setSpeciesList] = useState<PlantSpeciesRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<PlantRow | null>(null);
  const [formValues, setFormValues] = useState<PlantFormValues>(emptyForm);
  const [savingPlant, setSavingPlant] = useState(false);
  const [careSaving, setCareSaving] = useState<CareType | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: authData }) => {
      if (!mounted) return;
      setUser(authData.session?.user ?? null);
      setSessionLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession: Session | null) => {
      setUser(nextSession?.user ?? null);
      setError(null);
      setNotice(null);
      if (!nextSession) {
        setData({ plants: [], schedules: [], logs: [] });
        setSelectedId(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const refreshDashboard = useCallback(async () => {
    if (!user) return;

    setDataLoading(true);
    setError(null);
    try {
      const nextData = await listDashboardData(supabase, user.id);
      setData(nextData);
      setSelectedId((current) => {
        if (current && nextData.plants.some((plant) => plant.id === current)) return current;
        return nextData.plants[0]?.id ?? null;
      });
    } catch (refreshError) {
      setError(errorMessage(refreshError));
    } finally {
      setDataLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user) {
      void refreshDashboard();
    }
  }, [refreshDashboard, user]);

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    listPlantSpecies(supabase)
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

  const tasks = useMemo(() => buildCareTasks(data.plants, data.schedules), [data.plants, data.schedules]);
  const selectedPlant = data.plants.find((plant) => plant.id === selectedId) ?? data.plants[0] ?? null;
  const selectedSchedules = selectedPlant
    ? data.schedules.filter((schedule) => schedule.plant_id === selectedPlant.id)
    : [];

  const visiblePlants = useMemo(
    () =>
      data.plants.filter((plant) =>
        `${plant.name} ${plant.species ?? ""} ${plant.location ?? ""}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [data.plants, query],
  );

  function openCreateForm() {
    setEditingPlant(null);
    setFormValues(emptyForm);
    setShowForm(true);
  }

  function openEditForm(plant: PlantRow) {
    setEditingPlant(plant);
    setFormValues({
      name: plant.name,
      species_id: plant.species_id ?? "",
      species: plant.species ?? "",
      location: plant.location ?? "",
      notes: plant.notes ?? "",
      health_status: plant.health_status ?? "stable",
    });
    setShowForm(true);
  }

  async function handleSavePlant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !formValues.name.trim()) return;

    setSavingPlant(true);
    setError(null);
    try {
      if (editingPlant) {
        const updated = await updatePlant(supabase, user.id, editingPlant.id, formValues);
        setNotice(`${updated.name} updated.`);
      } else {
        const created = await createPlant(supabase, user.id, formValues);
        setNotice(`${created.name} added.`);
        setSelectedId(created.id);
      }
      setShowForm(false);
      setEditingPlant(null);
      await refreshDashboard();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSavingPlant(false);
    }
  }

  async function handleDeletePlant(plant: PlantRow) {
    if (!user) return;

    const confirmed = window.confirm(`Delete ${plant.name}? This removes its schedules, logs, and journal entries.`);
    if (!confirmed) return;

    setError(null);
    try {
      await deletePlant(supabase, user.id, plant.id);
      setNotice(`${plant.name} deleted.`);
      await refreshDashboard();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    }
  }

  async function handleMarkCare(careType: CareType) {
    if (!user || !selectedPlant) return;

    setCareSaving(careType);
    setError(null);
    try {
      await markCareDone(supabase, user.id, selectedPlant.id, careType);
      setNotice(`${selectedPlant.name} marked ${careType === "water" ? "watered" : "fertilized"}.`);
      await refreshDashboard();
    } catch (careError) {
      setError(errorMessage(careError));
    } finally {
      setCareSaving(null);
    }
  }

  function exportJson() {
    const payload = JSON.stringify(
      { schemaVersion: 1, exportedAt: new Date().toISOString(), ...data },
      null,
      2,
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "opensprout-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (sessionLoading) {
    return <CenteredState label="Loading OpenSprout" />;
  }

  if (!user) {
    return <AuthPanel supabase={supabase} />;
  }

  const dueTasks = tasks.filter((task) => task.status === "Due" || task.status === "Overdue");
  const healthyCount = data.plants.filter((plant) => plant.health_status === "thriving" || plant.health_status === "stable").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="hidden border-r border-border bg-white px-4 py-5 lg:block">
          <Brand />
          <nav className="space-y-1" aria-label="Primary">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  item.label === "Dashboard" && "bg-primary/10 text-primary",
                )}
              >
                <item.icon size={18} aria-hidden />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-8 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <div className="flex items-center gap-2 font-semibold text-emerald-900">
              <CloudOff size={16} aria-hidden />
              Supabase sync
            </div>
            <p className="mt-1 text-xs leading-5 text-emerald-800">
              Your rows are protected by RLS and scoped to your authenticated user.
            </p>
          </div>
        </aside>

        <main className="px-4 py-4 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 lg:hidden">
                <Sprout className="text-primary shrink-0" size={24} aria-hidden />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-bold tracking-[0.06em] uppercase text-muted-foreground/50">
                    OPEN
                  </span>
                  <span className="text-lg font-bold text-foreground -mt-0.5">
                    Sprout
                  </span>
                </div>
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-normal text-foreground md:mt-0">Plant dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Signed in as {user.email}. Your plants are persisted in Supabase.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportJson}>
                <Download size={16} aria-hidden />
                Export JSON
              </Button>
              <Button variant="outline" disabled title="Import is planned for the backup milestone.">
                <FileUp size={16} aria-hidden />
                Import
              </Button>
              <Button onClick={openCreateForm}>
                <Plus size={16} aria-hidden />
                Add plant
              </Button>
              <Button variant="ghost" onClick={() => signOut(supabase)}>
                <LogOut size={16} aria-hidden />
                Logout
              </Button>
            </div>
          </header>

          {(error || notice) && (
            <div
              className={cn(
                "mt-4 rounded-md border px-4 py-3 text-sm font-medium",
                error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800",
              )}
            >
              {error ?? notice}
            </div>
          )}

          <section className="grid gap-5 py-6 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["Due today", String(dueTasks.length), dueTasks.length === 1 ? "1 care task" : `${dueTasks.length} care tasks`],
                  ["Healthy plants", String(healthyCount), `${data.plants.length} total plants`],
                  ["Backups", "JSON", "Export uses live rows"],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-md border border-border bg-card p-4 shadow-panel">
                    <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
                    <p className="mt-3 text-3xl font-bold">{value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-md border border-border bg-card p-4 shadow-panel">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Care reminders</h2>
                    <p className="text-sm text-muted-foreground">Calculated from your active Supabase schedules.</p>
                  </div>
                  {dataLoading && <Loader2 className="animate-spin text-muted-foreground" size={18} aria-label="Loading" />}
                </div>
                {tasks.length === 0 ? (
                  <EmptyPanel text="Add a plant with a watering cadence to see care tasks here." />
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {tasks.slice(0, 6).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedId(task.plantId)}
                        className="rounded-md border border-border bg-white p-3 text-left transition hover:border-primary"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold">{task.label}</p>
                          <span className={cn("rounded-sm px-2 py-1 text-xs font-bold", careStyles[task.careType])}>
                            {task.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{task.plantName}</p>
                        <p className="mt-3 text-xs font-semibold text-foreground">{formatDueDate(task.dueAt)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-md border border-border bg-card p-4 shadow-panel">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Plants</h2>
                    <p className="text-sm text-muted-foreground">Create, edit, delete, and inspect persisted plants.</p>
                  </div>
                  <label className="relative block md:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search plants"
                      className="pl-9"
                    />
                  </label>
                </div>

                {showForm && (
                  <PlantForm
                    editing={Boolean(editingPlant)}
                    values={formValues}
                    speciesList={speciesList}
                    saving={savingPlant}
                    onChange={setFormValues}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingPlant(null);
                    }}
                    onSubmit={handleSavePlant}
                  />
                )}

                {dataLoading ? (
                  <CenteredState label="Loading plants" compact />
                ) : visiblePlants.length === 0 ? (
                  <EmptyPanel text={query ? "No plants match that search." : "No plants yet. Add your first plant to start tracking care."} />
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {visiblePlants.map((plant, index) => (
                      <PlantCard
                        key={plant.id}
                        plant={plant}
                        image={plantImages[index % plantImages.length]}
                        selected={selectedPlant?.id === plant.id}
                        onSelect={() => setSelectedId(plant.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-5">
              {selectedPlant ? (
                <PlantDetail
                  plant={selectedPlant}
                  image={plantImages[Math.max(data.plants.findIndex((plant) => plant.id === selectedPlant.id), 0) % plantImages.length]}
                  schedules={selectedSchedules}
                  careSaving={careSaving}
                  onEdit={() => openEditForm(selectedPlant)}
                  onDelete={() => handleDeletePlant(selectedPlant)}
                  onMarkCare={handleMarkCare}
                />
              ) : (
                <div className="rounded-md border border-border bg-card p-4 shadow-panel">
                  <h2 className="text-lg font-bold">No plant selected</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Add a plant to unlock care logging.</p>
                </div>
              )}

              <div className="rounded-md border border-border bg-card p-4 shadow-panel">
                <h2 className="text-lg font-bold">Recent care logs</h2>
                {data.logs.length === 0 ? (
                  <EmptyPanel text="Mark a plant watered or fertilized to start the care log." />
                ) : (
                  <div className="mt-3 space-y-3">
                    {data.logs.slice(0, 5).map((log) => {
                      const plant = data.plants.find((item) => item.id === log.plant_id);
                      return (
                        <div key={log.id} className="flex gap-3 rounded-md border border-border bg-white p-3">
                          <div className="h-12 w-12 rounded-md bg-[linear-gradient(135deg,#d7f5e5,#d7ecff)]" />
                          <div>
                            <p className="font-semibold capitalize">{log.care_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {plant?.name ?? "Plant"} · {formatDueDate(log.occurred_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}

function AuthPanel({ supabase }: { supabase: ReturnType<typeof createClient> }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
        const result = await signUpWithEmail(supabase, email, password);
        setMessage(result.session ? "Account created. Loading your garden..." : "Check your email to confirm your account, then log in.");
      } else {
        await signInWithEmail(supabase, email, password);
      }
    } catch (authError) {
      setError(errorMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md rounded-md border border-border bg-card p-6 shadow-panel">
        <Brand />
        <h1 className="mt-8 text-3xl font-bold">Sign in to your garden</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          OpenSprout uses Supabase Auth and RLS so every plant row belongs to your user.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleAuth}>
          <label className="block text-sm font-semibold">
            Email
            <Input
              className="mt-2"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <Input
              className="mt-2"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}
          {message && <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{message}</p>}
          <Button className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" size={16} aria-hidden />}
            {mode === "signup" ? "Create account" : "Login"}
          </Button>
        </form>
        <button
          className="mt-4 text-sm font-semibold text-primary hover:underline"
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setError(null);
            setMessage(null);
          }}
        >
          {mode === "signup" ? "Already have an account? Login" : "Need an account? Sign up"}
        </button>
      </section>
    </main>
  );
}

function Brand() {
  return (
    <div className="mb-8 flex items-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Sprout size={22} aria-hidden />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] font-bold tracking-[0.06em] uppercase text-muted-foreground/50">
          OPEN
        </span>
        <span className="text-lg font-bold text-foreground -mt-0.5">
          Sprout
        </span>
        <span className="text-xs font-medium text-muted-foreground">Your plants. Your data.</span>
      </div>
    </div>
  );
}

function PlantForm({
  editing,
  values,
  speciesList,
  saving,
  onChange,
  onCancel,
  onSubmit,
}: {
  editing: boolean;
  values: PlantFormValues;
  speciesList: PlantSpeciesRow[];
  saving: boolean;
  onChange: (values: PlantFormValues) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [templateQuery, setTemplateQuery] = useState("");
  const selectedSpecies = speciesList.find((species) => species.id === values.species_id) ?? null;
  const visibleSpecies = speciesList
    .filter((species) => {
      const query = templateQuery.trim().toLowerCase();
      if (!query) return true;

      return [
        species.common_name,
        species.scientific_name ?? "",
        ...species.aliases,
      ].some((value) => value.toLowerCase().includes(query));
    });

  function applySpeciesTemplate(speciesId: string) {
    const species = speciesList.find((item) => item.id === speciesId);
    if (!species) {
      onChange({ ...values, species_id: "", species: "" });
      return;
    }

    onChange({
      ...values,
      name: values.name || species.common_name,
      species_id: species.id,
      species: species.scientific_name ?? species.common_name,
    });
  }

  return (
    <form className="mt-4 rounded-md border border-border bg-white p-4" onSubmit={onSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        {!editing && (
          <div className="md:col-span-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
              <label className="text-sm font-semibold text-emerald-950">
                Care Templates
                <Input
                  className="mt-2 bg-white"
                  value={templateQuery}
                  onChange={(event) => setTemplateQuery(event.target.value)}
                  placeholder="Search snake plant, pothos, basil..."
                />
              </label>
              <label className="text-sm font-semibold text-emerald-950">
                Choose a plant
                <select
                  className="mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                  value={values.species_id ?? ""}
                  onChange={(event) => applySpeciesTemplate(event.target.value)}
                >
                  <option value="">Custom or unknown plant</option>
                  {visibleSpecies.map((species) => (
                    <option key={species.id} value={species.id}>
                      {species.common_name}
                      {species.scientific_name ? ` (${species.scientific_name})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {selectedSpecies && (
              <div className="mt-3 grid gap-3 text-sm text-emerald-950 md:grid-cols-3">
                <p>
                  <span className="block text-xs font-bold uppercase text-emerald-700">Light</span>
                  {selectedSpecies.light_preference ?? "No light note yet."}
                </p>
                <p>
                  <span className="block text-xs font-bold uppercase text-emerald-700">Water</span>
                  {formatWaterRange(selectedSpecies)}
                </p>
                <p>
                  <span className="block text-xs font-bold uppercase text-emerald-700">Difficulty</span>
                  {selectedSpecies.difficulty ?? "Not rated"}
                </p>
                <p className="md:col-span-3">{selectedSpecies.care_summary}</p>
              </div>
            )}
          </div>
        )}
        <label className="text-sm font-semibold">
          Name
          <Input
            className="mt-2"
            required
            value={values.name}
            onChange={(event) => onChange({ ...values, name: event.target.value })}
            placeholder="Monstera by the window"
          />
        </label>
        <label className="text-sm font-semibold">
          Species
          <Input
            className="mt-2"
            value={values.species ?? ""}
            onChange={(event) => onChange({ ...values, species_id: "", species: event.target.value })}
            placeholder="Monstera deliciosa"
          />
        </label>
        <label className="text-sm font-semibold">
          Location
          <Input
            className="mt-2"
            value={values.location ?? ""}
            onChange={(event) => onChange({ ...values, location: event.target.value })}
            placeholder="Living room"
          />
        </label>
        <label className="text-sm font-semibold">
          Health
          <select
            className="mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
            value={values.health_status ?? "stable"}
            onChange={(event) => onChange({ ...values, health_status: event.target.value as HealthStatus })}
          >
            {healthOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        {!editing && (
          <>
          </>
        )}
      </div>
      <label className="mt-3 block text-sm font-semibold">
        Notes
        <textarea
          className="mt-2 min-h-24 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
          value={values.notes ?? ""}
          onChange={(event) => onChange({ ...values, notes: event.target.value })}
          placeholder="Care notes, soil mix, light preference..."
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={16} aria-hidden /> : <Save size={16} aria-hidden />}
          {editing ? "Save plant" : "Create plant"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function PlantCard({
  plant,
  image,
  selected,
  onSelect,
}: {
  plant: PlantRow;
  image: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex min-h-32 gap-4 rounded-md border border-border bg-white p-3 text-left transition hover:border-primary",
        selected && "border-primary ring-2 ring-ring",
      )}
    >
      <Image
        src={image}
        alt=""
        width={96}
        height={96}
        unoptimized
        className="h-24 w-24 shrink-0 rounded-md bg-muted object-cover"
      />
      <span className="min-w-0">
        <span className="block font-bold">{plant.name}</span>
        <span className="block truncate text-sm italic text-muted-foreground">{plant.species ?? "Unknown species"}</span>
        <span className="mt-3 block text-sm text-muted-foreground">{plant.location ?? "No location"}</span>
        <span className="mt-3 inline-flex rounded-sm bg-emerald-100 px-2 py-1 text-xs font-bold capitalize text-emerald-800">
          {plant.health_status ?? "stable"}
        </span>
      </span>
    </button>
  );
}

function PlantDetail({
  plant,
  image,
  schedules,
  careSaving,
  onEdit,
  onDelete,
  onMarkCare,
}: {
  plant: PlantRow;
  image: string;
  schedules: CareScheduleRow[];
  careSaving: CareType | null;
  onEdit: () => void;
  onDelete: () => void;
  onMarkCare: (careType: CareType) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{plant.name}</h2>
          <p className="text-sm italic text-muted-foreground">{plant.species ?? "Unknown species"}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label="Edit plant" onClick={onEdit}>
            <Pencil size={18} aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Delete plant" onClick={onDelete}>
            <Trash2 size={18} aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Plant settings">
            <Settings size={18} aria-hidden />
          </Button>
        </div>
      </div>
      <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
        <Image src={image} alt="" fill unoptimized className="object-cover" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => onMarkCare("water")} disabled={careSaving !== null}>
          {careSaving === "water" ? <Loader2 className="animate-spin" size={16} aria-hidden /> : <Droplets size={16} aria-hidden />}
          Mark watered
        </Button>
        <Button variant="outline" onClick={() => onMarkCare("fertilize")} disabled={careSaving !== null}>
          {careSaving === "fertilize" ? <Loader2 className="animate-spin" size={16} aria-hidden /> : <Leaf size={16} aria-hidden />}
          Fertilized
        </Button>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="font-semibold text-muted-foreground">Location</dt>
          <dd>{plant.location ?? "Not set"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted-foreground">Status</dt>
          <dd className="capitalize">{plant.health_status ?? "stable"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted-foreground">Water</dt>
          <dd>{formatSchedule(schedules, "water")}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted-foreground">Fertilize</dt>
          <dd>{formatSchedule(schedules, "fertilize")}</dd>
        </div>
      </dl>
      <p className="mt-4 rounded-md bg-muted p-3 text-sm leading-6 text-muted-foreground">
        {plant.notes ?? "No notes yet."}
      </p>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-md border border-dashed border-border bg-white p-4 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function CenteredState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={cn("grid place-items-center text-muted-foreground", compact ? "min-h-40" : "min-h-screen")}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Loader2 className="animate-spin" size={18} aria-hidden />
        {label}
      </div>
    </div>
  );
}

function formatWaterRange(species: PlantSpeciesRow) {
  if (species.watering_min_days && species.watering_max_days) {
    return `${species.watering_min_days}-${species.watering_max_days} days`;
  }

  const days = species.watering_min_days ?? species.watering_max_days;
  return days ? `About every ${days} days` : "No watering template yet.";
}

function formatSchedule(schedules: CareScheduleRow[], careType: CareType) {
  const schedule = schedules.find((item) => item.care_type === careType);
  return schedule ? formatDueDate(schedule.next_due_at) : "No schedule";
}

function errorMessage(error: unknown) {
  console.error(error);
  if (error instanceof ValidationError) return error.message;
  return "Something went wrong. Please try again.";
}
