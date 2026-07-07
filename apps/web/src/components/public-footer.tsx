import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand — Open Product Family lockup, no icon */}
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold tracking-[0.06em] uppercase text-muted-foreground opacity-50">
              OPEN
            </span>
            <span className="text-sm sm:text-[15px] font-medium text-foreground transition-colors -mt-0.5">
              Sprout
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <Link
              href="/about"
              className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Terms
            </Link>
            <a
              href="https://github.com/sparshsam/opensprout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8 text-center">
          <svg width="78" height="14" viewBox="0 0 78 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto text-muted-foreground/40" aria-label="Kovina">
            <path d="M6.5 0C7.88 0 9.26 0.26 10.5 0.78C11.74 1.3 12.82 2.08 13.64 3.1C14.46 4.12 15 5.34 15.26 6.68C15.52 8.02 15.5 9.38 15.2 10.68C14.9 11.98 14.34 13.14 13.52 14H12.08C12.9 13.16 13.44 12.1 13.72 10.88C14 9.66 14 8.38 13.72 7.16C13.44 5.94 12.9 4.88 12.08 4.02C11.26 3.16 10.24 2.54 9.1 2.14C7.96 1.74 6.76 1.56 5.56 1.56C3.62 1.56 1.86 2.16 0.56 3.36C-0.18 4.04 -0.18 5.2 0.56 5.88C1.3 6.56 2.44 6.56 3.18 5.88C3.92 5.2 4.9 4.8 6 4.8C7.1 4.8 8.08 5.2 8.82 5.88C9.56 6.56 9.56 7.7 8.82 8.38C8.08 9.06 7.1 9.46 6 9.46C5.54 9.46 5.08 9.38 4.66 9.22C4.24 9.06 3.88 8.84 3.56 8.56C2.82 7.88 1.68 7.88 0.94 8.56C0.2 9.24 0.2 10.38 0.94 11.06C2.06 12.08 3.48 12.68 5.06 12.68C6.46 12.68 7.78 12.22 8.82 11.42C9.86 12.22 11.18 12.68 12.58 12.68C14.18 12.68 15.66 12.06 16.82 10.96C18.02 9.84 18.74 8.26 18.98 6.58C19.22 4.9 18.96 3.18 18.22 1.68C17.48 0.18 16.32 -1.02 14.88 -1.78C13.44 -2.54 11.82 -2.92 10.14 -2.92C8.46 -2.92 6.84 -2.54 5.4 -1.78C3.96 -1.02 2.8 0.18 2.06 1.68C1.32 3.18 1.06 4.9 1.3 6.58C1.54 8.26 2.26 9.84 3.46 10.96C4.6 12.04 6.06 12.66 7.64 12.66C8.56 12.66 9.44 12.38 10.16 11.9C10.88 11.42 11.4 10.78 11.68 10.04C11.96 9.3 12 8.52 11.78 7.78C11.56 7.04 11.1 6.4 10.46 5.96C9.82 5.52 9.04 5.3 8.24 5.3C7.44 5.3 6.66 5.52 6.02 5.96C5.38 6.4 4.92 7.04 4.7 7.78C4.48 8.52 4.52 9.3 4.8 10.04C5.08 10.78 5.6 11.42 6.32 11.9C7.04 12.38 7.92 12.66 8.84 12.66C10.22 12.66 11.5 12.18 12.5 11.34C13.5 10.5 14.16 9.34 14.42 8.06C14.68 6.78 14.52 5.46 13.98 4.3C13.44 3.14 12.56 2.2 11.44 1.62C10.32 1.04 9.04 0.84 7.8 1.06C6.56 1.28 5.44 1.9 4.62 2.82C3.8 3.74 3.32 4.9 3.22 6.14C3.12 7.38 3.42 8.6 4.06 9.62C4.7 10.64 5.66 11.4 6.8 11.78C7.94 12.16 9.18 12.14 10.3 11.74C11.42 11.34 12.36 10.56 13 9.54C13.64 8.52 13.94 7.32 13.86 6.1C13.78 4.88 13.32 3.74 12.52 2.84C11.72 1.94 10.62 1.34 9.4 1.12C8.18 0.9 6.9 1.08 5.78 1.64C4.66 2.2 3.76 3.12 3.2 4.26C2.64 5.4 2.46 6.7 2.68 7.96C2.9 9.22 3.52 10.36 4.44 11.2C5.36 12.04 6.54 12.52 7.78 12.58C8.66 12.62 9.52 12.42 10.28 12.02C11.04 11.62 11.66 11.04 12.08 10.34C12.5 9.64 12.72 8.84 12.72 8.02C12.72 7.2 12.5 6.4 12.08 5.72C11.66 5.04 11.06 4.48 10.32 4.1C9.58 3.72 8.74 3.54 7.9 3.58C7.06 3.62 6.24 3.88 5.54 4.34C4.84 4.8 4.3 5.44 3.98 6.2C3.66 6.96 3.58 7.8 3.74 8.6C3.9 9.4 4.3 10.12 4.88 10.66C5.46 11.2 6.2 11.54 7 11.66C7.8 11.78 8.62 11.68 9.34 11.36C10.06 11.04 10.66 10.52 11.08 9.88C11.5 9.24 11.72 8.5 11.72 7.74C11.72 6.98 11.5 6.24 11.08 5.62C10.66 5 10.06 4.52 9.36 4.24C8.66 3.96 7.88 3.9 7.16 4.06" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </footer>
  );
}
