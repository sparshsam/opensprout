import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="flex items-start gap-3">
            <img src="/app-icon.png" alt="" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-bold text-foreground">OpenSprout</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                Free and open-source plant care companion. Privacy-first, user-owned data.
              </p>
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

        <div className="mt-12 border-t border-border/40 pt-6">
          <p className="text-xs text-muted-foreground">
            OpenSprout is free software licensed under{" "}
            <a
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              AGPLv3
            </a>
            . Source code on{" "}
            <a
              href="https://github.com/sparshsam/opensprout"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
