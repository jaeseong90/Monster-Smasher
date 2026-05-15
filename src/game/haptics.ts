export function haptic(intensity: "light" | "medium" | "heavy" = "light") {
  if (typeof window === "undefined" || !navigator.vibrate) return;
  const ms = intensity === "light" ? 10 : intensity === "medium" ? 30 : 60;
  try {
    navigator.vibrate(ms);
  } catch {}
}

export function hapticPattern(pattern: number[]) {
  if (typeof window === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {}
}
