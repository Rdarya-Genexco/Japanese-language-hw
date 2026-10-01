import { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { createAssignment } from '../utils/firestoreService'
import { useAuth } from '../contexts/AuthContext'

export default function AssignmentModal({ classroomCode, onClose, onCreated }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!title.trim()) { setError('Please enter a title.'); return }
    setSaving(true); setError('')
    try {
      const id = await createAssignment(
        classroomCode,
        user.uid,
        title.trim(),
        description.trim(),
        dueDate || null,
      )
      onCreated?.({ id, title: title.trim(), description: description.trim(), dueDate: dueDate || null })
      onClose()
    } catch (err) {
      setError('Failed to create: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 pt-5 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">New Assignment</h2>
            <p className="text-white/70 text-xs mt-0.5">Post to classroom {classroomCode}</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <X size={15} className="text-white" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setError('') }}
              placeholder="e.g. Chapter 3 Vocabulary"
              className="input w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Instructions or notes for students..."
              rows={3}
              className="input w-full resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Due Date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="input w-full"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center text-sm">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !title.trim()}
              className="btn-primary flex-1 justify-center text-sm"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
