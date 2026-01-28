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

/** Language learning: day type (coursebook or fixed speaking). */
export type LanguageDayType = 'coursebook' | 'speaking';

/** Single day in a language week (Mon–Sun). */
export interface LanguageDay {
  id: string;
  dayName: string;
  type: LanguageDayType;
  sectionName: string;
  completed: boolean;
  ankiCompleted: boolean;
}

/** One week: chapter + 7 days + workbook. */
export interface LanguageWeek {
  id: string;
  weekNumber: number;
  chapterName: string;
  days: LanguageDay[];
  workbookCompleted: boolean;
}

/** Full language level (e.g. A2): name, duration, weeks. */
export interface LanguageLevelState {
  levelName: string;
  totalWeeks: number;
  weeks: LanguageWeek[];
}

/** One language (e.g. German A2): id, display name, level, weeks. */
export interface LanguagePlan {
  id: string;
  name: string;
  levelName: string;
  totalWeeks: number;
  weeks: LanguageWeek[];
}

/** Yearly goal for tracking long-term objectives. */
export interface Goal {
  id: string;
  name: string;
  description?: string;
  targetYear: number;
  status: 'not-started' | 'in-progress' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

/** A single page in a notebook. */
export interface NotebookPage {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A notebook containing multiple pages. */
export interface Notebook {
  id: string;
  name: string;
  pages: NotebookPage[];
  createdAt: Date;
  updatedAt: Date;
}

/** Calendar event/note for a specific date. */
export interface CalendarEvent {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
