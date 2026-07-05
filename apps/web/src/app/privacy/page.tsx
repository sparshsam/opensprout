import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Privacy Policy — OpenSprout",
  description: "How OpenSprout protects your privacy.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <main
        id="main-content"
        className="px-6 py-28 sm:py-36 lg:px-10"
      >
        <article className="mx-auto max-w-2xl">
          <p className="text-label mb-4 text-primary">Legal</p>
          <h1 className="text-hero mb-4 text-foreground">Privacy Policy</h1>
          <p className="mb-16 text-sm text-muted-foreground">
            Last updated: July 4, 2026
          </p>

          <div className="space-y-12 text-sm leading-relaxed text-foreground/80">
            <section>
              <h2 className="text-display mb-4 text-foreground">
                1. Our Commitment to Privacy
              </h2>
              <p className="mb-3">
                OpenSprout is a free and open-source plant care companion built
                with privacy as a core principle. We minimize data collection, do
                not use third-party analytics, do not serve ads, and do not sell
                or share your data. Your plant information belongs to you.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">
                2. Local-First Data Model
              </h2>
              <p className="mb-3">
                OpenSprout is designed to work without an account. The following
                data stays entirely on your device in localStorage and is never
                sent to any server:
              </p>
              <ul className="space-y-2 list-inside list-disc marker:text-primary/40">
                <li>Theme preference (light / dark mode)</li>
                <li>Notification preferences and quiet hours</li>
                <li>Onboarding completion status</li>
              </ul>
              <p className="mt-4">
                If you choose to create an account, the data listed above remains
                local. Only the data described in Section 4 is stored on our
                servers.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">
                3. Optional Cloud / Sync Features
              </h2>
              <p className="mb-3">
                Account creation is entirely optional and opt-in. If you create
                an account, the following cloud features become available:
              </p>
              <ul className="space-y-2 list-inside list-disc marker:text-primary/40">
                <li>
                  <strong>Authentication</strong> — via Supabase Auth (Google
                  OAuth only; email/password is disabled)
                </li>
                <li>
                  <strong>Plant records</strong> — names, species, care
                  schedules, and logs persisted in a Supabase PostgreSQL database
                </li>
                <li>
                  <strong>Photos</strong> — plant images stored in Supabase file
                  storage (object storage)
                </li>
              </ul>
              <p className="mt-4">
                You can stop using cloud features at any time by deleting your
                account (Section 6). No cloud data is collected or processed
                unless you voluntarily sign up.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">4. What We Collect</h2>
              <h3 className="mb-3 text-sm font-bold text-foreground">
                Information you provide (when you create an account)
              </h3>
              <ul className="space-y-2 list-inside list-disc marker:text-primary/40">
                <li>
                  <strong>Email address</strong> — used solely for authentication
                  via Google OAuth
                </li>
                <li>
                  <strong>Plant records</strong> — names, species, care
                  schedules, health notes, journal entries
                </li>
                <li>
                  <strong>Photos</strong> — plant images you upload
                </li>
              </ul>
              <h3 className="mt-6 mb-3 text-sm font-bold text-foreground">
                Automatically collected (session only)
              </h3>
              <ul className="space-y-2 list-inside list-disc marker:text-primary/40">
                <li>Session tokens (stored in browser storage)</li>
              </ul>
              <p className="mt-4 font-semibold text-foreground">
                We do NOT collect: IP addresses, precise location data, device
                identifiers, browsing history, usage analytics, crash reports,
                advertising IDs, or any data from non-account users beyond what
                stays in localStorage.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">
                5. Third-Party Services
              </h2>
              <p className="mb-3">
                OpenSprout relies on a minimal set of third-party services, none
                of which are used for tracking, advertising, or analytics:
              </p>
              <ul className="space-y-3 list-inside list-disc marker:text-primary/40">
                <li>
                  <strong>Supabase</strong> — Authentication, PostgreSQL
                  database, and file storage for plant photos. Data is stored in
                  a shared project with OpenSend (file sharing app); all
                  OpenSprout tables use the <code>opensprout_</code> prefix for
                  isolation. Supabase privacy policy:{" "}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    supabase.com/privacy
                  </a>
                </li>
                <li>
                  <strong>Vercel</strong> — Static web hosting and serverless
                  functions. Vercel privacy policy:{" "}
                  <a
                    href="https://vercel.com/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    vercel.com/legal/privacy
                  </a>
                </li>
                <li>
                  <strong>PlantNet API</strong> — Optional AI plant
                  identification. When you use the identify feature, the plant
                  photo you select is sent to PlantNet for analysis. No other
                  data is shared. Usage is entirely opt-in per identification.
                </li>
              </ul>
              <p className="mt-4">
                We never sell or share your data with third parties for marketing
                or analytics purposes.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">
                6. Data Deletion
              </h2>
              <p className="mb-3">
                You can delete your data at any time:
              </p>
              <ul className="space-y-2 list-inside list-disc marker:text-primary/40">
                <li>
                  <strong>Clear app data</strong> — Reset local preferences and
                  cached data by clearing browser localStorage or the app data
                  in your device settings
                </li>
                <li>
                  <strong>Delete account</strong> — From the Settings page,
                  choose &quot;Delete Account&quot; under the Danger Zone. This
                  permanently removes your profile, plant records, photos, care
                  schedules, journal entries, and all associated data from
                  Supabase
                </li>
              </ul>
              <p className="mt-4">
                Account deletion is irreversible and typically completes within
                24 hours. For deletion requests or questions, contact us at the
                address in Section 9.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">
                7. Data Export
              </h2>
              <p className="mb-3">
                You can export all of your account data at any time from the
                Settings page. The export is provided as a downloadable JSON file
                containing your plant records, care schedules, journal entries,
                and profile information. Photos are included as URLs to the
                stored files.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">
                8. Changes to This Policy
              </h2>
              <p className="mb-3">
                We may update this privacy policy from time to time. Changes will
                be posted on this page with an updated &quot;Last
                updated&quot; date. For material changes, we will notify users
                through the application interface.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">9. Contact</h2>
              <p>
                For privacy questions, data deletion requests, or data export
                assistance:{" "}
                <a
                  href="mailto:sparshsam@gmail.com"
                  className="text-primary hover:underline"
                >
                  sparshsam@gmail.com
                </a>
              </p>
            </section>
          </div>

          <div className="border-t border-border/40 mt-16 pt-8">
            <Link
              href="/"
              className="text-sm font-semibold text-primary hover:underline"
            >
              ← Home
            </Link>
          </div>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
