import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconPicker } from '@/components/IconPicker';
import { Plus } from 'lucide-react';
import { Subject } from '@/types';

const ICON_OPTIONS = [
  '📚', '📖', '📐', '🔬', '💼', '⚖️', '🎯', '📊', '🧮', '📝',
  '🏛️', '🌐', '💻', '🔧', '📈', '🎓', '✏️', '📋', '🗂️', '📌',
];

interface AddCourseDialogProps {
  onAddCourse: (course: Omit<Subject, 'id'>) => void;
}

export function AddCourseDialog({ onAddCourse }: AddCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📚');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCourse({
      name: name.trim(),
      icon,
      tracking: [],
      status: 'not-started',
    });

    setName('');
    setIcon('📚');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Add course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">New course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          <div className="space-y-2">
            <Label htmlFor="course-name">Course name</Label>
            <Input
              id="course-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Calculus, Psychology"
              className="h-11"
              autoFocus
            />
          </div>

          <IconPicker
            label="Icon"
            value={icon}
            onChange={setIcon}
            options={ICON_OPTIONS}
            size="md"
          />

          <Button type="submit" className="w-full h-11">
            Add course
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
