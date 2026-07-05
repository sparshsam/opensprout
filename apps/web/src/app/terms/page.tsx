import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Terms of Service — OpenSprout",
  description: "OpenSprout terms of service.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <main
        id="main-content"
        className="px-6 py-28 sm:py-36 lg:px-10"
      >
        <article className="mx-auto max-w-2xl">
          <p className="text-label mb-4 text-primary">Legal</p>
          <h1 className="text-hero mb-4 text-foreground">Terms of Service</h1>
          <p className="mb-16 text-sm text-muted-foreground">
            Last updated: July 4, 2026
          </p>

          <div className="space-y-12 text-sm leading-relaxed text-foreground/80">
            <section>
              <h2 className="text-display mb-4 text-foreground">
                1. Acceptance of Terms
              </h2>
              <p className="mb-3">
                By accessing or using OpenSprout (&quot;the Service&quot;), you
                agree to be bound by these Terms of Service. If you do not agree
                to these terms, please do not use the Service.
              </p>
              <p>
                OpenSprout is provided as a free, open-source application. Use of
                the Service is at your own discretion and in compliance with all
                applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">2. License</h2>
              <p className="mb-3">
                OpenSprout is licensed under the{" "}
                <a
                  href="https://www.gnu.org/licenses/agpl-3.0.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GNU Affero General Public License v3.0
                </a>{" "}
                (AGPL-3.0-or-later). You are free to use, modify, and distribute
                the software in accordance with the terms of that license.
              </p>
              <p>
                Source code is available at:{" "}
                <a
                  href="https://github.com/sparshsam/opensprout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  github.com/sparshsam/opensprout
                </a>
                . The full license text is available in the repository at{" "}
                <a
                  href="https://github.com/sparshsam/opensprout/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  github.com/sparshsam/opensprout/blob/main/LICENSE
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">
                3. No Medical or Gardening Advice
              </h2>
              <p className="mb-3">
                OpenSprout is a tool for tracking plant care schedules and
                observations. It does not provide medical, veterinary, or
                professional gardening advice. Plant care suggestions,
                identification results, and health diagnoses are generated based
                on general species knowledge and may not be appropriate for your
                specific plant, environment, or situation.
              </p>
              <p className="font-semibold text-foreground">
                Always consult a qualified horticulturist, botanist, or
                professional gardener for specific guidance about your plants.
                Never rely solely on this application for decisions that could
                affect plant health or safety.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">
                4. No Warranty
              </h2>
              <p className="mb-3">
                The Service is provided &quot;as is&quot; and &quot;as
                available&quot; without any warranty of any kind, either express
                or implied, including but not limited to the implied warranties
                of merchantability, fitness for a particular purpose, or
                non-infringement.
              </p>
              <p>
                The project is maintained as open-source software by volunteers
                and may experience downtime, bugs, or data loss. We make no
                guarantees regarding the availability, accuracy, reliability, or
                continuity of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">
                5. Data Responsibility
              </h2>
              <p className="mb-3">
                You retain full ownership of all data you create within
                OpenSprout, including plant records, photos, journal entries, and
                care logs. OpenSprout does not claim any ownership of your
                content.
              </p>
              <p className="mb-3">
                You are responsible for maintaining backups of your data. While
                account data is persisted in Supabase (a managed cloud database
                with automated backups), we recommend you regularly export your
                data using the built-in export feature in Settings.
              </p>
              <p>
                We take reasonable measures to protect your data, but we cannot
                guarantee against data loss caused by factors beyond our control,
                including service provider outages, force majeure events, or
                security breaches at the infrastructure level.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">
                6. Service Availability
              </h2>
              <p className="mb-3">
                OpenSprout is hosted on the following infrastructure:
              </p>
              <ul className="space-y-2 list-inside list-disc marker:text-primary/40">
                <li>
                  <strong>Web hosting:</strong> Vercel (edge network, serverless
                  functions)
                </li>
                <li>
                  <strong>Backend:</strong> Supabase (PostgreSQL database, file
                  storage, authentication)
                </li>
              </ul>
              <p className="mt-3">
                These are third-party services with their own terms, service
                level agreements, and availability guarantees. We do not provide
                any uptime guarantee for OpenSprout. The Service may be
                temporarily unavailable for maintenance, updates, or due to
                infrastructure issues.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">
                7. User Conduct
              </h2>
              <p className="mb-3">
                When using OpenSprout, you agree not to:
              </p>
              <ul className="space-y-2 list-inside list-disc marker:text-primary/40">
                <li>Use the Service for any unlawful purpose</li>
                <li>
                  Attempt to access another user&apos;s account, data, or photos
                </li>
                <li>Upload malicious content, malware, or harmful code</li>
                <li>Abuse the API, edge functions, or MCP endpoints</li>
                <li>
                  Use automated tools to scrape, crawl, or overload the Service
                </li>
                <li>
                  Submit prohibited content, including but not limited to images
                  of people, animals, or any non-plant subject matter
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">
                8. Changes to Terms
              </h2>
              <p>
                We reserve the right to update or modify these terms at any time.
                Changes will be posted on this page with an updated
                &quot;Last updated&quot; date. Continued use of the Service
                after changes constitutes acceptance of the new terms. For
                material changes, we will notify users through the application.
              </p>
            </section>

            <section>
              <h2 className="text-display mb-4 text-foreground">9. Contact</h2>
              <p>
                For questions about these terms, license inquiries, or other
                legal matters:{" "}
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
