import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LanguageWeekCard } from '@/components/LanguageWeekCard';
import { AddLanguageDialog } from '@/components/AddLanguageDialog';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import { syncPlanWeeks } from '@/lib/languageLogic';
import type { LanguagePlan, LanguageWeek } from '@/types';
import { Plus, Trash2, Languages } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

const DEFAULT_WEEKS = 10;

interface LanguagesState {
  plans: LanguagePlan[];
  selectedId: string | null;
}

function getInitialState(): LanguagesState {
  return { plans: [], selectedId: null };
}

export function LanguagesPage() {
  const [state, setState] = useUserLocalStorage<LanguagesState>(
    'language-plans',
    getInitialState()
  );
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [weeksInputValues, setWeeksInputValues] = useState<Record<string, string>>({});

  const selectedPlan = state.plans.find((p) => p.id === state.selectedId);
  const hasPlans = state.plans.length > 0;

  const handleAddLanguage = (plan: LanguagePlan) => {
    setState((prev) => ({
      plans: [...prev.plans, plan],
      selectedId: plan.id,
    }));
    setAddDialogOpen(false);
  };

  const handleSelectLanguage = (id: string) => {
    setState((prev) => ({ ...prev, selectedId: id }));
  };

  const handleDeleteLanguage = (id: string) => {
    setState((prev) => {
      const nextPlans = prev.plans.filter((p) => p.id !== id);
      const nextSelected =
        prev.selectedId === id ? (nextPlans[0]?.id ?? null) : prev.selectedId;
      return { plans: nextPlans, selectedId: nextSelected };
    });
    setDeleteTargetId(null);
  };

  const updatePlan = (planId: string, updater: (p: LanguagePlan) => LanguagePlan) => {
    setState((prev) => ({
      ...prev,
      plans: prev.plans.map((p) => (p.id === planId ? updater(p) : p)),
    }));
  };

  const handleLevelNameChange = (levelName: string) => {
    if (!selectedPlan) return;
    updatePlan(selectedPlan.id, (p) => ({ ...p, levelName: levelName.trim() || 'A2' }));
  };

  const handleTotalWeeksChange = (totalWeeks: number) => {
    if (!selectedPlan) return;
    const n = Math.max(1, Math.min(52, totalWeeks));
    updatePlan(selectedPlan.id, (p) => syncPlanWeeks({ ...p, totalWeeks: n }));
  };

  const handleUpdateWeek = (weekId: string, updates: Partial<LanguageWeek>) => {
    if (!selectedPlan) return;
    updatePlan(selectedPlan.id, (p) => ({
      ...p,
      weeks: p.weeks.map((w) => (w.id === weekId ? { ...w, ...updates } : w)),
    }));
  };

  const handleUpdateDay = (
    weekId: string,
    dayId: string,
    updates: Partial<LanguageWeek['days'][0]>
  ) => {
    if (!selectedPlan) return;
    
    // Check if we're updating a section name in week 1
    const week1 = selectedPlan.weeks.find((w) => w.id === weekId);
    const isWeek1 = week1?.weekNumber === 1;
    const isSectionNameUpdate = 'sectionName' in updates && updates.sectionName !== undefined;
    
    if (isWeek1 && isSectionNameUpdate && week1) {
      // Find the day index in week 1
      const dayIndex = week1.days.findIndex((d) => d.id === dayId);
      
      if (dayIndex >= 0) {
        // Sync section name to all other weeks for the same day index
        updatePlan(selectedPlan.id, (p) => ({
          ...p,
          weeks: p.weeks.map((w) => {
            if (w.id === weekId) {
              // Update the current week
              return {
                ...w,
                days: w.days.map((d) => (d.id === dayId ? { ...d, ...updates } : d)),
              };
            } else {
              // Sync to same day index in other weeks (only if it's a coursebook day)
              return {
                ...w,
                days: w.days.map((d, idx) => {
                  if (idx === dayIndex && d.type === 'coursebook') {
                    return { ...d, sectionName: updates.sectionName || '' };
                  }
                  return d;
                }),
              };
            }
          }),
        }));
        return;
      }
    }
    
    // Normal update (not week 1 section name, or other updates)
    updatePlan(selectedPlan.id, (p) => ({
      ...p,
      weeks: p.weeks.map((w) => {
        if (w.id !== weekId) return w;
        return {
          ...w,
          days: w.days.map((d) => (d.id === dayId ? { ...d, ...updates } : d)),
        };
      }),
    }));
  };

  const handleRenamePlan = (name: string) => {
    if (!selectedPlan) return;
    updatePlan(selectedPlan.id, (p) => ({ ...p, name: name.trim() || p.name }));
  };

  const calculateLanguageProgress = (plan: LanguagePlan) => {
    let totalDays = 0;
    let completedDays = 0;
    let totalWeeks = plan.weeks.length;
    let completedWeeks = 0;

    plan.weeks.forEach((week) => {
      week.days.forEach((day) => {
        totalDays++;
        if (day.completed) {
          completedDays++;
        }
      });
      if (week.workbookCompleted) {
        completedWeeks++;
      }
    });

    const dayProgress = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
    const weekProgress = totalWeeks > 0 ? (completedWeeks / totalWeeks) * 100 : 0;
    // Overall progress: 70% weight on days, 30% on weeks
    const overallProgress = Math.round(dayProgress * 0.7 + weekProgress * 0.3);

    return {
      completedDays,
      totalDays,
      completedWeeks,
      totalWeeks,
      dayProgress: Math.round(dayProgress),
      weekProgress: Math.round(weekProgress),
      overallProgress,
    };
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Languages</h1>
          <p className="text-muted-foreground">
            Add multiple languages. Each has its own level, weeks, and tracking. Nothing
            disappears.
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add language
        </Button>
      </div>

      <AddLanguageDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddLanguage}
      />

      {!hasPlans ? (
        <EmptyState
          variant="card"
          icon={<Languages className="w-7 h-7" />}
          title="No languages yet"
          description="Add a language plan to track coursebook and speaking days."
          action={
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first language
            </Button>
          }
        />
      ) : (
        <Tabs
          value={state.selectedId ?? state.plans[0]?.id ?? ''}
          onValueChange={handleSelectLanguage}
          className="w-full"
        >
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/50 mb-6">
            {state.plans.map((plan) => (
              <TabsTrigger
                key={plan.id}
                value={plan.id}
                className="data-[state=active]:bg-background flex items-center gap-2"
              >
                {plan.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteTargetId(plan.id);
                  }}
                  className="rounded p-0.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${plan.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </TabsTrigger>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </TabsList>

          {state.plans.map((plan) => {
            const progress = calculateLanguageProgress(plan);
            return (
              <TabsContent key={plan.id} value={plan.id} className="mt-0 space-y-6">
                {/* Overall Progress */}
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground">Overall Progress</h3>
                    <span className="text-sm font-semibold text-primary">{progress.overallProgress}%</span>
                  </div>
                  <ProgressBar 
                    value={progress.overallProgress} 
                    max={100} 
                    variant={progress.overallProgress === 100 ? 'success' : 'default'}
                    size="md"
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{progress.completedDays} / {progress.totalDays} days completed</span>
                    <span>{progress.completedWeeks} / {progress.totalWeeks} weeks completed</span>
                  </div>
                </div>

                {/* Level config for this language */}
                <div className="glass-card p-6 flex flex-wrap items-end gap-6">
                <div className="min-w-[140px]">
                  <Label className="text-muted-foreground">Language name</Label>
                  <Input
                    value={plan.name}
                    onChange={(e) => handleRenamePlan(e.target.value)}
                    placeholder="e.g. German"
                    className="mt-1.5 font-medium"
                  />
                </div>
                <div className="min-w-[120px]">
                  <Label className="text-muted-foreground">Level</Label>
                  <Input
                    value={plan.levelName}
                    onChange={(e) => handleLevelNameChange(e.target.value)}
                    placeholder="e.g. A1, A2, B1"
                    className="mt-1.5 font-medium"
                  />
                </div>
                <div className="min-w-[100px]">
                  <Label className="text-muted-foreground">Weeks</Label>
                  <Input
                    type="number"
                    min={1}
                    max={52}
                    value={weeksInputValues[plan.id] !== undefined ? weeksInputValues[plan.id] : plan.totalWeeks.toString()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWeeksInputValues(prev => ({ ...prev, [plan.id]: val }));
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val === '' || isNaN(parseInt(val, 10))) {
                        // Reset to current value if blank or invalid
                        setWeeksInputValues(prev => {
                          const next = { ...prev };
                          delete next[plan.id];
                          return next;
                        });
                        e.target.value = plan.totalWeeks.toString();
                      } else {
                        const num = parseInt(val, 10);
                        const clamped = Math.max(1, Math.min(52, num));
                        handleTotalWeeksChange(clamped);
                        setWeeksInputValues(prev => {
                          const next = { ...prev };
                          delete next[plan.id];
                          return next;
                        });
                      }
                    }}
                    className="mt-1.5 font-medium"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Mon–Sat = coursebook sections, Sunday = Speaking Day. Workbook per week.
                </p>
              </div>

              {/* Weeks overview */}
              <div>
                <h2 className="text-lg font-medium text-foreground mb-4">
                  {plan.name} {plan.levelName} — Week 1 to {plan.weeks.length}
                </h2>
                <div className="overflow-x-auto pb-4 -mx-1">
                  <div className="flex gap-4 min-w-min">
                    {plan.weeks.map((week) => (
                      <LanguageWeekCard
                        key={week.id}
                        week={week}
                        onUpdateWeek={handleUpdateWeek}
                        onUpdateDay={handleUpdateDay}
                      />
                    ))}
                  </div>
                </div>
              </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      <AlertDialog open={!!deleteTargetId} onOpenChange={() => setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete language?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this language and all its weeks. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetId && handleDeleteLanguage(deleteTargetId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
