import { getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const config =
  typeof window === "undefined" ? undefined : window.__MANUS_CONFIG__?.firebase;

export const isFirebaseConfigured = Boolean(
  config?.apiKey && config.authDomain && config.projectId && config.appId
);

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured || !config) return null;
  if (authInstance) return authInstance;

  const existingApp = getApps().find(app => app.name === "ravishka-lms-auth");
  const app = existingApp ?? initializeApp(config, "ravishka-lms-auth");
  authInstance = getAuth(app);
  return authInstance;
}

export const firebaseAuth = getFirebaseAuth();
