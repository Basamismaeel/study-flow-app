# Admin setup (approval-based access)

## First-time admin

Only users you approve can access the dashboard. To become the first admin:

### 1. Bootstrap admin email

1. **Firestore rules**  
   In `firestore.rules`, replace `REPLACE_WITH_YOUR_ADMIN_EMAIL` with your actual email (the one you use to sign in):

   ```
   request.auth.token.email == 'your-email@example.com'
   ```

2. **Environment (optional, for client-side bootstrap)**  
   In `.env` (create from `.env.example` if needed), set:

   ```
   VITE_ADMIN_EMAIL=your-email@example.com
   ```

   The app uses this to automatically set your Firestore user document to `role: 'admin'` and `status: 'approved'` when you sign in with that email. This only runs if your doc exists and your status is still `pending`.

3. **Sign up or sign in**  
   Sign up (or sign in) with that email.  
   - If you use the env variable: on first load after sign-in, the app will call Firestore to set your user doc to `role: 'admin'` and `status: 'approved'`. You will then have access to the dashboard and the admin page.  
   - If you don’t use the env variable: set your user document manually in the Firebase Console (see below).

### 2. Manual first admin (no env / no rules bootstrap)

1. Sign up with your email.
2. In Firebase Console → Firestore → `users` → open the document whose ID is your user UID.
3. Set:
   - `role`: `"admin"`
   - `status`: `"approved"`
4. Reload the app; you will have dashboard and admin access.

---

## Removing the bootstrap after setup

The bootstrap is only for creating the **first** admin. After that you can lock it down.

### Option A: Remove from Firestore rules

1. Open `firestore.rules`.
2. Remove the whole bootstrap condition (the line that contains `REPLACE_WITH_YOUR_ADMIN_EMAIL` and `request.resource.data.role == 'admin'`).
3. Keep only:
   - Users can update their own doc **without** changing `role` or `status`.
   - Admins (already set in Firestore) can update other users.

So the `allow update` block should look like:

```
allow update: if request.auth != null && (
  (request.auth.uid == userId && request.resource.data.role == resource.data.role && request.resource.data.status == resource.data.status)
  || (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' && request.auth.uid != userId)
);
```

4. Deploy rules: `firebase deploy --only firestore:rules`

### Option B: Remove from the app

1. In `src/services/userProfile.ts`, remove or disable the `ensureBootstrapAdmin` function (or stop calling it from `AuthContext`).
2. In `.env`, remove `VITE_ADMIN_EMAIL` so no one can bootstrap via the client.

After this, new admins can only be created by:
- Manually editing a user document in Firestore (`role: 'admin'`, `status: 'approved'`), or  
- Adding a proper admin-only “promote user” feature that uses Admin SDK or a trusted backend.

---

## Admin page

- **URL:** `/admin`
- **Access:** Only users with `role === 'admin'` and `status === 'approved'`.
- **Usage:** Lists users with `status === 'pending'` and lets you click “Approve” to set their status to `approved`.

Add a link to `/admin` in your app’s nav (e.g. in the layout) for admins only, so you can open the approval page easily.
