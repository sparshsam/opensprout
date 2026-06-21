"use client";

import { AppProvider, useApp } from "@/lib/context/app-context";
import { BottomNav } from "@/components/shell/bottom-nav";
import { Sidebar } from "@/components/shell/sidebar";
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
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Loader2 className="animate-spin" size={18} aria-hidden />
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
      <div className="flex min-h-screen">
        <Sidebar />
        <main
          id="main-content"
          className="mx-auto w-full max-w-2xl flex-1 px-5 pb-24 pt-6 sm:pb-24 md:px-8 md:pb-8 lg:px-10"
        >
          {children}
        </main>
      </div>
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
