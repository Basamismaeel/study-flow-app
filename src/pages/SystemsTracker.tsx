import { useState } from 'react';
import { MedicalSystem } from '@/types';
import { SystemCard } from '@/components/SystemCard';
import { AddSystemDialog } from '@/components/AddSystemDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [includeBootcamp, setIncludeBootcamp] = useState(true);
  const [includeQbank, setIncludeQbank] = useState(true);

  const openEditDialog = (system: MedicalSystem) => {
    setSelectedSystem(system);
    const hasBootcamp = system.bootcamp.total > 0;
    const hasQbank = system.qbank.total > 0;
    setIncludeBootcamp(hasBootcamp);
    setIncludeQbank(hasQbank);
    setEditValues({
      bootcampCompleted: system.bootcamp.completed,
      bootcampTotal: system.bootcamp.total,
      qbankCompleted: system.qbank.completed,
      qbankTotal: system.qbank.total,
    });
  };

  const handleSave = () => {
    if (!selectedSystem) return;
    if (!includeBootcamp && !includeQbank) {
      alert('Please select at least one content type (Bootcamp Videos or QBank Questions)');
      return;
    }

    const bootcampTotal = includeBootcamp ? Math.max(0, editValues.bootcampTotal) : 0;
    const qbankTotal = includeQbank ? Math.max(0, editValues.qbankTotal) : 0;
    const bootcampCompleted = includeBootcamp ? Math.min(editValues.bootcampCompleted, bootcampTotal) : 0;
    const qbankCompleted = includeQbank ? Math.min(editValues.qbankCompleted, qbankTotal) : 0;

    // Calculate status based on enabled fields only
    let status: MedicalSystem['status'] = 'not-started';
    const bootcampComplete = !includeBootcamp || (bootcampCompleted === bootcampTotal && bootcampTotal > 0);
    const qbankComplete = !includeQbank || (qbankCompleted === qbankTotal && qbankTotal > 0);
    
    if (bootcampComplete && qbankComplete) {
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
            {/* Content Type Selection */}
            <div className="space-y-3">
              <Label>Content Types</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-include-bootcamp"
                    checked={includeBootcamp}
                    onCheckedChange={(checked) => {
                      setIncludeBootcamp(!!checked);
                      if (!checked) {
                        setEditValues(prev => ({
                          ...prev,
                          bootcampTotal: 0,
                          bootcampCompleted: 0,
                        }));
                      }
                    }}
                  />
                  <Label htmlFor="edit-include-bootcamp" className="cursor-pointer">
                    Include Bootcamp Videos
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-include-qbank"
                    checked={includeQbank}
                    onCheckedChange={(checked) => {
                      setIncludeQbank(!!checked);
                      if (!checked) {
                        setEditValues(prev => ({
                          ...prev,
                          qbankTotal: 0,
                          qbankCompleted: 0,
                        }));
                      }
                    }}
                  />
                  <Label htmlFor="edit-include-qbank" className="cursor-pointer">
                    Include QBank Questions
                  </Label>
                </div>
              </div>
            </div>

            {/* Number of videos (bootcamp total) */}
            {includeBootcamp && (
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Number of videos (total)
                </label>
              <Input
                type="number"
                value={editValues.bootcampTotal}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    return;
                  }
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    const v = Math.max(0, num);
                    setEditValues(prev => ({
                      ...prev,
                      bootcampTotal: v,
                      bootcampCompleted: Math.min(prev.bootcampCompleted, v),
                    }));
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  if (val === '' || isNaN(parseInt(val, 10))) {
                    const v = editValues.bootcampTotal || 0;
                    setEditValues(prev => ({
                      ...prev,
                      bootcampTotal: v,
                      bootcampCompleted: Math.min(prev.bootcampCompleted, v),
                    }));
                    e.target.value = v.toString();
                  } else {
                    const v = Math.max(0, parseInt(val, 10));
                    setEditValues(prev => ({
                      ...prev,
                      bootcampTotal: v,
                      bootcampCompleted: Math.min(prev.bootcampCompleted, v),
                    }));
                    e.target.value = v.toString();
                  }
                }}
                className="text-center text-lg font-medium"
                min={0}
              />
              </div>
            )}

            {/* Bootcamp Videos Completed */}
            {includeBootcamp && (
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
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      return;
                    }
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      setEditValues(prev => ({
                        ...prev,
                        bootcampCompleted: Math.max(0, Math.min(prev.bootcampTotal, num))
                      }));
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val === '' || isNaN(parseInt(val, 10))) {
                      const v = editValues.bootcampCompleted || 0;
                      setEditValues(prev => ({
                        ...prev,
                        bootcampCompleted: v
                      }));
                      e.target.value = v.toString();
                    } else {
                      const v = Math.max(0, Math.min(editValues.bootcampTotal, parseInt(val, 10)));
                      setEditValues(prev => ({
                        ...prev,
                        bootcampCompleted: v
                      }));
                      e.target.value = v.toString();
                    }
                  }}
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
            )}

            {/* Number of questions (qbank total) */}
            {includeQbank && (
              <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Number of questions (total)
              </label>
              <Input
                type="number"
                value={editValues.qbankTotal}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    return;
                  }
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    const v = Math.max(0, num);
                    setEditValues(prev => ({
                      ...prev,
                      qbankTotal: v,
                      qbankCompleted: Math.min(prev.qbankCompleted, v),
                    }));
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  if (val === '' || isNaN(parseInt(val, 10))) {
                    const v = editValues.qbankTotal || 0;
                    setEditValues(prev => ({
                      ...prev,
                      qbankTotal: v,
                      qbankCompleted: Math.min(prev.qbankCompleted, v),
                    }));
                    e.target.value = v.toString();
                  } else {
                    const v = Math.max(0, parseInt(val, 10));
                    setEditValues(prev => ({
                      ...prev,
                      qbankTotal: v,
                      qbankCompleted: Math.min(prev.qbankCompleted, v),
                    }));
                    e.target.value = v.toString();
                  }
                }}
                className="text-center text-lg font-medium"
                min={0}
              />
              </div>
            )}

            {/* QBank Questions Completed */}
            {includeQbank && (
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
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      return;
                    }
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      setEditValues(prev => ({
                        ...prev,
                        qbankCompleted: Math.max(0, Math.min(prev.qbankTotal, num))
                      }));
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val === '' || isNaN(parseInt(val, 10))) {
                      const v = editValues.qbankCompleted || 0;
                      setEditValues(prev => ({
                        ...prev,
                        qbankCompleted: v
                      }));
                      e.target.value = v.toString();
                    } else {
                      const v = Math.max(0, Math.min(editValues.qbankTotal, parseInt(val, 10)));
                      setEditValues(prev => ({
                        ...prev,
                        qbankCompleted: v
                      }));
                      e.target.value = v.toString();
                    }
                  }}
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
            )}
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
