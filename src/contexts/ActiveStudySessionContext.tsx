import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import { useStudySessions } from '@/hooks/useStudySessions';

export interface ActiveSessionPayload {
  subjectId: string | null;
  subjectName: string | null;
  taskId: string | null;
  taskLabel: string | null;
}

interface ActiveSession extends ActiveSessionPayload {
  startTime: string;
  /** Total seconds studied so far (includes time before pause). */
  accumulatedSeconds: number;
  /** When running: ISO string of last resume time. When paused: null. */
  resumedAt: string | null;
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
  let elapsed = active.accumulatedSeconds;
  if (active.resumedAt) {
    elapsed += (Date.now() - new Date(active.resumedAt).getTime()) / 1000;
  }
  return Math.floor(elapsed);
}

function normalizeActive(raw: ActiveSession | null): ActiveSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const hasNewFields =
    typeof (raw as ActiveSession).accumulatedSeconds === 'number' &&
    (raw as ActiveSession).resumedAt !== undefined;
  if (hasNewFields) return raw as ActiveSession;
  // Migrate old session: treat as running from start
  return {
    ...raw,
    startTime: (raw as { startTime?: string }).startTime ?? new Date().toISOString(),
    accumulatedSeconds: 0,
    resumedAt: (raw as { startTime?: string }).startTime ?? new Date().toISOString(),
  };
}

export function ActiveStudySessionProvider({ children }: { children: ReactNode }) {
  const [rawActive, setRawActive] = useUserLocalStorage<ActiveSession | null>(
    'active-study-session',
    null
  );
  const active = normalizeActive(rawActive);
  const setActive = setRawActive;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const { addSession } = useStudySessions();

  useEffect(() => {
    if (!active) {
      setElapsedSeconds(0);
      return;
    }
    const tick = () => setElapsedSeconds(getElapsedSeconds(active));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [active?.accumulatedSeconds, active?.resumedAt]);

  const startSession = useCallback((payload: ActiveSessionPayload) => {
    const now = new Date().toISOString();
    setActive({
      ...payload,
      startTime: now,
      accumulatedSeconds: 0,
      resumedAt: now,
    });
  }, [setActive]);

  const pauseSession = useCallback(() => {
    if (!active || !active.resumedAt) return;
    const now = Date.now();
    const resumedAt = new Date(active.resumedAt).getTime();
    const added = Math.floor((now - resumedAt) / 1000);
    setActive({
      ...active,
      accumulatedSeconds: active.accumulatedSeconds + added,
      resumedAt: null,
    });
  }, [active, setActive]);

  const continueSession = useCallback(() => {
    if (!active) return;
    setActive({
      ...active,
      resumedAt: new Date().toISOString(),
    });
  }, [active, setActive]);

  const endSession = useCallback(() => {
    if (!active) return;
    const totalSeconds = getElapsedSeconds(active);
    const durationMinutes = Math.max(1 / 60, totalSeconds / 60);
    const end = new Date().toISOString();
    addSession({
      subjectId: active.subjectId,
      subjectName: active.subjectName,
      taskId: active.taskId,
      taskLabel: active.taskLabel,
      startTime: active.startTime,
      endTime: end,
      durationMinutes,
    });
    setActive(null);
  }, [active, addSession, setActive]);

  return (
    <ActiveStudySessionContext.Provider
      value={{
        active,
        elapsedSeconds,
        isPaused: active !== null && active.resumedAt === null,
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
