/** User-added task type for a system (e.g. "Anki deck", "Notes"). */
export interface SystemCustomTask {
  id: string;
  label: string;
}

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
  /** User-defined task types for this system (e.g. Anki, notes). */
  customTasks?: SystemCustomTask[];
  status: 'not-started' | 'in-progress' | 'completed';
}

export interface DailyTask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  /** ISO date string (YYYY-MM-DD). If omitted, treated as the date of createdAt. */
  date?: string;
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

// --- Non-Medicine (generic dashboard): user-defined subjects & tasks ---

/** One customizable tracking item (e.g. Videos 10/45, Chapters 3/12). */
export interface SubjectTrackingItem {
  id: string;
  label: string;
  completed: number;
  total: number;
}

/** User-defined subject with same functions as Medicine systems but customizable tracking. */
export interface Subject {
  id: string;
  name: string;
  icon: string;
  tracking: SubjectTrackingItem[];
  status: 'not-started' | 'in-progress' | 'completed';
  /** Daily task templates for this course (generic majors). What to finish daily. */
  dailyTasks?: CourseDailyTask[];
}

/** User-defined task within a subject. Title and completion only. */
export interface GenericTask {
  id: string;
  subjectId: string;
  title: string;
  completed: boolean;
}

/** Daily task template for a course (generic majors). What to finish daily for that course. */
export interface CourseDailyTask {
  id: string;
  text: string;
}

/** Completion record for a course daily task on a specific date. */
export interface CourseDailyCompletion {
  taskId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

/** Compute subject status from tracking items. */
export function subjectStatus(tracking: SubjectTrackingItem[]): Subject['status'] {
  const withTotal = tracking.filter((t) => t.total > 0);
  if (withTotal.length === 0) return 'not-started';
  const allComplete = withTotal.every((t) => t.completed === t.total);
  const anyStarted = withTotal.some((t) => t.completed > 0);
  if (allComplete) return 'completed';
  if (anyStarted) return 'in-progress';
  return 'not-started';
}

// --- Study session tracking & planning (no AI) ---

/** A single logged study session. */
export interface StudySession {
  id: string;
  subjectId: string | null;
  subjectName: string | null;
  taskId: string | null;
  taskLabel: string | null;
  startTime: string; // ISO
  endTime: string;   // ISO
  durationMinutes: number;
}

/** Weekly reflection (3 prompts). */
export interface WeeklyReflection {
  weekKey: string;   // e.g. "2025-W29"
  whatWentWell: string;
  whatWasChallenging: string;
  whatWillChange: string;
  savedAt: string;   // ISO
}

/** Study goals: weekly overall + optional per-subject hours. */
export interface StudyGoals {
  weeklyHours: number;
  subjectHours: Record<string, number>;
}
