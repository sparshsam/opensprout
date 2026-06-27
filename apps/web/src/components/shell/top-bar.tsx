"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { label: "Dashboard", href: "/today" },
  { label: "Plants", href: "/plants" },
  { label: "Identify", href: "/identify" },
  { label: "Profile", href: "/profile" },
];

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        {/* Wordmark + icon */}
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/opensprout-icon.png"
            alt="OpenSprout"
            className="h-7 w-7"
          />
          <span className="text-lg font-bold tracking-tight text-foreground">
            OpenSprout
          </span>
          <span className="sr-only">Go to homepage</span>
        </Link>

        {/* Desktop nav — pill style */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

          {/* Theme toggle */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>
      </div>
    </header>
  );
}
