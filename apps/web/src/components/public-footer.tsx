import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand — Open Product Family lockup with icon */}
          <div className="flex items-start gap-3">
            <div className="relative size-7 sm:size-8 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/opensprout-icon-header.png" alt="" className="absolute inset-0 size-7 sm:size-8 rounded-lg transition-opacity duration-300 dark:opacity-0" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/opensprout-icon-header-dark.png" alt="" className="absolute inset-0 size-7 sm:size-8 rounded-lg transition-opacity duration-300 opacity-0 dark:opacity-100" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold tracking-[0.06em] uppercase text-muted-foreground opacity-50">
                OPEN
              </span>
              <span className="text-sm sm:text-[15px] font-medium text-foreground transition-colors -mt-0.5">
                Sprout
              </span>
            </div>
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
          <a
            href="https://kovina.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-black tracking-[-0.03em] text-muted-foreground/40 hover:text-muted-foreground transition-colors no-underline"
            aria-label="KOVINA — Personal software. Forged to last."
          >
            KOVINA
          </a>
        </div>
      </div>
    </footer>
  );
}
