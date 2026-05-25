"use client";

import {
  CalendarDays,
  CloudOff,
  Download,
  FileUp,
  Home,
  Leaf,
  NotebookTabs,
  Plus,
  Search,
  Settings,
  Sprout,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { plants as seedPlants, reminders, journalEntries, type Plant } from "@/data/demo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: Home },
  { label: "Plants", icon: Leaf },
  { label: "Calendar", icon: CalendarDays },
  { label: "Journal", icon: NotebookTabs },
  { label: "Backups", icon: Download },
];

const careStyles = {
  water: "bg-sky-100 text-sky-800",
  fertilize: "bg-emerald-100 text-emerald-800",
  prune: "bg-orange-100 text-orange-800",
  repot: "bg-rose-100 text-rose-800",
};

export function AppShell() {
  const [plants, setPlants] = useState<Plant[]>(seedPlants);
  const [selectedId, setSelectedId] = useState(seedPlants[0].id);
  const [query, setQuery] = useState("");
  const selectedPlant = plants.find((plant) => plant.id === selectedId) ?? plants[0];

  const visiblePlants = useMemo(
    () =>
      plants.filter((plant) =>
        `${plant.name} ${plant.species} ${plant.room}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [plants, query],
  );

  function addPlant() {
    const newPlant: Plant = {
      id: `plant-${Date.now()}`,
      name: "New cutting",
      species: "Unidentified plant",
      room: "Propagation station",
      light: "Bright indirect",
      status: "stable",
      nextCare: "Set schedule",
      careType: "water",
      image: "/plant-pothos.svg",
      notes: "Add species, photos, and care cadence when this plant settles in.",
    };

    setPlants((current) => [newPlant, ...current]);
    setSelectedId(newPlant.id);
  }

  function exportJson() {
    const payload = JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), plants }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "opensprout-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="hidden border-r border-border bg-white px-4 py-5 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sprout size={22} aria-hidden />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">OpenSprout</p>
              <p className="text-xs font-medium text-muted-foreground">Your plants. Your data.</p>
            </div>
          </div>
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
              Offline ready
            </div>
            <p className="mt-1 text-xs leading-5 text-emerald-800">
              Changes queue locally and sync when your Supabase instance is reachable.
            </p>
          </div>
        </aside>

        <main className="px-4 py-4 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 lg:hidden">
                <Sprout className="text-primary" size={24} aria-hidden />
                <span className="text-lg font-bold">OpenSprout</span>
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-normal text-foreground md:mt-0">Plant dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track care, photos, and reminders without handing your garden to a subscription.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportJson}>
                <Download size={16} aria-hidden />
                Export JSON
              </Button>
              <Button variant="outline">
                <FileUp size={16} aria-hidden />
                Import
              </Button>
              <Button onClick={addPlant}>
                <Plus size={16} aria-hidden />
                Add plant
              </Button>
            </div>
          </header>

          <section className="grid gap-5 py-6 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["Due today", "2", "Water and inspect"],
                  ["Healthy plants", "8", "3 improved this week"],
                  ["Backups", "Local", "Last export 2 days ago"],
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
                    <p className="text-sm text-muted-foreground">Your next household plant tasks.</p>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                      <span
                        key={day}
                        className={cn("rounded-md px-2 py-1.5", index === 0 && "bg-primary text-primary-foreground")}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {reminders.map((reminder) => (
                    <div key={reminder.id} className="rounded-md border border-border bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{reminder.task}</p>
                        <span className="rounded-sm bg-sky-100 px-2 py-1 text-xs font-bold text-sky-800">
                          {reminder.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{reminder.plant}</p>
                      <p className="mt-3 text-xs font-semibold text-foreground">{reminder.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-border bg-card p-4 shadow-panel">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Plants</h2>
                    <p className="text-sm text-muted-foreground">Search, inspect, and update your collection.</p>
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
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {visiblePlants.map((plant) => (
                    <button
                      key={plant.id}
                      onClick={() => setSelectedId(plant.id)}
                      className={cn(
                        "flex min-h-32 gap-4 rounded-md border border-border bg-white p-3 text-left transition hover:border-primary",
                        selectedId === plant.id && "border-primary ring-2 ring-ring",
                      )}
                    >
                      <Image
                        src={plant.image}
                        alt=""
                        width={96}
                        height={96}
                        unoptimized
                        className="h-24 w-24 shrink-0 rounded-md bg-muted object-cover"
                      />
                      <span className="min-w-0">
                        <span className="block font-bold">{plant.name}</span>
                        <span className="block truncate text-sm italic text-muted-foreground">{plant.species}</span>
                        <span className="mt-3 block text-sm text-muted-foreground">{plant.room}</span>
                        <span className={cn("mt-3 inline-flex rounded-sm px-2 py-1 text-xs font-bold", careStyles[plant.careType])}>
                          {plant.careType}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-md border border-border bg-card p-4 shadow-panel">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{selectedPlant.name}</h2>
                    <p className="text-sm italic text-muted-foreground">{selectedPlant.species}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Plant settings">
                    <Settings size={18} aria-hidden />
                  </Button>
                </div>
                <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
                  <Image src={selectedPlant.image} alt="" fill unoptimized className="object-cover" />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="font-semibold text-muted-foreground">Room</dt>
                    <dd>{selectedPlant.room}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-muted-foreground">Light</dt>
                    <dd>{selectedPlant.light}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-muted-foreground">Status</dt>
                    <dd className="capitalize">{selectedPlant.status}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-muted-foreground">Next care</dt>
                    <dd>{selectedPlant.nextCare}</dd>
                  </div>
                </dl>
                <p className="mt-4 rounded-md bg-muted p-3 text-sm leading-6 text-muted-foreground">{selectedPlant.notes}</p>
              </div>

              <div className="rounded-md border border-border bg-card p-4 shadow-panel">
                <h2 className="text-lg font-bold">Health journal</h2>
                <div className="mt-3 space-y-3">
                  {journalEntries.map((entry) => (
                    <div key={entry.title} className="flex gap-3 rounded-md border border-border bg-white p-3">
                      <div className="h-12 w-12 rounded-md bg-[linear-gradient(135deg,#d7f5e5,#d7ecff)]" />
                      <div>
                        <p className="font-semibold">{entry.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.plant} · {entry.date} · {entry.tone}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
