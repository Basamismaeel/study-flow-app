import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

/** Profile-only keys on the main user doc; everything else is app data. */
const PROFILE_KEYS = new Set(['email', 'role', 'status', 'createdAt']);

function appDataRef(uid: string) {
  return doc(db, 'users', uid, 'app', 'data');
}

/**
 * Loads all app data from users/{uid}/app/data.
 * If app/data is empty, one-time migrates app keys from the main user doc into app/data.
 */
export async function loadUserData(
  uid: string
): Promise<Record<string, unknown>> {
  const appRef = appDataRef(uid);
  const snap = await getDoc(appRef);
  if (snap.exists()) {
    const data = snap.data() as Record<string, unknown>;
    if (Object.keys(data).length > 0) return data;
  }

  const mainRef = doc(db, 'users', uid);
  const mainSnap = await getDoc(mainRef);
  if (!mainSnap.exists()) return {};
  const mainData = mainSnap.data() as Record<string, unknown>;
  const appData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(mainData)) {
    if (!PROFILE_KEYS.has(k) && v !== undefined) appData[k] = v;
  }
  if (Object.keys(appData).length > 0) {
    await setDoc(appRef, appData, { merge: true });
  }
  return appData;
}

/**
 * Saves app data by merging the given keys into users/{uid}/app/data.
 * Uses a separate document so writes are not blocked by user profile security rules.
 */
export async function saveUserData(
  uid: string,
  data: Record<string, unknown>
): Promise<void> {
  const ref = appDataRef(uid);
  const existing = await getDoc(ref);
  const merged = existing.exists()
    ? { ...(existing.data() as Record<string, unknown>), ...data }
    : data;
  await setDoc(ref, merged, { merge: true });
}
