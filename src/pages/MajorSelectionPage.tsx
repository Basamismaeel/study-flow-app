import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Briefcase, Code2, Scale, Stethoscope, MoreHorizontal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PREDEFINED_MAJORS = [
  { id: 'medicine', label: 'Medicine', icon: Stethoscope, locked: true },
  { id: 'engineering', label: 'Engineering', icon: BookOpen, locked: false },
  { id: 'business', label: 'Business', icon: Briefcase, locked: false },
  { id: 'computer-science', label: 'Computer Science', icon: Code2, locked: false },
  { id: 'law', label: 'Law', icon: Scale, locked: false },
] as const;

/** Brief delay so auth state can settle after sign-up (avoids redirect-to-login race). */
const AUTH_SETTLE_MS = 400;

export function MajorSelectionPage() {
  const navigate = useNavigate();
  const { user, accessState, setMajor } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [otherValue, setOtherValue] = useState('');
  const [error, setError] = useState('');
  const [authSettled, setAuthSettled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAuthSettled(true), AUTH_SETTLE_MS);
    return () => clearTimeout(t);
  }, []);

  if (!user) {
    if (!authSettled) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }
    return <Navigate to="/login" replace />;
  }
  if (accessState === 'pending') return <Navigate to="/pending" replace />;
  if (accessState === 'blocked') return <Navigate to="/blocked" replace />;
  if (accessState !== 'approved') return <Navigate to="/login" replace />;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setOtherValue('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (selectedId === 'other') {
      const custom = otherValue.trim();
      if (!custom) {
        setError('Please enter your major.');
        return;
      }
      setMajor(custom);
    } else if (selectedId) {
      const predefined = PREDEFINED_MAJORS.find((m) => m.id === selectedId);
      setMajor(predefined ? predefined.label : selectedId);
    } else {
      setError('Please select a major.');
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Choose your major</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pick one to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            {PREDEFINED_MAJORS.map(({ id, label, icon: Icon, locked }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSelect(id)}
                className={cn(
                  'flex items-center gap-3 w-full p-4 rounded-xl border-2 text-left transition-all',
                  selectedId === id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-muted-foreground/30',
                  locked && 'opacity-100'
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </span>
                <span className="font-medium text-foreground">{label}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => handleSelect('other')}
              className={cn(
                'flex items-center gap-3 w-full p-4 rounded-xl border-2 text-left transition-all',
                selectedId === 'other'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-muted-foreground/30'
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </span>
              <span className="font-medium text-foreground">Other</span>
            </button>
          </div>

          {selectedId === 'other' && (
            <div className="pt-2">
              <Label htmlFor="other-major">Your major</Label>
              <Input
                id="other-major"
                value={otherValue}
                onChange={(e) => setOtherValue(e.target.value)}
                placeholder="e.g. Psychology, Architecture"
                className="mt-1.5"
                autoFocus
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
