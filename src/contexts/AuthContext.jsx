import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, signInAnonymously } from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config'

const AuthContext = createContext(null)

const MOCK_USER = { uid: 'test-uid-123', displayName: 'Rishi Dev', email: 'rishi@genexco.in', photoURL: null }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('mock=1')) {
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
    try {
      // Try popup first (faster UX); fall back to redirect if browser blocks it
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      const code = err?.code || ''
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' ||
          code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider)
      } else {
        throw err
      }
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
