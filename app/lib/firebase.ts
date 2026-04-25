import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_ADMIN_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_ADMIN_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_ADMIN_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_ADMIN_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
  } catch (_) {}
}

export default app;

