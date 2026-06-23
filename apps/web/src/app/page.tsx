import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { AuthGate } from "@/components/auth-gate";
import {
  Bell,
  Folder,
  Scan,
  BookOpen,
  Stethoscope,
  WifiOff,
  Bot,
} from "lucide-react";

export const metadata: Metadata = {
  title: "OpenSprout — Free & Open-Source Plant Care",
  description:
    "Track, identify, and care for your plants. OpenSprout is a privacy-first, open-source plant care companion with reminders, journals, identification, and diagnosis.",
  openGraph: {
    title: "OpenSprout — Free & Open-Source Plant Care",
    description:
      "Track, identify, and care for your plants. OpenSprout is a privacy-first, open-source plant care companion.",
  },
};

const features = [
  {
    number: "01",
    icon: Folder,
    title: "Plant collection",
    description:
      "Build a living catalog of your plants. Add names, species, locations, and photos. Your garden, organized your way.",
  },
  {
    number: "02",
    icon: Bell,
    title: "Care reminders",
    description:
      "Set watering, fertilizing, and misting schedules per plant. OpenSprout tells you what needs attention and when.",
  },
  {
    number: "03",
    icon: Scan,
    title: "Plant identification",
    description:
      "Snap a photo and let AI suggest the species. Powered by PlantNet — your data stays private, only the image is analyzed.",
  },
  {
    number: "04",
    icon: BookOpen,
    title: "Growth journal",
    description:
      "Log observations, track milestones, and score health over time. Build a visual history of every plant's journey.",
  },
  {
    number: "05",
    icon: Stethoscope,
    title: "Diagnosis & care knowledge",
    description:
      "Search a built-in knowledge base for symptoms like yellow leaves or drooping stems. Get causes, solutions, and prevention tips.",
  },
  {
    number: "06",
    icon: WifiOff,
    title: "Offline-first ownership",
    description:
      "Your data lives on your device. Sync when you choose. Export everything as JSON at any time — no vendor lock-in.",
  },
  {
    number: "07",
    icon: Bot,
    title: "AI-agent ready",
    description:
      "Connect AI agents through MCP (Model Context Protocol). Ask your assistant to water logs, check schedules, or diagnose issues in natural language.",
  },
];

function FeatureSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <p className="text-label mb-4 text-primary">Features</p>
        <h2 className="text-display mb-4 text-foreground">
          Everything you need to care for your plants
        </h2>
        <p className="mb-16 max-w-lg text-base text-muted-foreground sm:text-lg">
          No subscriptions, no ads, no data sales. Just a calm, purposeful tool
          for plant people.
        </p>

        <div className="grid gap-14 sm:grid-cols-[auto_1fr] sm:gap-x-10 sm:gap-y-16">
          {features.map((f) => (
            <div
              key={f.number}
              className="sm:contents"
            >
              {/* Number anchor — large, bold, accent */}
              <span className="hidden text-6xl font-black leading-none text-primary/20 select-none sm:block sm:text-7xl">
                {f.number}
              </span>
              {/* Content */}
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <f.icon size={18} aria-hidden />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {f.title}
                  </h3>
                </div>
                <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="border-t border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-14 sm:grid-cols-2 sm:gap-16">
          {/* Main trust copy */}
          <div>
            <p className="text-label mb-4 text-primary">Trust</p>
            <h2 className="text-display mb-4 text-foreground">
              Built on open source and privacy
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              OpenSprout is free software licensed under{" "}
              <a
                href="https://www.gnu.org/licenses/agpl-3.0.html"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground underline underline-offset-2"
              >
                AGPLv3
              </a>
              . The full source is on GitHub — auditable, forkable, improvable.
              No analytics, no tracking, no data sales. Your data stays yours.
            </p>
          </div>

          {/* Technical details — lighter, for builders */}
          <div>
            <p className="text-label mb-4 text-muted-foreground">
              For builders
            </p>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary/40" />
                <span>
                  <strong className="text-foreground">Private storage</strong> — Photos use
                  signed URLs. No public access to your uploads.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary/40" />
                <span>
                  <strong className="text-foreground">Row-level security</strong> — Supabase
                  RLS ensures your data is isolated by design.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary/40" />
                <span>
                  <strong className="text-foreground">User-owned exports</strong> — Download
                  all your data as JSON from settings. Full portability.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary/40" />
                <span>
                  <strong className="text-foreground">MCP protocol</strong> — Connect AI agents
                  directly to your plant data through the Model Context Protocol.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="border-t border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-10">
        <h2 className="text-display mb-4 text-foreground">
          Start growing
        </h2>
        <p className="mx-auto mb-10 max-w-md text-base text-muted-foreground sm:text-lg">
          Free, open-source, and built for plant people. No credit card
          required.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition hover:brightness-110"
          >
            <img src="/app-icon.png" alt="" className="h-4.5 w-4.5" aria-hidden />
            Sign in to OpenSprout
          </Link>
          <a
            href="https://github.com/sparshsam/opensprout"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-8 py-4 text-base font-semibold text-foreground transition hover:bg-muted dark:bg-transparent"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <AuthGate>
      <div className="min-h-screen bg-background text-foreground">
        <PublicNav />

        <main id="main-content">
          {/* ── Hero ── */}
          <section className="pt-28 sm:pt-40">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
              <div className="max-w-3xl">
                <p className="text-label mb-4 text-primary">OpenSprout</p>
                <h1 className="text-hero mb-6 text-foreground">
                  Track, identify, and care for your plants.
                </h1>
                <p className="mb-10 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  OpenSprout helps you build a living plant collection with
                  reminders, journals, identification, diagnosis, and
                  privacy-first data ownership.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                  >
                    <img src="/app-icon.png" alt="" className="h-4 w-4" aria-hidden />
                    Sign in
                  </Link>
                  <a
                    href="https://github.com/sparshsam/opensprout"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-7 py-3.5 text-sm font-semibold text-foreground transition hover:bg-muted dark:bg-transparent"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ── Quote / positioning strip ── */}
          <section className="border-t border-border/40 mt-20 sm:mt-28">
            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
              <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
                <span className="text-xs font-bold tracking-wider uppercase text-primary">
                  Open source
                </span>
                <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                  Privacy first
                </span>
                <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                  No subscriptions
                </span>
                <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                  AI-agent ready
                </span>
                <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                  Offline capable
                </span>
              </div>
            </div>
          </section>

          {/* ── Features ── */}
          <FeatureSection />

          {/* ── Trust ── */}
          <TrustSection />

          {/* ── CTA ── */}
          <CtaSection />
        </main>

        <PublicFooter />
      </div>
    </AuthGate>
  );
}
