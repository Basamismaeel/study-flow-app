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
import { Plus, Trash2 } from 'lucide-react';
import { Subject, SubjectTrackingItem, subjectStatus } from '@/types';

const ICON_OPTIONS = [
  '📚', '📖', '📐', '🔬', '💼', '⚖️', '🎯', '📊', '🧮', '📝',
  '🏛️', '🌐', '💻', '🔧', '📈', '🎓', '✏️', '📋', '🗂️', '📌',
];

interface AddSubjectDialogProps {
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
}

function newTrackingItem(): SubjectTrackingItem {
  return {
    id: crypto.randomUUID(),
    label: '',
    completed: 0,
    total: 0,
  };
}

export function AddSubjectDialog({ onAddSubject }: AddSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📚');
  const [tracking, setTracking] = useState<SubjectTrackingItem[]>([]);

  const addTrackingItem = () => {
    setTracking((prev) => [...prev, newTrackingItem()]);
  };

  const removeTrackingItem = (id: string) => {
    setTracking((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTrackingItem = (
    id: string,
    updates: Partial<SubjectTrackingItem>
  ) => {
    setTracking((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const items = tracking
      .filter((t) => t.label.trim())
      .map((t) => ({ ...t, total: Math.max(0, t.total), completed: Math.min(Math.max(0, t.completed), Math.max(0, t.total)) }));
    const status = subjectStatus(items);

    onAddSubject({
      name: name.trim(),
      icon,
      tracking: items,
      status,
    });

    setName('');
    setIcon('📚');
    setTracking([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Subject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Subject</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject-name">Subject Name</Label>
            <Input
              id="subject-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Calculus, Marketing"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                    icon === emoji
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tracking (customize labels, e.g. Videos, Chapters)</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addTrackingItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {tracking.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Optional: add tracking items (e.g. &quot;Videos&quot; 0/45) to track progress. You can add more later.
              </p>
            ) : (
              <div className="space-y-3">
                {tracking.map((t) => (
                  <div key={t.id} className="flex gap-2 items-center">
                    <Input
                      value={t.label}
                      onChange={(e) => updateTrackingItem(t.id, { label: e.target.value })}
                      placeholder="Label (e.g. Videos)"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={t.total || ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') {
                          updateTrackingItem(t.id, { total: 0 });
                          return;
                        }
                        const n = parseInt(v, 10);
                        if (!isNaN(n)) updateTrackingItem(t.id, { total: Math.max(0, n) });
                      }}
                      placeholder="Total"
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTrackingItem(t.id)}
                      className="text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
