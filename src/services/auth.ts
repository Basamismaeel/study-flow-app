import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
      email: user.email,
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
