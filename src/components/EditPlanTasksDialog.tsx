import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Plan, PlannerTask } from '@/types';
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditPlanTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onAddTask: (planId: string, name: string) => void;
  onAddTasks: (planId: string, names: string[]) => void;
  onUpdateTask: (planId: string, taskId: string, name: string) => void;
  onDeleteTask: (planId: string, taskId: string) => void;
  onReorderTasks: (planId: string, tasks: PlannerTask[]) => void;
}

export function EditPlanTasksDialog({
  open,
  onOpenChange,
  plan,
  onAddTask,
  onAddTasks,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
}: EditPlanTasksDialogProps) {
  const [newTaskName, setNewTaskName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTaskName.trim();
    if (!name || !plan) return;
    onAddTask(plan.id, name);
    setNewTaskName('');
  };

  const handleAddMultiple = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    const lines = bulkText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    onAddTasks(plan.id, lines);
    setBulkText('');
  };

  const startEdit = (task: PlannerTask) => {
    setEditingId(task.id);
    setEditValue(task.name);
  };

  const saveEdit = (taskId: string) => {
    if (!plan) return;
    const name = editValue.trim();
    if (name) onUpdateTask(plan.id, taskId, name);
    setEditingId(null);
    setEditValue('');
  };

  const handleDelete = (taskId: string) => {
    if (!plan) return;
    onDeleteTask(plan.id, taskId);
    if (editingId === taskId) setEditingId(null);
  };

  const moveUp = (index: number) => {
    if (!plan || index <= 0) return;
    const tasks = [...plan.tasks];
    [tasks[index - 1], tasks[index]] = [tasks[index], tasks[index - 1]];
    onReorderTasks(plan.id, tasks);
  };

  const moveDown = (index: number) => {
    if (!plan || index >= plan.tasks.length - 1) return;
    const tasks = [...plan.tasks];
    [tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]];
    onReorderTasks(plan.id, tasks);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index) {
      setDragOverIndex(null);
      return;
    }
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Don't clear dragOverIndex if we're moving to a child element
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return;
    }
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceIndex = draggedIndex;
    if (!plan || sourceIndex === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    if (sourceIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    // Create new array with reordered tasks
    const tasks = [...plan.tasks];
    const [removed] = tasks.splice(sourceIndex, 1);
    tasks.splice(dropIndex, 0, removed);
    // Update parent state
    onReorderTasks(plan.id, tasks);
    // Clear drag state
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (!plan) return null;

  const tasks = plan.tasks;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit task list — {plan.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Add, edit, remove, or reorder videos/tasks. Order is preserved.
        </p>

        <ul
          className="space-y-2 max-h-[280px] overflow-y-auto pr-1"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {tasks.map((task, index) => (
            <li
              key={task.id}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={cn(
                'flex items-center gap-1 p-2 rounded-lg border transition-all select-none',
                draggedIndex === index
                  ? 'opacity-50 border-primary bg-primary/10'
                  : dragOverIndex === index
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-border/50 bg-muted/30'
              )}
            >
              <div
                className="flex items-center gap-1 shrink-0 cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveUp(index);
                    }}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveDown(index);
                    }}
                    disabled={index === tasks.length - 1}
                    aria-label="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <span className="text-xs text-muted-foreground w-5 shrink-0 text-center">
                {index + 1}
              </span>
              {editingId === task.id ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(task.id);
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditValue('');
                      }
                    }}
                    className="flex-1 h-9 min-w-0"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveEdit(task.id);
                    }}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <span
                    className="flex-1 text-sm font-medium truncate cursor-pointer py-1 min-w-0"
                    onClick={(e) => {
                      if (draggedIndex === null) startEdit(task);
                    }}
                  >
                    {task.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(task);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(task.id);
                    }}
                    aria-label={`Delete ${task.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
          {tasks.length === 0 && (
            <li className="text-sm text-muted-foreground py-4 text-center">
              No tasks yet. Add one below or paste multiple.
            </li>
          )}
        </ul>

        {/* Add one */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="New video or task name"
            className="flex-1"
          />
          <Button type="submit" disabled={!newTaskName.trim()}>
            <Plus className="w-4 h-4 mr-1" />
            Add one
          </Button>
        </form>

        {/* Add multiple */}
        <div className="space-y-2 pt-2 border-t">
          <label className="text-sm font-medium text-foreground">
            Add multiple (one per line)
          </label>
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'Video 1\nVideo 2\nVideo 3\n...'}
            rows={4}
            className="resize-y font-mono text-sm"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddMultiple}
            disabled={!bulkText.trim()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add all ({bulkText.split(/\r?\n/).filter((s) => s.trim()).length} items)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
