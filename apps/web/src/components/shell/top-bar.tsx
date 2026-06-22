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
    <header className="sticky top-0 z-50 border-b border-border/30 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        {/* Logo */}
        <Link href="/today" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Sprout size={22} aria-hidden />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            OpenSprout
          </span>
        </Link>

        {/* Desktop nav — centered */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-[14px] px-5 py-3 text-base font-semibold transition active:scale-[0.97]",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon size={18} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-[14px] px-4 py-2.5 text-base font-semibold transition active:scale-[0.97]",
            pathname === "/profile"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User size={18} aria-hidden />
          </div>
          <span className="hidden sm:inline">Profile</span>
        </Link>
      </div>
    </header>
  );
}
