import type { Metadata } from "next";
import { Mail, Bug } from "lucide-react";

export const metadata: Metadata = {
  title: "Support — OpenSprout",
  description: "Get help and support for OpenSprout plant care tracking app.",
};

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-normal text-foreground">
        Support
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Get help with OpenSprout
      </p>

      <section className="mt-8 space-y-6">
        {/* Email Support */}
        <div className="rounded-md border border-border bg-card p-5 shadow-panel">
          <div className="flex items-start gap-4">
            <Mail size={24} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="text-lg font-bold text-foreground">Email Support</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                For account issues, data deletion requests, or general questions.
              </p>
              <a
                href="mailto:sparshsam@gmail.com"
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                sparshsam@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* GitHub Issues */}
        <div className="rounded-md border border-border bg-card p-5 shadow-panel">
          <div className="flex items-start gap-4">
            <Bug size={24} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="text-lg font-bold text-foreground">GitHub Issues</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Report bugs, request features, or browse known issues.
              </p>
              <a
                href="https://github.com/sparshsam/opensprout/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                github.com/sparshsam/opensprout/issues
              </a>
            </div>
          </div>
        </div>

        {/* Bug Report */}
        <div className="rounded-md border border-border bg-card p-5 shadow-panel">
          <div className="flex items-start gap-4">
            <Bug size={24} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="text-lg font-bold text-foreground">Report a Bug</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Found a problem? Open a GitHub issue with:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>A clear description of the issue</li>
                <li>Steps to reproduce</li>
                <li>Your device and browser/OS version</li>
                <li>Screenshots if applicable</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-md border border-border bg-card p-5 shadow-panel">
          <h2 className="text-lg font-bold text-foreground">Frequently Asked Questions</h2>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-sm font-semibold text-foreground">
                How do I delete my account?
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                Go to Settings → Account → Delete Account. Or email your request to sparshsam@gmail.com.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-foreground">
                How do I export my data?
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                Go to Settings → Data → Export JSON. A backup file will be downloaded.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-foreground">
                Is OpenSprout really free?
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                Yes. No subscriptions, no ads, no in-app purchases. It&apos;s open source under AGPLv3.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-foreground">
                How do I connect an AI agent?
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                Go to Settings → AI Agent Access → Manage Tokens. Create a token and add it to your agent&apos;s MCP configuration.
              </dd>
            </div>
          </dl>
        </div>

        {/* Privacy & Terms */}
        <div className="flex flex-wrap gap-4 text-sm">
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
          <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
        </div>
      </section>
    </main>
  );
}
