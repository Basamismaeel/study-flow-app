import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatePlanDialog } from '@/components/CreatePlanDialog';
import { EditPlanTasksDialog } from '@/components/EditPlanTasksDialog';
import { EditPlanDialog } from '@/components/EditPlanDialog';
import { PlanCard } from '@/components/PlanCard';
import { EmptyState } from '@/components/EmptyState';
import { Plus, ClipboardList } from 'lucide-react';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import type { Plan, PlannerTask } from '@/types';

export function PlannerPage() {
  const [plans, setPlans] = useUserLocalStorage<Plan[]>('study-flow-plans', []);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTasksPlanId, setEditTasksPlanId] = useState<string | null>(null);
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(plans[0]?.id ?? null);

  const editTasksPlan = editTasksPlanId ? plans.find((p) => p.id === editTasksPlanId) ?? null : null;
  const editPlan = editPlanId ? plans.find((p) => p.id === editPlanId) ?? null : null;

  const handleAddPlan = (planData: Omit<Plan, 'id'>) => {
    const newPlan: Plan = {
      ...planData,
      id: crypto.randomUUID(),
    };
    setPlans((prev) => [...prev, newPlan]);
    setActivePlanId(newPlan.id);
  };

  const handleToggleTask = (planId: string, taskId: string) => {
    setPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          tasks: plan.tasks.map((t) =>
            t.id === taskId
              ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
              : t
          ),
        };
      })
    );
  };

  const handleAddTask = (planId: string, name: string) => {
    const task: PlannerTask = {
      id: crypto.randomUUID(),
      name: name.trim(),
      completed: false,
    };
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId ? { ...p, tasks: [...p.tasks, task] } : p
      )
    );
  };

  const handleUpdateTask = (planId: string, taskId: string, name: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) =>
            t.id === taskId ? { ...t, name: name.trim() } : t
          ),
        };
      })
    );
  };

  const handleDeleteTask = (planId: string, taskId: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        return { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) };
      })
    );
  };

  const handleReorderTasks = (planId: string, tasks: PlannerTask[]) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, tasks } : p))
    );
  };

  const handleUpdatePlan = (planId: string, updates: { name?: string; totalDays?: number; tasksPerDay?: number }) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id !== planId ? p : { ...p, ...updates }
      )
    );
    setEditPlanId(null);
  };

  const handleAddTasks = (planId: string, names: string[]) => {
    const newTasks: PlannerTask[] = names
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({
        id: crypto.randomUUID(),
        name,
        completed: false,
      }));
    if (newTasks.length === 0) return;
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId ? { ...p, tasks: [...p.tasks, ...newTasks] } : p
      )
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Planner</h1>
          <p className="text-muted-foreground">
            Create plans, assign tasks to days, and roll over unfinished tasks automatically.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          variant="card"
          icon={<ClipboardList className="w-7 h-7" />}
          title="No plans yet"
          description="Your plans will show here once you create one."
          action={
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first plan
            </Button>
          }
        />
      ) : (
        <Tabs
          value={activePlanId ?? plans[0].id}
          onValueChange={(v) => setActivePlanId(v)}
          className="w-full"
        >
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/50">
            {plans.map((plan) => (
              <TabsTrigger
                key={plan.id}
                value={plan.id}
                className="data-[state=active]:bg-background"
              >
                {plan.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {plans.map((plan) => (
            <TabsContent key={plan.id} value={plan.id} className="mt-6">
              <PlanCard
                plan={plan}
                onToggleTask={handleToggleTask}
                onEditTaskList={(planId) => setEditTasksPlanId(planId)}
                onEditPlan={(planId) => setEditPlanId(planId)}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      <EditPlanTasksDialog
        open={!!editTasksPlan}
        onOpenChange={(open) => !open && setEditTasksPlanId(null)}
        plan={editTasksPlan}
        onAddTask={handleAddTask}
        onAddTasks={handleAddTasks}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onReorderTasks={handleReorderTasks}
      />

      <CreatePlanDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onAddPlan={handleAddPlan}
      />

      <EditPlanDialog
        open={!!editPlan}
        onOpenChange={(open) => !open && setEditPlanId(null)}
        plan={editPlan}
        onSave={handleUpdatePlan}
      />
    </div>
  );
}
