import { useState } from 'react';
import { DailyTask } from '@/types';
import { TaskItem } from '@/components/TaskItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2, ListTodo, Trash2 } from 'lucide-react';
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

interface DailyTasksProps {
  tasks: DailyTask[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask?: (id: string, text: string) => void;
  onClearAllTasks: () => void;
}

export function DailyTasks({ tasks, onAddTask, onToggleTask, onDeleteTask, onUpdateTask, onClearAllTasks }: DailyTasksProps) {
  const [newTask, setNewTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAddTask(newTask.trim());
      setNewTask('');
    }
  };

  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground mb-2">Daily Tasks</h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a task for today..."
          className="flex-1 h-12 text-base"
        />
        <Button type="submit" size="lg" disabled={!newTask.trim()}>
          <Plus className="w-5 h-5" />
        </Button>
      </form>

      {/* Progress Summary */}
      {tasks.length > 0 && (
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
                  This will delete all {tasks.length} tasks (both completed and pending). This action cannot be undone.
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
            <p className="text-sm text-muted-foreground">Add your first task for today</p>
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
          <h3 className="font-medium text-foreground mb-1">All done for today!</h3>
          <p className="text-sm text-muted-foreground">Great work! Take a well-deserved break.</p>
        </div>
      )}
    </div>
  );
}
