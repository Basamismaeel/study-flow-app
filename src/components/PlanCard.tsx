import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ProgressBar';
import {
  getCurrentDay,
  getPlanProgress,
  getTasksForDay,
} from '@/lib/plannerLogic';
import type { Plan } from '@/types';
import { cn } from '@/lib/utils';
import { ListPlus, Pencil, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { safeFormat, safeParseDate } from '@/lib/dateUtils';

interface PlanCardProps {
  plan: Plan;
  onToggleTask: (planId: string, taskId: string) => void;
  onEditTaskList?: (planId: string) => void;
  onEditPlan?: (planId: string) => void;
}

export function PlanCard({ plan, onToggleTask, onEditTaskList, onEditPlan }: PlanCardProps) {
  const progress = getPlanProgress(plan);
  const currentDay = getCurrentDay(plan);
  const todayTasks = getTasksForDay(plan, currentDay);
  const isComplete = progress.total > 0 && progress.completed === progress.total;
  const totalDays = Math.max(1, plan.totalDays ?? 30);
  const extendedDays = currentDay > totalDays ? currentDay - totalDays : 0;
  const [showCompleted, setShowCompleted] = useState(false);
  const completedForHistory = plan.tasks.filter((t) => t.completed).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  return (
    <div className="space-y-6">
      {/* Edit plan name / days & Edit task list */}
      <div className="flex flex-wrap justify-end gap-2">
        {onEditPlan && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditPlan(plan.id)}
            className="gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit plan
          </Button>
        )}
        {onEditTaskList && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditTaskList?.(plan.id)}
            className="gap-2"
          >
            <ListPlus className="w-4 h-4" />
            Edit task list
          </Button>
        )}
      </div>

      {/* Progress */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Progress</h3>
        <p className="text-2xl font-semibold text-foreground">
          {progress.completed}
          <span className="text-base font-normal text-muted-foreground"> / {progress.total} tasks</span>
        </p>
        <ProgressBar
          value={progress.completed}
          max={progress.total || 1}
          size="sm"
          className="mt-2"
          variant={isComplete ? 'success' : 'default'}
        />
      </div>

      {/* Current day + planned vs extended */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Current day</h3>
        <p className="text-2xl font-semibold text-foreground">Day {currentDay}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Planned: {totalDays} days
          {extendedDays > 0 && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">Extended: +{extendedDays} days</span>
          )}
        </p>
      </div>

      {/* Today's tasks */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Today&apos;s tasks</h3>
        {todayTasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {progress.total === 0
              ? 'No tasks in this plan yet.'
              : isComplete
                ? 'All tasks completed!'
                : 'No tasks assigned for this day.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {todayTasks.map((task) => (
              <li
                key={task.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border border-border/50 transition-colors',
                  task.completed && 'bg-muted/50 opacity-75'
                )}
              >
                <Checkbox
                  id={task.id}
                  checked={task.completed}
                  onCheckedChange={() => onToggleTask(plan.id, task.id)}
                />
                <label
                  htmlFor={task.id}
                  className={cn(
                    'flex-1 text-sm font-medium cursor-pointer select-none',
                    task.completed && 'line-through text-muted-foreground'
                  )}
                >
                  {task.name}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Track record: completed tasks */}
      {completedForHistory.length > 0 && (
        <div className="glass-card p-6">
          <button
            type="button"
            className="flex items-center gap-2 w-full text-left"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <h3 className="text-sm font-medium text-muted-foreground">Completed ({completedForHistory.length})</h3>
          </button>
          {showCompleted && (
            <ul className="mt-3 space-y-2">
              {completedForHistory.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2 text-sm py-1.5 border-b border-border/50 last:border-0"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="flex-1 truncate text-muted-foreground line-through">{task.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {task.completedAt ? safeFormat(safeParseDate(task.completedAt), 'MMM d, yyyy') : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
