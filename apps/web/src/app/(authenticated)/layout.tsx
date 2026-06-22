"use client";

import { AppProvider, useApp } from "@/lib/context/app-context";
import { BottomNav } from "@/components/shell/bottom-nav";
import { TopBar } from "@/components/shell/top-bar";
import { Loader2 } from "lucide-react";
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
        <div className="flex items-center gap-2 text-base font-semibold">
          <Loader2 className="animate-spin" size={20} aria-hidden />
          Loading OpenSprout
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
        className="mx-auto w-full max-w-7xl px-6 pb-28 pt-8 sm:pb-28 md:pb-10 lg:px-10"
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
