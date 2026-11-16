import {
  ChevronsLeft,
  ChevronsRight,
  ClockArrowUp,
  FolderKanban,
  FolderOpen,
  Globe,
  House,
  MessageSquarePlus,
  Moon,
  Settings,
  SquareTerminal,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import type { ViewId } from '../types'
import { cn } from '../lib/cn'

const NAV: Array<{ id: ViewId; label: string; icon: LucideIcon }> = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'browser', label: 'Browser', icon: Globe },
  { id: 'files', label: 'File Manager', icon: FolderOpen },
  { id: 'terminal', label: 'Terminal', icon: SquareTerminal },
  { id: 'history', label: 'Task History', icon: ClockArrowUp },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function NavItem({
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active: boolean
  collapsed: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      title={collapsed ? label : undefined}
      className={cn('nav-item', collapsed && 'justify-center px-0')}
    >
      <Icon size={18} strokeWidth={1.7} className="shrink-0" />
      {!collapsed ? <span className="truncate">{label}</span> : null}
      {!collapsed && active ? (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))] shadow-[0_0_8px_2px_rgb(var(--accent)/0.6)]" />
      ) : null}
    </button>
  )
}

export function Sidebar({
  view,
  onNavigate,
  collapsed,
  onToggleCollapse,
  theme,
  onToggleTheme,
  modelLabel,
}: {
  view: ViewId
  onNavigate: (view: ViewId) => void
  collapsed: boolean
  onToggleCollapse: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  modelLabel: string
}) {
  return (
    <aside
      className={cn(
        'glass relative z-10 hidden shrink-0 flex-col overflow-hidden p-3 transition-[width] duration-300 ease-out md:flex',
        collapsed ? 'w-[76px]' : 'w-[250px]',
      )}
    >
      <div className={cn('flex items-center gap-3 px-1 pb-4 pt-1', collapsed && 'justify-center px-0')}>
        <div className="logo-mark" />
        {!collapsed ? (
          <div className="min-w-0">
            <p className="display text-[16px] tracking-[0.16em]">NEXORA</p>
            <p className="truncate text-[10px] uppercase tracking-[0.24em] text-muted">AI Agent OS</p>
          </div>
        ) : null}
      </div>

      <div className="hairline mb-3" />

      <button
        type="button"
        onClick={() => onNavigate('new-chat')}
        className={cn(
          'btn btn-glass btn-md mb-3 w-full justify-start gap-2.5 border-[rgb(var(--accent)/0.28)] bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--ink))]',
          collapsed && 'justify-center px-0',
        )}
        title={collapsed ? 'New chat' : undefined}
      >
        <MessageSquarePlus size={18} strokeWidth={1.7} />
        {!collapsed ? <span>New chat</span> : null}
      </button>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto scroll-slim">
        {NAV.map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            active={view === item.id}
            collapsed={collapsed}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      <div className="mt-3 shrink-0">
        <div className="hairline mb-3" />
        {!collapsed ? (
          <div className="mb-3 rounded-2xl border border-[rgb(var(--glass-border)/0.14)] bg-[rgb(var(--glass-tint)/0.05)] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Active model</p>
            <p className="mt-0.5 truncate text-[12.5px] font-medium">{modelLabel}</p>
          </div>
        ) : null}
        <div className={cn('flex items-center gap-1.5', collapsed && 'flex-col')}>
          <button
            type="button"
            onClick={onToggleTheme}
            className="btn btn-ghost btn-icon"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            {theme === 'dark' ? <Sun size={17} strokeWidth={1.7} /> : <Moon size={17} strokeWidth={1.7} />}
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="btn btn-ghost btn-icon"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronsRight size={17} strokeWidth={1.7} />
            ) : (
              <ChevronsLeft size={17} strokeWidth={1.7} />
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
