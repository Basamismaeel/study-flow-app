export interface MedicalSystem {
  id: string;
  name: string;
  icon: string;
  bootcamp: {
    completed: number;
    total: number;
  };
  qbank: {
    completed: number;
    total: number;
  };
  status: 'not-started' | 'in-progress' | 'completed';
}

export interface DailyTask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  date: Date;
  description: string;
  systemId?: string;
}

/** Single task in a plan (e.g. video name). Order in plan.tasks matters. */
export interface PlannerTask {
  id: string;
  name: string;
  completed: boolean;
}

/** A plan with ordered tasks and day-based scheduling. */
export interface Plan {
  id: string;
  name: string;
  totalDays: number;
  tasksPerDay: number;
  tasks: PlannerTask[];
}
