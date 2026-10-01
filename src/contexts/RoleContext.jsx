import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getUserRole, saveUserRole } from '../utils/firestoreService'

const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const { user } = useAuth()
  const [role, setRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setRole(null)
      setRoleLoading(false)
      return
    }
    if (user.isAnonymous) {
      setRole('student')
      setRoleLoading(false)
      return
    }

    setRoleLoading(true)
    getUserRole(user.uid)
      .then(async (r) => {
        if (r) {
          setRole(r)
          return r
        }
        // Check sessionStorage for pendingRole set from login page
        const pending = sessionStorage.getItem('pendingRole')
        if (pending === 'student' || pending === 'teacher') {
          sessionStorage.removeItem('pendingRole')
          await saveUserRole(user.uid, pending).catch(() => {})
          setRole(pending)
          return pending
        }
        setRole(null)
        return null
      })
      .catch(() => setRole(null))
      .finally(() => setRoleLoading(false))
  }, [user?.uid, user?.isAnonymous])

  useEffect(() => {
    if (role) {
      document.documentElement.dataset.role = role
    } else {
      delete document.documentElement.dataset.role
    }
  }, [role])

  const saveRole = async (newRole) => {
    if (user && !user.isAnonymous) {
      await saveUserRole(user.uid, newRole)
    }
    setRole(newRole)
  }

  return (
    <RoleContext.Provider value={{ role, roleLoading, saveRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
