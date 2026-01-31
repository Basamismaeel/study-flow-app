import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ActiveStudySessionProvider } from '@/contexts/ActiveStudySessionContext';
import { Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Index from '@/pages/Index';

/**
 * Protects app routes: requires logged-in user with status === "approved".
 * Redirects to /login, /pending, or /blocked when needed.
 * Pending users cannot access dashboard even via direct URL.
 */
export function ProtectedLayout() {
  const { user, accessState } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (accessState === 'pending') {
    return <Navigate to="/pending" replace />;
  }
  if (accessState === 'blocked') {
    return <Navigate to="/blocked" replace />;
  }
  if (accessState !== 'approved') {
    return <Navigate to="/login" replace />;
  }
  if (!user.major) {
    return <Navigate to="/select-major" replace />;
  }

  return (
    <ActiveStudySessionProvider>
      <Layout>
        <ErrorBoundary>
          <Index />
        </ErrorBoundary>
      </Layout>
    </ActiveStudySessionProvider>
  );
}
