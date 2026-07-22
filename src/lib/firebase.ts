import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import type { Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB2cY3GL9smlYOv0fdOiBaL94qBQ6tVyTk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'resume-feab6.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://resume-feab6-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'resume-feab6',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'resume-feab6.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '616430157839',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:616430157839:web:75d546a5fb2fda5608637a',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-31SR9TLGGL',
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)

let analyticsInstance: Promise<Analytics | null> | null = null

export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (!analyticsInstance) {
    analyticsInstance = import('firebase/analytics')
      .then(async ({ getAnalytics, isSupported }) => await isSupported() ? getAnalytics(firebaseApp) : null)
      .catch(() => null)
  }
  return analyticsInstance
}

export async function trackFirebaseEvent(name: string, parameters?: Record<string, string | number | boolean>) {
  const analytics = await getFirebaseAnalytics()
  if (analytics) {
    const { logEvent } = await import('firebase/analytics')
    logEvent(analytics, name, parameters)
  }
}
