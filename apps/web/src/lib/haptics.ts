"use client";

/**
 * Lightweight haptic feedback.
 * Falls back to navigator.vibrate on devices that support it.
 */

function canVibrate(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

export async function hapticLight() {
  if (canVibrate()) navigator.vibrate(10);
}

export async function hapticMedium() {
  if (canVibrate()) navigator.vibrate(20);
}

export async function hapticHeavy() {
  if (canVibrate()) navigator.vibrate(40);
}

export async function hapticSuccess() {
  if (canVibrate()) navigator.vibrate([10, 50, 10]);
}

export async function hapticError() {
  if (canVibrate()) navigator.vibrate([20, 30, 20, 30, 20]);
}
