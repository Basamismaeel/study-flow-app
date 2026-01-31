import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Subject, CourseDailyCompletion } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ArrowLeft, Trash2 } from 'lucide-react';
import { safeFormat, safeParseDate, safeToDateString } from '@/lib/dateUtils';

interface SubjectDetailPageProps {
  subjects: Subject[];
  courseDailyCompletions: CourseDailyCompletion[];
  onAddCourseDailyTask: (courseId: string, text: string) => void;
  onRemoveCourseDailyTask: (courseId: string, taskId: string) => void;
  onToggleCourseDailyCompletion: (taskId: string, date: string, completed: boolean) => void;
  getCourseDailyCompletion: (taskId: string, date: string) => boolean;
}

export function SubjectDetailPage({
  subjects,
  courseDailyCompletions,
  onAddCourseDailyTask,
  onRemoveCourseDailyTask,
  onToggleCourseDailyCompletion,
  getCourseDailyCompletion,
}: SubjectDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const [newTaskText, setNewTaskText] = useState('');

  const subject = subjects.find((s) => s.id === id);
  const dailyTasks = subject?.dailyTasks ?? [];
  const todayStr = safeToDateString(new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject && newTaskText.trim()) {
      onAddCourseDailyTask(subject.id, newTaskText.trim());
      setNewTaskText('');
    }
  };

  if (!subject) {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        <p className="text-muted-foreground">Course not found.</p>
        <Link to="/subjects">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to courses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/subjects">
          <Button variant="ghost" size="icon" aria-label="Back to courses" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-2xl">
          {subject.icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground truncate">{subject.name}</h1>
          <p className="text-sm text-muted-foreground">Daily tasks</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add task (e.g. Watch 2 lectures)"
          className="h-11 flex-1"
        />
        <Button type="submit" size="sm" disabled={!newTaskText.trim()} className="h-11 px-5">
          <Plus className="w-4 h-4" />
        </Button>
      </form>

      <div>
        {dailyTasks.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/10 py-12 px-6 text-center">
            <p className="text-muted-foreground text-sm">No daily tasks yet</p>
            <p className="text-muted-foreground/80 text-xs mt-1">Add tasks above — check them off each day</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground mb-3">
              {safeFormat(safeParseDate(todayStr), 'EEEE, MMM d')}
            </p>
            {dailyTasks.map((task) => {
              const completed = getCourseDailyCompletion(task.id, todayStr);
              return (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <Checkbox
                    checked={completed}
                    onCheckedChange={(checked) =>
                      onToggleCourseDailyCompletion(task.id, todayStr, !!checked)
                    }
                    className="h-5 w-5 shrink-0"
                  />
                  <span className={`flex-1 text-sm ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.text}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    onClick={() => onRemoveCourseDailyTask(subject.id, task.id)}
                    aria-label={`Remove ${task.text}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
