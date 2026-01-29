import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MedicineIndex } from './MedicineIndex';
import { GenericIndex } from './GenericIndex';

const Index = () => {
  const { user } = useAuth();
  const major = user?.major ?? null;

  if (!major) {
    return <Navigate to="/select-major" replace />;
  }

  if (major.toLowerCase() === 'medicine') {
    return <MedicineIndex />;
  }

  return <GenericIndex />;
};

export default Index;
