import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loadUserData, saveUserData } from '@/services/userData';
// #region agent log
import { debugLog } from '@/debugLog';
// #endregion

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
  
  // Initialize from localStorage when userId is available so we show saved data immediately
  const [stored, setStored] = useState<T>(() => {
    if (!userId) return initialValue;
    return readFromLocalStorage(userId, key, initialValue);
  });
  
  // Keep a ref with the latest value to avoid stale closures
  const storedRef = useRef<T>(stored);
  storedRef.current = stored;

  useEffect(() => {
    if (!userId) {
      setStored(initialValue);
      storedRef.current = initialValue;
      return;
    }
    
    // Rehydrate from localStorage on mount / userId change so refresh always shows saved data
    const lsFallback = readFromLocalStorage(userId, key, initialValue);
    setStored(lsFallback);
    storedRef.current = lsFallback;

    // #region agent log
    if (key === 'active-study-session') {
      const active = lsFallback as { startTime?: string } | null;
      debugLog({
        location: 'useUserFirestore.ts:effect',
        message: 'Effect ran — read from localStorage',
        data: { key, userId: userId.slice(0, 8), hasActive: !!active, startTime: active?.startTime ?? null },
        hypothesisId: 'H2,H5',
      });
    }
    // #endregion

    // Then try Firestore (may have newer data from other devices)
    loadUserData(userId)
      .then((data) => {
        let raw = data[key];
        // Backwards compat: migration used to save study-sessions under "user-{uid}-study-sessions"
        if (key === 'study-sessions' && (raw === undefined || raw === null)) {
          const legacyKey = `user-${userId}-study-sessions`;
          if (data[legacyKey] !== undefined && data[legacyKey] !== null) raw = data[legacyKey];
        }
        if (raw !== undefined && raw !== null) {
          if (Array.isArray(initialValue) && !Array.isArray(raw)) {
            return;
          }
          
          // study-sessions / yearly-goals: only accept Firestore when it has MORE items than localStorage.
          // Never overwrite with non-array or fewer so refresh always keeps local data (fixes goals not saving).
          if (key === 'study-sessions' || key === 'yearly-goals') {
            if (Array.isArray(raw) && Array.isArray(lsFallback) && raw.length > lsFallback.length) {
              setStored(raw as T);
              storedRef.current = raw as T;
            }
            return;
          }
          
          // Only update if Firestore has MORE data than localStorage
          if (Array.isArray(lsFallback) && Array.isArray(raw)) {
            if (raw.length > lsFallback.length) {
              setStored(raw as T);
              storedRef.current = raw as T;
            }
          } else {
            // FIX (H7): For active-study-session, never overwrite a running session from localStorage with Firestore.
            // Firestore can be stale (e.g. from another tab or an old write); startTime must stay immutable.
            if (key === 'active-study-session') {
              const localActive = lsFallback as { startTime?: string } | null;
              const fromF = raw as { startTime?: string } | null;
              const hasLocalSession = localActive && typeof localActive.startTime === 'string';
              if (hasLocalSession) {
                // #region agent log
                debugLog({
                  location: 'useUserFirestore.ts:effect',
                  message: 'Keeping localStorage active session (not overwriting with Firestore)',
                  data: { key, localStartTime: localActive.startTime ?? null },
                  hypothesisId: 'H7',
                });
                // #endregion
                // Keep lsFallback; do not overwrite with raw
                return;
              }
              // #region agent log
              debugLog({
                location: 'useUserFirestore.ts:effect',
                message: 'Applying Firestore data for active-study-session (no local session)',
                data: { key, startTime: fromF?.startTime ?? null },
                hypothesisId: 'H2,H7',
              });
              // #endregion
            }
            setStored(raw as T);
            storedRef.current = raw as T;
          }
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
      
      // #region agent log
      if (key === 'active-study-session') {
        const nextActive = next as { startTime?: string } | null;
        debugLog({
          location: 'useUserFirestore.ts:setValue',
          message: 'setValue called for active-study-session — writing to storage',
          data: { key, startTime: nextActive?.startTime ?? null },
          hypothesisId: 'H1,H4',
        });
      }
      // #endregion
      
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
