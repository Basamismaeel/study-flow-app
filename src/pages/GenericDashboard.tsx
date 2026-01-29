import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, ListTodo, TrendingUp, ArrowRight, ChevronDown } from 'lucide-react';
import { Subject, GenericTask, DailyTask } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StudySessionBlock } from '@/components/StudySessionBlock';
import { StudyGoalsCard } from '@/components/StudyGoalsCard';

interface GenericDashboardProps {
  subjects: Subject[];
  subjectTasks: GenericTask[];
  dailyTasks: DailyTask[];
  selectedNextSubjectId: string | null;
  onSelectNextSubject: (id: string) => void;
}

export function GenericDashboard({
  subjects,
  subjectTasks,
  dailyTasks,
  selectedNextSubjectId,
  onSelectNextSubject,
}: GenericDashboardProps) {
  const dailyCompleted = dailyTasks.filter((t) => t.completed).length;
  const dailyTotal = dailyTasks.length;
  const dailyPercent =
    dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0;

  const stats = useMemo(() => {
    let totalItems = 0;
    let completedItems = 0;
    const perTracking: Record<string, { total: number; completed: number }> = {};
    subjects.forEach((sub) => {
      sub.tracking.forEach((t) => {
        if (t.total > 0) {
          totalItems += t.total;
          completedItems += t.completed;
          if (!perTracking[t.label]) {
            perTracking[t.label] = { total: 0, completed: 0 };
          }
          perTracking[t.label].total += t.total;
          perTracking[t.label].completed += t.completed;
        }
      });
    });
    const overallPercent =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    const trackingLabels = Object.keys(perTracking);
    const firstLabel = trackingLabels[0];
    const firstStats = firstLabel ? perTracking[firstLabel] : null;
    const firstPercent =
      firstStats && firstStats.total > 0
        ? Math.round((firstStats.completed / firstStats.total) * 100)
        : 0;
    return {
      totalItems,
      completedItems,
      overallPercent,
      firstLabel,
      firstStats,
      firstPercent,
      perTracking,
      trackingLabels,
    };
  }, [subjects]);

  const barChartData = useMemo(
    () =>
      subjects.map((sub) => {
        const withTotal = sub.tracking.filter((t) => t.total > 0);
        if (withTotal.length === 0)
          return {
            name: sub.name,
            fullName: sub.name,
            progress: 0,
            status: sub.status,
          };
        const avg =
          withTotal.reduce(
            (acc, t) => acc + (t.completed / t.total) * 100,
            0
          ) / withTotal.length;
        return {
          name: sub.name,
          fullName: sub.name,
          progress: Math.round(avg),
          status: sub.status,
        };
      }),
    [subjects]
  );

  const nextSubject = useMemo(() => {
    if (selectedNextSubjectId) {
      return subjects.find((s) => s.id === selectedNextSubjectId);
    }
    return (
      subjects.find((s) => s.status !== 'completed') || subjects[0]
    );
  }, [subjects, selectedNextSubjectId]);

  const incompleteSubjects = subjects.filter((s) => s.status !== 'completed');

  const subjectProgress = subjects.map((sub) => {
    const withTotal = sub.tracking.filter((t) => t.total > 0);
    const completed = withTotal.reduce((a, t) => a + t.completed, 0);
    const total = withTotal.reduce((a, t) => a + t.total, 0);
    const percent =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    return { subject: sub, completed, total, percent };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Overview
        </h1>
        <p className="text-muted-foreground">
          Track your progress across subjects and daily tasks
        </p>
      </div>

      {/* Start Study Session */}
      <StudySessionBlock
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        tasks={subjectTasks.map((t) => ({ id: t.id, label: t.title, subjectId: t.subjectId }))}
      />

      {/* Weekly & subject goals */}
      <StudyGoalsCard subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} />

      {/* Daily tasks summary */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-medium text-foreground">
              Today&apos;s tasks
            </h2>
          </div>
          <Link to="/daily">
            <Button variant="ghost" size="sm" className="text-primary">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Progress value={dailyPercent} className="h-3 flex-1" />
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {dailyCompleted} / {dailyTotal} completed
          </span>
        </div>
      </div>

      {/* Coverage Progress (like Medicine) */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">
            Coverage Progress
          </h2>
        </div>

        {subjects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
              {/* Overall donut */}
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                  Overall Coverage
                </h3>
                <ChartContainer
                  config={{
                    completed: {
                      label: 'Completed',
                      color: 'hsl(var(--primary))',
                    },
                    remaining: {
                      label: 'Remaining',
                      color: 'hsl(var(--muted))',
                    },
                  }}
                  className="h-[250px] w-full max-w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: 'Completed',
                            value: stats.overallPercent,
                          },
                          {
                            name: 'Remaining',
                            value: 100 - stats.overallPercent,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill="hsl(var(--primary))" />
                        <Cell fill="hsl(var(--muted))" />
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-3xl font-bold fill-foreground"
                      >
                        {stats.overallPercent}%
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex justify-center gap-6 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted" />
                    <span className="text-muted-foreground">Remaining</span>
                  </div>
                </div>
              </div>

              {/* Subjects bar chart */}
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                  Subjects Coverage
                </h3>
                <ChartContainer
                  config={{
                    progress: {
                      label: 'Progress',
                      color: 'hsl(var(--primary))',
                    },
                  }}
                  className="h-[250px] w-full max-w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 70, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--muted))"
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={60}
                        tick={{
                          fill: 'hsl(var(--muted-foreground))',
                          fontSize: 11,
                        }}
                        interval={0}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-3 shadow-sm">
                                <div className="font-medium mb-2">
                                  {data.fullName}
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">
                                    Overall:{' '}
                                  </span>
                                  <span className="font-medium">
                                    {data.progress}%
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="progress"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>

            {/* Metrics breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {stats.overallPercent}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Overall Complete
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stats.completedItems} / {stats.totalItems} items
                </div>
              </div>
              {stats.firstLabel && stats.firstStats && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {stats.firstPercent}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.firstLabel}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.firstStats.completed} / {stats.firstStats.total}
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {subjects.filter((s) => s.status === 'completed').length} /{' '}
                  {subjects.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Subjects Completed
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {subjects.length > 0
                    ? Math.round(
                        (subjects.filter((s) => s.status === 'completed')
                          .length /
                          subjects.length) *
                          100
                      )
                    : 0}
                  % coverage
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-foreground">No subjects yet</p>
            <p className="text-sm">
              Add subjects and tracking items to see coverage here
            </p>
            <Link to="/subjects">
              <Button className="mt-4">Add subject</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Next up */}
      {nextSubject && subjects.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Next Up</h2>
            <Link to="/subjects">
              <Button variant="ghost" size="sm" className="text-primary">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/30 border border-primary/10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <span className="text-4xl">{nextSubject.icon}</span>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <h3 className="font-medium text-foreground">
                        {nextSubject.name}
                      </h3>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Click to change
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {incompleteSubjects.map((sub) => (
                  <DropdownMenuItem
                    key={sub.id}
                    onClick={() => onSelectNextSubject(sub.id)}
                    className="flex items-center gap-2"
                  >
                    <span>{sub.icon}</span>
                    <span>{sub.name}</span>
                    {sub.id === nextSubject.id && (
                      <span className="ml-auto text-xs text-primary">
                        Current
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex-1 text-right">
              <p className="text-sm text-muted-foreground">
                {nextSubject.tracking
                  .filter((t) => t.total > 0)
                  .map(
                    (t) =>
                      `${t.total - t.completed} ${t.label.toLowerCase()} left`
                  )
                  .join(' • ') || 'No tracking items'}
              </p>
            </div>
            <Link to="/subjects">
              <Button size="sm">Open</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Subject list (quick links + progress) */}
      {subjectProgress.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Subjects</h2>
            <Link to="/subjects">
              <Button variant="ghost" size="sm" className="text-primary">
                Manage <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {subjectProgress.map(({ subject, completed, total, percent }) => (
              <Link
                key={subject.id}
                to={`/subjects/${subject.id}`}
                className="block p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
                      {subject.icon}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {subject.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {completed} / {total} items
                      </p>
                    </div>
                  </div>
                  <Progress value={percent} className="h-2 w-24 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
