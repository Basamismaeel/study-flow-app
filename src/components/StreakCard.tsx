import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import type { StudySession } from '@/types';
import type { CourseDailyCompletion } from '@/types';
import { useStudySessions } from '@/hooks/useStudySessions';
import { currentStreakFromSessionsAndCompletions } from '@/lib/sessionUtils';

interface StreakCardProps {
  /** When not provided, uses useStudySessions() (e.g. on medicine dashboard). */
  sessions?: StudySession[] | null;
  courseDailyCompletions?: CourseDailyCompletion[];
}

export function StreakCard({ sessions: sessionsProp, courseDailyCompletions = [] }: StreakCardProps) {
  const { sessions: sessionsFromHook } = useStudySessions();
  const sessions = sessionsProp ?? sessionsFromHook ?? [];
  const today = useMemo(() => new Date(), []);
  const streak = useMemo(
    () =>
      currentStreakFromSessionsAndCompletions(
        sessions,
        courseDailyCompletions ?? [],
        today
      ),
    [sessions, courseDailyCompletions, today]
  );

  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Flame className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Current streak</p>
        <p className="text-2xl font-semibold text-foreground">
          {streak} day{streak !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
