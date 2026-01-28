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
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
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

function getUsers(): Record<string, { id: string; passwordHash: string }> {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setUsers(users: Record<string, { id: string; passwordHash: string }>) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(CURRENT_KEY);
    return raw ? JSON.parse(raw) : null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const users = getUsers();
      const normalized = email.trim().toLowerCase();
      const record = users[normalized];
      if (!record) return { error: 'No account with this email.' };
      if (record.passwordHash !== hashPassword(password)) return { error: 'Wrong password.' };
      const authUser: AuthUser = { id: record.id, email: normalized };
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
      const authUser: AuthUser = { id, email: normalized };
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

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
