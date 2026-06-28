"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sprout, Plus, Scan, BookOpen, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "opensprout_onboarding_shown";

type Step = {
  title: string;
  description: string;
  icon: React.ElementType;
  action?: { label: string; href: string };
};

const STEPS: Step[] = [
  {
    title: "Welcome to OpenSprout",
    description:
      "Track watering, log care, and keep your plants thriving — all locally, all private. Let's get you set up in a few seconds.",
    icon: Sprout,
  },
  {
    title: "Add your first plant",
    description:
      "Start by adding a plant to your collection. You can search the species library or take a photo to identify it automatically.",
    icon: Plus,
    action: { label: "Add a plant", href: "/plants" },
  },
  {
    title: "Set up a care plan",
    description:
      "Once you add a plant, OpenSprout will suggest a care schedule based on its species. You choose what to apply — watering, fertilizing, misting, and more.",
    icon: BookOpen,
  },
  {
    title: "Track care daily",
    description:
      "Your dashboard shows what's due today, what's overdue, and what's coming up. Log care with one tap and build a history over time.",
    icon: Check,
    action: { label: "Go to Dashboard", href: "/today" },
  },
];

export function WelcomeWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const shown = localStorage.getItem(STORAGE_KEY);
    if (!shown) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  function next() {
    const s = STEPS[step];
    if (s.action && step === STEPS.length - 1) {
      dismiss();
      router.push(s.action.href);
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  function skip() {
    dismiss();
  }

  if (!open) return null;

  const s = STEPS[step];
  const Icon = s.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to OpenSprout"
        className="relative mx-auto w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl dark:bg-muted animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Step indicator */}
        <div className="mb-6 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted-foreground/20",
              )}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon size={28} />
        </div>

        {/* Content */}
        <h2 className="text-display mb-3 text-center text-foreground">
          {s.title}
        </h2>
        <p className="mb-8 text-center text-sm leading-relaxed text-muted-foreground">
          {s.description}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={next} className="w-full">
            {isLast ? (
              <>
                <Check size={16} /> Get started
              </>
            ) : (
              <>
                Next <ChevronRight size={16} />
              </>
            )}
          </Button>
          <button
            onClick={skip}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition"
          >
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
}
