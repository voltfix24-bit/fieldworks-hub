/**
 * Dutch-locale numeric utilities.
 *
 * Dutch users type comma as decimal separator (1,78).
 * We normalise to dot for storage/calculation, and format back with comma for display.
 */

/** Parse a Dutch-style numeric string: accepts both comma and dot as decimal separator. */
export function parseNlNumber(value: string): number {
  if (!value || value.trim() === '') return NaN;
  // Replace comma with dot, then parse
  const normalised = value.replace(',', '.');
  return parseFloat(normalised);
}

/** Like parseNlNumber but returns 0 instead of NaN for empty/invalid input. */
export function parseNlNumberOrZero(value: string): number {
  const n = parseNlNumber(value);
  return isNaN(n) ? 0 : n;
}

/** Like parseNlNumber but returns null for empty/invalid input. */
export function parseNlNumberOrNull(value: string): number | null {
  if (!value || value.trim() === '' || value.trim() === '-') return null;
  const n = parseNlNumber(value);
  return isNaN(n) ? null : n;
}

/**
 * Format a number for Dutch display.
 * Uses comma as decimal separator.
 */
export function formatNlNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value == null || isNaN(value)) return '—';
  return value.toFixed(decimals).replace('.', ',');
}

/**
 * Format a number for Dutch display, returning empty string if null/undefined.
 * Useful for input fields.
 */
export function formatNlNumberInput(value: number | null | undefined, decimals?: number): string {
  if (value == null || isNaN(value)) return '';
  if (value === 0) return '';
  return decimals != null ? value.toFixed(decimals).replace('.', ',') : String(value).replace('.', ',');
}

/**
 * Normalise a typed value for controlled inputs.
 * Allows digits, comma, dot, and minus. Prevents double separators.
 */
export function normaliseNlInput(raw: string): string {
  // Allow: digits, one comma or dot, optional leading minus
  return raw.replace(/[^0-9.,-]/g, '');
}
