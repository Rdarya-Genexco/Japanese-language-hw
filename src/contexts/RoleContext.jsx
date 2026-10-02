import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getUserData, saveUserData, upsertClassroomMember, leaveClassroom } from '../utils/firestoreService'

const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const { user } = useAuth()
  const [role, setRole] = useState(null)
  const [classroomCode, setClassroomCode] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setRole(null)
      setClassroomCode(null)
      setRoleLoading(false)
      return
    }
    if (user.isAnonymous) {
      setRole('student')
      setRoleLoading(false)
      return
    }

    setRoleLoading(true)
    getUserData(user.uid)
      .then(async (doc) => {
        let r = doc?.role || null
        const savedCode = doc?.classroomCode || null

        if (!r) {
          const pending = sessionStorage.getItem('pendingRole')
          if (pending === 'student' || pending === 'teacher') {
            sessionStorage.removeItem('pendingRole')
            await saveUserData(user.uid, { role: pending }).catch(() => {})
            r = pending
          }
        }

        setRole(r)
        setClassroomCode(savedCode)
        // Backfills students who joined before member records existed; also refreshes their name/photo.
        if (r === 'student' && savedCode) {
          upsertClassroomMember(savedCode, user).catch(() => {})
        }
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
      await saveUserData(user.uid, { role: newRole })
    }
    setRole(newRole)
  }

  const saveClassroomCode = async (code) => {
    if (user && !user.isAnonymous) {
      await saveUserData(user.uid, { classroomCode: code })
      if (role === 'student') {
        if (classroomCode && classroomCode !== code) {
          await leaveClassroom(classroomCode, user.uid).catch(() => {})
        }
        await upsertClassroomMember(code, user, { joined: true })
          .catch(err => console.error('[Role] could not register class membership', err))
      }
    }
    setClassroomCode(code)
  }

  return (
    <RoleContext.Provider value={{ role, roleLoading, saveRole, classroomCode, saveClassroomCode }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
