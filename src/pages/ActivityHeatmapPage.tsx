import { useState } from 'react';
import { useStudySessions } from '@/hooks/useStudySessions';
import { StudyHeatmap, type HeatmapRangeMode } from '@/components/StudyHeatmap';
import { StudyTimeGraph } from '@/components/StudyTimeGraph';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StudySession } from '@/types';
import { safeFormat, safeParseDate } from '@/lib/dateUtils';
import { formatExactStudyTime } from '@/lib/sessionUtils';
import { Clock, BookOpen, BarChart3, Flame } from 'lucide-react';
import { Label } from '@/components/ui/label';

export function ActivityHeatmapPage() {
  const { sessions } = useStudySessions();
  const [rangeMode, setRangeMode] = useState<HeatmapRangeMode>('full');
  const [weeksBack, setWeeksBack] = useState(12);
  const [selectedDay, setSelectedDay] = useState<{
    dateKey: string;
    minutes: number;
    daySessions: StudySession[];
  } | null>(null);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
          <Flame className="h-7 w-7 text-orange-500" />
          Study activity
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          See how much you studied per day, week, month, or year. Click a day on the heatmap for details.
        </p>
      </div>

      {/* Study time graph: hours per day / week / month / year + total */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-lg font-medium text-foreground">
          <BarChart3 className="h-5 w-5 text-primary" />
          Study time over time
        </div>
        <StudyTimeGraph sessions={sessions} />
      </section>

      {/* Heatmap */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-medium text-foreground">Activity heatmap</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="heatmap-range" className="text-sm text-muted-foreground whitespace-nowrap">Time range</Label>
              <select
                id="heatmap-range"
                value={rangeMode === 'weeks' ? `weeks-${weeksBack}` : rangeMode}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === 'from-first-data' || v === 'full') setRangeMode(v);
                  else if (v.startsWith('weeks-')) {
                    setRangeMode('weeks');
                    setWeeksBack(Math.max(1, parseInt(v.slice(6), 10) || 12));
                  }
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="full">Full year (53 weeks)</option>
                <option value="from-first-data">From first data</option>
                <option value="weeks-12">Last 12 weeks</option>
                <option value="weeks-26">Last 26 weeks</option>
              </select>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
          <StudyHeatmap
            sessions={sessions}
            rangeMode={rangeMode}
            weeksBack={weeksBack}
            onDayClick={(dateKey, minutes, daySessions) =>
              setSelectedDay({ dateKey, minutes, daySessions })
            }
          />
        </div>
      </section>

      <Dialog
        open={!!selectedDay}
        onOpenChange={(open) => !open && setSelectedDay(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedDay
                ? safeFormat(safeParseDate(selectedDay.dateKey), 'EEE, MMM d, yyyy')
                : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedDay && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {formatExactStudyTime(selectedDay.minutes)} total
              </div>
              {selectedDay.daySessions.length > 0 ? (
                <ul className="space-y-1.5">
                  {selectedDay.daySessions.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-2 py-2 px-2.5 rounded-md border border-border bg-muted/30 text-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">
                        {s.subjectName || 'No subject'}
                        {s.taskLabel ? ` · ${s.taskLabel}` : ''}
                      </span>
                      <span className="ml-auto text-muted-foreground tabular-nums shrink-0">
                        {formatExactStudyTime(s.durationMinutes)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No sessions recorded this day.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
