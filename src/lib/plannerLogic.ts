import type { Plan, PlannerTask } from '@/types';

/**
 * Scheduling logic for the Planner.
 * Tasks are assigned sequentially. Unfinished tasks roll over to the next day
 * and are shown first before any new tasks. No tasks are ever skipped or deleted.
 */

const DEFAULT_TASKS_PER_DAY = 5;

/**
 * Get the effective tasks per day for a plan (minimum 1).
 */
export function getTasksPerDay(plan: Plan): number {
  return Math.max(1, plan.tasksPerDay ?? DEFAULT_TASKS_PER_DAY);
}

/**
 * Returns the task indices that should appear on the given day (1-based).
 * Unfinished tasks from previous days are prioritized; then new tasks fill remaining slots.
 */
export function getTaskIndicesForDay(plan: Plan, dayNumber: number): number[] {
  const tasks = plan.tasks;
  const tasksPerDay = getTasksPerDay(plan);
  if (tasks.length === 0 || dayNumber < 1) return [];

  const pending: number[] = []; // queue of task indices (unfinished from previous days)
  let nextIndex = 0;

  for (let d = 1; d <= dayNumber; d++) {
    const dayIndices: number[] = [];

    // First: fill from pending (unfinished from previous days)
    while (dayIndices.length < tasksPerDay && pending.length > 0) {
      const idx = pending.shift()!;
      dayIndices.push(idx);
    }

    // Then: add next tasks from list in order
    while (dayIndices.length < tasksPerDay && nextIndex < tasks.length) {
      dayIndices.push(nextIndex);
      nextIndex++;
    }

    if (d === dayNumber) {
      return dayIndices;
    }

    // End of day d: any incomplete task goes to pending for next day
    for (const idx of dayIndices) {
      if (!tasks[idx].completed) {
        pending.push(idx);
      }
    }
  }

  return [];
}

/**
 * Returns the actual task objects for the given day (1-based).
 */
export function getTasksForDay(plan: Plan, dayNumber: number): PlannerTask[] {
  const indices = getTaskIndicesForDay(plan, dayNumber);
  return indices.map((i) => plan.tasks[i]);
}

/**
 * The "current" day is the first day that has at least one incomplete task.
 * If all tasks are complete, returns the last day that had tasks (or 1 if no tasks).
 */
export function getCurrentDay(plan: Plan): number {
  const tasks = plan.tasks;
  const tasksPerDay = getTasksPerDay(plan);
  if (tasks.length === 0) return 1;

  const pending: number[] = [];
  let nextIndex = 0;
  let d = 1;
  const maxDays = Math.max(plan.totalDays, 1) + Math.ceil(tasks.length / tasksPerDay) + 100;

  while (d <= maxDays) {
    const dayIndices: number[] = [];
    while (dayIndices.length < tasksPerDay && pending.length > 0) {
      dayIndices.push(pending.shift()!);
    }
    while (dayIndices.length < tasksPerDay && nextIndex < tasks.length) {
      dayIndices.push(nextIndex);
      nextIndex++;
    }

    const hasIncomplete = dayIndices.some((idx) => !tasks[idx].completed);
    if (hasIncomplete) {
      return d;
    }

    for (const idx of dayIndices) {
      if (!tasks[idx].completed) {
        pending.push(idx);
      }
    }

    if (nextIndex >= tasks.length && pending.length === 0) {
      return d; // all done; current day is this last day
    }
    d++;
  }

  return 1;
}

/**
 * Progress: completed count and total task count.
 */
export function getPlanProgress(plan: Plan): { completed: number; total: number } {
  const total = plan.tasks.length;
  const completed = plan.tasks.filter((t) => t.completed).length;
  return { completed, total };
}
