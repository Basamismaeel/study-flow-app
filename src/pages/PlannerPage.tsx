import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatePlanDialog } from '@/components/CreatePlanDialog';
import { PlanCard } from '@/components/PlanCard';
import { Plus } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Plan } from '@/types';

export function PlannerPage() {
  const [plans, setPlans] = useLocalStorage<Plan[]>('study-flow-plans', []);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activePlanId, setActivePlanId] = useState<string | null>(plans[0]?.id ?? null);

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
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        };
      })
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
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground mb-4">No plans yet.</p>
          <Button onClick={() => setCreateDialogOpen(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create your first plan
          </Button>
        </div>
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
              <PlanCard plan={plan} onToggleTask={handleToggleTask} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      <CreatePlanDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onAddPlan={handleAddPlan}
      />
    </div>
  );
}
