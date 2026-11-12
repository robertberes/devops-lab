import { LayoutDashboard, Server, Settings, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/servers', label: 'Servers', icon: Server, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

export default function Sidebar({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-16 items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Server className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-zinc-100">Mini CMDB</p>
            <p className="text-[11px] text-zinc-500">Infrastructure inventory</p>
          </div>
        </div>
        {onClose && (
          <button type="button" aria-label="Close menu" onClick={onClose} className="text-zinc-400 hover:text-zinc-100 md:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
              }`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <p className="px-5 py-4 text-[11px] text-zinc-600">v0.1.0</p>
    </div>
  )
}
