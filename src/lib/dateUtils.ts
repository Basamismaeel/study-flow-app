import { format, parseISO, isValid } from 'date-fns';

/**
 * Safely convert date to YYYY-MM-DD. Never throws.
 * Handles Firestore Timestamp, Date, ISO strings, and invalid values.
 */
export function safeToDateString(v: unknown, fallback?: string): string {
  const d = safeParseDate(v, new Date());
  if (!isValid(d)) return fallback ?? new Date().toISOString().slice(0, 10);
  try {
    return d.toISOString().slice(0, 10);
  } catch {
    return fallback ?? new Date().toISOString().slice(0, 10);
  }
}

/**
 * Safely parse a date string. Returns valid Date or fallback.
 * Handles Firestore Timestamp, ISO strings, and invalid values.
 */
export function safeParseDate(v: unknown, fallback: Date = new Date()): Date {
  if (v instanceof Date) return isValid(v) ? v : fallback;
  if (typeof v === 'string') {
    try {
      const d = parseISO(v);
      if (isValid(d)) return d;
      const d2 = new Date(v);
      return isValid(d2) ? d2 : fallback;
    } catch {
      return fallback;
    }
  }
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    const d = (v as { toDate: () => Date }).toDate();
    return isValid(d) ? d : fallback;
  }
  return fallback;
}

/**
 * Safely format a date. Returns fallback if date is invalid.
 */
export function safeFormat(date: Date, formatStr: string, fallback = '—'): string {
  if (!date || !isValid(date)) return fallback;
  try {
    return format(date, formatStr);
  } catch {
    return fallback;
  }
}

/**
 * Safely parse ISO string and format. One-liner for common case.
 */
export function safeFormatDate(dateStr: string, formatStr: string, fallback = '—'): string {
  const d = parseISO(dateStr);
  return safeFormat(d, formatStr, fallback);
}

/**
 * Local date key (YYYY-MM-DD) from a Date.
 */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format HH:mm (24h) for display, e.g. "14:30" -> "2:30 PM". Returns fallback if invalid.
 */
export function formatTimeForDisplay(hhmm: string | undefined, fallback = '—'): string {
  if (!hhmm || typeof hhmm !== 'string') return fallback;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || h < 0 || h > 23) return fallback;
  const mins = Number.isNaN(m) ? 0 : Math.max(0, Math.min(59, m));
  if (h === 0) return `12:${mins.toString().padStart(2, '0')} AM`;
  if (h === 12) return `12:${mins.toString().padStart(2, '0')} PM`;
  if (h < 12) return `${h}:${mins.toString().padStart(2, '0')} AM`;
  return `${h - 12}:${mins.toString().padStart(2, '0')} PM`;
}

/**
 * Format a start/end time range. Falls back gracefully.
 */
export function formatTimeRange(start?: string, end?: string): string | null {
  const startLabel = start ? formatTimeForDisplay(start, '') : '';
  const endLabel = end ? formatTimeForDisplay(end, '') : '';
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  if (startLabel) return startLabel;
  if (endLabel) return endLabel;
  return null;
}
