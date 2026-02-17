import { useMemo } from 'react';
import { StudySession } from '@/types';
import { toDateKey, minutesOnDate, formatExactStudyTime } from '@/lib/sessionUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { safeFormat, safeParseDate, toLocalDateKey } from '@/lib/dateUtils';

export type HeatmapRangeMode = 'full' | 'from-first-data' | 'weeks';

interface StudyHeatmapProps {
  sessions: StudySession[];
  onDayClick?: (dateKey: string, minutes: number, daySessions: StudySession[]) => void;
  /** 'full' = last 53 weeks (default); 'from-first-data' = start from first session; 'weeks' = last N weeks */
  rangeMode?: HeatmapRangeMode;
  /** When rangeMode is 'weeks', number of weeks to show (e.g. 12, 26). */
  weeksBack?: number;
}

const DEFAULT_TOTAL_WEEKS = 53;
const DAYS_PER_WEEK = 7;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMaxMinutes(sessions: StudySession[], dateKeys: Set<string>): number {
  let max = 1;
  dateKeys.forEach((key) => {
    const m = minutesOnDate(sessions, key);
    if (m > max) max = m;
  });
  return max;
}

export function StudyHeatmap({ sessions, onDayClick, rangeMode = 'full', weeksBack = 12 }: StudyHeatmapProps) {
  const { grid, maxMinutes, startDate, monthLabels, totalWeeks } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = new Date(today);
    let totalWeeks = DEFAULT_TOTAL_WEEKS;

    if (rangeMode === 'from-first-data' && Array.isArray(sessions) && sessions.length > 0) {
      const firstDate = sessions.reduce((earliest, s) => {
        const t = new Date(s.startTime).getTime();
        return t < earliest ? t : earliest;
      }, Number.MAX_SAFE_INTEGER);
      if (firstDate !== Number.MAX_SAFE_INTEGER) {
        start = new Date(firstDate);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - start.getDay());
        const diffMs = today.getTime() - start.getTime();
        totalWeeks = Math.max(1, Math.ceil(diffMs / (DAYS_PER_WEEK * 24 * 60 * 60 * 1000)));
      }
    } else if (rangeMode === 'weeks' && weeksBack > 0) {
      totalWeeks = Math.min(weeksBack, DEFAULT_TOTAL_WEEKS);
      start.setDate(today.getDate() - (totalWeeks - 1) * DAYS_PER_WEEK);
      start.setDate(start.getDate() - start.getDay());
    } else {
      start.setDate(today.getDate() - (totalWeeks - 1) * DAYS_PER_WEEK);
      start.setDate(start.getDate() - start.getDay());
    }

    const keys = new Set<string>();
    const grid2D: { dateKey: string; minutes: number }[][] = [];
    for (let row = 0; row < DAYS_PER_WEEK; row++) {
      grid2D[row] = [];
      for (let col = 0; col < totalWeeks; col++) {
        const d = new Date(start);
        d.setDate(start.getDate() + col * DAYS_PER_WEEK + row);
        const key = toLocalDateKey(d);
        const minutes = minutesOnDate(sessions, key);
        if (d <= today) keys.add(key);
        grid2D[row].push({ dateKey: key, minutes });
      }
    }

    const monthLabels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    for (let col = 0; col < totalWeeks; col++) {
      const d = new Date(start);
      d.setDate(start.getDate() + col * DAYS_PER_WEEK);
      const m = d.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ col, label: safeFormat(d, 'MMM') });
        lastMonth = m;
      }
    }

    const max = getMaxMinutes(sessions, keys);
    return { grid: grid2D, maxMinutes: max, startDate: start, monthLabels, totalWeeks };
  }, [sessions, rangeMode, weeksBack]);

  const getLevel = (minutes: number, dateKey: string): number => {
    const today = toLocalDateKey(new Date());
    if (dateKey > today) return -1;
    if (minutes <= 0) return 0;
    if (maxMinutes <= 0) return 0;
    const p = minutes / maxMinutes;
    if (p >= 1) return 4;
    if (p >= 0.75) return 3;
    if (p >= 0.5) return 2;
    if (p >= 0.25) return 1;
    return 1;
  };

  const byDateKey = useMemo(() => {
    const map: Record<string, StudySession[]> = {};
    sessions.forEach((s) => {
      const key = toDateKey(s.startTime);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    Object.keys(map).forEach((k) =>
      map[k].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    );
    return map;
  }, [sessions]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          {/* Day labels (left) + grid - GitHub style */}
          <div className="flex gap-[3px] items-start">
            <div
              className="grid gap-[3px] text-[10px] text-muted-foreground shrink-0"
              style={{ gridTemplateRows: 'repeat(7, 10px)' }}
            >
              {DAY_LABELS.map((label, row) => (
                <span key={row} className="h-[10px] flex items-center leading-none">
                  {label.slice(0, 1)}
                </span>
              ))}
            </div>
            <div
              className="grid gap-[3px] shrink-0"
              style={{
                gridTemplateColumns: `repeat(${totalWeeks}, 10px)`,
                gridTemplateRows: 'repeat(7, 10px)',
              }}
            >
              {grid.map((row, rowIdx) =>
                row.map((cell, colIdx) => {
                  const level = getLevel(cell.minutes, cell.dateKey);
                  const daySessions = byDateKey[cell.dateKey] ?? [];
                  const isFuture = cell.dateKey > toLocalDateKey(new Date());
                  const content = (
                    <button
                      type="button"
                      onClick={() =>
                        !isFuture && onDayClick?.(cell.dateKey, cell.minutes, daySessions)
                      }
                      className={cn(
                        'w-[10px] h-[10px] rounded-[2px] transition-colors',
                        level === -1 && 'bg-transparent',
                        level === 0 && !isFuture && 'bg-muted/50',
                        level === 0 && isFuture && 'bg-muted/30',
                        level === 1 && 'bg-emerald-400/70 dark:bg-emerald-500/50',
                        level === 2 && 'bg-emerald-500 dark:bg-emerald-600',
                        level === 3 && 'bg-emerald-600 dark:bg-emerald-700',
                        level === 4 && 'bg-emerald-700 dark:bg-emerald-800',
                        !isFuture && daySessions.length > 0 && 'cursor-pointer hover:ring-2 hover:ring-foreground/20 hover:ring-offset-1'
                      )}
                    />
                  );
                  const tooltip = (
                    <span className="text-xs">
                      {safeFormat(safeParseDate(cell.dateKey), 'MMM d, yyyy')}
                      <br />
                      {cell.minutes > 0
                        ? `${formatExactStudyTime(cell.minutes)} studied`
                        : 'No activity'}
                      {daySessions.length > 0 && (
                        <>
                          <br />
                          {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </span>
                  );
                  return (
                    <Tooltip key={`${rowIdx}-${colIdx}`}>
                      <TooltipTrigger asChild>{content}</TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {tooltip}
                      </TooltipContent>
                    </Tooltip>
                  );
                })
              )}
            </div>
          </div>
          {/* Month labels (bottom) - aligned under first week of each month */}
          <div
            className="relative pl-9 h-4 text-[10px] text-muted-foreground"
            style={{ width: 9 + totalWeeks * 10 + (totalWeeks - 1) * 3 }}
          >
            {monthLabels.map(({ col, label }) => (
              <span
                key={col}
                className="absolute"
                style={{ left: 9 + col * (10 + 3) }}
              >
                {label}
              </span>
            ))}
          </div>
          {/* Legend - GitHub style: Less [squares] More */}
          <div className="flex items-center gap-1.5 pl-9 mt-3 text-[10px] text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className={cn(
                  'w-[10px] h-[10px] rounded-[2px]',
                  level === 0 && 'bg-muted/50',
                  level === 1 && 'bg-emerald-400/70 dark:bg-emerald-500/50',
                  level === 2 && 'bg-emerald-500 dark:bg-emerald-600',
                  level === 3 && 'bg-emerald-600 dark:bg-emerald-700',
                  level === 4 && 'bg-emerald-700 dark:bg-emerald-800'
                )}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
