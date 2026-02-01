import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase';

export async function signUp(
  email: string,
  password: string
): Promise<{ user: User } | { error: string }> {
  const trimmed = email.trim();
  if (!trimmed) return { error: 'Email is required.' };
  if (!password || password.length < 6)
    return { error: 'Password must be at least 6 characters.' };

  try {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      trimmed.toLowerCase(),
      password
    );
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email ?? trimmed.toLowerCase(),
      role: 'user',
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return { user };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === 'auth/email-already-in-use')
      return { error: 'An account with this email already exists.' };
    if (err.code === 'auth/invalid-email') return { error: 'Invalid email.' };
    return { error: err.message ?? 'Sign up failed.' };
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ user: User } | { error: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { error: 'Email is required.' };
  if (!password) return { error: 'Password is required.' };

  try {
    const { user } = await signInWithEmailAndPassword(auth, normalized, password);
    return { user };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === 'auth/user-not-found')
      return { error: 'No account with this email.' };
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential')
      return { error: 'Wrong password.' };
    if (err.code === 'auth/invalid-email') return { error: 'Invalid email.' };
    return { error: err.message ?? 'Sign in failed.' };
  }
}

/**
 * Send a password reset email to the given address.
 * Firebase sends an email with a link to reset the password.
 */
export async function resetPassword(
  email: string
): Promise<{ ok: true } | { error: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { error: 'Email is required.' };

  try {
    await sendPasswordResetEmail(auth, trimmed);
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === 'auth/user-not-found')
      return { error: 'No account with this email.' };
    if (err.code === 'auth/invalid-email') return { error: 'Invalid email.' };
    if (err.code === 'auth/too-many-requests')
      return { error: 'Too many attempts. Try again later.' };
    return { error: err.message ?? 'Failed to send reset email.' };
  }
}
