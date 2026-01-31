import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase';

const USERS_COLLECTION = 'users';

export interface PendingUser {
  uid: string;
  email: string;
  createdAt: unknown;
}

/**
 * Fetch all users where status === "pending".
 * Only call from admin context; Firestore rules will block non-admins from reading other users.
 */
export async function getPendingUsers(): Promise<PendingUser[]> {
  const q = query(
    collection(db, USERS_COLLECTION),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      email: data.email ?? '',
      createdAt: data.createdAt,
    };
  });
  list.sort((a, b) => {
    const ta = a.createdAt as { toMillis?: () => number } | null | undefined;
    const tb = b.createdAt as { toMillis?: () => number } | null | undefined;
    const ma = ta?.toMillis?.() ?? 0;
    const mb = tb?.toMillis?.() ?? 0;
    return mb - ma;
  });
  return list;
}

/**
 * Set a user's status to "approved". Only admins can call this (enforced by Firestore rules).
 */
export async function approveUser(uid: string): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), { status: 'approved' });
}
