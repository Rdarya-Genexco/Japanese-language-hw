import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, signInAnonymously } from 'firebase/auth'
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
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
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

  const loginAnonymous = async () => {
    await signInAnonymously(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, loginAnonymous }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
