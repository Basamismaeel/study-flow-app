import { useMemo, useState, useEffect } from 'react';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import {
  getWeekKey,
  weekKeyToStartDate,
  totalMinutesInWeek,
  daysStudiedThisWeek,
  currentStreak,
} from '@/lib/sessionUtils';
import { WeeklyReflection } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar, Flame, BookOpen } from 'lucide-react';
import { safeFormat } from '@/lib/dateUtils';

const REFLECTIONS_KEY = 'weekly-reflections';

export function WeeklyReviewPage() {
  const { sessions } = useStudySessions();
  const [reflections, setReflections] = useUserLocalStorage<WeeklyReflection[]>(
    REFLECTIONS_KEY,
    []
  );
  const today = useMemo(() => new Date(), []);
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(() =>
    getWeekKey(today)
  );

  const weekStart = useMemo(
    () => weekKeyToStartDate(selectedWeekKey),
    [selectedWeekKey]
  );
  const weekLabel = `${safeFormat(weekStart, 'MMM d')} – ${safeFormat(
    new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
    'MMM d, yyyy'
  )}`;

  const totalMinutes = useMemo(
    () => totalMinutesInWeek(sessions, weekStart),
    [sessions, weekStart]
  );
  const sessionCount = useMemo(
    () =>
      sessions.filter((s) => {
        const t = new Date(s.startTime);
        const end = new Date(weekStart);
        end.setDate(end.getDate() + 7);
        return t >= weekStart && t < end;
      }).length,
    [sessions, weekStart]
  );
  const daysStudied = useMemo(
    () => daysStudiedThisWeek(sessions, weekStart),
    [sessions, weekStart]
  );

  const bySubject = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const t = new Date(s.startTime);
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 7);
      if (t >= weekStart && t < end) {
        const name = s.subjectName || 'Uncategorized';
        map[name] = (map[name] || 0) + s.durationMinutes;
      }
    });
    return map;
  }, [sessions, weekStart]);

  const mostStudied =
    Object.keys(bySubject).length > 0
      ? Object.entries(bySubject).sort((a, b) => b[1] - a[1])[0][0]
      : '—';
  const leastStudied =
    Object.keys(bySubject).length > 0
      ? Object.entries(bySubject).sort((a, b) => a[1] - b[1])[0][0]
      : '—';

  const currentReflection = reflections.find((r) => r.weekKey === selectedWeekKey);
  const [whatWentWell, setWhatWentWell] = useState(
    currentReflection?.whatWentWell ?? ''
  );
  const [whatWasChallenging, setWhatWasChallenging] = useState(
    currentReflection?.whatWasChallenging ?? ''
  );
  const [whatWillChange, setWhatWillChange] = useState(
    currentReflection?.whatWillChange ?? ''
  );

  useEffect(() => {
    const r = reflections.find((x) => x.weekKey === selectedWeekKey);
    setWhatWentWell(r?.whatWentWell ?? '');
    setWhatWasChallenging(r?.whatWasChallenging ?? '');
    setWhatWillChange(r?.whatWillChange ?? '');
  }, [selectedWeekKey, reflections]);

  const streak = useMemo(() => currentStreak(sessions, today), [sessions, today]);

  const saveReflection = () => {
    const existing = reflections.findIndex((r) => r.weekKey === selectedWeekKey);
    const newRef: WeeklyReflection = {
      weekKey: selectedWeekKey,
      whatWentWell: whatWentWell.trim(),
      whatWasChallenging: whatWasChallenging.trim(),
      whatWillChange: whatWillChange.trim(),
      savedAt: new Date().toISOString(),
    };
    if (existing >= 0) {
      setReflections((prev) =>
        prev.map((r, i) => (i === existing ? newRef : r))
      );
    } else {
      setReflections((prev) => [...prev, newRef].sort((a, b) => b.weekKey.localeCompare(a.weekKey)));
    }
  };

  const weekOptions = useMemo(() => {
    const keys: string[] = [];
    for (let i = 0; i < 26; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - 7 * i);
      keys.push(getWeekKey(d));
    }
    return [...new Set(keys)].sort((a, b) => b.localeCompare(a));
  }, [today]);

  const goPrevWeek = () => {
    const idx = weekOptions.indexOf(selectedWeekKey);
    if (idx < weekOptions.length - 1)
      setSelectedWeekKey(weekOptions[idx + 1]);
  };
  const goNextWeek = () => {
    const idx = weekOptions.indexOf(selectedWeekKey);
    if (idx > 0) setSelectedWeekKey(weekOptions[idx - 1]);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Weekly Review
        </h1>
        <p className="text-muted-foreground">
          Summarize your week and reflect. No AI — just you.
        </p>
      </div>

      {/* Consistency & streak (non-gamified) */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Days studied this week:</span>
          <span className="font-medium">{daysStudied}</span>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Current streak:</span>
          <span className="font-medium">{streak} day{streak !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Week selector */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" size="icon" onClick={goPrevWeek}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Select value={selectedWeekKey} onValueChange={setSelectedWeekKey}>
          <SelectTrigger className="w-[280px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weekOptions.map((key) => (
              <SelectItem key={key} value={key}>
                {key} ({safeFormat(weekKeyToStartDate(key), 'MMM d')})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={goNextWeek}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Week summary */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">{weekLabel}</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-muted-foreground">Total study time:</span>
            <span className="font-medium">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-muted-foreground">Study sessions:</span>
            <span className="font-medium">{sessionCount}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-muted-foreground">Most studied:</span>
            <span className="font-medium">{mostStudied}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-muted-foreground">Least studied:</span>
            <span className="font-medium">{leastStudied}</span>
          </li>
        </ul>
      </div>

      {/* Reflection inputs */}
      <div className="glass-card p-6 space-y-6">
        <h2 className="text-lg font-medium text-foreground">Reflection</h2>
        <div className="space-y-2">
          <Label>What went well this week?</Label>
          <Textarea
            value={whatWentWell}
            onChange={(e) => setWhatWentWell(e.target.value)}
            placeholder="e.g. Finished 3 chapters, stayed consistent in the morning."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>What was challenging?</Label>
          <Textarea
            value={whatWasChallenging}
            onChange={(e) => setWhatWasChallenging(e.target.value)}
            placeholder="e.g. Hard to focus after lunch."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>What will I change next week?</Label>
          <Textarea
            value={whatWillChange}
            onChange={(e) => setWhatWillChange(e.target.value)}
            placeholder="e.g. Block 2 hours in the morning, no phone during sessions."
            rows={3}
          />
        </div>
        <Button onClick={saveReflection}>Save reflection</Button>
      </div>

      {/* Past weeks with saved reflections */}
      {reflections.filter((r) => r.weekKey !== selectedWeekKey).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-foreground">Past reflections</h2>
          <ul className="space-y-2">
            {reflections
              .filter((r) => r.weekKey !== selectedWeekKey)
              .slice(0, 10)
              .map((r) => (
                <li key={r.weekKey}>
                  <button
                    type="button"
                    onClick={() => setSelectedWeekKey(r.weekKey)}
                    className="text-left w-full p-3 rounded-lg border border-border hover:bg-accent/30 text-sm"
                  >
                    <span className="font-medium">{r.weekKey}</span>
                    {r.whatWentWell || r.whatWasChallenging || r.whatWillChange ? (
                      <span className="text-muted-foreground ml-2">· Saved</span>
                    ) : null}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
