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
