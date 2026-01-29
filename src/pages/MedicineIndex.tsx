/**
 * Medicine major: existing dashboard unchanged.
 * Systems-based structure, Qbank, medical analytics — DO NOT MODIFY.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { SystemsTracker } from './SystemsTracker';
import { DailyTasks } from './DailyTasks';
import { TimerPage } from './TimerPage';
import { PlannerPage } from './PlannerPage';
import { LanguagesPage } from './LanguagesPage';
import { GoalsPage } from './GoalsPage';
import { NotebookPage } from './NotebookPage';
import { ActivityHeatmapPage } from './ActivityHeatmapPage';
import { useUserLocalStorage } from '@/hooks/useUserLocalStorage';
import { initialSystems } from '@/data/initialSystems';
import { MedicalSystem, DailyTask } from '@/types';

export function MedicineIndex() {
  const [systems, setSystems] = useUserLocalStorage<MedicalSystem[]>('usmle-systems', initialSystems);
  const [tasks, setTasks] = useUserLocalStorage<DailyTask[]>('usmle-daily-tasks', []);
  const [selectedNextSystemId, setSelectedNextSystemId] = useUserLocalStorage<string | null>(
    'usmle-next-system',
    null
  );

  const handleUpdateSystem = (id: string, updates: Partial<MedicalSystem>) => {
    setSystems((prev) =>
      prev.map((system) => (system.id === id ? { ...system, ...updates } : system))
    );
  };

  const handleAddSystem = (system: Omit<MedicalSystem, 'id'>) => {
    const newSystem: MedicalSystem = { ...system, id: crypto.randomUUID() };
    setSystems((prev) => [...prev, newSystem]);
  };

  const handleDeleteSystem = (id: string) => {
    setSystems((prev) => prev.filter((system) => system.id !== id));
    if (selectedNextSystemId === id) setSelectedNextSystemId(null);
  };

  const handleAddTask = (text: string) => {
    const newTask: DailyTask = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleClearAllTasks = () => setTasks([]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Dashboard
            systems={systems}
            selectedNextSystemId={selectedNextSystemId}
            onSelectNextSystem={setSelectedNextSystemId}
            dailyTasks={tasks}
          />
        }
      />
      <Route
        path="/systems"
        element={
          <SystemsTracker
            systems={systems}
            onUpdateSystem={handleUpdateSystem}
            onAddSystem={handleAddSystem}
            onDeleteSystem={handleDeleteSystem}
          />
        }
      />
      <Route
        path="/daily"
        element={
          <DailyTasks
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onClearAllTasks={handleClearAllTasks}
          />
        }
      />
      <Route path="/activity" element={<ActivityHeatmapPage />} />
      <Route path="/timer" element={<TimerPage />} />
      <Route path="/planner" element={<PlannerPage />} />
      <Route path="/languages" element={<LanguagesPage />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/notebook" element={<NotebookPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
