import type { Metadata } from "next";
import { DebugInfo } from "./debug-info";

export const metadata: Metadata = {
  title: "Debug — OpenSprout",
};

/**
 * Diagnostics page for APK debugging.
 *
 * Shows runtime environment info: origin, protocol, Capacitor detection,
 * native platform status, resolved API URLs, Supabase session, and
 * deep-link listener registration.
 *
 * Not linked from the app navigation — access via /debug.
 */
export default function DebugPage() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-display mb-6 text-foreground">Debug Info</h1>
        <DebugInfo />
      </div>
    </main>
  );
}
