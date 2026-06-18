"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  /** Minimum pull distance in px before refresh triggers (default: 60) */
  threshold?: number;
  /** Loading indicator text (default: "Refreshing…") */
  label?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 60,
  label = "Refreshing…",
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (refreshing) return;
    // Only activate pull-to-refresh when at the top of the scroll container
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [refreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || refreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff <= 0) {
      setPullDistance(0);
      return;
    }

    // Apply resistance so the pull feels natural
    const resisted = Math.min(diff * 0.4, threshold * 1.5);
    setPullDistance(resisted);
  }, [refreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || refreshing) return;

    pulling.current = false;

    if (pullDistance >= threshold) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [refreshing, pullDistance, threshold, onRefresh]);

  // Reset pull distance once refreshing completes
  useEffect(() => {
    if (!refreshing) {
      setPullDistance(0);
    }
  }, [refreshing]);

  // On desktop (≥ md), render children normally without pull-to-refresh behavior
  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Loading indicator — only visible during pull or refresh */}
      <div
        className="flex items-center justify-center transition-all"
        style={{
          height: refreshing ? 48 : Math.min(pullDistance, 80),
          opacity: refreshing ? 1 : Math.min(pullDistance / threshold, 1),
        }}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2
            className={`${refreshing ? "animate-spin" : ""} text-muted-foreground`}
            size={18}
            aria-hidden="true"
          />
          <span>{refreshing ? label : pullDistance >= threshold ? "Release to refresh" : "Pull to refresh"}</span>
        </div>
      </div>

      {children}
    </div>
  );
}
