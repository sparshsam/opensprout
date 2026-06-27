"use client";

import { Sprout, Leaf, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/today", icon: Sprout },
  { label: "Plants", href: "/plants", icon: Leaf },
  { label: "Identify", href: "/identify", icon: Search },
  { label: "Profile", href: "/profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-border/40 bg-white md:flex md:w-56 md:flex-col lg:w-64 dark:bg-muted">
      <Link href="/" className="flex items-center gap-3 px-6 pb-5 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Sprout size={22} aria-hidden />
        </div>
        <div>
          <p className="text-lg font-bold leading-tight">OpenSprout</p>
          <p className="text-xs font-medium text-muted-foreground">
            Plant care companion
          </p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3" aria-label="Primary">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98]",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon size={18} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6 pt-2">
        <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <p className="text-xs font-semibold text-primary">OpenSprout</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Free and open-source plant care tracking.
          </p>
        </div>
      </div>
    </aside>
  );
}
