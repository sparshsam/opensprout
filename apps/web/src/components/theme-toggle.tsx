"use client";

import { useTheme } from "@/lib/context/theme-context";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
      aria-label={`Switch to ${resolved === "light" ? "dark" : "light"} mode`}
    >
      {resolved === "light" ? (
        <Moon size={16} aria-hidden />
      ) : (
        <Sun size={16} aria-hidden />
      )}
    </button>
  );
}
