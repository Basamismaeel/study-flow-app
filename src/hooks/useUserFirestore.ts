import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loadUserData, saveUserData } from '@/services/userData';

/**
 * Firestore-backed user data. Same API as useUserLocalStorage but stores under users/{uid}.
 * When not logged in, uses in-memory state only (no persist).
 */
export function useUserFirestore<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const { user } = useAuth();
  const [stored, setStored] = useState<T>(initialValue);

  useEffect(() => {
    if (!user) {
      setStored(initialValue);
      return;
    }
    loadUserData(user.id)
      .then((data) => {
        const raw = data[key];
        if (raw === undefined || raw === null) {
          setStored(initialValue);
          return;
        }
        // Ensure arrays stay arrays (Firestore might return odd shapes)
        if (Array.isArray(initialValue) && !Array.isArray(raw)) {
          setStored(initialValue);
          return;
        }
        setStored(raw as T);
      })
      .catch(() => setStored(initialValue));
  }, [user?.id, key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
        if (user) {
          saveUserData(user.id, { [key]: next }).catch((e) =>
            console.error(`useUserFirestore write "${key}":`, e)
          );
        }
        return next;
      });
    },
    [user?.id, key]
  );

  return [stored, setValue];
}
