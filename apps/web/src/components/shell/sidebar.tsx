"use client";

import { Sprout, CalendarDays, Leaf, NotebookTabs, Settings, BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Today", href: "/today", icon: Sprout },
  { label: "Plants", href: "/plants", icon: Leaf },
  { label: "Identify", href: "/identify", icon: Search },
  { label: "Explore", href: "/explore", icon: BookOpen },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Journal", href: "/journal", icon: NotebookTabs },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-border bg-white px-3 py-5 md:flex md:w-56 md:flex-col lg:w-64">
      <Link href="/today" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sprout size={22} aria-hidden />
        </div>
        <div>
          <p className="text-lg font-bold leading-tight">OpenSprout</p>
          <p className="text-xs font-medium text-muted-foreground">
            Your plants. Your data.
          </p>
        </div>
      </Link>

      <nav className="space-y-1" aria-label="Primary">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition",
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

      <div className="mt-auto rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
        <p className="text-xs font-semibold text-emerald-900">
          Supabase sync
        </p>
        <p className="mt-1 text-xs leading-5 text-emerald-800">
          Your rows are protected by RLS and scoped to your authenticated user.
        </p>
      </div>
    </aside>
  );
}
