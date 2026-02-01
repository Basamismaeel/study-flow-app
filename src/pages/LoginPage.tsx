import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { resetPassword } from '@/services/auth';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, accessState, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  if (user && accessState === 'approved') {
    return <Navigate to={user.major ? '/' : '/select-major'} replace />;
  }
  if (user && accessState === 'pending') {
    return <Navigate to="/pending" replace />;
  }
  if (user && accessState === 'blocked') {
    return <Navigate to="/blocked" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (isSignUp) {
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else {
      if (!password) {
        setError('Password is required.');
        return;
      }
    }
    setLoading(true);
    const result = isSignUp
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      if (isSignUp) {
        navigate('/pending', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailToUse = forgotPassword ? email.trim() : '';
    if (!emailToUse) {
      setError('Email is required.');
      return;
    }
    setLoading(true);
    const result = await resetPassword(emailToUse);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setResetSent(true);
      setResetEmail(emailToUse);
      setError('');
    }
  };

  if (forgotPassword) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Mail className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Reset password</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {resetSent ? 'Check your email' : 'We’ll email you a reset link.'}
            </p>
          </div>
          {resetSent ? (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                We sent a link to <span className="font-medium text-foreground">{resetEmail}</span>. Click it to set a new password.
              </p>
              <p className="text-xs text-center text-muted-foreground">
                Can’t find it? Check spam.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setForgotPassword(false);
                  setResetSent(false);
                  setResetEmail('');
                  setError('');
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send reset link'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setForgotPassword(false);
                  setError('');
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to sign in
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-foreground"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Tracker</h1>
          <p className="text-muted-foreground mt-1">
            {isSignUp ? 'Create an account' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5"
            />
            {!isSignUp && (
              <button
                type="button"
                onClick={() => {
                  setForgotPassword(true);
                  setError('');
                }}
                className="text-sm text-primary font-medium hover:underline mt-1.5 block"
              >
                Forgot password?
              </button>
            )}
          </div>
          {isSignUp && (
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5"
              />
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignUp ? (
              'Create account'
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setConfirmPassword('');
            }}
            className="text-primary font-medium hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}
