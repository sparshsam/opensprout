import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — OpenSprout",
  description: "How OpenSprout protects your privacy.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-28 sm:py-36 lg:px-10">
      <article className="mx-auto max-w-2xl">
        <p className="text-label mb-4 text-primary">Legal</p>
        <h1 className="text-hero mb-4 text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-16">Last updated: June 21, 2026</p>

        <div className="space-y-12 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-display mb-4 text-foreground">1. Overview</h2>
            <p className="mb-3">OpenSprout is a free and open-source plant care application built with privacy as a core principle. We minimize data collection, do not use third-party analytics, do not serve ads, and do not sell your data.</p>
          </section>

          <section>
            <h2 className="text-display mb-4 text-foreground">2. What we collect</h2>
            <h3 className="text-sm font-bold mb-3 text-foreground">You provide</h3>
            <ul className="space-y-2 list-inside list-disc marker:text-primary/40">
              <li>Email address — for authentication</li>
              <li>Plant records — names, species, schedules, logs</li>
              <li>Photos — plant images you upload</li>
              <li>Journal entries — your notes and observations</li>
            </ul>
            <h3 className="text-sm font-bold mt-6 mb-3 text-foreground">Automatically collected</h3>
            <ul className="space-y-2 list-inside list-disc marker:text-primary/40">
              <li>Session tokens (local storage)</li>
              <li>Theme and notification preferences (local storage)</li>
            </ul>
            <p className="mt-4 font-semibold text-foreground">We do NOT collect: IP addresses, location data, device identifiers, browsing history, usage analytics, crash reports, or advertising IDs.</p>
          </section>

          <section>
            <h2 className="text-display mb-4 text-foreground">3. Third-party services</h2>
            <ul className="space-y-3 list-inside list-disc marker:text-primary/40">
              <li><strong>Supabase</strong> — Authentication, database, file storage</li>
              <li><strong>PlantNet API</strong> — AI plant identification (optional, photo only)</li>
              <li><strong>Vercel</strong> — Static web hosting</li>
            </ul>
            <p className="mt-4">We never sell or share your data with third parties for marketing or analytics.</p>
          </section>

          <section>
            <h2 className="text-display mb-4 text-foreground">4. Your rights</h2>
            <ul className="space-y-3 list-inside list-disc marker:text-primary/40">
              <li>Export your data as JSON from Settings</li>
              <li>Delete your account and all data from Settings</li>
              <li>Revoke API tokens at any time</li>
              <li>Disable notifications or camera permissions in device settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-display mb-4 text-foreground">5. Contact</h2>
            <p>For privacy questions or data deletion requests: <a href="mailto:sparshsam@gmail.com" className="text-primary hover:underline">sparshsam@gmail.com</a></p>
          </section>
        </div>

        <div className="border-t border-border mt-16 pt-8">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">← OpenSprout</Link>
        </div>
      </article>
    </main>
  );
}
