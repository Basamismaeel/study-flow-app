import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Subject, GenericTask } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskItem } from '@/components/TaskItem';
import { Plus, CheckCircle2, ListTodo, ArrowLeft } from 'lucide-react';

interface SubjectDetailPageProps {
  subjects: Subject[];
  subjectTasks: GenericTask[];
  onAddTask: (subjectId: string, title: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export function SubjectDetailPage({
  subjects,
  subjectTasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: SubjectDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const subject = subjects.find((s) => s.id === id);
  const tasks = subject ? subjectTasks.filter((t) => t.subjectId === subject.id) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject && newTaskTitle.trim()) {
      onAddTask(subject.id, newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  if (!subject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <p className="text-muted-foreground">Subject not found.</p>
        <Link to="/subjects">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to subjects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/subjects">
          <Button variant="ghost" size="icon" aria-label="Back to subjects">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">{subject.name}</h1>
          <p className="text-muted-foreground">Tasks for this subject</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a task (e.g. Watch lectures, Solve problem set)"
          className="flex-1 h-12 text-base"
        />
        <Button type="submit" size="lg" disabled={!newTaskTitle.trim()}>
          <Plus className="w-5 h-5" />
        </Button>
      </form>

      {tasks.length > 0 && (
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <ListTodo className="w-4 h-4" />
            {pendingTasks.length} remaining
          </span>
          <span className="flex items-center gap-2 text-success">
            <CheckCircle2 className="w-4 h-4" />
            {completedTasks.length} completed
          </span>
        </div>
      )}

      <div className="space-y-3">
        {pendingTasks.length === 0 && completedTasks.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground">No tasks yet. Add your first task above.</p>
          </div>
        )}

        {pendingTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={{ id: task.id, text: task.title, completed: task.completed, createdAt: new Date() }}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
          />
        ))}

        {completedTasks.length > 0 && pendingTasks.length > 0 && (
          <div className="border-t border-border my-4" />
        )}

        {completedTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={{ id: task.id, text: task.title, completed: task.completed, createdAt: new Date() }}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
          />
        ))}
      </div>
    </div>
  );
}
