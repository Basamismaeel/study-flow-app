import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from './Dashboard';
import { SystemsTracker } from './SystemsTracker';
import { DailyTasks } from './DailyTasks';
import { TimerPage } from './TimerPage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialSystems } from '@/data/initialSystems';
import { MedicalSystem, DailyTask } from '@/types';

const Index = () => {
  const [systems, setSystems] = useLocalStorage<MedicalSystem[]>('usmle-systems', initialSystems);
  const [tasks, setTasks] = useLocalStorage<DailyTask[]>('usmle-daily-tasks', []);

  const handleUpdateSystem = (id: string, updates: Partial<MedicalSystem>) => {
    setSystems(prev => prev.map(system => 
      system.id === id ? { ...system, ...updates } : system
    ));
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

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard systems={systems} />} />
        <Route 
          path="/systems" 
          element={
            <SystemsTracker 
              systems={systems} 
              onUpdateSystem={handleUpdateSystem}
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
            />
          } 
        />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default Index;
