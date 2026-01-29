import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '@/firebase';
import * as authService from '@/services/auth';
import { loadUserData, saveUserData } from '@/services/userData';
import { migrateLocalStorageToFirestore } from '@/services/migration';

export interface AuthUser {
  id: string;
  email: string;
  major: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setMajor: (major: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toAuthUser(fb: User, major: string | null): AuthUser {
  return {
    id: fb.uid,
    email: fb.email ?? '',
    major,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [major, setMajorState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const migrationDone = useRef(false);

  const user: AuthUser | null =
    fbUser && fbUser.email
      ? toAuthUser(fbUser, major)
      : null;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fb) => {
      setFbUser(fb);
      if (!fb) {
        setMajorState(null);
        setLoading(false);
        return;
      }

      if (!migrationDone.current) {
        migrationDone.current = true;
        try {
          await migrateLocalStorageToFirestore(fb.uid);
        } catch (e) {
          console.error('Migration failed:', e);
        }
      }

      try {
        const data = await loadUserData(fb.uid);
        const m = (data.major as string | null | undefined) ?? null;
        setMajorState(m);
      } catch {
        setMajorState(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const res = await authService.login(email, password);
      if ('error' in res) return { error: res.error };
      return { error: null };
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const res = await authService.signUp(email, password);
      if ('error' in res) return { error: res.error };
      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const setMajor = useCallback((value: string) => {
    const m = value.trim() || null;
    setMajorState(m);
    const u = auth.currentUser;
    if (u) {
      saveUserData(u.uid, { major: m }).catch((e) =>
        console.error('setMajor save:', e)
      );
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, setMajor }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
