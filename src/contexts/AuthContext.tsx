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
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import * as authService from '@/services/auth';
import { getFirestoreUser, ensureBootstrapAdmin, parseUserDocFromData } from '@/services/userProfile';
import { loadUserData, saveUserData } from '@/services/userData';
import { migrateLocalStorageToFirestore } from '@/services/migration';
import type { UserRole, UserStatus } from '@/types/auth';

export type AccessState = 'unauthenticated' | 'blocked' | 'pending' | 'approved';

export interface AuthUser {
  id: string;
  email: string;
  major: string | null;
  role: UserRole;
  status: UserStatus;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  /** Resolved after auth + Firestore user doc are loaded. */
  accessState: AccessState;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setMajor: (major: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toAuthUser(
  uid: string,
  email: string,
  doc: { role: UserRole; status: UserStatus; major?: string | null }
): AuthUser {
  return {
    id: uid,
    email,
    major: doc.major ?? null,
    role: doc.role,
    status: doc.status,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessState, setAccessState] = useState<AccessState>('unauthenticated');
  const [loading, setLoading] = useState(true);
  const migrationDone = useRef(false);
  const unsubSnapshotRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fb) => {
      unsubSnapshotRef.current?.();
      unsubSnapshotRef.current = null;
      setFbUser(fb);
      if (!fb) {
        setUser(null);
        setAccessState('unauthenticated');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let profile = await getFirestoreUser(fb.uid);
        if (!profile) {
          setUser(null);
          setAccessState('blocked');
          setLoading(false);
          return;
        }

        if (profile.status === 'pending' && profile.role !== 'admin') {
          const updated = await ensureBootstrapAdmin(fb.uid, fb.email ?? null);
          if (updated) {
            profile = await getFirestoreUser(fb.uid);
            if (!profile) {
              setUser(null);
              setAccessState('blocked');
              setLoading(false);
              return;
            }
          }
        }

        if (!migrationDone.current) {
          migrationDone.current = true;
          try {
            await migrateLocalStorageToFirestore(fb.uid);
          } catch (e) {
            console.error('Migration failed:', e);
          }
        }

        let major = profile.major ?? null;
        try {
          const data = await loadUserData(fb.uid);
          major = major ?? (data.major as string | null | undefined) ?? null;
        } catch (_) {
          // use profile.major only
        }
        setUser(
          toAuthUser(fb.uid, fb.email ?? profile.email ?? '', {
            ...profile,
            major,
          })
        );
        setAccessState(profile.status === 'approved' ? 'approved' : 'pending');

        const userDocRef = doc(db, 'users', fb.uid);
        unsubSnapshotRef.current = onSnapshot(userDocRef, (snap) => {
          if (!snap.exists()) return;
          const nextProfile = parseUserDocFromData(snap.data() ?? {});
          setUser((prev) =>
            prev
              ? toAuthUser(fb.uid, fb.email ?? nextProfile.email ?? prev.email, {
                  ...nextProfile,
                  major: nextProfile.major ?? prev.major,
                })
              : null
          );
          setAccessState(nextProfile.status === 'approved' ? 'approved' : 'pending');
        });
      } catch (e) {
        console.error('Auth profile load failed:', e);
        setUser(null);
        setAccessState('blocked');
      } finally {
        setLoading(false);
      }
    });
    return () => {
      unsub();
      unsubSnapshotRef.current?.();
      unsubSnapshotRef.current = null;
    };
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
    setUser((prev) => (prev ? { ...prev, major: m } : null));
    const u = auth.currentUser;
    if (u) {
      saveUserData(u.uid, { major: m }).catch((e) =>
        console.error('setMajor save:', e)
      );
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessState,
        signIn,
        signUp,
        signOut,
        setMajor,
      }}
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
