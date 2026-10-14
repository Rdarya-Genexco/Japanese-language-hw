import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Firebase web config comes from VITE_FIREBASE_* env vars (Netlify settings / local .env),
// not from code: Netlify's secret scan fails the build when their values appear in the repo.
//
// On the live site, sign-in runs through our own domain (netlify/edge-functions/firebase-auth.js
// proxies /__/auth/* to Firebase), so Google's account chooser names doc-translate.netlify.app.
// Elsewhere (localhost, deploy previews) the Firebase domain is used.
const LIVE_HOST = 'doc-translate.netlify.app'
const onLiveSite = typeof window !== 'undefined' && window.location.hostname === LIVE_HOST

export const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        onLiveSite ? LIVE_HOST : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export default app
