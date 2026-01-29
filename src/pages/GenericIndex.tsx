/**
 * Non-medicine majors: generic dashboard with user-defined subjects and tasks.
 * Subjects have same functions as Medicine systems but fully customizable.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import { GenericDashboard } from './GenericDashboard';
import { SubjectsPage } from './SubjectsPage';
import { SubjectDetailPage } from './SubjectDetailPage';
import { DailyTasks } from './DailyTasks';
import { TimerPage } from './TimerPage';
import { GoalsPage } from './GoalsPage';
import { NotebookPage } from './NotebookPage';
import { ActivityHeatmapPage } from './ActivityHeatmapPage';
import { Subject, GenericTask, DailyTask, subjectStatus } from '@/types';

const defaultSubjectTasks: GenericTask[] = [];
const defaultDailyTasks: DailyTask[] = [];

function normalizeSubject(s: Subject | Record<string, unknown>): Subject {
  if ('icon' in s && 'tracking' in s && 'status' in s && Array.isArray((s as Subject).tracking)) {
    return s as Subject;
  }
  const sub = s as { id: string; name: string };
  return {
    id: sub.id,
    name: sub.name,
    icon: '📚',
    tracking: [],
    status: 'not-started',
  };
}

const defaultSubjects: Subject[] = [];

export function GenericIndex() {
  const [subjects, setSubjects] = useUserLocalStorage<Subject[]>(
    'generic-subjects',
    defaultSubjects
  );
  const [subjectTasks, setSubjectTasks] = useUserLocalStorage<GenericTask[]>(
    'generic-subject-tasks',
    defaultSubjectTasks
  );
  const [dailyTasks, setDailyTasks] = useUserLocalStorage<DailyTask[]>(
    'generic-daily-tasks',
    defaultDailyTasks
  );
  const [selectedNextSubjectId, setSelectedNextSubjectId] = useUserLocalStorage<string | null>(
    'generic-next-subject',
    null
  );

  const normalizedSubjects = subjects.map(normalizeSubject);

  const handleAddSubject = (subject: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      ...subject,
      id: crypto.randomUUID(),
    };
    setSubjects((prev) => [...prev.map(normalizeSubject), newSubject]);
  };

  const handleUpdateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects((prev) =>
      prev.map((s) => {
        const sub = normalizeSubject(s);
        if (sub.id !== id) return sub;
        const merged = { ...sub, ...updates };
        if (updates.tracking) {
          merged.status = subjectStatus(updates.tracking);
        }
        return merged;
      })
    );
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => normalizeSubject(s).id !== id));
    setSubjectTasks((prev) => prev.filter((t) => t.subjectId !== id));
    if (selectedNextSubjectId === id) setSelectedNextSubjectId(null);
  };

  const handleAddTask = (subjectId: string, title: string) => {
    const newTask: GenericTask = {
      id: crypto.randomUUID(),
      subjectId,
      title,
      completed: false,
    };
    setSubjectTasks((prev) => [...prev, newTask]);
  };

  const handleToggleSubjectTask = (id: string) => {
    setSubjectTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteSubjectTask = (id: string) => {
    setSubjectTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddDailyTask = (text: string) => {
    const newTask: DailyTask = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date(),
    };
    setDailyTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleDailyTask = (id: string) => {
    setDailyTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteDailyTask = (id: string) => {
    setDailyTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateDailyTask = (id: string, text: string) => {
    setDailyTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text } : t))
    );
  };

  const handleClearAllDailyTasks = () => setDailyTasks([]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <GenericDashboard
            subjects={normalizedSubjects}
            subjectTasks={subjectTasks}
            dailyTasks={dailyTasks}
            selectedNextSubjectId={selectedNextSubjectId}
            onSelectNextSubject={setSelectedNextSubjectId}
          />
        }
      />
      <Route
        path="/subjects"
        element={
          <SubjectsPage
            subjects={normalizedSubjects}
            subjectTasks={subjectTasks}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
          />
        }
      />
      <Route
        path="/subjects/:id"
        element={
          <SubjectDetailPage
            subjects={normalizedSubjects}
            subjectTasks={subjectTasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleSubjectTask}
            onDeleteTask={handleDeleteSubjectTask}
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
