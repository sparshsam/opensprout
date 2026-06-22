"use client";

import { AppProvider, useApp } from "@/lib/context/app-context";
import { BottomNav } from "@/components/shell/bottom-nav";
import { TopBar } from "@/components/shell/top-bar";
import { Loader2, Sprout } from "lucide-react";
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
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        <div className="flex items-center gap-3">
          <Sprout size={24} className="animate-pulse text-primary" aria-hidden />
          <span className="text-base font-semibold">OpenSprout</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl px-6 pb-32 pt-12 md:pb-16 md:pt-16 lg:px-10"
      >
        {children}
      </main>
      <BottomNav />
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
