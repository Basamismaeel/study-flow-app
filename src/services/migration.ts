import { saveUserData } from './userData';

const PREFIX = 'study-flow-';
const AUTH_USERS = 'study-flow-auth-users';
const AUTH_CURRENT = 'study-flow-auth-current';

/**
 * One-time migration: upload localStorage data to Firestore under users/{uid},
 * then clear localStorage. Run on first Firebase login when local data exists.
 */
export async function migrateLocalStorageToFirestore(
  uid: string
): Promise<void> {
  const payload: Record<string, unknown> = {};

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    if (key === AUTH_USERS || key === AUTH_CURRENT) continue;

    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) continue;
      const value = JSON.parse(raw) as unknown;

      const suffix = key.slice(PREFIX.length);
      // User-scoped keys: "user-{uid}-study-sessions" -> field "study-sessions" (app expects this)
      const userPrefix = `user-${uid}-`;
      let field: string;
      if (suffix.startsWith(userPrefix)) {
        field = suffix.slice(userPrefix.length);
      } else {
        const parts = suffix.split('-');
        const maybeUuid = parts[0] ?? '';
        const isUuid =
          maybeUuid.length === 8 &&
          /^[0-9a-f]+$/i.test(maybeUuid);
        field = isUuid && parts.length > 1
          ? parts.slice(1).join('-')
          : suffix;
      }

      if (payload[field] !== undefined) continue;
      payload[field] = value;
    } catch {
      /* skip invalid */
    }
  }

  if (Object.keys(payload).length === 0) return;

  await saveUserData(uid, payload);

  const toRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    toRemove.push(key);
  }
  toRemove.forEach((k) => window.localStorage.removeItem(k));
}
