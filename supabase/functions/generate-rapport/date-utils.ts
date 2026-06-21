// Pure date helpers for the rapport generator.
// Kept free of Deno/Supabase imports so they can be unit-tested in isolation
// and reused server-side without timezone surprises.

/**
 * Format a YYYY-MM-DD ISO date string (or full ISO timestamp) as Dutch dd-MM-yyyy
 * WITHOUT going through the Date() constructor.
 *
 * This avoids timezone drift: a Postgres `date` column returns "2026-06-21",
 * and `new Date("2026-06-21")` is parsed as UTC midnight — which becomes
 * "2026-06-20" in any timezone west of UTC. Slicing the first 10 chars and
 * rearranging is timezone-safe.
 */
export function formatDateNL(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = String(iso).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/**
 * Resolve the measurement date for a report, preferring (in order):
 *   1. The session's `measurement_date` (when the technician actually measured)
 *   2. The project's `completed_date`
 *   3. Today (UTC date portion)
 *
 * Returns a Dutch dd-MM-yyyy string. Never throws.
 */
export function resolveMeetdatum(
  sessionMeasurementDate: string | null | undefined,
  projectCompletedDate: string | null | undefined,
  today: Date = new Date(),
): string {
  return (
    formatDateNL(sessionMeasurementDate) ||
    formatDateNL(projectCompletedDate) ||
    formatDateNL(today.toISOString().split("T")[0])
  );
}
