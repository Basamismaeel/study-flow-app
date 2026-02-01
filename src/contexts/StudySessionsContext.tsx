import { createContext, useContext, ReactNode, useCallback } from 'react';
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

interface StudySessionsContextType {
  sessions: StudySession[];
  addSession: (session: Omit<StudySession, 'id'>) => void;
}

const StudySessionsContext = createContext<StudySessionsContextType | null>(null);

export function StudySessionsProvider({ children }: { children: ReactNode }) {
  const [rawSessions, setRawSessions] = useUserLocalStorage<StudySession[]>(
    'study-sessions',
    []
  );
  const sessions = normalizeSessions(rawSessions);

  const addSession = useCallback((session: Omit<StudySession, 'id'>) => {
    const withId: StudySession = {
      ...session,
      id: crypto.randomUUID(),
    };
    setRawSessions((prev) => {
      const normalized = normalizeSessions(prev);
      return [withId, ...normalized];
    });
  }, [setRawSessions]);

  return (
    <StudySessionsContext.Provider value={{ sessions, addSession }}>
      {children}
    </StudySessionsContext.Provider>
  );
}

export function useStudySessionsContext() {
  const ctx = useContext(StudySessionsContext);
  if (!ctx) {
    throw new Error('useStudySessionsContext must be used within StudySessionsProvider');
  }
  return ctx;
}
