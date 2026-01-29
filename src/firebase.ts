import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC3XTdCbP1WRa9EDZcrQipy98at5ndBp2A',
  authDomain: 'study-flow-app-1dc8b.firebaseapp.com',
  projectId: 'study-flow-app-1dc8b',
  storageBucket: 'study-flow-app-1dc8b.firebasestorage.app',
  messagingSenderId: '544297771360',
  appId: '1:544297771360:web:c0ac6d0938c9750de4be05',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
