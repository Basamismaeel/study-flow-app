/**
 * Firestore user document (users/{uid}).
 * Used for approval-based access: status must be "approved" to access the dashboard.
 */
export type UserRole = 'user' | 'admin';
export type UserStatus = 'pending' | 'approved';

export interface FirestoreUserDoc {
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: unknown; // Firestore serverTimestamp()
  /** Optional: major selection (existing app data). */
  major?: string | null;
}
