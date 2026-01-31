import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import type { FirestoreUserDoc, UserRole, UserStatus } from '@/types/auth';

const USERS_COLLECTION = 'users';

/**
 * Fetch the Firestore user document for a given UID.
 * Returns null if the document does not exist.
 */
function normalizeRole(raw: unknown): UserRole {
  const s = typeof raw === 'string' ? raw.toLowerCase().trim() : '';
  return s === 'admin' ? 'admin' : 'user';
}

function normalizeStatus(raw: unknown): UserStatus {
  const s = typeof raw === 'string' ? raw.toLowerCase().trim() : '';
  return s === 'approved' ? 'approved' : 'pending';
}

/** Parse raw Firestore document data into FirestoreUserDoc (for use in onSnapshot). */
export function parseUserDocFromData(data: Record<string, unknown>): FirestoreUserDoc {
  return {
    email: (data.email as string) ?? '',
    role: normalizeRole(data.role),
    status: normalizeStatus(data.status),
    createdAt: data.createdAt,
    major: (data.major as string | null | undefined) ?? null,
  };
}

export async function getFirestoreUser(
  uid: string
): Promise<FirestoreUserDoc | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return parseUserDocFromData(snap.data() ?? {});
}

/**
 * Temporary bootstrap: if the logged-in user's email matches VITE_ADMIN_EMAIL,
 * set their role to "admin" and status to "approved" so they can access the admin page.
 * Call this only after confirming the user doc exists.
 * Remove this after creating your first admin (see ADMIN_SETUP.md or README).
 */
export async function ensureBootstrapAdmin(
  uid: string,
  email: string | null
): Promise<boolean> {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
  if (!adminEmail || !email || email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) {
    return false;
  }
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    role: 'admin',
    status: 'approved',
  });
  return true;
}
