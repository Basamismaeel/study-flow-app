import { useMemo, useState, type MouseEvent } from 'react';
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
import { BookOpen, ListTodo, TrendingUp, ArrowRight, ChevronDown, Timer, PlusCircle, CheckCircle2, Circle } from 'lucide-react';
import { Subject, DailyTask, CourseDailyCompletion, StudySession } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StudySessionBlock } from '@/components/StudySessionBlock';
import { StreakCard } from '@/components/StreakCard';
import { WeeklyRecapCard } from '@/components/WeeklyRecapCard';
import { CourseCard } from '@/components/CourseCard';
import { AddCourseDailyTasksDialog } from '@/components/AddCourseDailyTasksDialog';
import { EmptyState } from '@/components/EmptyState';

import { safeToDateString } from '@/lib/dateUtils';

interface GenericDashboardProps {
  subjects: Subject[];
  sessions: StudySession[];
  courseDailyCompletions: CourseDailyCompletion[];
  dailyTasks: DailyTask[];
  selectedNextSubjectId: string | null;
  onSelectNextSubject: (id: string) => void;
  onToggleDailyTask: (id: string) => void;
  onAddCourseDailyTask: (courseId: string, text: string) => void;
  onRemoveCourseDailyTask: (courseId: string, taskId: string) => void;
  getCourseDailyCompletion: (taskId: string, date: string) => boolean;
  onToggleCourseDailyCompletion: (taskId: string, date: string, completed: boolean) => void;
}

export function GenericDashboard({
  subjects,
  sessions,
  courseDailyCompletions,
  dailyTasks,
  selectedNextSubjectId,
  onSelectNextSubject,
  onToggleDailyTask,
  onAddCourseDailyTask,
  onRemoveCourseDailyTask,
  getCourseDailyCompletion,
  onToggleCourseDailyCompletion,
}: GenericDashboardProps) {
  const todayStr = safeToDateString(new Date());
  const [courseForTasksDialog, setCourseForTasksDialog] = useState<Subject | null>(null);

  const safeDailyTasks = Array.isArray(dailyTasks) ? dailyTasks : [];
  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeCompletions = Array.isArray(courseDailyCompletions) ? courseDailyCompletions : [];

  // Global daily tasks for today (from Daily Tasks page)
  const todayDailyTasks = safeDailyTasks.filter((t) => {
    const d = t.date ?? (t.createdAt ? safeToDateString(t.createdAt, todayStr) : todayStr);
    return d === todayStr;
  });
  const dailyCompleted = todayDailyTasks.filter((t) => t.completed).length;
  const dailyTotal = todayDailyTasks.length;
  const dailyPercent =
    dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0;
  const pendingTasks = todayDailyTasks.filter((t) => !t.completed);
  const firstPending = pendingTasks[0];
  const handleToggleFromDashboard = (taskId: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleDailyTask(taskId);
  };

  // Time-of-day greeting and state-based motivational copy
  const todaysTasksCopy = (() => {
    const hour = new Date().getHours();
    const morning = hour >= 5 && hour < 12;
    const afternoon = hour >= 12 && hour < 17;
    const greeting = morning ? 'Good morning' : afternoon ? 'Good afternoon' : 'Good evening';
    if (dailyTotal === 0) {
      return { title: `${greeting} — your list is empty`, subtitle: 'Add your first task and own the day.' };
    }
    if (dailyCompleted === dailyTotal) {
      const lines = ['You crushed it today.', 'All done. Nice work.', 'List cleared. Time to relax.'];
      return { title: "Today's list", subtitle: lines[dailyTotal % lines.length] };
    }
    const left = dailyTotal - dailyCompleted;
    if (left === 1) {
      return { title: "Today's list", subtitle: 'One more to go — you’ve got this.' };
    }
    if (dailyPercent >= 75) {
      return { title: "Today's list", subtitle: `${left} left. Almost there!` };
    }
    if (dailyPercent >= 50) {
      return { title: "Today's list", subtitle: `${left} to go. You’re halfway there.` };
    }
    return { title: "Today's list", subtitle: `${left} left. One step at a time.` };
  })();

  // Coverage: only courses WITH daily tasks. Daily coverage = completed today / total.
  const coursesWithDailyTasks = safeSubjects.filter((s) => (s.dailyTasks ?? []).length > 0);
  const coverageStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    coursesWithDailyTasks.forEach((sub) => {
      (sub.dailyTasks ?? []).forEach((task) => {
        total += 1;
        const c = safeCompletions.find(
          (x) => x.taskId === task.id && x.date === todayStr && x.completed
        );
        if (c) completed += 1;
      });
    });
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [coursesWithDailyTasks, safeCompletions, todayStr]);

  const barChartData = useMemo(
    () =>
      coursesWithDailyTasks.map((sub) => {
        const tasks = sub.dailyTasks ?? [];
        const total = tasks.length;
        const completed = tasks.filter((task) =>
          safeCompletions.some(
            (c) => c.taskId === task.id && c.date === todayStr && c.completed
          )
        ).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          name: sub.name,
          fullName: sub.name,
          progress,
          completed,
          total,
        };
      }),
    [coursesWithDailyTasks, safeCompletions, todayStr]
  );

  const studySessionTasks = useMemo(
    () =>
      safeSubjects.flatMap((s) =>
        (s.dailyTasks ?? []).map((t) => ({
          id: t.id,
          label: t.text,
          subjectId: s.id,
        }))
      ),
    [safeSubjects]
  );

  const nextSubject = useMemo(() => {
    if (selectedNextSubjectId) {
      return safeSubjects.find((s) => s.id === selectedNextSubjectId);
    }
    return safeSubjects[0];
  }, [safeSubjects, selectedNextSubjectId]);

  const subjectProgress = safeSubjects.map((sub) => {
    const tasks = sub.dailyTasks ?? [];
    const total = tasks.length;
    const completed = tasks.filter((task) =>
      safeCompletions.some(
        (c) => c.taskId === task.id && c.date === todayStr && c.completed
      )
    ).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { subject: sub, completed, total, percent };
  });

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero: one clear next step */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">
          Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Start a session, check today&apos;s tasks, or open the timer.
        </p>
      </div>

      {/* Quick actions: Start session, Add task, Timer */}
      <div className="flex flex-wrap items-center gap-3">
        <StudySessionBlock
          subjects={safeSubjects.map((s) => ({ id: s.id, name: s.name }))}
          tasks={studySessionTasks}
        />
        <Link to="/daily">
          <Button variant="outline" size="lg" className="gap-2">
            <PlusCircle className="w-5 h-5" />
            Today&apos;s tasks
          </Button>
        </Link>
        <Link to="/timer">
          <Button variant="outline" size="lg" className="gap-2">
            <Timer className="w-5 h-5" />
            Timer
          </Button>
        </Link>
      </div>

      {/* Streak & weekly recap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StreakCard courseDailyCompletions={safeCompletions} />
        <WeeklyRecapCard />
      </div>

      {/* Today's tasks — creative focus card */}
      <Link to="/daily" className="block group/tasks">
        <div className="glass-card p-6 hover:border-primary/30 hover:shadow-lg active:scale-[0.99] transition-all duration-200 cursor-pointer rounded-2xl overflow-hidden relative">
          {/* Subtle gradient when complete */}
          {dailyTotal > 0 && dailyCompleted === dailyTotal && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" aria-hidden />
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 relative">
            {/* Circular progress with state-based ring effect */}
            <div className="flex items-center gap-4 shrink-0">
              <div
                className={[
                  'relative h-24 w-24 shrink-0 transition-all duration-300',
                  dailyTotal > 0 && dailyCompleted === dailyTotal && 'today-ring-complete',
                  dailyTotal > 0 && pendingTasks.length > 0 && 'today-ring-pending',
                ].filter(Boolean).join(' ')}
              >
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-muted/80"
                    fill="none"
                    strokeWidth="2.5"
                    strokeDasharray="100"
                    d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                  />
                  <path
                    className="stroke-primary transition-all duration-700 ease-out"
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="100"
                    strokeDashoffset={100 - dailyPercent}
                    d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground tabular-nums">
                  {dailyTotal > 0 ? `${dailyPercent}%` : '—'}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground group-hover/tasks:text-primary transition-colors">
                  {todaysTasksCopy.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {todaysTasksCopy.subtitle}
                </p>
                {dailyTotal > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {dailyCompleted} of {dailyTotal} done
                  </p>
                )}
              </div>
            </div>
            {/* Task preview: highlight "Next up", then up to 2 more */}
            <div className="flex-1 min-w-0 space-y-3">
              {todayDailyTasks.length === 0 && (
                <div className="flex items-center gap-3 py-2">
                  <div className="rounded-full bg-muted/80 p-2">
                    <ListTodo className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tap here to add your first task and get started.
                  </p>
                </div>
              )}
              {firstPending && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary shrink-0">
                    Current
                  </span>
                  <span className="text-sm font-medium text-foreground truncate flex-1">
                    {firstPending.text}
                  </span>
                  <button
                    type="button"
                    className="shrink-0 text-primary/80 hover:text-primary transition-colors"
                    aria-label={`Mark "${firstPending.text}" as done`}
                    onClick={(e) => handleToggleFromDashboard(firstPending.id, e)}
                  >
                    <Circle className="h-4 w-4" />
                  </button>
                </div>
              )}
              {todayDailyTasks.length > 0 && todayDailyTasks.filter((t) => t.id !== firstPending?.id).slice(0, 2).map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    className={task.completed ? 'shrink-0 text-primary' : 'shrink-0 text-muted-foreground hover:text-foreground'}
                    aria-label={task.completed ? `Mark "${task.text}" as not done` : `Mark "${task.text}" as done`}
                    onClick={(e) => handleToggleFromDashboard(task.id, e)}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                  <span className={task.completed ? 'text-muted-foreground line-through truncate' : 'text-foreground truncate'}>
                    {task.text}
                  </span>
                </div>
              ))}
              {(() => {
                const displayedCount = firstPending ? Math.min(3, todayDailyTasks.length) : Math.min(2, todayDailyTasks.length);
                const moreCount = todayDailyTasks.length - displayedCount;
                return moreCount > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    +{moreCount} more on your list
                  </p>
                ) : null;
              })()}
            </div>
            <div className="flex items-center shrink-0 sm:pl-2">
              <span className="text-primary font-medium text-sm inline-flex items-center gap-1.5 group-hover/tasks:gap-2 transition-all">
                Open list <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Coverage Progress (like Medicine) */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">
            Coverage Progress
          </h2>
        </div>

        {safeSubjects.length > 0 && coursesWithDailyTasks.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
              {/* Overall donut - daily coverage */}
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                  Today&apos;s Coverage
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
                            value: coverageStats.percent,
                          },
                          {
                            name: 'Remaining',
                            value: 100 - coverageStats.percent,
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
                        {coverageStats.percent}%
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

              {/* Courses bar chart - only courses with daily tasks */}
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                  Daily Coverage by Course
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
                                    Today:{' '}
                                  </span>
                                  <span className="font-medium">
                                    {data.completed} / {data.total} tasks
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {coverageStats.percent}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Today&apos;s Daily Coverage
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {coverageStats.completed} / {coverageStats.total} tasks done
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {coursesWithDailyTasks.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Courses with daily tasks
                </div>
              </div>
            </div>
          </>
        ) : safeSubjects.length > 0 ? (
          <EmptyState
            variant="card"
            icon={<BookOpen className="w-7 h-7" />}
            title="No daily tasks yet"
            description="Add tasks to your courses — your progress will show here."
            action={
              <Link to="/subjects">
                <Button>Go to courses</Button>
              </Link>
            }
          />
        ) : (
          <EmptyState
            variant="card"
            icon={<BookOpen className="w-7 h-7" />}
            title="No courses yet"
            description="Your first course will show here once you add one."
            action={
              <Link to="/subjects">
                <Button>Add course</Button>
              </Link>
            }
          />
        )}
      </div>

      {/* Next up */}
      {nextSubject && safeSubjects.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Current / Next Up</h2>
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
                    <p className="text-xs text-muted-foreground">
                      Change course
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {safeSubjects.map((sub) => (
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
                {(nextSubject.dailyTasks ?? []).length > 0
                  ? `${(nextSubject.dailyTasks ?? []).length} daily tasks`
                  : 'Add daily tasks'}
              </p>
            </div>
            <Button size="sm" onClick={() => setCourseForTasksDialog(nextSubject)}>
              Open
            </Button>
          </div>
        </div>
      )}

      {/* Course list (quick links + daily progress) */}
      {subjectProgress.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Courses</h2>
            <Link to="/subjects">
              <Button variant="ghost" size="sm" className="text-primary">
                Manage <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {subjectProgress.map(({ subject, completed, total }) => (
              <div
                key={subject.id}
                onClick={() => setCourseForTasksDialog(subject)}
                className="cursor-pointer"
              >
                <CourseCard
                  course={subject}
                  todayCompleted={completed}
                  todayTotal={total}
                  onClick={() => setCourseForTasksDialog(subject)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <AddCourseDailyTasksDialog
        course={courseForTasksDialog}
        open={!!courseForTasksDialog}
        onOpenChange={(open) => !open && setCourseForTasksDialog(null)}
        onAddTask={onAddCourseDailyTask}
        onRemoveTask={onRemoveCourseDailyTask}
        getCompletion={getCourseDailyCompletion}
        onToggleCompletion={onToggleCourseDailyCompletion}
      />
    </div>
  );
}
