import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { MedicalSystem } from '@/types';

const EMOJI_OPTIONS = ['📚', '🔬', '💊', '🩺', '🧫', '📖', '🎯', '⚕️', '🏥', '💉'];

interface AddSystemDialogProps {
  onAddSystem: (system: Omit<MedicalSystem, 'id'>) => void;
}

export function AddSystemDialog({ onAddSystem }: AddSystemDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📚');
  const [bootcampTotal, setBootcampTotal] = useState(30);
  const [qbankTotal, setQbankTotal] = useState(200);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddSystem({
      name: name.trim(),
      icon,
      bootcamp: { completed: 0, total: bootcampTotal },
      qbank: { completed: 0, total: qbankTotal },
      status: 'not-started',
    });

    // Reset form
    setName('');
    setIcon('📚');
    setBootcampTotal(30);
    setQbankTotal(200);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Add System
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New System</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">System Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dermatology"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bootcamp">Bootcamp Videos Total</Label>
              <Input
                id="bootcamp"
                type="number"
                value={bootcampTotal}
                onChange={(e) => setBootcampTotal(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qbank">QBank Questions Total</Label>
              <Input
                id="qbank"
                type="number"
                value={qbankTotal}
                onChange={(e) => setQbankTotal(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add System
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
