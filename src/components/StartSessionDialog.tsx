import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SubjectOption {
  id: string;
  name: string;
}

export interface TaskOption {
  id: string;
  label: string;
  /** When set, task is only shown when this subject is selected. */
  subjectId?: string;
}

export interface StartSessionPayload {
  subjectId: string | null;
  subjectName: string | null;
  taskId: string | null;
  taskLabel: string | null;
}

interface StartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: SubjectOption[];
  tasks: TaskOption[];
  onStart: (payload: StartSessionPayload) => void;
}

export function StartSessionDialog({
  open,
  onOpenChange,
  subjects,
  tasks,
  onStart,
}: StartSessionDialogProps) {
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  const tasksForSubject = subjectId
    ? tasks.filter((t) => !t.subjectId || t.subjectId === subjectId)
    : tasks.filter((t) => !t.subjectId);

  const handleStart = () => {
    const subject = subjectId ? subjects.find((s) => s.id === subjectId) : null;
    const task = taskId ? tasksForSubject.find((t) => t.id === taskId) : null;
    onStart({
      subjectId: subject?.id ?? null,
      subjectName: subject?.name ?? null,
      taskId: task?.id ?? null,
      taskLabel: task?.label ?? null,
    });
    setSubjectId(null);
    setTaskId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Study Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Subject (optional)</Label>
            <Select
              value={subjectId ?? 'none'}
              onValueChange={(v) => {
                const next = v === 'none' ? null : v;
                setSubjectId(next);
                setTaskId(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Task (optional)</Label>
            <Select
              value={taskId ?? 'none'}
              onValueChange={(v) => setTaskId(v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={tasksForSubject.length ? 'Choose task' : (subjectId ? 'No tasks for this system' : 'Select a system first')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {tasksForSubject.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStart}>Start session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
