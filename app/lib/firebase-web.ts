import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const WEB_APP_NAME = "web-readonly";

const webApp =
  getApps().find((a) => a.name === WEB_APP_NAME) ??
  initializeApp(
    {
      apiKey: import.meta.env.VITE_WEB_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_WEB_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_WEB_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_WEB_FIREBASE_APP_ID,
    },
    WEB_APP_NAME
  );

export const webDb = getFirestore(webApp);
