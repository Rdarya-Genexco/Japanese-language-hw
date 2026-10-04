import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import {
  getUserData, saveUserData, upsertClassroomMember, leaveClassroom, getClassroom, getClassroomMember,
} from '../utils/firestoreService'

const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const { user } = useAuth()
  const [role, setRole] = useState(null)
  const [classroomCode, setClassroomCode] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const [roleError, setRoleError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  // Drops the code if the class was deleted or the teacher removed this student;
  // otherwise backfills/refreshes the member record. Errors (e.g. offline) leave everything as is.
  async function syncMembership(u, code) {
    try {
      const [room, member] = await Promise.all([getClassroom(code), getClassroomMember(code, u.uid)])
      if (!room || member?.removed) {
        await saveUserData(u.uid, { classroomCode: null })
        setClassroomCode(null)
        return
      }
      await upsertClassroomMember(code, u)
    } catch (err) {
      console.warn('[Role] class membership sync skipped', err)
    }
  }

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
    setRoleError(null)
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
        if (r === 'student' && savedCode) syncMembership(user, savedCode)
      })
      // Not "no role": offline or Firestore trouble. Don't send them to role-select to overwrite it.
      .catch(err => {
        console.error('[Role] could not load profile', err)
        setRoleError(err)
      })
      .finally(() => setRoleLoading(false))
  }, [user?.uid, user?.isAnonymous, attempt])

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
    <RoleContext.Provider value={{ role, roleLoading, roleError, retryRole: () => setAttempt(a => a + 1), saveRole, classroomCode, saveClassroomCode }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
