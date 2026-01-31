import { useState } from 'react';
import { Subject } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, ListTodo } from 'lucide-react';
import { safeToDateString } from '@/lib/dateUtils';

interface AddCourseDailyTasksDialogProps {
  course: Subject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask: (courseId: string, text: string) => void;
  onRemoveTask: (courseId: string, taskId: string) => void;
  getCompletion: (taskId: string, date: string) => boolean;
  onToggleCompletion: (taskId: string, date: string, completed: boolean) => void;
}

export function AddCourseDailyTasksDialog({
  course,
  open,
  onOpenChange,
  onAddTask,
  onRemoveTask,
  getCompletion,
  onToggleCompletion,
}: AddCourseDailyTasksDialogProps) {
  const [newTaskText, setNewTaskText] = useState('');
  const todayStr = safeToDateString(new Date());
  const dailyTasks = course?.dailyTasks ?? [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (course && newTaskText.trim()) {
      onAddTask(course.id, newTaskText.trim());
      setNewTaskText('');
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) setNewTaskText('');
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{course?.icon}</span>
            <span>{course?.name ?? 'Course'}</span>
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">
          Add daily tasks for this course. You can add as many as you like.
        </p>

        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="e.g. Watch 2 lectures, Do 20 problems"
            className="h-11 flex-1"
          />
          <Button type="submit" size="sm" disabled={!course || !newTaskText.trim()} className="h-11 px-4">
            <Plus className="w-4 h-4" />
          </Button>
        </form>

        <div className="min-h-[120px] max-h-[280px] overflow-y-auto rounded-lg border border-border bg-muted/20">
          {dailyTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <ListTodo className="w-10 h-10 text-muted-foreground/60 mb-2" />
              <p className="text-sm text-muted-foreground">No tasks yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add tasks above</p>
            </div>
          ) : (
            <ul className="divide-y divide-border p-2">
              {dailyTasks.map((task) => {
                const completed = getCompletion(task.id, todayStr);
                return (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-md hover:bg-muted/40 group"
                  >
                    <Checkbox
                      checked={completed}
                      onCheckedChange={(checked) =>
                        onToggleCompletion(task.id, todayStr, !!checked)
                      }
                      className="h-5 w-5 shrink-0 rounded-full border-2"
                      aria-label={completed ? `Mark "${task.text}" not done` : `Mark "${task.text}" done`}
                    />
                    <span
                      className={`flex-1 text-sm truncate ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                    >
                      {task.text}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => course && onRemoveTask(course.id, task.id)}
                      aria-label={`Remove ${task.text}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => handleClose(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
