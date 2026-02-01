import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getPendingUsers, approveUser, type PendingUser } from '@/services/admin';
import { Loader2, Check, Users, ArrowLeft } from 'lucide-react';

export function AdminApprovalPage() {
  const { user, loading: authLoading, accessState } = useAuth();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin' && user?.status === 'approved';

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getPendingUsers();
      setPending(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pending users');
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      refresh();
    } else {
      setLoading(false);
    }
  }, [isAdmin, refresh]);

  const handleApprove = async (uid: string) => {
    setApprovingId(uid);
    setError(null);
    try {
      await approveUser(uid);
      setPending((prev) => prev.filter((u) => u.uid !== uid));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || accessState !== 'approved' || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">
            Pending approvals
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Click Approve to give them dashboard access.
        </p>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/20 py-12 text-center text-muted-foreground">
            No pending users.
          </div>
        ) : (
          <ul className="space-y-2">
            {pending.map((u) => (
              <li
                key={u.uid}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3"
              >
                <span className="font-medium text-foreground truncate">
                  {u.email || '(no email)'}
                </span>
                <Button
                  size="sm"
                  onClick={() => handleApprove(u.uid)}
                  disabled={approvingId === u.uid}
                >
                  {approvingId === u.uid ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <Button variant="outline" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
