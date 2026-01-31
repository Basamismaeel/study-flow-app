import { useMemo, useState } from 'react';
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
import { Subject, DailyTask, CourseDailyCompletion } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StudySessionBlock } from '@/components/StudySessionBlock';
import { StudyGoalsCard } from '@/components/StudyGoalsCard';
import { CourseCard } from '@/components/CourseCard';
import { AddCourseDailyTasksDialog } from '@/components/AddCourseDailyTasksDialog';

import { safeToDateString } from '@/lib/dateUtils';

interface GenericDashboardProps {
  subjects: Subject[];
  courseDailyCompletions: CourseDailyCompletion[];
  dailyTasks: DailyTask[];
  selectedNextSubjectId: string | null;
  onSelectNextSubject: (id: string) => void;
  onAddCourseDailyTask: (courseId: string, text: string) => void;
  onRemoveCourseDailyTask: (courseId: string, taskId: string) => void;
  getCourseDailyCompletion: (taskId: string, date: string) => boolean;
  onToggleCourseDailyCompletion: (taskId: string, date: string, completed: boolean) => void;
}

export function GenericDashboard({
  subjects,
  courseDailyCompletions,
  dailyTasks,
  selectedNextSubjectId,
  onSelectNextSubject,
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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Overview
        </h1>
        <p className="text-muted-foreground">
          Track your progress across courses and daily tasks
        </p>
      </div>

      {/* Start Study Session */}
      <StudySessionBlock
        subjects={safeSubjects.map((s) => ({ id: s.id, name: s.name }))}
        tasks={studySessionTasks}
      />

      {/* Weekly & subject goals */}
      <StudyGoalsCard subjects={safeSubjects.map((s) => ({ id: s.id, name: s.name }))} />

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
                <div className="text-xs text-muted-foreground mt-1">
                  Only these appear in coverage
                </div>
              </div>
            </div>
          </>
        ) : safeSubjects.length > 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-foreground">No daily tasks yet</p>
            <p className="text-sm">
              Add daily tasks to your courses to see coverage here. Open a course and add what you want to finish each day.
            </p>
            <Link to="/subjects">
              <Button className="mt-4">Go to courses</Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-foreground">No courses yet</p>
            <p className="text-sm">
              Add courses and daily tasks to see coverage here
            </p>
            <Link to="/subjects">
              <Button className="mt-4">Add course</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Next up */}
      {nextSubject && safeSubjects.length > 0 && (
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
