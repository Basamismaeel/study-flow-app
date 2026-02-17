import { useState } from 'react';
import { Goal } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Target, CheckCircle2, Circle, Clock, Trash2, Edit2, Search } from 'lucide-react';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import { cn } from '@/lib/utils';
import { safeFormat, safeParseDate } from '@/lib/dateUtils';
import { toast } from 'sonner';

export function GoalsPage() {
  const [goals, setGoals] = useUserLocalStorage<Goal[]>('yearly-goals', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetYear: new Date().getFullYear(),
    status: 'not-started' as Goal['status'],
    goalType: 'short-term' as 'long-term' | 'short-term',
  });

  const currentYear = new Date().getFullYear();

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      targetYear: currentYear,
      status: 'not-started',
      goalType: 'short-term',
    });
    setEditingGoal(null);
  };

  const handleOpenDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        description: goal.description || '',
        targetYear: goal.targetYear,
        status: goal.status,
        goalType: goal.goalType ?? 'short-term',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingGoal) {
        const promise = setGoals((prev) =>
          prev.map((g) =>
            g.id === editingGoal.id
              ? {
                  ...g,
                  name: formData.name.trim(),
                  description: formData.description.trim() || undefined,
                  targetYear: formData.targetYear,
                  status: formData.status,
                  goalType: formData.goalType,
                  completedAt:
                    formData.status === 'completed' && g.status !== 'completed'
                      ? new Date()
                      : formData.status !== 'completed'
                      ? undefined
                      : g.completedAt,
                }
              : g
          )
        );
        if (typeof promise?.then === 'function') await promise;
      } else {
        const newGoal: Goal = {
          id: crypto.randomUUID(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          targetYear: formData.targetYear,
          status: formData.status,
          goalType: formData.goalType,
          createdAt: new Date(),
          completedAt: formData.status === 'completed' ? new Date() : undefined,
        };
        const promise = setGoals((prev) => [...prev, newGoal]);
        if (typeof promise?.then === 'function') await promise;
      }
      handleCloseDialog();
      toast.success(editingGoal ? 'Goal updated' : 'Goal created');
    } catch (e) {
      console.error('Failed to save goal:', e);
      toast.error('Failed to save. Check your connection and try again.');
    }
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    setGoals((prev) => prev.filter((g) => g.id !== deleteTargetId));
    setDeleteTargetId(null);
  };

  const handleStatusChange = (goalId: string, newStatus: Goal['status']) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              status: newStatus,
              completedAt: newStatus === 'completed' ? new Date() : undefined,
            }
          : g
      )
    );
  };

  const getStatusIcon = (status: Goal['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-500/50 bg-green-500/10';
      case 'in-progress':
        return 'border-blue-500/50 bg-blue-500/10';
      default:
        return 'border-muted bg-card';
    }
  };

  const sortedGoals = [...goals].sort((a, b) => {
    // Sort by status: completed last, then by target year
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return b.targetYear - a.targetYear;
  });

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredGoals = searchLower
    ? sortedGoals.filter(
        (g) =>
          g.name.toLowerCase().includes(searchLower) ||
          (g.description ?? '').toLowerCase().includes(searchLower)
      )
    : sortedGoals;

  const longTerm = filteredGoals.filter((g) => (g.goalType ?? 'short-term') === 'long-term');
  const shortTerm = filteredGoals.filter((g) => (g.goalType ?? 'short-term') === 'short-term');
  const currentGoals = filteredGoals.filter((g) => g.status !== 'completed');
  const completedGoals = filteredGoals.filter((g) => g.status === 'completed');
  const longTermActive = longTerm.filter((g) => g.status !== 'completed');
  const longTermCompleted = longTerm.filter((g) => g.status === 'completed');
  const shortTermActive = shortTerm.filter((g) => g.status !== 'completed');
  const shortTermCompleted = shortTerm.filter((g) => g.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2 flex items-center gap-2">
            <Target className="w-8 h-8 text-primary" />
            Goals
          </h1>
          <p className="text-muted-foreground">Track yearly goals and mark progress.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
              <DialogDescription>
                {editingGoal
                  ? 'Update your goal details below.'
                  : 'Create a new yearly goal to track your progress.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Goal Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Complete USMLE Step 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add more details about this goal..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetYear">Target Year</Label>
                <Input
                  id="targetYear"
                  type="number"
                  value={formData.targetYear}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      return;
                    }
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      setFormData({ ...formData, targetYear: num });
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val === '' || isNaN(parseInt(val, 10))) {
                      setFormData({ ...formData, targetYear: currentYear });
                      e.target.value = currentYear.toString();
                    } else {
                      const num = parseInt(val, 10);
                      const clamped = Math.max(currentYear, Math.min(currentYear + 10, num));
                      setFormData({ ...formData, targetYear: clamped });
                      e.target.value = clamped.toString();
                    }
                  }}
                  min={currentYear}
                  max={currentYear + 10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalType">Goal type</Label>
                <select
                  id="goalType"
                  value={formData.goalType}
                  onChange={(e) =>
                    setFormData({ ...formData, goalType: e.target.value as 'long-term' | 'short-term' })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="short-term">Short-term</option>
                  <option value="long-term">Long-term</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as Goal['status'] })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!formData.name.trim()}>
                {editingGoal ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          variant="card"
          icon={<Target className="w-7 h-7" />}
          title="No goals yet"
          description="Your goals will show here once you add one."
          action={
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first goal
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
              aria-label="Search goals"
            />
          </div>
          {(longTermActive.length > 0 || longTermCompleted.length > 0) && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Long-term goals</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {longTermActive.map((goal) => (
                  <div
                    key={goal.id}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all',
                      getStatusColor(goal.status)
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        {getStatusIcon(goal.status)}
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{goal.name}</h3>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-muted-foreground">Target: {goal.targetYear}</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={goal.status}
                          onChange={(e) =>
                            handleStatusChange(goal.id, e.target.value as Goal['status'])
                          }
                          className="text-xs px-2 py-1 rounded border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="not-started">Not Started</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenDialog(goal)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTargetId(goal.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {longTermCompleted.map((goal) => (
                  <div
                    key={goal.id}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all opacity-75',
                      getStatusColor(goal.status)
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        {getStatusIcon(goal.status)}
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground line-through">{goal.name}</h3>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-muted-foreground">
                        Completed: {goal.completedAt ? safeFormat(safeParseDate(goal.completedAt), 'MMM d, yyyy') : 'N/A'}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenDialog(goal)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTargetId(goal.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(shortTermActive.length > 0 || shortTermCompleted.length > 0) && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Short-term goals</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {shortTermActive.map((goal) => (
                  <div
                    key={goal.id}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all',
                      getStatusColor(goal.status)
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        {getStatusIcon(goal.status)}
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{goal.name}</h3>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-muted-foreground">Target: {goal.targetYear}</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={goal.status}
                          onChange={(e) =>
                            handleStatusChange(goal.id, e.target.value as Goal['status'])
                          }
                          className="text-xs px-2 py-1 rounded border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="not-started">Not Started</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenDialog(goal)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTargetId(goal.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {shortTermCompleted.map((goal) => (
                  <div
                    key={goal.id}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all opacity-75',
                      getStatusColor(goal.status)
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        {getStatusIcon(goal.status)}
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground line-through">{goal.name}</h3>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-muted-foreground">
                        Completed: {goal.completedAt ? safeFormat(safeParseDate(goal.completedAt), 'MMM d, yyyy') : 'N/A'}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenDialog(goal)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTargetId(goal.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentGoals.length === 0 && completedGoals.length === 0 && searchLower && (
            <p className="text-sm text-muted-foreground py-4 text-center">No goals match your search.</p>
          )}
        </div>
      )}

      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
