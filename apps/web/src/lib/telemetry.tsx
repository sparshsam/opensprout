"use client";

import { useEffect, Fragment, type ReactNode } from "react";

const LOG_PREFIX = "[OpenSprout]";

type LogLevel = "info" | "warn" | "error";

type AppErrorEvent = {
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
};

function captureError(error: Error) {
  const event: AppErrorEvent = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };

  console.error(`${LOG_PREFIX} Error:`, event.message);
  if (event.stack) console.error(event.stack);

  if (process.env.NODE_ENV === "production") {
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: "error", ...event }),
      keepalive: true,
    }).catch(() => {});
  }
}

export function log(level: LogLevel, message: string, data?: unknown) {
  const method = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  method(`${LOG_PREFIX} ${message}`, data ?? "");
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      captureError(event.error ?? new Error(event.message ?? "Unknown error"));
    };
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      captureError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    };
    window.addEventListener("error", errorHandler);
    window.addEventListener("unhandledrejection", rejectionHandler);
    return () => {
      window.removeEventListener("error", errorHandler);
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };
  }, []);

  return <Fragment>{children}</Fragment>;
}

export function markPerf(name: string) {
  if (typeof performance !== "undefined") {
    performance.mark(`opensprout:${name}`);
  }
}
