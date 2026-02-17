import { DailyTask } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeForDisplay, formatTimeRange } from '@/lib/dateUtils';

interface TaskItemProps {
  task: DailyTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  /** When provided, text and optional time are editable. timeStart/timeEnd clear when passed "". */
  onUpdate?: (id: string, text: string, timeStart?: string, timeEnd?: string) => void;
}

export function TaskItem({ task, onToggle, onDelete, onUpdate }: TaskItemProps) {
  return (
    <div className={cn(
      'task-item group animate-fade-in',
      task.completed && 'opacity-60'
    )}>
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="h-5 w-5 shrink-0 rounded-md border-2"
      />
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
        {onUpdate ? (
          <Input
            value={task.text}
            onChange={(e) => onUpdate(task.id, e.target.value, task.timeStart ?? task.time, task.timeEnd)}
            className={cn(
              'flex-1 min-w-0 h-9 border-0 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-ring',
              task.completed && 'line-through text-muted-foreground'
            )}
            placeholder="Task..."
          />
        ) : (
          <span className={cn(
            'flex-1 text-foreground transition-all duration-200',
            task.completed && 'line-through text-muted-foreground'
          )}>
            {task.text}
          </span>
        )}
        {onUpdate ? (
          <div className="flex items-center rounded-full border border-border/60 bg-background px-3 h-9 shrink-0 shadow-sm ring-1 ring-muted/40">
            <Clock className="w-3.5 h-3.5 text-muted-foreground mr-2" aria-hidden />
            <label className="sr-only" htmlFor={`task-start-${task.id}`}>Start time</label>
            <Input
              id={`task-start-${task.id}`}
              type="time"
              value={task.timeStart ?? task.time ?? ''}
              onChange={(e) => onUpdate(task.id, task.text, e.target.value, task.timeEnd)}
              className="h-8 w-[92px] text-foreground text-sm font-medium border-0 bg-transparent px-1.5 focus-visible:ring-0"
              aria-label="Start time"
            />
            <span className="text-xs text-muted-foreground/80 px-1">to</span>
            <label className="sr-only" htmlFor={`task-end-${task.id}`}>End time</label>
            <Input
              id={`task-end-${task.id}`}
              type="time"
              value={task.timeEnd ?? ''}
              onChange={(e) => onUpdate(task.id, task.text, task.timeStart ?? task.time, e.target.value)}
              className="h-8 w-[92px] text-foreground text-sm font-medium border-0 bg-transparent px-1.5 focus-visible:ring-0"
              aria-label="End time"
            />
          </div>
        ) : (
          <>
            {(() => {
              const timeRange = formatTimeRange(task.timeStart ?? task.time, task.timeEnd);
              return timeRange ? (
                <span className="flex items-center gap-1.5 shrink-0 text-sm text-muted-foreground" aria-hidden>
                  <Clock className="w-3.5 h-3.5" />
                  {timeRange}
                </span>
              ) : null;
            })()}
            {task.repeatEvery && task.repeatEvery !== 'none' && (
              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Repeats {task.repeatEvery === 'daily' ? 'daily' : 'weekly'}
              </span>
            )}
          </>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 min-h-[44px] min-w-[44px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(task.id)}
        aria-label={`Delete ${task.text}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
