import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export async function saveUserData(
  uid: string,
  data: Record<string, unknown>
): Promise<void> {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

export async function loadUserData(
  uid: string
): Promise<Record<string, unknown>> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return {};
  return (snap.data() ?? {}) as Record<string, unknown>;
}
