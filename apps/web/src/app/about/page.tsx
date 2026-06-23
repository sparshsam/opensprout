import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — OpenSprout",
  description: "OpenSprout is a privacy-first plant care companion.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-28 sm:py-36 lg:px-10">
      <article className="mx-auto max-w-2xl">
        <p className="text-label mb-4 text-primary">About</p>
        <h1 className="text-hero mb-6 text-foreground">OpenSprout</h1>
        <p className="text-lg leading-relaxed text-muted-foreground mb-16 max-w-xl">
          A privacy-first plant care companion. Track watering, log care, and keep your plants thriving — without surveillance.
        </p>

        <div className="space-y-12 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-display mb-4 text-foreground">Why</h2>
            <p className="mb-3">Most plant care apps are surveillance products dressed in green. They track your data, sell your attention, and treat your garden like a spreadsheet.</p>
            <p>OpenSprout exists because plants deserve better — and so do you.</p>
          </section>

          <section>
            <h2 className="text-display mb-4 text-foreground">How it works</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</span><div><p className="font-semibold text-foreground">Add your plants</p><p className="text-muted-foreground">Name them, set a schedule, upload a photo.</p></div></li>
              <li className="flex items-start gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">2</span><div><p className="font-semibold text-foreground">Follow the care rhythm</p><p className="text-muted-foreground">OpenSprout tells you what each plant needs, when it needs it.</p></div></li>
              <li className="flex items-start gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">3</span><div><p className="font-semibold text-foreground">Watch them grow</p><p className="text-muted-foreground">Log care, track trends, and build a living record of your collection.</p></div></li>
            </ul>
          </section>

          <section>
            <h2 className="text-display mb-4 text-foreground">Principles</h2>
            <ul className="space-y-4">
              <li><p className="font-semibold text-foreground">Your data stays yours.</p><p className="text-muted-foreground">No tracking, no analytics, no data sales. You can export or delete everything at any time.</p></li>
              <li><p className="font-semibold text-foreground">Open source, always.</p><p className="text-muted-foreground">The full source is on GitHub. Auditable, forkable, improvable.</p></li>
              <li><p className="font-semibold text-foreground">Calm by design.</p><p className="text-muted-foreground">No notifications for notifications&apos; sake. The app supports your routine, it doesn&apos;t demand one.</p></li>
            </ul>
          </section>

          <section>
            <h2 className="text-display mb-4 text-foreground">Built by</h2>
            <p><a href="https://github.com/sparshsam" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sparsh Sam</a>. Open source since day one.</p>
          </section>
        </div>

        <div className="border-t border-border mt-16 pt-8 flex flex-wrap gap-6">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">← OpenSprout</Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
        </div>
      </article>
    </main>
  );
}
