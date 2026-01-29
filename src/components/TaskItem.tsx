import { DailyTask } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: DailyTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, text: string) => void;
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
      {onUpdate ? (
        <Input
          value={task.text}
          onChange={(e) => onUpdate(task.id, e.target.value)}
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
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(task.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
