"use client";

import { Sprout, CalendarDays, Leaf, NotebookTabs, Settings, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Today", href: "/today", icon: Sprout },
  { label: "Plants", href: "/plants", icon: Leaf },
  { label: "Explore", href: "/explore", icon: BookOpen },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Journal", href: "/journal", icon: NotebookTabs },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white md:hidden" aria-label="Mobile navigation">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 pb-2 pt-2.5 text-[10px] font-semibold transition",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon size={22} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
