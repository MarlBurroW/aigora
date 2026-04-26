/**
 * Tiny wrapper around Plausible's custom-event API.
 *
 *   track("Quiz completed", { match: "anthropic/claude-opus-4-7" })
 *
 * No-ops on the server and when the Plausible script isn't loaded yet
 * (e.g. user has an ad blocker, or the call fires before window onload).
 */

type PlausibleProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: PlausibleProps },
    ) => void;
  }
}

export function track(event: string, props?: PlausibleProps): void {
  if (typeof window === "undefined") return;
  if (typeof window.plausible !== "function") return;
  try {
    window.plausible(event, props ? { props } : undefined);
  } catch {
    /* swallow — analytics must never break the UI */
  }
}
