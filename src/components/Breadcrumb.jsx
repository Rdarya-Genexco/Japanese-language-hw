import { useNavigate } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumb({ items = [] }) {
  const navigate = useNavigate()

  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        const isRoot = item.id === 'root'

        return (
          <div key={item.id} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />}
            {isLast ? (
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
                {isRoot ? <><Home size={14} className="inline mr-1" />{item.name}</> : item.name}
              </span>
            ) : (
              <button
                onClick={() => navigate(isRoot ? '/' : `/folder/${item.id}`)}
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[120px] transition-colors"
              >
                {isRoot ? <><Home size={14} className="inline mr-1" />{item.name}</> : item.name}
              </button>
            )}
          </div>
        )
      })}
    </nav>
  )
}
