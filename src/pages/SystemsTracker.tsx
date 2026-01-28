import { useState } from 'react';
import { MedicalSystem } from '@/types';
import { SystemCard } from '@/components/SystemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Minus, Plus, Save } from 'lucide-react';

interface SystemsTrackerProps {
  systems: MedicalSystem[];
  onUpdateSystem: (id: string, updates: Partial<MedicalSystem>) => void;
}

export function SystemsTracker({ systems, onUpdateSystem }: SystemsTrackerProps) {
  const [selectedSystem, setSelectedSystem] = useState<MedicalSystem | null>(null);
  const [editValues, setEditValues] = useState({
    bootcampCompleted: 0,
    qbankCompleted: 0,
  });

  const openEditDialog = (system: MedicalSystem) => {
    setSelectedSystem(system);
    setEditValues({
      bootcampCompleted: system.bootcamp.completed,
      qbankCompleted: system.qbank.completed,
    });
  };

  const handleSave = () => {
    if (!selectedSystem) return;

    const bootcampCompleted = Math.min(editValues.bootcampCompleted, selectedSystem.bootcamp.total);
    const qbankCompleted = Math.min(editValues.qbankCompleted, selectedSystem.qbank.total);
    
    let status: MedicalSystem['status'] = 'not-started';
    if (bootcampCompleted === selectedSystem.bootcamp.total && qbankCompleted === selectedSystem.qbank.total) {
      status = 'completed';
    } else if (bootcampCompleted > 0 || qbankCompleted > 0) {
      status = 'in-progress';
    }

    onUpdateSystem(selectedSystem.id, {
      bootcamp: { ...selectedSystem.bootcamp, completed: bootcampCompleted },
      qbank: { ...selectedSystem.qbank, completed: qbankCompleted },
      status,
    });

    setSelectedSystem(null);
  };

  const adjustValue = (field: 'bootcampCompleted' | 'qbankCompleted', delta: number) => {
    if (!selectedSystem) return;
    const max = field === 'bootcampCompleted' ? selectedSystem.bootcamp.total : selectedSystem.qbank.total;
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
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Systems Tracker</h1>
        <p className="text-muted-foreground">Track your progress by system</p>
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
            {/* Bootcamp Videos */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Bootcamp Videos Completed
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
                    bootcampCompleted: Math.max(0, Math.min(selectedSystem?.bootcamp.total || 0, parseInt(e.target.value) || 0))
                  }))}
                  className="text-center text-lg font-medium"
                  min={0}
                  max={selectedSystem?.bootcamp.total}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustValue('bootcampCompleted', 1)}
                  disabled={editValues.bootcampCompleted >= (selectedSystem?.bootcamp.total || 0)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  / {selectedSystem?.bootcamp.total}
                </span>
              </div>
            </div>

            {/* QBank Questions */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                QBank Questions Completed
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
                    qbankCompleted: Math.max(0, Math.min(selectedSystem?.qbank.total || 0, parseInt(e.target.value) || 0))
                  }))}
                  className="text-center text-lg font-medium"
                  min={0}
                  max={selectedSystem?.qbank.total}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustValue('qbankCompleted', 10)}
                  disabled={editValues.qbankCompleted >= (selectedSystem?.qbank.total || 0)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  / {selectedSystem?.qbank.total}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Use +/- buttons to adjust by 10</p>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Progress
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
