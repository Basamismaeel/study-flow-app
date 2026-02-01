import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import type { StudySession } from '@/types';
import { useStudySessions } from '@/hooks/useStudySessions';
import {
  daysStudiedThisWeek,
  totalMinutesInWeek,
  formatExactStudyTime,
} from '@/lib/sessionUtils';

interface WeeklyRecapCardProps {
  /** When not provided, uses useStudySessions() (e.g. on medicine dashboard). */
  sessions?: StudySession[] | null;
}

export function WeeklyRecapCard({ sessions: sessionsProp }: WeeklyRecapCardProps) {
  const { sessions: sessionsFromHook } = useStudySessions();
  const sessions = sessionsProp ?? sessionsFromHook ?? [];
  const daysThisWeek = useMemo(
    () => daysStudiedThisWeek(sessions, new Date()),
    [sessions]
  );
  const minutesThisWeek = useMemo(
    () => totalMinutesInWeek(sessions, new Date()),
    [sessions]
  );

  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <CalendarDays className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">This week</p>
        <p className="text-lg font-semibold text-foreground">
          {daysThisWeek} day{daysThisWeek !== 1 ? 's' : ''} · {formatExactStudyTime(minutesThisWeek)}
        </p>
      </div>
    </div>
  );
}
