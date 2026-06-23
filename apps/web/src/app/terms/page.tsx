import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — OpenSprout",
  description: "OpenSprout terms of service.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-28 sm:py-36 lg:px-10">
      <article className="mx-auto max-w-2xl">
        <p className="text-label mb-4 text-primary">Legal</p>
        <h1 className="text-hero mb-4 text-foreground">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-16">Last updated: June 21, 2026</p>

        <div className="space-y-12 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-display mb-4 text-foreground">1. Acceptance</h2>
            <p>By using OpenSprout, you agree to these terms. OpenSprout is provided as a free, open-source application under the AGPLv3 license.</p>
          </section>

          <section>
            <h2 className="text-display mb-4 text-foreground">2. Your account</h2>
            <p>You are responsible for maintaining your account credentials and for all activity under your account. You may delete your account and data at any time from Settings.</p>
          </section>

          <section>
            <h2 className="text-display mb-4 text-foreground">3. Acceptable use</h2>
            <ul className="space-y-2 list-inside list-disc marker:text-primary/40">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to access another user&apos;s data</li>
              <li>Upload malicious content</li>
              <li>Abuse the API or edge functions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-display mb-4 text-foreground">4. Your content</h2>
            <p>You retain all rights to the plant data, photos, and journal entries you create. OpenSprout does not claim ownership of your content.</p>
          </section>

          <section>
            <h2 className="text-display mb-4 text-foreground">5. Disclaimer</h2>
            <p>OpenSprout is provided &quot;as is&quot; without warranty. The project is maintained as open-source software and may experience downtime or bugs.</p>
          </section>

          <section>
            <h2 className="text-display mb-4 text-foreground">6. License</h2>
            <p>OpenSprout is licensed under the <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GNU Affero General Public License v3.0</a>. Source code: <a href="https://github.com/sparshsam/opensprout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">github.com/sparshsam/opensprout</a>.</p>
          </section>

          <section>
            <h2 className="text-display mb-4 text-foreground">7. Contact</h2>
            <p><a href="mailto:sparshsam@gmail.com" className="text-primary hover:underline">sparshsam@gmail.com</a></p>
          </section>
        </div>

        <div className="border-t border-border mt-16 pt-8">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">← OpenSprout</Link>
        </div>
      </article>
    </main>
  );
}
