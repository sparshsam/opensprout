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
        {/* Brand — Open Product Family lockup */}
        <Link
          href="/"
          className="flex items-center gap-1.5 group shrink-0"
          aria-label="OpenSprout home"
        >
          <img
            src="/opensprout-icon-header.png"
            alt=""
            className="h-7 w-7 shrink-0"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold tracking-[0.06em] uppercase text-muted-foreground/50">
              OPEN
            </span>
            <span className="text-sm sm:text-[15px] font-bold text-foreground group-hover:text-primary transition-colors -mt-0.5">
              Sprout
            </span>
          </div>
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
