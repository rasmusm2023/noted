import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

function getFirebaseApp(): FirebaseApp {
  if (getApps().length) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

function createBrowserFirebase() {
  if (typeof window === "undefined" || !isFirebaseConfigured) {
    return null;
  }
  const app = getFirebaseApp();
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
}

const browserFirebase = createBrowserFirebase();

export const auth = (browserFirebase?.auth ?? ({} as Auth));
export const db = (browserFirebase?.db ?? ({} as Firestore));
export default (browserFirebase?.app ?? ({} as FirebaseApp));
