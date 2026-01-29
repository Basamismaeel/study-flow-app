import { useMemo, useState } from 'react';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useStudyGoals } from '@/hooks/useStudyGoals';
import { totalMinutesInWeek, daysStudiedThisWeek, currentStreak } from '@/lib/sessionUtils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Target, Settings, Calendar, Flame } from 'lucide-react';

interface SubjectOption {
  id: string;
  name: string;
}

interface StudyGoalsCardProps {
  subjects?: SubjectOption[];
}

export function StudyGoalsCard({ subjects = [] }: StudyGoalsCardProps) {
  const { sessions } = useStudySessions();
  const { goals, setWeeklyHours, setSubjectHours, removeSubjectGoal } =
    useStudyGoals();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [weeklyInput, setWeeklyInput] = useState(
    goals.weeklyHours ? String(goals.weeklyHours) : ''
  );

  const today = useMemo(() => new Date(), []);
  const thisWeekMinutes = useMemo(
    () => totalMinutesInWeek(sessions, today),
    [sessions, today]
  );
  const daysThisWeek = useMemo(
    () => daysStudiedThisWeek(sessions, today),
    [sessions, today]
  );
  const streak = useMemo(() => currentStreak(sessions, today), [sessions, today]);
  const weeklyGoalMinutes = goals.weeklyHours * 60;
  const weeklyPercent =
    weeklyGoalMinutes > 0
      ? Math.min(100, Math.round((thisWeekMinutes / weeklyGoalMinutes) * 100))
      : 0;

  const subjectProgress = useMemo(() => {
    const bySubject: Record<string, number> = {};
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    sessions.forEach((s) => {
      const t = new Date(s.startTime);
      if (t >= start && t < end) {
        const id = s.subjectId || s.subjectName || '';
        if (id) bySubject[id] = (bySubject[id] || 0) + s.durationMinutes;
      }
    });
    return bySubject;
  }, [sessions, today]);

  const saveWeeklyGoal = () => {
    const n = parseFloat(weeklyInput);
    if (!isNaN(n)) setWeeklyHours(n);
    setSettingsOpen(false);
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Study goals</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Consistency (non-gamified) */}
      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {daysThisWeek} day{daysThisWeek !== 1 ? 's' : ''} studied this week
        </span>
        <span className="inline-flex items-center gap-1">
          <Flame className="w-4 h-4" />
          {streak} day streak
        </span>
      </div>

      {goals.weeklyHours > 0 ? (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">This week</span>
            <span className="font-medium">
              {Math.floor(thisWeekMinutes / 60)}h {thisWeekMinutes % 60}m /{' '}
              {goals.weeklyHours}h goal
            </span>
          </div>
          <Progress value={weeklyPercent} className="h-3" />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Set a weekly study hour goal to track progress.
        </p>
      )}

      {subjects.length > 0 &&
        Object.keys(goals.subjectHours).length > 0 && (
          <div className="mt-4 pt-4 border-t space-y-2">
            {subjects
              .filter((s) => (goals.subjectHours[s.id] ?? 0) > 0)
              .map((s) => {
                const mins = subjectProgress[s.id] ?? 0;
                const goalMins = (goals.subjectHours[s.id] ?? 0) * 60;
                const pct =
                  goalMins > 0
                    ? Math.min(100, Math.round((mins / goalMins) * 100))
                    : 0;
                return (
                  <div key={s.id} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground truncate">
                        {s.name}
                      </span>
                      <span className="font-medium tabular-nums shrink-0 ml-2">
                        {Math.floor(mins / 60)}h{mins % 60}m /{' '}
                        {goals.subjectHours[s.id]}h
                      </span>
                    </div>
                    <Progress value={pct} className="h-2 mt-1" />
                  </div>
                );
              })}
          </div>
        )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Study goals</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Weekly study hours (overall)</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={weeklyInput}
                onChange={(e) => setWeeklyInput(e.target.value)}
                placeholder="e.g. 20"
              />
            </div>
            {subjects.length > 0 && (
              <div className="space-y-2">
                <Label>Per-subject weekly hours (optional)</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {subjects.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2"
                    >
                      <span className="flex-1 truncate text-sm">{s.name}</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        className="w-20"
                        value={
                          goals.subjectHours[s.id] != null
                            ? String(goals.subjectHours[s.id])
                            : ''
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '') {
                            removeSubjectGoal(s.id);
                            return;
                          }
                          const n = parseFloat(v);
                          if (!isNaN(n)) setSubjectHours(s.id, n);
                        }}
                        placeholder="0"
                      />
                      <span className="text-xs text-muted-foreground">h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveWeeklyGoal}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
