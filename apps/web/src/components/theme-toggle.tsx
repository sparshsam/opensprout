"use client";

import { useTheme } from "@/lib/context/theme-context";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-sm transition hover:text-foreground active:scale-95"
      aria-label={`Switch to ${resolved === "light" ? "dark" : "light"} mode`}
    >
      {resolved === "light" ? (
        <Moon size={15} aria-hidden />
      ) : (
        <Sun size={15} aria-hidden />
      )}
    </button>
  );
}
