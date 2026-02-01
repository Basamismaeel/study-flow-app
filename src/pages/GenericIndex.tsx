/**
 * Non-medicine majors: courses with daily tasks. Coverage shows daily completion.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import { useStudySessions } from '@/hooks/useStudySessions';
import { GenericDashboard } from './GenericDashboard';
import { SubjectsPage } from './SubjectsPage';
import { SubjectDetailPage } from './SubjectDetailPage';
import { DailyTasks } from './DailyTasks';
import { TimerPage } from './TimerPage';
import { GoalsPage } from './GoalsPage';
import { NotebookPage } from './NotebookPage';
import { ActivityHeatmapPage } from './ActivityHeatmapPage';
import { Subject, DailyTask, subjectStatus, CourseDailyCompletion } from '@/types';

const defaultDailyTasks: DailyTask[] = [];
const defaultCompletions: CourseDailyCompletion[] = [];

function normalizeSubject(s: Subject | Record<string, unknown>): Subject {
  if ('icon' in s && 'tracking' in s && 'status' in s && Array.isArray((s as Subject).tracking)) {
    const sub = s as Subject;
    return { ...sub, dailyTasks: sub.dailyTasks ?? [] };
  }
  const sub = s as { id: string; name: string };
  return {
    id: sub.id,
    name: sub.name,
    icon: '📚',
    tracking: [],
    status: 'not-started',
    dailyTasks: [],
  };
}

const defaultSubjects: Subject[] = [];

export function GenericIndex() {
  const { sessions } = useStudySessions();
  const [subjects, setSubjects] = useUserLocalStorage<Subject[]>(
    'generic-subjects',
    defaultSubjects
  );
  const [courseDailyCompletionsRaw, setCourseDailyCompletions] = useUserLocalStorage<CourseDailyCompletion[]>(
    'generic-course-daily-completions',
    defaultCompletions
  );
  const courseDailyCompletions = Array.isArray(courseDailyCompletionsRaw)
    ? courseDailyCompletionsRaw
    : defaultCompletions;

  const [dailyTasksRaw, setDailyTasks] = useUserLocalStorage<DailyTask[]>(
    'generic-daily-tasks',
    defaultDailyTasks
  );
  const dailyTasks = Array.isArray(dailyTasksRaw) ? dailyTasksRaw : defaultDailyTasks;
  const [selectedNextSubjectId, setSelectedNextSubjectId] = useUserLocalStorage<string | null>(
    'generic-next-subject',
    null
  );

  const normalizedSubjects = Array.isArray(subjects)
    ? subjects.map(normalizeSubject)
    : defaultSubjects;

  const handleAddSubject = (subject: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      ...subject,
      id: crypto.randomUUID(),
      dailyTasks: [],
    };
    setSubjects((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return [...list.map(normalizeSubject), newSubject];
    });
  };

  const handleUpdateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((s) => {
        const sub = normalizeSubject(s);
        if (sub.id !== id) return sub;
        const merged = { ...sub, ...updates };
        if (updates.tracking) {
          merged.status = subjectStatus(updates.tracking);
        }
        return merged;
      });
    });
  };

  const handleDeleteSubject = (id: string) => {
    const deletedSub = (Array.isArray(subjects) ? subjects : []).find((s) => s.id === id);
    const taskIds = new Set((deletedSub?.dailyTasks ?? []).map((t) => t.id));
    setSubjects((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.filter((s) => normalizeSubject(s).id !== id);
    });
    setCourseDailyCompletions((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.filter((c) => !taskIds.has(c.taskId));
    });
    if (selectedNextSubjectId === id) setSelectedNextSubjectId(null);
  };

  const handleAddCourseDailyTask = (courseId: string, text: string) => {
    const newTask = { id: crypto.randomUUID(), text };
    setSubjects((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((s) =>
        s.id === courseId
          ? { ...s, dailyTasks: [...(s.dailyTasks ?? []), newTask] }
          : s
      );
    });
  };

  const handleRemoveCourseDailyTask = (courseId: string, taskId: string) => {
    setSubjects((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((s) =>
        s.id === courseId
          ? { ...s, dailyTasks: (s.dailyTasks ?? []).filter((t) => t.id !== taskId) }
          : s
      );
    });
    setCourseDailyCompletions((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.filter((c) => c.taskId !== taskId);
    });
  };

  const handleToggleCourseDailyCompletion = (taskId: string, date: string, completed: boolean) => {
    setCourseDailyCompletions((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const rest = list.filter((c) => !(c.taskId === taskId && c.date === date));
      return [...rest, { taskId, date, completed }];
    });
  };

  const getCourseDailyCompletion = (taskId: string, date: string): boolean => {
    const c = courseDailyCompletions.find((x) => x.taskId === taskId && x.date === date);
    return c?.completed ?? false;
  };

  const handleAddDailyTask = (text: string, date?: string, timeStart?: string, timeEnd?: string) => {
    const newTask: DailyTask = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date(),
      date: date ?? new Date().toISOString().slice(0, 10),
      ...(timeStart && timeStart.trim() && { timeStart: timeStart.trim() }),
      ...(timeEnd && timeEnd.trim() && { timeEnd: timeEnd.trim() }),
    };
    setDailyTasks((prev) => [newTask, ...(Array.isArray(prev) ? prev : [])]);
  };

  const handleToggleDailyTask = (id: string) => {
    setDailyTasks((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    });
  };

  const handleDeleteDailyTask = (id: string) => {
    setDailyTasks((prev) => (Array.isArray(prev) ? prev : []).filter((t) => t.id !== id));
  };

  const handleUpdateDailyTask = (id: string, text: string, timeStart?: string, timeEnd?: string) => {
    setDailyTasks((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((t) =>
        t.id === id
          ? {
              ...t,
              text,
              ...(timeStart !== undefined && { timeStart: timeStart === '' ? undefined : timeStart }),
              ...(timeEnd !== undefined && { timeEnd: timeEnd === '' ? undefined : timeEnd }),
            }
          : t
      );
    });
  };

  const handleClearAllDailyTasks = () => setDailyTasks([]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <GenericDashboard
            subjects={normalizedSubjects}
            sessions={sessions}
            courseDailyCompletions={courseDailyCompletions}
            dailyTasks={dailyTasks}
            selectedNextSubjectId={selectedNextSubjectId}
            onSelectNextSubject={setSelectedNextSubjectId}
            onToggleDailyTask={handleToggleDailyTask}
            onAddCourseDailyTask={handleAddCourseDailyTask}
            onRemoveCourseDailyTask={handleRemoveCourseDailyTask}
            getCourseDailyCompletion={getCourseDailyCompletion}
            onToggleCourseDailyCompletion={handleToggleCourseDailyCompletion}
          />
        }
      />
      <Route
        path="/subjects"
        element={
          <SubjectsPage
            subjects={normalizedSubjects}
            courseDailyCompletions={courseDailyCompletions}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            onAddCourseDailyTask={handleAddCourseDailyTask}
            onRemoveCourseDailyTask={handleRemoveCourseDailyTask}
            getCourseDailyCompletion={getCourseDailyCompletion}
            onToggleCourseDailyCompletion={handleToggleCourseDailyCompletion}
          />
        }
      />
      <Route
        path="/subjects/:id"
        element={
          <SubjectDetailPage
            subjects={normalizedSubjects}
            courseDailyCompletions={courseDailyCompletions}
            onAddCourseDailyTask={handleAddCourseDailyTask}
            onRemoveCourseDailyTask={handleRemoveCourseDailyTask}
            onToggleCourseDailyCompletion={handleToggleCourseDailyCompletion}
            getCourseDailyCompletion={getCourseDailyCompletion}
          />
        }
      />
      <Route
        path="/daily"
        element={
          <DailyTasks
            tasks={dailyTasks}
            onAddTask={handleAddDailyTask}
            onToggleTask={handleToggleDailyTask}
            onDeleteTask={handleDeleteDailyTask}
            onUpdateTask={handleUpdateDailyTask}
            onClearAllTasks={handleClearAllDailyTasks}
            allowOtherDays={true}
          />
        }
      />
      <Route path="/activity" element={<ActivityHeatmapPage />} />
      <Route path="/timer" element={<TimerPage />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/notebook" element={<NotebookPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
