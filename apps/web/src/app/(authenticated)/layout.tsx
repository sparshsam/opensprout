"use client";

import { AppProvider, useApp } from "@/lib/context/app-context";
import { BottomNav } from "@/components/shell/bottom-nav";
import { TopBar } from "@/components/shell/top-bar";
import { PwaInstall } from "@/components/shell/pwa-install";
import { AppUpdate } from "@/components/shell/app-update";
import { WelcomeWizard } from "@/components/onboarding/welcome-wizard";
import { Sprout } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function AuthenticatedLayoutInner({ children }: { children: React.ReactNode }) {
  const { sessionLoading, user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace("/login");
    }
  }, [sessionLoading, user, router]);

  if (sessionLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sprout size={24} className="animate-pulse text-primary" aria-hidden />
          <span className="text-sm font-semibold">OpenSprout</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip-to-content link for keyboard/assistive tech users */}
      <a
        href="#main-content"
        className="skip-to-content"
      >
        Skip to main content
      </a>

      {/* Live region for dynamic announcements (loading, errors, etc.) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="a11y-announcements"
      />

      <TopBar />
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl px-6 pb-32 pt-28 sm:pt-36 md:pb-16 lg:px-10 animate-page-in"
      >
        {children}
      </main>
      <BottomNav />
      <PwaInstall />
      <AppUpdate />

      {/* First-run onboarding wizard */}
      <WelcomeWizard />
    </div>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <AuthenticatedLayoutInner>{children}</AuthenticatedLayoutInner>
    </AppProvider>
  );
}
