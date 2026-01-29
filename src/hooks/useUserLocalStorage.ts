import { useUserFirestore } from '@/hooks/useUserFirestore';

/**
 * User-scoped persistence via Firestore (users/{uid}). Same API as before.
 * Keys map to Firestore fields under the user doc.
 */
export function useUserLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  return useUserFirestore(key, initialValue);
}
