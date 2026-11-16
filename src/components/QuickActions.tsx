import { FolderOpen, Globe, Plus, Sparkles, SquareTerminal, type LucideIcon } from 'lucide-react'
import type { ViewId } from '../types'

const ACTIONS: Array<{ label: string; hint: string; icon: LucideIcon; target: ViewId }> = [
  { label: 'Create project', hint: 'Scaffold something new', icon: Plus, target: 'projects' },
  { label: 'Open browser', hint: 'Controlled browsing', icon: Globe, target: 'browser' },
  { label: 'Run terminal', hint: 'Sandboxed shell', icon: SquareTerminal, target: 'terminal' },
  { label: 'Manage files', hint: 'Inspect the workspace', icon: FolderOpen, target: 'files' },
  { label: 'Explore models', hint: 'Pick your engine', icon: Sparkles, target: 'settings' },
]

export function QuickActions({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {ACTIONS.map(({ label, hint, icon: Icon, target }) => (
        <button key={label} type="button" className="quick-action" onClick={() => onNavigate(target)}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[rgb(var(--glass-border)/0.16)] bg-[rgb(var(--glass-tint)/0.07)] text-[rgb(var(--accent))]">
            <Icon size={15} strokeWidth={1.8} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] font-medium text-[rgb(var(--ink))]">{label}</span>
            <span className="block truncate text-[10.5px] text-muted">{hint}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
