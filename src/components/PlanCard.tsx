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
import { ListPlus } from 'lucide-react';

interface PlanCardProps {
  plan: Plan;
  onToggleTask: (planId: string, taskId: string) => void;
  onEditTaskList?: (planId: string) => void;
}

export function PlanCard({ plan, onToggleTask, onEditTaskList }: PlanCardProps) {
  const progress = getPlanProgress(plan);
  const currentDay = getCurrentDay(plan);
  const todayTasks = getTasksForDay(plan, currentDay);
  const isComplete = progress.total > 0 && progress.completed === progress.total;

  return (
    <div className="space-y-6">
      {/* Edit task list */}
      {onEditTaskList && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditTaskList?.(plan.id)}
            className="gap-2"
          >
            <ListPlus className="w-4 h-4" />
            Edit task list
          </Button>
        </div>
      )}

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

      {/* Current day */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Current day</h3>
        <p className="text-2xl font-semibold text-foreground">Day {currentDay}</p>
        {plan.totalDays > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Plan length: {plan.totalDays} days (schedule extends as needed)
          </p>
        )}
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
    </div>
  );
}
