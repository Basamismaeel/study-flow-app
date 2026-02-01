import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loadUserData, saveUserData } from '@/services/userData';

const LS_PREFIX = 'study-flow-user-';

function localStorageKey(uid: string, key: string): string {
  return `${LS_PREFIX}${uid}-${key}`;
}

function readFromLocalStorage<T>(uid: string, key: string, initialValue: T): T {
  try {
    const raw = localStorage.getItem(localStorageKey(uid, key));
    if (raw == null) return initialValue;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(initialValue) && !Array.isArray(parsed)) return initialValue;
    return parsed as T;
  } catch {
    return initialValue;
  }
}

function writeToLocalStorage(uid: string, key: string, value: unknown): void {
  try {
    localStorage.setItem(localStorageKey(uid, key), JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * User-scoped persistence: Firestore (users/{uid}/app/data) + localStorage fallback.
 * Saves to BOTH so goals persist when you leave and come back even if Firestore fails.
 * Load: try Firestore first; if empty, use localStorage.
 */
export function useUserFirestore<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void | Promise<void>] {
  const { user } = useAuth();
  const [stored, setStored] = useState<T>(initialValue);

  useEffect(() => {
    if (!user) {
      setStored(initialValue);
      return;
    }
    const lsFallback = readFromLocalStorage(user.id, key, initialValue);

    loadUserData(user.id)
      .then((data) => {
        const raw = data[key];
        if (raw !== undefined && raw !== null) {
          if (Array.isArray(initialValue) && !Array.isArray(raw)) {
            setStored(lsFallback);
            return;
          }
          setStored(raw as T);
          return;
        }
        setStored(lsFallback);
      })
      .catch(() => setStored(lsFallback));
  }, [user?.id, key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)): void | Promise<void> => {
      const next = typeof value === 'function' ? (value as (p: T) => T)(stored) : value;
      setStored(next);

      if (user) {
        writeToLocalStorage(user.id, key, next);
        return saveUserData(user.id, { [key]: next }).catch((e) => {
          console.error(`useUserFirestore write "${key}":`, e);
        }) as Promise<void>;
      }
    },
    [user?.id, key, stored]
  );

  return [stored, setValue];
}
