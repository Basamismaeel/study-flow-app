import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Same as useLocalStorage but key is scoped by current user id.
 * When not logged in, uses 'guest' so the hook doesn't break (e.g. during logout).
 */
export function useUserLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const { user } = useAuth();
  const storageKey = user ? `study-flow-${user.id}-${key}` : `study-flow-guest-${key}`;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${storageKey}":`, error);
      return initialValue;
    }
  });

  // When user changes (storageKey), load that user's data
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(storageKey);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (error) {
      console.error(`Error reading localStorage key "${storageKey}":`, error);
      setStoredValue(initialValue);
    }
  }, [storageKey]);

  // Persist when storedValue changes (storageKey not in deps so we don't write old data to new key on user switch)
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${storageKey}":`, error);
    }
  }, [storedValue]);

  return [storedValue, setStoredValue];
}
