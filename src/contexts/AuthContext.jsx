import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, signInAnonymously, signInWithCredential, GoogleAuthProvider, reauthenticateWithPopup, deleteUser } from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config'
import { useLang } from './LanguageContext'

const AuthContext = createContext(null)

const MOCK_USER = { uid: 'test-uid-123', displayName: 'Rishi Dev', email: 'rishi@genexco.in', photoURL: null }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { langCode } = useLang()

  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.search.includes('mock=1')) {
      setUser(MOCK_USER); setLoading(false); return
    }

    // Handle redirect result from Google sign-in
    getRedirectResult(auth).catch(() => {}) // swallow — onAuthStateChanged handles the user

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    // Desktop app (Electron): Google blocks sign-in inside embedded windows, so sign-in happens in
    // the system browser (/desktop-auth) and the Google ID token comes back through the desktop bridge.
    const offDesktop = window.docTranslateDesktop?.onGoogleIdToken(async (idToken) => {
      try {
        await signInWithCredential(auth, GoogleAuthProvider.credential(idToken))
      } catch (err) {
        console.error('[Auth] desktop sign-in failed', err)
      }
    })
    return () => { unsubscribe(); offDesktop?.() }
  }, [])

  const signInWithGoogle = async () => {
    if (window.docTranslateDesktop) {
      await window.docTranslateDesktop.startGoogleSignIn(langCode)
      return
    }
    // Show Google's sign-in page in the language picked in the app (hl = Google's UI language)
    googleProvider.setCustomParameters({ hl: langCode })
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      const code = err?.code || ''
      // Closing the popup is the user cancelling, not a failure
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
      // Browsers that block popups get the full-page redirect flow instead
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, googleProvider)
        return
      }
      throw err
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  /**
   * Deletes the account: a fresh Google sign-in first (Firebase requires a recent one to delete a user,
   * and doing it up front means data is never deleted while the sign-in survives), then the caller's
   * data, then the sign-in itself.
   */
  const deleteAccount = async (deleteData) => {
    const current = auth.currentUser
    if (!current) { // mock/test mode has no Firebase user
      await deleteData()
      setUser(null)
      return
    }
    // The desktop app can't open Google's popup; Firebase may then refuse deleteUser below
    if (!window.docTranslateDesktop) await reauthenticateWithPopup(current, googleProvider)
    await deleteData()
    try {
      await deleteUser(current)
    } catch (err) {
      // Data is already gone; never leave the user signed in to an empty account
      await signOut(auth)
      if (err.code !== 'auth/requires-recent-login') throw err
    }
  }

  const loginAnonymous = async () => {
    await signInAnonymously(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, loginAnonymous, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
