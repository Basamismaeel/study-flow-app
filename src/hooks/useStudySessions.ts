import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import type { StudySession } from '@/types';

function normalizeSessions(value: unknown): StudySession[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (s): s is StudySession =>
      s &&
      typeof s === 'object' &&
      typeof s.id === 'string' &&
      typeof s.durationMinutes === 'number' &&
      typeof s.startTime === 'string' &&
      typeof s.endTime === 'string'
  );
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
