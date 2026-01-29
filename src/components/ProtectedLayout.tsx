import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ActiveStudySessionProvider } from '@/contexts/ActiveStudySessionContext';
import { Layout } from '@/components/Layout';
import Index from '@/pages/Index';

/**
 * Protects app routes: requires auth and major selection.
 * Redirects to /login or /select-major when needed.
 */
export function ProtectedLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!user.major) {
    return <Navigate to="/select-major" replace />;
  }

  return (
    <ActiveStudySessionProvider>
      <Layout>
        <Index />
      </Layout>
    </ActiveStudySessionProvider>
  );
}
