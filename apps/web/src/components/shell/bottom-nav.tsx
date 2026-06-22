"use client";

import { Sprout, Leaf, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/today", icon: Sprout },
  { label: "Plants", href: "/plants", icon: Leaf },
  { label: "Identify", href: "/identify", icon: Search },
  { label: "Profile", href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 pb-2 pt-2.5 text-xs font-semibold transition",
                active
                  ? "text-primary"
                  : "text-muted-foreground/50 hover:text-foreground/70",
              )}
            >
              <item.icon size={20} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
