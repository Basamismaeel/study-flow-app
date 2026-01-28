import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Plan, PlannerTask } from '@/types';

const DEFAULT_TASKS_PER_DAY = 5;

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPlan: (plan: Omit<Plan, 'id'>) => void;
}

export function CreatePlanDialog({ open, onOpenChange, onAddPlan }: CreatePlanDialogProps) {
  const [name, setName] = useState('');
  const [totalDays, setTotalDays] = useState(30);
  const [tasksPerDay, setTasksPerDay] = useState(DEFAULT_TASKS_PER_DAY);
  const [taskListText, setTaskListText] = useState('');

  const reset = () => {
    setName('');
    setTotalDays(30);
    setTasksPerDay(DEFAULT_TASKS_PER_DAY);
    setTaskListText('');
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const lines = taskListText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const tasks: PlannerTask[] = lines.map((name) => ({
      id: crypto.randomUUID(),
      name,
      completed: false,
    }));

    onAddPlan({
      name: trimmedName,
      totalDays: Math.max(1, totalDays),
      tasksPerDay: Math.max(1, tasksPerDay),
      tasks,
    });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="plan-name">Plan name</Label>
            <Input
              id="plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bootcamp Videos"
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total-days">Total days</Label>
              <Input
                id="total-days"
                type="number"
                min={1}
                value={totalDays}
                onChange={(e) => setTotalDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="tasks-per-day">Tasks per day</Label>
              <Input
                id="tasks-per-day"
                type="number"
                min={1}
                value={tasksPerDay}
                onChange={(e) => setTasksPerDay(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="task-list">Task list (one per line)</Label>
            <Textarea
              id="task-list"
              value={taskListText}
              onChange={(e) => setTaskListText(e.target.value)}
              placeholder={'Video 1\nVideo 2\nVideo 3\n...'}
              rows={8}
              className="mt-1.5 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Order matters. Tasks are assigned to days in this order.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
