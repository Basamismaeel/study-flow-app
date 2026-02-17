import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Plan } from '@/types';

interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onSave: (planId: string, updates: { name?: string; totalDays?: number; tasksPerDay?: number }) => void;
}

export function EditPlanDialog({ open, onOpenChange, plan, onSave }: EditPlanDialogProps) {
  const [name, setName] = useState('');
  const [totalDays, setTotalDays] = useState(30);
  const [tasksPerDay, setTasksPerDay] = useState(5);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setTotalDays(plan.totalDays ?? 30);
      setTasksPerDay(plan.tasksPerDay ?? 5);
    }
  }, [plan]);

  const handleSave = () => {
    if (!plan) return;
    onSave(plan.id, {
      name: name.trim() || plan.name,
      totalDays: Math.max(1, totalDays),
      tasksPerDay: Math.max(1, tasksPerDay),
    });
    onOpenChange(false);
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="edit-plan-name">Plan name</Label>
            <Input
              id="edit-plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Videos"
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-total-days">Total days</Label>
              <Input
                id="edit-total-days"
                type="number"
                min={1}
                value={totalDays}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') return;
                  const n = parseInt(v, 10);
                  if (!isNaN(n)) setTotalDays(n);
                }}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v === '' || isNaN(parseInt(v, 10))) setTotalDays(1);
                  else setTotalDays(Math.max(1, totalDays));
                }}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="edit-tasks-per-day">Tasks per day</Label>
              <Input
                id="edit-tasks-per-day"
                type="number"
                min={1}
                value={tasksPerDay}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') return;
                  const n = parseInt(v, 10);
                  if (!isNaN(n)) setTasksPerDay(n);
                }}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v === '' || isNaN(parseInt(v, 10))) setTasksPerDay(1);
                  else setTasksPerDay(Math.max(1, tasksPerDay));
                }}
                className="mt-1.5"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
