import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — OpenSprout",
  description: "OpenSprout terms of service — rules and guidelines for using the app.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-normal text-foreground">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: June 21, 2026 &middot; Version 1.0
      </p>

      <section className="mt-8 space-y-6 text-sm leading-6 text-foreground/80">
        <div>
          <h2 className="text-lg font-bold text-foreground">1. Acceptance</h2>
          <p className="mt-2">
            By using OpenSprout, you agree to these Terms of Service. OpenSprout is 
            provided as a free, open-source application under the AGPLv3 license.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground">2. Your Account</h2>
          <p className="mt-2">
            You are responsible for maintaining your account credentials and for all 
            activity under your account. You may delete your account and data at any 
            time via Settings or by emailing sparshsam@gmail.com.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground">3. Acceptable Use</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to access another user&apos;s data</li>
            <li>Upload malicious content</li>
            <li>Abuse the API or edge functions</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground">4. Your Content</h2>
          <p className="mt-2">
            You retain all rights to the plant data, photos, and journal entries you 
            create. OpenSprout does not claim ownership of your content.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground">5. Disclaimer</h2>
          <p className="mt-2">
            OpenSprout is provided &quot;as is&quot; without warranty. The project is 
            maintained as open-source software and may experience downtime or bugs.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground">6. Open Source License</h2>
          <p className="mt-2">
            OpenSprout is licensed under the{" "}
            <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              GNU Affero General Public License v3.0
            </a>
            . Source code:{" "}
            <a href="https://github.com/sparshsam/opensprout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              github.com/sparshsam/opensprout
            </a>
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground">7. Contact</h2>
          <p className="mt-2">
            <a href="mailto:sparshsam@gmail.com" className="text-primary hover:underline">
              sparshsam@gmail.com
            </a>
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Read the full terms at{" "}
            <Link href="/docs/terms-of-service.md" className="text-primary hover:underline">
              docs/terms-of-service.md
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
