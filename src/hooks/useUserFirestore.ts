import { useState, useEffect, useCallback, useRef } from 'react';
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
 * Saves to BOTH so data persists even if Firestore fails.
 * Uses a ref to avoid stale closure issues.
 */
export function useUserFirestore<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void | Promise<void>] {
  const { user } = useAuth();
  const userId = user?.id;
  
  // Initialize from localStorage synchronously for immediate fresh data
  const getInitialValue = (): T => {
    if (!userId) return initialValue;
    return readFromLocalStorage(userId, key, initialValue);
  };
  
  const [stored, setStored] = useState<T>(getInitialValue);
  
  // Keep a ref with the latest value to avoid stale closures
  const storedRef = useRef<T>(stored);
  storedRef.current = stored;

  useEffect(() => {
    if (!userId) {
      setStored(initialValue);
      storedRef.current = initialValue;
      return;
    }
    // Read fresh from localStorage on every mount
    const lsFallback = readFromLocalStorage(userId, key, initialValue);
    setStored(lsFallback);
    storedRef.current = lsFallback;

    // Then try Firestore (may have newer data from other devices)
    loadUserData(userId)
      .then((data) => {
        const raw = data[key];
        if (raw !== undefined && raw !== null) {
          if (Array.isArray(initialValue) && !Array.isArray(raw)) {
            return;
          }
          setStored(raw as T);
          storedRef.current = raw as T;
        }
      })
      .catch(() => {});
  }, [userId, key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)): void | Promise<void> => {
      // Always read from localStorage first to get absolute latest
      const currentFromStorage = userId 
        ? readFromLocalStorage(userId, key, storedRef.current)
        : storedRef.current;
      
      // Compute next value using the freshest data
      const next = typeof value === 'function' 
        ? (value as (p: T) => T)(currentFromStorage) 
        : value;
      
      // Update state and ref
      setStored(next);
      storedRef.current = next;

      if (userId) {
        // Write to localStorage immediately
        writeToLocalStorage(userId, key, next);
        // Write to Firestore in background
        return saveUserData(userId, { [key]: next }).catch((e) => {
          console.error(`useUserFirestore write "${key}":`, e);
        }) as Promise<void>;
      }
    },
    [userId, key]
  );

  return [stored, setValue];
}
