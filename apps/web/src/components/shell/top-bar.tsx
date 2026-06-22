"use client";

import { Sprout, Leaf, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/today", icon: Sprout },
  { label: "Plants", href: "/plants", icon: Leaf },
  { label: "Identify", href: "/identify", icon: Search },
];

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        {/* Logo — just the icon on mobile, icon + name on desktop */}
        <Link href="/today" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-sm">
            <Sprout size={18} aria-hidden />
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-foreground sm:inline">
            OpenSprout
          </span>
        </Link>

        {/* Desktop nav — subtle */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm font-semibold transition active:scale-[0.97]",
                  active
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <item.icon size={16} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-2 rounded-[12px] px-3 py-2 text-sm font-semibold transition active:scale-[0.97]",
            pathname === "/profile"
              ? "bg-primary/8 text-primary"
              : "text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/8 text-primary">
            <User size={15} aria-hidden />
          </div>
          <span className="hidden sm:inline">Profile</span>
        </Link>
      </div>
    </header>
  );
}
