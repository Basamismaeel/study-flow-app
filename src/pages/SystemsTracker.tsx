import { useState } from 'react';
import { MedicalSystem } from '@/types';
import { SystemCard } from '@/components/SystemCard';
import { AddSystemDialog } from '@/components/AddSystemDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Minus, Plus, Save, Trash2 } from 'lucide-react';

interface SystemsTrackerProps {
  systems: MedicalSystem[];
  onUpdateSystem: (id: string, updates: Partial<MedicalSystem>) => void;
  onAddSystem: (system: Omit<MedicalSystem, 'id'>) => void;
  onDeleteSystem: (id: string) => void;
}

export function SystemsTracker({ systems, onUpdateSystem, onAddSystem, onDeleteSystem }: SystemsTrackerProps) {
  const [selectedSystem, setSelectedSystem] = useState<MedicalSystem | null>(null);
  const [editValues, setEditValues] = useState({
    bootcampCompleted: 0,
    bootcampTotal: 0,
    qbankCompleted: 0,
    qbankTotal: 0,
  });

  const openEditDialog = (system: MedicalSystem) => {
    setSelectedSystem(system);
    setEditValues({
      bootcampCompleted: system.bootcamp.completed,
      bootcampTotal: system.bootcamp.total,
      qbankCompleted: system.qbank.completed,
      qbankTotal: system.qbank.total,
    });
  };

  const handleSave = () => {
    if (!selectedSystem) return;

    const bootcampTotal = Math.max(0, editValues.bootcampTotal);
    const qbankTotal = Math.max(0, editValues.qbankTotal);
    const bootcampCompleted = Math.min(editValues.bootcampCompleted, bootcampTotal);
    const qbankCompleted = Math.min(editValues.qbankCompleted, qbankTotal);

    let status: MedicalSystem['status'] = 'not-started';
    if (bootcampCompleted === bootcampTotal && qbankCompleted === qbankTotal) {
      status = 'completed';
    } else if (bootcampCompleted > 0 || qbankCompleted > 0) {
      status = 'in-progress';
    }

    onUpdateSystem(selectedSystem.id, {
      bootcamp: { completed: bootcampCompleted, total: bootcampTotal },
      qbank: { completed: qbankCompleted, total: qbankTotal },
      status,
    });

    setSelectedSystem(null);
  };

  const handleDelete = () => {
    if (!selectedSystem) return;
    onDeleteSystem(selectedSystem.id);
    setSelectedSystem(null);
  };

  const adjustValue = (field: 'bootcampCompleted' | 'qbankCompleted', delta: number) => {
    const max = field === 'bootcampCompleted' ? editValues.bootcampTotal : editValues.qbankTotal;
    setEditValues(prev => ({
      ...prev,
      [field]: Math.max(0, Math.min(max, prev[field] + delta)),
    }));
  };

  const completedSystems = systems.filter(s => s.status === 'completed');
  const inProgressSystems = systems.filter(s => s.status === 'in-progress');
  const notStartedSystems = systems.filter(s => s.status === 'not-started');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Systems Tracker</h1>
          <p className="text-muted-foreground">Track your progress by system</p>
        </div>
        <AddSystemDialog onAddSystem={onAddSystem} />
      </div>

      {completedSystems.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            Completed ({completedSystems.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedSystems.map(system => (
              <div key={system.id} onClick={() => openEditDialog(system)} className="cursor-pointer">
                <SystemCard system={system} />
              </div>
            ))}
          </div>
        </section>
      )}

      {inProgressSystems.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warning" />
            In Progress ({inProgressSystems.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressSystems.map(system => (
              <div key={system.id} onClick={() => openEditDialog(system)} className="cursor-pointer">
                <SystemCard system={system} />
              </div>
            ))}
          </div>
        </section>
      )}

      {notStartedSystems.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            Not Started ({notStartedSystems.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notStartedSystems.map(system => (
              <div key={system.id} onClick={() => openEditDialog(system)} className="cursor-pointer">
                <SystemCard system={system} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!selectedSystem} onOpenChange={(open) => !open && setSelectedSystem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-2xl">{selectedSystem?.icon}</span>
              {selectedSystem?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Number of videos (bootcamp total) */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Number of videos (total)
              </label>
              <Input
                type="number"
                value={editValues.bootcampTotal}
                onChange={(e) => {
                  const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setEditValues(prev => ({
                    ...prev,
                    bootcampTotal: v,
                    bootcampCompleted: Math.min(prev.bootcampCompleted, v),
                  }));
                }}
                className="text-center text-lg font-medium"
                min={0}
              />
            </div>

            {/* Bootcamp Videos Completed */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Bootcamp videos completed
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustValue('bootcampCompleted', -1)}
                  disabled={editValues.bootcampCompleted <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={editValues.bootcampCompleted}
                  onChange={(e) => setEditValues(prev => ({
                    ...prev,
                    bootcampCompleted: Math.max(0, Math.min(editValues.bootcampTotal, parseInt(e.target.value, 10) || 0))
                  }))}
                  className="text-center text-lg font-medium"
                  min={0}
                  max={editValues.bootcampTotal}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustValue('bootcampCompleted', 1)}
                  disabled={editValues.bootcampCompleted >= editValues.bootcampTotal}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  / {editValues.bootcampTotal}
                </span>
              </div>
            </div>

            {/* Number of questions (qbank total) */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Number of questions (total)
              </label>
              <Input
                type="number"
                value={editValues.qbankTotal}
                onChange={(e) => {
                  const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setEditValues(prev => ({
                    ...prev,
                    qbankTotal: v,
                    qbankCompleted: Math.min(prev.qbankCompleted, v),
                  }));
                }}
                className="text-center text-lg font-medium"
                min={0}
              />
            </div>

            {/* QBank Questions Completed */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                QBank questions completed
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustValue('qbankCompleted', -10)}
                  disabled={editValues.qbankCompleted <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={editValues.qbankCompleted}
                  onChange={(e) => setEditValues(prev => ({
                    ...prev,
                    qbankCompleted: Math.max(0, Math.min(editValues.qbankTotal, parseInt(e.target.value, 10) || 0))
                  }))}
                  className="text-center text-lg font-medium"
                  min={0}
                  max={editValues.qbankTotal}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustValue('qbankCompleted', 10)}
                  disabled={editValues.qbankCompleted >= editValues.qbankTotal}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  / {editValues.qbankTotal}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Use +/- buttons to adjust by 10</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Progress
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
