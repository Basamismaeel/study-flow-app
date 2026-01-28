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
