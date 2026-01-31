import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PendingApprovalPage() {
  const { user, loading, accessState, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (accessState === 'blocked') {
    navigate('/blocked', { replace: true });
    return null;
  }
  if (accessState !== 'pending') {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Your account is waiting for admin approval.
          </h1>
          <p className="text-muted-foreground mt-2">
            You will be able to access the dashboard once an administrator approves your account.
          </p>
        </div>
        {user?.email && (
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.email}</span>
          </p>
        )}
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
