import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { MedicalSystem } from '@/types';

const EMOJI_OPTIONS = [
  // General Medical
  '🩺', '⚕️', '🏥', '💊', '💉', '🔬', '🧪', '🧫',
  // Body Systems
  '❤️', '💓', '🧠', '🫁', '💧', '🫘', '🦴', '💪', '🩸',
  // Organs & Body Parts
  '👁️', '👂', '👃', '👄', '🦷', '👅', '🧬',
  // Medical Concepts
  '🛡️', '🦠', '🧴', '📋', '📊', '🎯', '🔍', '💡',
  // Additional Medical
  '🚑', '⛑️', '🎗️', '🧘', '🌡️', '💨', '🔬', '🧩'
];

interface AddSystemDialogProps {
  onAddSystem: (system: Omit<MedicalSystem, 'id'>) => void;
}

export function AddSystemDialog({ onAddSystem }: AddSystemDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📚');
  const [includeBootcamp, setIncludeBootcamp] = useState(true);
  const [includeQbank, setIncludeQbank] = useState(true);
  const [bootcampTotal, setBootcampTotal] = useState(30);
  const [qbankTotal, setQbankTotal] = useState(200);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!includeBootcamp && !includeQbank) {
      alert('Please select at least one content type (Videos or QBank Questions)');
      return;
    }

    onAddSystem({
      name: name.trim(),
      icon,
      bootcamp: { completed: 0, total: includeBootcamp ? bootcampTotal : 0 },
      qbank: { completed: 0, total: includeQbank ? qbankTotal : 0 },
      status: 'not-started',
    });

    // Reset form
    setName('');
    setIcon('📚');
    setIncludeBootcamp(true);
    setIncludeQbank(true);
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

          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Content Types</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-bootcamp"
                    checked={includeBootcamp}
                    onCheckedChange={(checked) => {
                      setIncludeBootcamp(!!checked);
                      if (!checked) {
                        setBootcampTotal(0);
                      } else {
                        setBootcampTotal(30);
                      }
                    }}
                  />
                  <Label htmlFor="include-bootcamp" className="cursor-pointer">
                    Include Videos
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-qbank"
                    checked={includeQbank}
                    onCheckedChange={(checked) => {
                      setIncludeQbank(!!checked);
                      if (!checked) {
                        setQbankTotal(0);
                      } else {
                        setQbankTotal(200);
                      }
                    }}
                  />
                  <Label htmlFor="include-qbank" className="cursor-pointer">
                    Include QBank Questions
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {includeBootcamp && (
                <div className="space-y-2">
                  <Label htmlFor="bootcamp">Videos Total</Label>
                  <Input
                    id="bootcamp"
                    type="number"
                    value={bootcampTotal}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        return;
                      }
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) {
                        setBootcampTotal(num);
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val === '' || isNaN(parseInt(val, 10))) {
                        setBootcampTotal(1);
                        e.target.value = '1';
                      } else {
                        const num = parseInt(val, 10);
                        setBootcampTotal(Math.max(1, num));
                        e.target.value = Math.max(1, num).toString();
                      }
                    }}
                    min={1}
                  />
                </div>
              )}
              {includeQbank && (
                <div className="space-y-2">
                  <Label htmlFor="qbank">QBank Questions Total</Label>
                  <Input
                    id="qbank"
                    type="number"
                    value={qbankTotal}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        return;
                      }
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) {
                        setQbankTotal(num);
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val === '' || isNaN(parseInt(val, 10))) {
                        setQbankTotal(1);
                        e.target.value = '1';
                      } else {
                        const num = parseInt(val, 10);
                        setQbankTotal(Math.max(1, num));
                        e.target.value = Math.max(1, num).toString();
                      }
                    }}
                    min={1}
                  />
                </div>
              )}
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
