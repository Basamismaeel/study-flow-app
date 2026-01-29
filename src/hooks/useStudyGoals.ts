import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import type { StudyGoals } from '@/types';

const defaultGoals: StudyGoals = {
  weeklyHours: 0,
  subjectHours: {},
};

function normalizeGoals(value: unknown): StudyGoals {
  if (!value || typeof value !== 'object') return defaultGoals;
  const o = value as Record<string, unknown>;
  return {
    weeklyHours: typeof o.weeklyHours === 'number' && o.weeklyHours >= 0 ? o.weeklyHours : 0,
    subjectHours: o.subjectHours && typeof o.subjectHours === 'object' && !Array.isArray(o.subjectHours)
      ? (o.subjectHours as Record<string, number>)
      : {},
  };
}

export function useStudyGoals() {
  const [rawGoals, setRawGoals] = useUserLocalStorage<StudyGoals>(
    'study-goals',
    defaultGoals
  );
  const goals = normalizeGoals(rawGoals);

  const setGoals = (fn: (prev: StudyGoals) => StudyGoals) => {
    setRawGoals((prev) => normalizeGoals(fn(normalizeGoals(prev))));
  };

  const setWeeklyHours = (hours: number) => {
    setRawGoals((prev) => {
      const g = normalizeGoals(prev);
      return { ...g, weeklyHours: Math.max(0, hours) };
    });
  };

  const setSubjectHours = (subjectId: string, hours: number) => {
    setRawGoals((prev) => {
      const g = normalizeGoals(prev);
      return {
        ...g,
        subjectHours: { ...g.subjectHours, [subjectId]: Math.max(0, hours) },
      };
    });
  };

  const removeSubjectGoal = (subjectId: string) => {
    setRawGoals((prev) => {
      const g = normalizeGoals(prev);
      const next = { ...g.subjectHours };
      delete next[subjectId];
      return { ...g, subjectHours: next };
    });
  };

  return { goals, setGoals, setWeeklyHours, setSubjectHours, removeSubjectGoal };
}
