import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from './Dashboard';
import { SystemsTracker } from './SystemsTracker';
import { DailyTasks } from './DailyTasks';
import { TimerPage } from './TimerPage';
import { PlannerPage } from './PlannerPage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialSystems } from '@/data/initialSystems';
import { MedicalSystem, DailyTask } from '@/types';

const Index = () => {
  const [systems, setSystems] = useLocalStorage<MedicalSystem[]>('usmle-systems', initialSystems);
  const [tasks, setTasks] = useLocalStorage<DailyTask[]>('usmle-daily-tasks', []);
  const [selectedNextSystemId, setSelectedNextSystemId] = useLocalStorage<string | null>('usmle-next-system', null);

  const handleUpdateSystem = (id: string, updates: Partial<MedicalSystem>) => {
    setSystems(prev => prev.map(system => 
      system.id === id ? { ...system, ...updates } : system
    ));
  };

  const handleAddSystem = (system: Omit<MedicalSystem, 'id'>) => {
    const newSystem: MedicalSystem = {
      ...system,
      id: crypto.randomUUID(),
    };
    setSystems(prev => [...prev, newSystem]);
  };

  const handleDeleteSystem = (id: string) => {
    setSystems(prev => prev.filter(system => system.id !== id));
    if (selectedNextSystemId === id) {
      setSelectedNextSystemId(null);
    }
  };

  const handleAddTask = (text: string) => {
    const newTask: DailyTask = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date(),
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const handleClearAllTasks = () => {
    setTasks([]);
  };

  return (
    <Layout>
      <Routes>
        <Route 
          path="/" 
          element={
            <Dashboard 
              systems={systems} 
              selectedNextSystemId={selectedNextSystemId}
              onSelectNextSystem={setSelectedNextSystemId}
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
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default Index;
