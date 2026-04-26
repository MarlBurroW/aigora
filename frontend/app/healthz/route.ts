/**
 * Lightweight liveness/readiness endpoint for Kubernetes probes.
 * Returns 200 instantly without touching the database — kept separate from
 * "/" so a slow data-heavy home render can never trigger a pod restart.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response("ok", {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}
