# Study Flow

Track study sessions, goals, and daily tasks.

## How to run locally

Requirements: Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

## Tech stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Firebase (Auth + Firestore) — auth and user data sync across devices. Run `npm install` to ensure the Firebase SDK is installed.

### Firebase & Firestore

Auth and user data live in Firebase. Deploy Firestore security rules (e.g. `firebase deploy --only firestore` if using Firebase CLI) so `firestore.rules` is active. Rules restrict `users/{uid}` to the signed-in user only.

## Deploy

Build: `npm run build`. Deploy the `dist` folder to your hosting (Vercel, Netlify, etc.). See `vercel.json` and `public/_redirects` for SPA routing.
