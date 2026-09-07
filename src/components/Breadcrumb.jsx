import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumb({ items = [], isDragTarget = false, onDropWorksheet }) {
  const navigate = useNavigate()
  const [dragOverId, setDragOverId] = useState(null)

  // ── Mouse drag handlers ──────────────────────────────────────────────────
  const handleDragOver = (e, itemId) => {
    if (!isDragTarget) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(itemId)
  }

  const handleDrop = (e, itemId) => {
    e.preventDefault()
    setDragOverId(null)
    const worksheetId = e.dataTransfer.getData('worksheetId')
    if (worksheetId) onDropWorksheet?.(worksheetId, itemId)
  }

  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        const isRoot = item.id === 'root'
        const isOver = isDragTarget && dragOverId === item.id

        return (
          <div key={item.id} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />}
            {isLast ? (
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
                {isRoot ? <><Home size={14} className="inline mr-1" />{item.name}</> : item.name}
              </span>
            ) : (
              <button
                data-folder-id={item.id}
                onClick={() => navigate(isRoot ? '/' : `/folder/${item.id}`)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => handleDrop(e, item.id)}
                className={`truncate max-w-[120px] transition-all px-2 py-0.5 rounded-lg ${
                  isOver
                    ? 'bg-violet-500 text-white font-semibold ring-2 ring-violet-300'
                    : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {isRoot ? <><Home size={14} className="inline mr-1" />{item.name}</> : item.name}
              </button>
            )}
          </div>
        )
      })}

      {/* Hint shown while dragging */}
      {isDragTarget && items.length > 1 && (
        <span className="ml-2 text-xs text-violet-400 dark:text-violet-500 italic flex-shrink-0">
          ← drop here to move up
        </span>
      )}
    </nav>
  )
}
