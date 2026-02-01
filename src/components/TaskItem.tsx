import { DailyTask } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeForDisplay } from '@/lib/dateUtils';

interface TaskItemProps {
  task: DailyTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  /** When provided, text and optional time are editable. time?: string clears time when passed "". */
  onUpdate?: (id: string, text: string, time?: string) => void;
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
            onChange={(e) => onUpdate(task.id, e.target.value, task.time)}
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
        {task.time != null && task.time !== '' ? (
          onUpdate ? (
            <label className="flex items-center gap-1.5 shrink-0 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" aria-hidden />
              <Input
                type="time"
                value={task.time}
                onChange={(e) => onUpdate(task.id, task.text, e.target.value || undefined)}
                className="h-8 w-[90px] text-muted-foreground text-sm border-muted"
                aria-label="Task time"
              />
            </label>
          ) : (
            <span className="flex items-center gap-1.5 shrink-0 text-sm text-muted-foreground" aria-hidden>
              <Clock className="w-3.5 h-3.5" />
              {formatTimeForDisplay(task.time)}
            </span>
          )
        ) : onUpdate ? (
          <label className="flex items-center gap-1.5 shrink-0 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" aria-hidden />
            <Input
              type="time"
              value=""
              onChange={(e) => e.target.value && onUpdate(task.id, task.text, e.target.value)}
              className="h-8 w-[90px] text-muted-foreground text-sm border-muted border-dashed"
              placeholder="Time"
              aria-label="Add time (optional)"
              title="Add time (optional)"
            />
          </label>
        ) : null}
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
