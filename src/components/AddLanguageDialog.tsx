import { useState } from 'react';
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
import { createNewLanguagePlan } from '@/lib/languageLogic';
import type { LanguagePlan } from '@/types';

interface AddLanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (plan: LanguagePlan) => void;
}

export function AddLanguageDialog({ open, onOpenChange, onAdd }: AddLanguageDialogProps) {
  const [name, setName] = useState('');
  const [levelName, setLevelName] = useState('A2');
  const [totalWeeks, setTotalWeeks] = useState(10);

  const reset = () => {
    setName('');
    setLevelName('A2');
    setTotalWeeks(10);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const plan = createNewLanguagePlan(trimmed, levelName, Math.max(1, Math.min(52, totalWeeks)));
    onAdd(plan);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add language</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="lang-name">Language name</Label>
            <Input
              id="lang-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. German, Spanish"
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lang-level">Level</Label>
              <Input
                id="lang-level"
                value={levelName}
                onChange={(e) => setLevelName(e.target.value)}
                placeholder="e.g. A1, A2, B1"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="lang-weeks">Weeks</Label>
              <Input
                id="lang-weeks"
                type="number"
                min={1}
                max={52}
                value={totalWeeks}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    return;
                  }
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    setTotalWeeks(num);
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  if (val === '' || isNaN(parseInt(val, 10))) {
                    setTotalWeeks(10);
                    e.target.value = '10';
                  } else {
                    const num = parseInt(val, 10);
                    setTotalWeeks(Math.max(1, Math.min(52, num)));
                    e.target.value = Math.max(1, Math.min(52, num)).toString();
                  }
                }}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
