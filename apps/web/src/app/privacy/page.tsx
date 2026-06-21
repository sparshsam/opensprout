import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — OpenSprout",
  description: "OpenSprout privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-normal text-foreground">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: June 21, 2026 &middot; Version 1.0
      </p>

      <section className="mt-8 space-y-6 text-sm leading-6 text-foreground/80">
        <div>
          <h2 className="text-lg font-bold text-foreground">1. Overview</h2>
          <p className="mt-2">
            OpenSprout is a free and open-source plant care tracking application. This 
            Privacy Policy explains how we collect, use, and safeguard your information.
          </p>
          <p className="mt-2">
            OpenSprout is designed with privacy as a core principle. We minimize data 
            collection, do not use third-party analytics, do not serve ads, and do not 
            sell your data.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground">2. Data We Collect</h2>
          <h3 className="mt-3 font-semibold">Information You Provide</h3>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li><strong>Email address</strong> — for account authentication via Supabase Auth</li>
            <li><strong>Plant records</strong> — names, species, care schedules, logs, health scores</li>
            <li><strong>Photos</strong> — plant cover photos and journal attachments (private storage)</li>
            <li><strong>Journal entries</strong> — notes, tags, observations about your plants</li>
          </ul>
          <h3 className="mt-4 font-semibold">Information Collected Automatically</h3>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Session tokens (local storage, for auth persistence)</li>
            <li>Theme preference (local storage, dark/light mode)</li>
            <li>Notification preferences (local storage, reminder settings)</li>
          </ul>
          <p className="mt-3">
            <strong>We do NOT collect:</strong> IP addresses, location data, device identifiers, 
            browsing history, usage analytics, crash reports, or advertising IDs.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground">3. Third-Party Services</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li><strong>Supabase</strong> — Authentication, database, file storage, edge functions</li>
            <li><strong>PlantNet API</strong> — AI plant identification (optional, photo only)</li>
            <li><strong>Vercel</strong> — Static web hosting</li>
          </ul>
          <p className="mt-2">
            We never sell or share your data with third parties for marketing or analytics.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground">4. Your Rights</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Export your data as JSON from Settings anytime</li>
            <li>Delete your account and all data from Settings or by email</li>
            <li>Revoke MCP API tokens at any time</li>
            <li>Disable notifications or camera permissions in device settings</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground">5. Contact</h2>
          <p className="mt-2">
            For privacy questions or data deletion requests:{" "}
            <a href="mailto:sparshsam@gmail.com" className="text-primary hover:underline">
              sparshsam@gmail.com
            </a>
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Read the full policy at{" "}
            <Link href="/docs/privacy-policy.md" className="text-primary hover:underline">
              docs/privacy-policy.md
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
