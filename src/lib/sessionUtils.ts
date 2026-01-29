import type { StudySession } from '@/types';

/** ISO date string (YYYY-MM-DD). */
export function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Week key e.g. "2025-W29" (ISO week). */
export function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Start of week (Monday) for a week key. */
export function weekKeyToStartDate(weekKey: string): Date {
  const [y, w] = weekKey.split('-W').map(Number);
  const jan1 = new Date(y, 0, 1);
  const mon = jan1.getDay() === 0 ? -6 : 1 - jan1.getDay();
  const start = new Date(y, 0, mon + (w - 1) * 7);
  return start;
}

/** Total minutes studied on a given date (dateKey YYYY-MM-DD). Uses exact sum (no rounding). */
export function minutesOnDate(sessions: StudySession[], dateKey: string): number {
  if (!Array.isArray(sessions)) return 0;
  return sessions
    .filter((s) => s && typeof s.startTime === 'string' && toDateKey(s.startTime) === dateKey)
    .reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
}

/** Format exact study time for display (no rounding). e.g. "1h 23m 45s", "45m 30s", "25m" */
export function formatExactStudyTime(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 min';
  const totalSeconds = Math.round(totalMinutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0) parts.push(`${s}s`);
  return parts.join(' ').trim() || '0 min';
}

/** Days with at least one session in the last N days (for streak). */
export function daysWithSessions(sessions: StudySession[], upToDate: Date): Set<string> {
  const set = new Set<string>();
  if (!Array.isArray(sessions)) return set;
  sessions.forEach((s) => {
    if (!s || typeof s.startTime !== 'string') return;
    const key = toDateKey(s.startTime);
    if (new Date(s.startTime) <= upToDate) set.add(key);
  });
  return set;
}

/** Current streak: consecutive days (including today) with at least one session. */
export function currentStreak(sessions: StudySession[], today: Date): number {
  const dateKeys = daysWithSessions(sessions, today);
  let streak = 0;
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (dateKeys.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/** Number of distinct days studied in the week containing the given date. */
export function daysStudiedThisWeek(sessions: StudySession[], refDate: Date): number {
  if (!Array.isArray(sessions)) return 0;
  const weekKey = getWeekKey(refDate);
  const start = weekKeyToStartDate(weekKey);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const set = new Set<string>();
  sessions.forEach((s) => {
    if (!s || typeof s.startTime !== 'string') return;
    const t = new Date(s.startTime);
    if (t >= start && t < end) set.add(toDateKey(s.startTime));
  });
  return set.size;
}

/** Total minutes in the week containing refDate. */
export function totalMinutesInWeek(sessions: StudySession[], refDate: Date): number {
  if (!Array.isArray(sessions)) return 0;
  const weekKey = getWeekKey(refDate);
  const start = weekKeyToStartDate(weekKey);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return sessions
    .filter((s) => s && typeof s.startTime === 'string')
    .filter((s) => {
      const t = new Date(s.startTime);
      return t >= start && t < end;
    })
    .reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
}

/** Month key e.g. "2025-01". */
export function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Year key e.g. "2025". */
export function getYearKey(date: Date): string {
  return String(date.getFullYear());
}

/** Aggregate sessions by date key (day), week key, month key, or year key. */
export type TimeBucket = 'day' | 'week' | 'month' | 'year';

export interface TimeBucketItem {
  key: string;
  label: string;
  minutes: number;
  hours: number;
}

export function aggregateByDay(sessions: StudySession[], lastNDays: number): TimeBucketItem[] {
  if (!Array.isArray(sessions)) return [];
  const result: Record<string, number> = {};
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - lastNDays);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    result[key] = minutesOnDate(sessions, key);
  }
  return Object.entries(result)
    .map(([key, minutes]) => ({
      key,
      label: key,
      minutes,
      hours: Math.round((minutes / 60) * 100) / 100,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function aggregateByWeek(sessions: StudySession[], lastNWeeks: number): TimeBucketItem[] {
  if (!Array.isArray(sessions)) return [];
  const result: Record<string, number> = {};
  const end = new Date();
  for (let i = 0; i < lastNWeeks; i++) {
    const d = new Date(end);
    d.setDate(d.getDate() - i * 7);
    const key = getWeekKey(d);
    result[key] = totalMinutesInWeek(sessions, d);
  }
  return Object.entries(result)
    .map(([key, minutes]) => ({
      key,
      label: key,
      minutes,
      hours: Math.round((minutes / 60) * 100) / 100,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function aggregateByMonth(sessions: StudySession[], lastNMonths: number): TimeBucketItem[] {
  const result: Record<string, number> = {};
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - lastNMonths, 1);
  for (let i = 0; i <= lastNMonths; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = getMonthKey(d);
    result[key] = 0;
  }
  if (Array.isArray(sessions)) {
    sessions.forEach((s) => {
      if (!s || typeof s.startTime !== 'string') return;
      const key = getMonthKey(new Date(s.startTime));
      if (key in result) result[key] += s.durationMinutes ?? 0;
    });
  }
  return Object.entries(result)
    .map(([key, minutes]) => ({
      key,
      label: key,
      minutes,
      hours: Math.round((minutes / 60) * 100) / 100,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function aggregateByYear(sessions: StudySession[]): TimeBucketItem[] {
  if (!Array.isArray(sessions)) return [];
  const result: Record<string, number> = {};
  sessions.forEach((s) => {
    if (!s || typeof s.startTime !== 'string') return;
    const key = getYearKey(new Date(s.startTime));
    result[key] = (result[key] ?? 0) + (s.durationMinutes ?? 0);
  });
  return Object.entries(result)
    .map(([key, minutes]) => ({
      key,
      label: key,
      minutes,
      hours: Math.round((minutes / 60) * 100) / 100,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** Total study time in minutes across all sessions. */
export function totalStudyMinutes(sessions: StudySession[]): number {
  if (!Array.isArray(sessions)) return 0;
  return sessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
}

/** Momentum: positive = consistent recent study, neutral = some, negative = neglected. */
export type Momentum = 'positive' | 'neutral' | 'negative';

export function subjectMomentum(
  sessions: StudySession[],
  subjectId: string | null,
  subjectName: string | null,
  lastNDays: number = 14
): Momentum {
  if (!Array.isArray(sessions)) return 'negative';
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lastNDays);
  const recent = sessions.filter((s) => {
    if (!s || typeof s.startTime !== 'string') return false;
    const t = new Date(s.startTime);
    if (t < cutoff) return false;
    if (subjectId) return s.subjectId === subjectId;
    if (subjectName) return s.subjectName === subjectName;
    return false;
  });
  const totalMins = recent.reduce((a, s) => a + (s.durationMinutes ?? 0), 0);
  const daysStudied = new Set(recent.map((s) => toDateKey(s.startTime))).size;
  if (totalMins >= 60 && daysStudied >= 3) return 'positive';
  if (totalMins >= 15 || daysStudied >= 1) return 'neutral';
  return 'negative';
}
