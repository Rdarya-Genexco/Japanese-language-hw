export const GRACE_DAYS = 10
const DAY_MS = 24 * 60 * 60 * 1000

/** A 'YYYY-MM-DD' due date means the end of that day in the teacher's local time. */
export function dueDateToTimes(dueDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate || '')
  if (!m) return null
  const dueAt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999)
  const closesAt = new Date(dueAt)
  closesAt.setDate(closesAt.getDate() + GRACE_DAYS)
  return { dueAt, closesAt }
}

/**
 * 'none' (no due date) | 'open' (before due) | 'overdue' (past due, still accepting for GRACE_DAYS)
 * | 'closed'. Uses the stored dueAt/closesAt when present; older assignments only have dueDate.
 */
export function dueStatus(assignment, now = Date.now()) {
  const fallback = dueDateToTimes(assignment?.dueDate)
  const dueMs = assignment?.dueAt?.seconds ? assignment.dueAt.seconds * 1000 : fallback?.dueAt.getTime()
  if (!dueMs) return { state: 'none' }
  const closesMs = assignment?.closesAt?.seconds ? assignment.closesAt.seconds * 1000 : fallback?.closesAt.getTime() ?? dueMs + GRACE_DAYS * DAY_MS
  if (now <= dueMs) return { state: 'open', dueMs, closesMs }
  if (now <= closesMs) return { state: 'overdue', dueMs, closesMs, daysLeft: Math.max(1, Math.ceil((closesMs - now) / DAY_MS)) }
  return { state: 'closed', dueMs, closesMs }
}

export function overdueText(status) {
  if (status.state === 'overdue') return `Overdue — submissions close in ${status.daysLeft} day${status.daysLeft !== 1 ? 's' : ''}`
  if (status.state === 'closed') return 'Closed — the deadline has passed'
  return ''
}
