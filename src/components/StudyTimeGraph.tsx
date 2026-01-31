import { useMemo, useState } from 'react';
import { StudySession } from '@/types';
import {
  aggregateByDay,
  aggregateByWeek,
  aggregateByMonth,
  aggregateByYear,
  totalStudyMinutes,
  type TimeBucketItem,
} from '@/lib/sessionUtils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { safeFormat, safeParseDate } from '@/lib/dateUtils';
import { BarChart3, Clock } from 'lucide-react';

interface StudyTimeGraphProps {
  sessions: StudySession[];
}

type ViewMode = 'day' | 'week' | 'month' | 'year';

function formatLabel(key: string, mode: ViewMode): string {
  try {
    if (mode === 'day') {
      return safeFormat(safeParseDate(key), 'MMM d', key);
    }
    if (mode === 'week') {
      const [y, w] = key.split('-W');
      return `W${w} '${y?.slice(2) ?? ''}`;
    }
    if (mode === 'month') {
      return safeFormat(safeParseDate(key + '-01'), 'MMM yyyy', key);
    }
    return key;
  } catch {
    return key;
  }
}

export function StudyTimeGraph({ sessions }: StudyTimeGraphProps) {
  const [view, setView] = useState<ViewMode>('week');

  const { data, totalHours } = useMemo(() => {
    const totalMins = totalStudyMinutes(sessions);
    const totalHours = Math.round((totalMins / 60) * 100) / 100;
    let items: TimeBucketItem[] = [];
    if (view === 'day') items = aggregateByDay(sessions, 30);
    if (view === 'week') items = aggregateByWeek(sessions, 26);
    if (view === 'month') items = aggregateByMonth(sessions, 12);
    if (view === 'year') items = aggregateByYear(sessions);
    const data = items.map((item) => ({
      ...item,
      displayLabel: formatLabel(item.key, view),
    }));
    return { data, totalHours };
  }, [sessions, view]);

  const maxHours = useMemo(() => {
    if (data.length === 0) return 1;
    const max = Math.max(...data.map((d) => d.hours));
    return max < 0.5 ? 1 : Math.ceil(max * 2) / 2;
  }, [data]);

  return (
    <div className="space-y-4">
      <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="day" className="text-xs sm:text-sm">Day</TabsTrigger>
            <TabsTrigger value="week" className="text-xs sm:text-sm">Week</TabsTrigger>
            <TabsTrigger value="month" className="text-xs sm:text-sm">Month</TabsTrigger>
            <TabsTrigger value="year" className="text-xs sm:text-sm">Year</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value={view} className="mt-4">
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              Study hours per {view}
            </div>
            <ChartContainer
              config={{
                hours: {
                  label: 'Hours',
                  color: 'hsl(var(--primary))',
                },
              }}
              className="h-[260px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis
                    dataKey="displayLabel"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, maxHours]}
                    tickFormatter={(v) => `${v}h`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [`${Number(value).toFixed(1)} h`, 'Studied']}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.displayLabel ?? ''
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="hours"
                    fill="var(--color-hours)"
                    radius={[4, 4, 0, 0]}
                    name="Hours"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </TabsContent>
      </Tabs>

      {/* Total study time */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total study time (all time)</p>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {totalHours >= 1
                ? `${totalHours.toFixed(1)} hours`
                : `${Math.round(totalStudyMinutes(sessions))} min`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
