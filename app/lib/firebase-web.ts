import { initializeApp, getApps, getApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";

const WEB_APP_NAME = "web-readonly";

const isBrowser = typeof window !== "undefined";

const webApp = isBrowser
  ? getApps().find((a) => a.name === WEB_APP_NAME) ??
    initializeApp(
      {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      },
      WEB_APP_NAME
    )
  : null;

export const webDb: Firestore = (isBrowser ? getFirestore(webApp!) : (null as unknown as Firestore));
