import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import type { StudySession } from '@/types';

function toISOString(v: unknown): string | null {
  if (typeof v === 'string') return v;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    const d = (v as { toDate: () => Date }).toDate();
    return d && !isNaN(d.getTime()) ? d.toISOString() : null;
  }
  return null;
}

function normalizeSessions(value: unknown): StudySession[] {
  if (!Array.isArray(value)) return [];
  const result: StudySession[] = [];
  for (const s of value) {
    if (!s || typeof s !== 'object' || typeof s.id !== 'string' || typeof s.durationMinutes !== 'number') continue;
    const start = toISOString((s as { startTime?: unknown }).startTime);
    const end = toISOString((s as { endTime?: unknown }).endTime);
    if (start && end) {
      result.push({
        ...s,
        startTime: start,
        endTime: end,
      } as StudySession);
    }
  }
  return result;
}

export function useStudySessions() {
  const [rawSessions, setRawSessions] = useUserLocalStorage<StudySession[]>(
    'study-sessions',
    []
  );
  const sessions = normalizeSessions(rawSessions);

  const addSession = (session: Omit<StudySession, 'id'>) => {
    const withId: StudySession = {
      ...session,
      id: crypto.randomUUID(),
    };
    setRawSessions((prev) => [withId, ...normalizeSessions(prev)]);
  };

  return { sessions, addSession, setSessions: setRawSessions };
}
