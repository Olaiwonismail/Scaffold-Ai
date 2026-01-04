import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Only initialize when config is present to avoid runtime errors in CI
// Mock firebase if API key is missing to allow build/dev to start without crashing immediately on imports
const isMissingConfig = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY

let app: any;
let auth: any;

try {
  if (isMissingConfig) {
      console.warn("Firebase config missing, using mock auth")
      // @ts-ignore
      app = { name: "[DEFAULT]" }
      // @ts-ignore
      auth = {
          currentUser: null,
          onAuthStateChanged: (cb: any) => { cb(null); return () => {} },
          signInWithEmailAndPassword: () => Promise.reject("Mock Auth: No config"),
          signOut: () => Promise.resolve()
      }
  } else {
      app = getApps().length ? getApp() : initializeApp(firebaseConfig)
      auth = getAuth(app)
  }
} catch (e) {
    console.error("Firebase init failed", e)
}

export { auth }
export default app
