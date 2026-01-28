import type { LanguageDay, LanguageWeek, LanguageLevelState, LanguagePlan } from '@/types';

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

function createDay(dayName: string, type: 'coursebook' | 'speaking', sectionName: string): LanguageDay {
  return {
    id: crypto.randomUUID(),
    dayName,
    type,
    sectionName,
    completed: false,
    ankiCompleted: false,
  };
}

/** Build default 7 days: Mon–Sat coursebook, Sunday speaking. */
export function createDefaultDays(): LanguageDay[] {
  return [
    createDay('Monday', 'coursebook', ''),
    createDay('Tuesday', 'coursebook', ''),
    createDay('Wednesday', 'coursebook', ''),
    createDay('Thursday', 'coursebook', ''),
    createDay('Friday', 'coursebook', ''),
    createDay('Saturday', 'coursebook', ''),
    createDay('Sunday', 'speaking', 'Speaking Day'),
  ];
}

/** Build one week with default days. */
export function createWeek(weekNumber: number): LanguageWeek {
  return {
    id: crypto.randomUUID(),
    weekNumber,
    chapterName: `Chapter ${weekNumber}`,
    days: createDefaultDays(),
    workbookCompleted: false,
  };
}

/** Build initial state for a level. */
export function createInitialLevelState(levelName: string, totalWeeks: number): LanguageLevelState {
  const weeks: LanguageWeek[] = [];
  for (let i = 1; i <= totalWeeks; i++) {
    weeks.push(createWeek(i));
  }
  return { levelName, totalWeeks, weeks };
}

/** Ensure weeks array matches totalWeeks (add or trim). */
export function syncWeeksToTotal(state: LanguageLevelState): LanguageLevelState {
  const { levelName, totalWeeks, weeks } = state;
  const nextWeeks = [...weeks];
  while (nextWeeks.length < totalWeeks) {
    nextWeeks.push(createWeek(nextWeeks.length + 1));
  }
  if (nextWeeks.length > totalWeeks) {
    nextWeeks.length = totalWeeks;
  }
  return { levelName, totalWeeks, weeks: nextWeeks };
}

/** Create a new language plan (e.g. "German" at A2, 10 weeks). */
export function createNewLanguagePlan(
  name: string,
  levelName: string = 'A2',
  totalWeeks: number = 10
): LanguagePlan {
  const state = createInitialLevelState(levelName, totalWeeks);
  return {
    id: crypto.randomUUID(),
    name: name.trim() || 'New language',
    levelName: state.levelName,
    totalWeeks: state.totalWeeks,
    weeks: state.weeks,
  };
}

/** Sync a plan's weeks array to match totalWeeks. */
export function syncPlanWeeks(plan: LanguagePlan): LanguagePlan {
  const synced = syncWeeksToTotal({
    levelName: plan.levelName,
    totalWeeks: plan.totalWeeks,
    weeks: plan.weeks,
  });
  return { ...plan, weeks: synced.weeks };
}
