import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

export interface AuthUser {
  id: string;
  email: string;
  /** Selected major; null until user completes major selection. Medicine = special locked case. */
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

const USERS_KEY = 'study-flow-auth-users';
const CURRENT_KEY = 'study-flow-auth-current';

function hashPassword(password: string): string {
  let h = 5381;
  for (let i = 0; i < password.length; i++) {
    h = ((h << 5) + h) + password.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

type UserRecord = { id: string; passwordHash: string; major?: string | null };

function getUsers(): Record<string, UserRecord> {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setUsers(users: Record<string, UserRecord>) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(CURRENT_KEY);
    return parseStoredUser(raw);
  } catch {
    return null;
  }
}

function setCurrentUser(user: AuthUser | null) {
  if (user) {
    window.localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(CURRENT_KEY);
  }
}

/** Parse stored user; ensure major field exists (legacy users get null). */
function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const id = typeof parsed.id === 'string' ? parsed.id : '';
    const email = typeof parsed.email === 'string' ? parsed.email : '';
    if (!id || !email) return null;
    const major = typeof parsed.major === 'string' ? parsed.major : (parsed.major === null ? null : null);
    return { id, email, major: major ?? null };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = getCurrentUser();
    if (current) {
      const users = getUsers();
      const record = users[current.email];
      const major = record?.major ?? current.major ?? null;
      const synced: AuthUser = { ...current, major };
      if (major !== current.major) setCurrentUser(synced);
      setUser(synced);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const users = getUsers();
      const normalized = email.trim().toLowerCase();
      const record = users[normalized];
      if (!record) return { error: 'No account with this email.' };
      if (record.passwordHash !== hashPassword(password)) return { error: 'Wrong password.' };
      const major = record.major ?? null;
      const authUser: AuthUser = { id: record.id, email: normalized, major };
      setCurrentUser(authUser);
      setUser(authUser);
      return { error: null };
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const trimmed = email.trim();
      if (!trimmed) return { error: 'Email is required.' };
      if (!password || password.length < 6) return { error: 'Password must be at least 6 characters.' };

      const users = getUsers();
      const normalized = trimmed.toLowerCase();
      if (users[normalized]) return { error: 'An account with this email already exists.' };
      const id = crypto.randomUUID();
      users[normalized] = { id, passwordHash: hashPassword(password) };
      setUsers(users);
      const authUser: AuthUser = { id, email: normalized, major: null };
      setCurrentUser(authUser);
      setUser(authUser);
      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    setCurrentUser(null);
    setUser(null);
  }, []);

  const setMajor = useCallback((major: string) => {
    const value = major.trim();
    setUser((prev) => {
      if (!prev) return prev;
      const newMajor = (value || prev.major) ?? null;
      const updated: AuthUser = { ...prev, major: newMajor };
      setCurrentUser(updated);
      const users = getUsers();
      const record = users[prev.email];
      if (record) {
        users[prev.email] = { ...record, major: newMajor };
        setUsers(users);
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, setMajor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
