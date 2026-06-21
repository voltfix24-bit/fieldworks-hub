import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { formatDateNL, resolveMeetdatum } from "./date-utils.ts";

Deno.test("formatDateNL: converts YYYY-MM-DD to dd-MM-yyyy", () => {
  assertEquals(formatDateNL("2026-06-21"), "21-06-2026");
  assertEquals(formatDateNL("2026-01-01"), "01-01-2026");
  assertEquals(formatDateNL("2026-12-31"), "31-12-2026");
});

Deno.test("formatDateNL: handles full ISO timestamps by slicing to date portion", () => {
  assertEquals(formatDateNL("2026-06-21T10:30:00.000Z"), "21-06-2026");
  assertEquals(formatDateNL("2026-06-21T00:00:00+02:00"), "21-06-2026");
});

Deno.test("formatDateNL: returns empty string for empty / null / undefined / invalid", () => {
  assertEquals(formatDateNL(null), "");
  assertEquals(formatDateNL(undefined), "");
  assertEquals(formatDateNL(""), "");
  assertEquals(formatDateNL("not-a-date"), "");
  assertEquals(formatDateNL("21/06/2026"), "");
});

Deno.test("formatDateNL: NO timezone drift on date-only strings (regression)", () => {
  // `new Date("2026-06-21")` parses as UTC midnight, which becomes
  // 2026-06-20 in any TZ west of UTC. Our helper must NOT exhibit that.
  const originalTZ = Deno.env.get("TZ");
  try {
    Deno.env.set("TZ", "America/Los_Angeles"); // UTC-7/8
    assertEquals(formatDateNL("2026-06-21"), "21-06-2026");
    Deno.env.set("TZ", "Pacific/Honolulu"); // UTC-10
    assertEquals(formatDateNL("2026-06-21"), "21-06-2026");
    Deno.env.set("TZ", "Asia/Tokyo"); // UTC+9
    assertEquals(formatDateNL("2026-06-21"), "21-06-2026");
  } finally {
    if (originalTZ) Deno.env.set("TZ", originalTZ);
    else Deno.env.delete("TZ");
  }
});

Deno.test("resolveMeetdatum: prefers session measurement_date", () => {
  assertEquals(
    resolveMeetdatum("2026-06-21", "2026-06-15", new Date("2026-07-01T12:00:00Z")),
    "21-06-2026",
  );
});

Deno.test("resolveMeetdatum: falls back to project completed_date when no session date", () => {
  assertEquals(
    resolveMeetdatum(null, "2026-06-15", new Date("2026-07-01T12:00:00Z")),
    "15-06-2026",
  );
  assertEquals(
    resolveMeetdatum(undefined, "2026-06-15", new Date("2026-07-01T12:00:00Z")),
    "15-06-2026",
  );
  assertEquals(
    resolveMeetdatum("", "2026-06-15", new Date("2026-07-01T12:00:00Z")),
    "15-06-2026",
  );
});

Deno.test("resolveMeetdatum: falls back to today when nothing else is set", () => {
  const today = new Date("2026-07-01T12:00:00Z");
  assertEquals(resolveMeetdatum(null, null, today), "01-07-2026");
  assertEquals(resolveMeetdatum(undefined, undefined, today), "01-07-2026");
});

Deno.test("resolveMeetdatum: ignores invalid session date and uses next fallback", () => {
  assertEquals(
    resolveMeetdatum("garbage", "2026-06-15", new Date("2026-07-01T12:00:00Z")),
    "15-06-2026",
  );
});

Deno.test("resolveMeetdatum: integration — session date wins even when 'today' would be different", () => {
  // Regression: ensure a measurement performed on 21 June 2026 always
  // shows 21-06-2026, even if the PDF is generated days later.
  const sessionDate = "2026-06-21";
  const completedDate = "2026-06-21";
  const reportGeneratedAt = new Date("2026-06-25T23:59:00Z");
  assertEquals(
    resolveMeetdatum(sessionDate, completedDate, reportGeneratedAt),
    "21-06-2026",
  );
});

Deno.test("resolveMeetdatum: integration — TZ shifts don't move the meetdatum", () => {
  const originalTZ = Deno.env.get("TZ");
  try {
    for (const tz of ["UTC", "America/Los_Angeles", "Pacific/Honolulu", "Asia/Tokyo", "Pacific/Kiritimati"]) {
      Deno.env.set("TZ", tz);
      assertEquals(
        resolveMeetdatum("2026-06-21", null, new Date("2026-06-21T12:00:00Z")),
        "21-06-2026",
        `expected stable date in TZ=${tz}`,
      );
    }
  } finally {
    if (originalTZ) Deno.env.set("TZ", originalTZ);
    else Deno.env.delete("TZ");
  }
});
