import { getApp, getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isBrowser = typeof window !== "undefined";

// En SPA mode React Router renderiza en build-time para generar `index.html`.
// Evitamos inicializar Firebase Auth/Firestore en Node durante el build.
const app = isBrowser ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const auth: Auth = (isBrowser ? getAuth(app!) : (null as unknown as Auth));
export const db: Firestore = (isBrowser ? getFirestore(app!) : (null as unknown as Firestore));

if (isBrowser && import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  } catch (_) {}
}

export default app;

