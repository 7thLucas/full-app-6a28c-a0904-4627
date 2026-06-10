/**
 * Stable per-browser leader identity.
 *
 * The app has no auth/login, so each leader's growth journey is scoped by a
 * stable id persisted in localStorage. This keeps timelines separate per
 * device without requiring accounts.
 */
const STORAGE_KEY = "guide.leaderId";

export function getLeaderId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `leader-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // localStorage unavailable (private mode, etc.) — fall back to ephemeral id.
    return `leader-${Date.now()}`;
  }
}
