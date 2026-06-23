"use client";

import Link from "next/link";
import { Sprout } from "lucide-react";
import { useTheme } from "@/lib/context/theme-context";
import { Sun, Moon } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/mcp", label: "AI Access" },
];

export function PublicNav() {
  const { resolved, toggle } = useTheme();
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold text-foreground"
        >
          <Sprout size={20} className="text-primary" aria-hidden />
          OpenSprout
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-1 sm:flex"
          aria-label="Public navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/sparshsam/opensprout"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            GitHub
          </a>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
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
          {isHome && (
            <a
              href="https://github.com/sparshsam/opensprout"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 sm:inline-flex"
            >
              View on GitHub
            </a>
          )}
          <Link
            href="/login"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex items-center justify-center gap-2 border-t border-border/40 px-6 py-2 sm:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              pathname === link.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
        <a
          href="https://github.com/sparshsam/opensprout"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
