/**
 * Dutch date formatting utilities.
 * Consistent date display across the app using dd-MM-yyyy or "d MMM yyyy" style.
 */
import { format, parseISO, isValid } from 'date-fns';
import { nl } from 'date-fns/locale';

/** Format a date string (ISO or Date) to Dutch display: "20 mrt 2026" */
export function formatNlDate(date: string | Date | null | undefined, style: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    switch (style) {
      case 'short': return format(d, 'dd-MM-yyyy');
      case 'medium': return format(d, 'd MMM yyyy', { locale: nl });
      case 'long': return format(d, 'd MMMM yyyy', { locale: nl });
      default: return format(d, 'd MMM yyyy', { locale: nl });
    }
  } catch {
    return '—';
  }
}

/** Format a date string to compact Dutch for mobile: "20 mrt" */
export function formatNlDateCompact(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return format(d, 'd MMM', { locale: nl });
  } catch {
    return '—';
  }
}
