"use client";

/**
 * Lightweight haptic feedback.
 * On native (Capacitor), uses Haptics plugin.
 * On web, falls back to navigator.vibrate.
 */

let capacitorHaptics: typeof import("@capacitor/haptics") | null = null;

async function ensureCapacitor() {
  if (typeof window === "undefined") return false;
  try {
    capacitorHaptics = await import("@capacitor/haptics");
    return true;
  } catch {
    return false;
  }
}

export async function hapticLight() {
  if (await ensureCapacitor()) {
    await capacitorHaptics!.Haptics.impact({ style: "light" });
  } else if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}

export async function hapticMedium() {
  if (await ensureCapacitor()) {
    await capacitorHaptics!.Haptics.impact({ style: "medium" });
  } else if (navigator.vibrate) {
    navigator.vibrate(20);
  }
}

export async function hapticHeavy() {
  if (await ensureCapacitor()) {
    await capacitorHaptics!.Haptics.impact({ style: "heavy" });
  } else if (navigator.vibrate) {
    navigator.vibrate(40);
  }
}

export async function hapticSuccess() {
  if (await ensureCapacitor()) {
    await capacitorHaptics!.Haptics.notification({ type: "success" });
  } else if (navigator.vibrate) {
    navigator.vibrate([10, 50, 10]);
  }
}

export async function hapticError() {
  if (await ensureCapacitor()) {
    await capacitorHaptics!.Haptics.notification({ type: "error" });
  } else if (navigator.vibrate) {
    navigator.vibrate([20, 30, 20, 30, 20]);
  }
}
