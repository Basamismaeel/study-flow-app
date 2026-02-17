import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import { useStudySessionsContext } from '@/contexts/StudySessionsContext';
// #region agent log
import { debugLog } from '@/debugLog';
// #endregion

const ACTIVE_SESSION_STORAGE_KEY = (uid: string) => `study-flow-user-${uid}-active-study-session`;

export interface ActiveSessionPayload {
  subjectId: string | null;
  subjectName: string | null;
  taskId: string | null;
  taskLabel: string | null;
}

interface ActiveSession extends ActiveSessionPayload {
  startTime: string; // ISO timestamp when session started
  endTime: string | null; // ISO timestamp when session ended (null if running)
  status: 'running' | 'paused';
}

interface ActiveStudySessionContextType {
  active: ActiveSession | null;
  elapsedSeconds: number;
  isPaused: boolean;
  startSession: (payload: ActiveSessionPayload) => void;
  pauseSession: () => void;
  continueSession: () => void;
  endSession: () => void;
}

const ActiveStudySessionContext =
  createContext<ActiveStudySessionContextType | null>(null);

function getElapsedSeconds(active: ActiveSession | null): number {
  if (!active) return 0;
  
  // Calculate from timestamps only
  const start = new Date(active.startTime).getTime();
  const end = active.endTime ? new Date(active.endTime).getTime() : Date.now();
  
  return Math.floor((end - start) / 1000);
}

function normalizeActive(raw: unknown): ActiveSession | null {
  if (!raw || typeof raw !== 'object') return null;
  
  const r = raw as Partial<ActiveSession>;
  
  // If it has the new structure, return as is
  if (r.startTime && r.status && r.endTime !== undefined) {
    return raw as ActiveSession;
  }
  
  // Migrate old session format
  if ((raw as { startTime?: string }).startTime) {
    return {
      subjectId: r.subjectId ?? null,
      subjectName: r.subjectName ?? null,
      taskId: r.taskId ?? null,
      taskLabel: r.taskLabel ?? null,
      startTime: (raw as { startTime: string }).startTime,
      endTime: null,
      status: 'running',
    };
  }
  
  return null;
}

export function ActiveStudySessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id ?? '';
  const [rawActive, setRawActive] = useUserLocalStorage<ActiveSession | null>(
    'active-study-session',
    null
  );
  const active = normalizeActive(rawActive);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const { addSession } = useStudySessionsContext();

  // Mark hydrated after we have had a chance to read from storage (next tick)
  useEffect(() => {
    const t = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(t);
  }, []);

  // #region agent log
  useEffect(() => {
    debugLog({ location: 'ActiveStudySessionContext.tsx:mount', message: 'Provider mounted', data: {}, hypothesisId: 'H5' });
  }, []);
  // #endregion

  // Timer: only run when hydrated and active; elapsed derived from startTime only
  useEffect(() => {
    if (!hydrated || !active) {
      if (!active) setElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      const elapsed = getElapsedSeconds(active);
      setElapsedSeconds(elapsed);
    };

    updateElapsed();
    // #region agent log
    const firstElapsed = getElapsedSeconds(active);
    debugLog({
      location: 'ActiveStudySessionContext.tsx:timerEffect',
      message: 'Timer effect running',
      data: { activeStartTime: active.startTime, firstElapsedSeconds: firstElapsed },
      hypothesisId: 'H6',
    });
    // #endregion

    if (active.status === 'running') {
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [hydrated, active?.startTime, active?.endTime, active?.status]);

  const startSession = useCallback((payload: ActiveSessionPayload) => {
    // Never overwrite an existing session: read from localStorage first (same key as useUserFirestore)
    if (uid) {
      try {
        const key = ACTIVE_SESSION_STORAGE_KEY(uid);
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          const existing = normalizeActive(parsed);
          if (existing && typeof existing.startTime === 'string') {
            // #region agent log
            debugLog({
              location: 'ActiveStudySessionContext.tsx:startSession',
              message: 'Reusing existing session (not overwriting startTime)',
              data: { startTime: existing.startTime },
              hypothesisId: 'H1,H4',
            });
            // #endregion
            setRawActive(existing);
            return;
          }
        }
      } catch {
        // ignore
      }
    }

    const now = new Date().toISOString();
    // #region agent log
    debugLog({
      location: 'ActiveStudySessionContext.tsx:startSession',
      message: 'startSession called — writing new startTime',
      data: { startTime: now },
      hypothesisId: 'H1,H4',
    });
    // #endregion
    setRawActive({
      ...payload,
      startTime: now,
      endTime: null,
      status: 'running',
    });
  }, [uid, setRawActive]);

  const pauseSession = useCallback(() => {
    if (!active || active.status !== 'running') return;
    
    // Set endTime to current time and mark as paused
    const now = new Date().toISOString();
    setRawActive({
      ...active,
      endTime: now,
      status: 'paused',
    });
  }, [active, setRawActive]);

  const continueSession = useCallback(() => {
    if (!active || active.status !== 'paused') return;
    
    // Calculate how much time elapsed before pause
    const pausedDuration = getElapsedSeconds(active);
    
    // Create new session with adjusted start time
    const now = Date.now();
    const adjustedStart = new Date(now - pausedDuration * 1000).toISOString();
    
    setRawActive({
      ...active,
      startTime: adjustedStart,
      endTime: null,
      status: 'running',
    });
  }, [active, setRawActive]);

  const endSession = useCallback(() => {
    // #region agent log
    debugLog({
      location: 'ActiveStudySessionContext.tsx:endSession',
      message: 'endSession called',
      data: { hasActive: !!active, activeStartTime: active?.startTime ?? null },
      hypothesisId: 'H1',
    });
    // #endregion
    if (!active) return;
    
    const end = new Date().toISOString();
    const totalSeconds = getElapsedSeconds({ ...active, endTime: end });
    const durationMinutes = Math.max(1 / 60, totalSeconds / 60);
    
    addSession({
      subjectId: active.subjectId,
      subjectName: active.subjectName,
      taskId: active.taskId,
      taskLabel: active.taskLabel,
      startTime: active.startTime,
      endTime: end,
      durationMinutes,
    });
    
    setRawActive(null);
  }, [active, addSession, setRawActive]);

  return (
    <ActiveStudySessionContext.Provider
      value={{
        active,
        elapsedSeconds,
        isPaused: active !== null && active.status === 'paused',
        startSession,
        pauseSession,
        continueSession,
        endSession,
      }}
    >
      {children}
    </ActiveStudySessionContext.Provider>
  );
}

export function useActiveStudySession() {
  const ctx = useContext(ActiveStudySessionContext);
  if (!ctx) {
    throw new Error(
      'useActiveStudySession must be used within ActiveStudySessionProvider'
    );
  }
  return ctx;
}
