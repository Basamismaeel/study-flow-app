import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BlockedAccessPage() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Access denied
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Please sign in again.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button variant="ghost" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
