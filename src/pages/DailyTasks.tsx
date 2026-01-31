import { useState } from 'react';
import { DailyTask } from '@/types';
import { TaskItem } from '@/components/TaskItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2, ListTodo, Trash2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { addDays, subDays, isToday, parseISO, isValid } from 'date-fns';
import { safeFormat, safeToDateString } from '@/lib/dateUtils';

interface DailyTasksProps {
  tasks: DailyTask[];
  onAddTask: (text: string, date?: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask?: (id: string, text: string) => void;
  onClearAllTasks: () => void;
  /** When true, allows adding and viewing tasks for any date */
  allowOtherDays?: boolean;
}

export function DailyTasks({ tasks, onAddTask, onToggleTask, onDeleteTask, onUpdateTask, onClearAllTasks, allowOtherDays = false }: DailyTasksProps) {
  const [newTask, setNewTask] = useState('');
  const today = new Date();
  const todayStr = safeToDateString(today);
  const [viewDate, setViewDate] = useState(todayStr);

  const tasksForViewDate = allowOtherDays
    ? (Array.isArray(tasks) ? tasks : []).filter((t) => {
        const d = t.date ?? (t.createdAt ? safeToDateString(t.createdAt, todayStr) : todayStr);
        return d === viewDate;
      })
    : (Array.isArray(tasks) ? tasks : []);

  const completedTasks = tasksForViewDate.filter(t => t.completed);
  const pendingTasks = tasksForViewDate.filter(t => !t.completed);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAddTask(newTask.trim(), allowOtherDays ? viewDate : undefined);
      setNewTask('');
    }
  };

  const displayDate = (() => {
    try {
      const d = parseISO(viewDate);
      return isValid(d) ? d : today;
    } catch {
      return today;
    }
  })();
  const dateLabel = safeFormat(displayDate, 'EEEE, MMM d, yyyy');

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground mb-2">Daily Tasks</h1>
        {allowOtherDays ? (
          <div className="flex items-center justify-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewDate(safeToDateString(subDays(displayDate, 1)))}
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 min-w-[200px] justify-center">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">{dateLabel}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewDate(safeToDateString(addDays(displayDate, 1)))}
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">{dateLabel}</p>
        )}
        {allowOtherDays && !isToday(displayDate) && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setViewDate(todayStr)}
          >
            Go to today
          </Button>
        )}
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        {allowOtherDays && (
          <div className="flex items-center gap-2">
            <label htmlFor="task-date" className="text-sm text-muted-foreground whitespace-nowrap">For date:</label>
            <Input
              id="task-date"
              type="date"
              value={viewDate}
              onChange={(e) => setViewDate(e.target.value)}
              className="w-[140px]"
            />
          </div>
        )}
        <div className="flex gap-3 flex-1 min-w-0">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder={allowOtherDays ? "Add a task..." : "Add a task for today..."}
            className="flex-1 h-12 text-base"
          />
          <Button type="submit" size="lg" disabled={!newTask.trim()}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </form>

      {/* Progress Summary */}
      {tasksForViewDate.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ListTodo className="w-4 h-4" />
              <span>{pendingTasks.length} remaining</span>
            </div>
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="w-4 h-4" />
              <span>{completedTasks.length} completed</span>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all tasks?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all {tasks.length} tasks{allowOtherDays ? ' across all dates' : ''} (both completed and pending). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAllTasks} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {pendingTasks.length === 0 && completedTasks.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
              <ListTodo className="w-8 h-8 text-accent-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No tasks yet</h3>
            <p className="text-sm text-muted-foreground">
              {allowOtherDays ? `Add your first task for ${safeFormat(displayDate, 'MMM d')}` : 'Add your first task for today'}
            </p>
          </div>
        )}

        {pendingTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
            onUpdate={onUpdateTask}
          />
        ))}

        {completedTasks.length > 0 && pendingTasks.length > 0 && (
          <div className="border-t border-border my-4" />
        )}

        {completedTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
            onUpdate={onUpdateTask}
          />
        ))}
      </div>

      {/* Motivational Message */}
      {pendingTasks.length === 0 && completedTasks.length > 0 && (
        <div className="text-center py-8 glass-card">
          <span className="text-4xl mb-4 block">🎉</span>
          <h3 className="font-medium text-foreground mb-1">
            {isToday(displayDate) ? 'All done for today!' : `All done for ${safeFormat(displayDate, 'MMM d')}!`}
          </h3>
          <p className="text-sm text-muted-foreground">Great work! Take a well-deserved break.</p>
        </div>
      )}
    </div>
  );
}
