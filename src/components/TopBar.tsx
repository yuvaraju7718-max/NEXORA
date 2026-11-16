import { ChevronRight, Cpu, PanelRight } from 'lucide-react'
import type { OrbState, ViewId } from '../types'
import { Button } from './ui/Button'

const TITLES: Record<ViewId, { title: string; subtitle: string }> = {
  home: { title: 'Workspace', subtitle: 'Command, build and automate with a single prompt.' },
  'new-chat': { title: 'Workspace', subtitle: 'Start something new.' },
  projects: { title: 'Projects', subtitle: 'Everything NEXORA is building for you.' },
  browser: { title: 'Browser', subtitle: 'Controlled browsing and page extraction.' },
  files: { title: 'File Manager', subtitle: 'Inspect and navigate your workspace.' },
  terminal: { title: 'Terminal', subtitle: 'Run commands inside the workspace sandbox.' },
  history: { title: 'Task History', subtitle: 'Every run, with status and duration.' },
  settings: { title: 'Settings', subtitle: 'Model, autonomy and appearance.' },
  'api-key': { title: 'API Key', subtitle: 'Connect NEXORA to your model provider.' },
}

const STATUS_LABEL: Record<OrbState, string> = {
  idle: 'Ready',
  listening: 'Listening',
  thinking: 'Thinking',
  executing: 'Executing',
  completed: 'Completed',
}

export function TopBar({
  view,
  status,
  modelLabel,
  onOpenSettings,
  onTogglePanel,
}: {
  view: ViewId
  status: OrbState
  modelLabel: string
  onOpenSettings: () => void
  onTogglePanel: () => void
}) {
  const meta = TITLES[view]
  const live = status === 'thinking' || status === 'executing' || status === 'listening'

  return (
    <header className="flex shrink-0 items-start justify-between gap-4 px-1">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.22em] text-muted">
          <span>NEXORA</span>
          <ChevronRight size={11} strokeWidth={2} />
          <span className="text-[rgb(var(--ink))]">{meta.title}</span>
        </div>
        <h1 className="display mt-1 truncate text-[22px] sm:text-[24px]">{meta.title}</h1>
        <p className="mt-0.5 hidden truncate text-[12.5px] text-muted sm:block">{meta.subtitle}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="glass glass-flat hidden items-center gap-2 rounded-full px-3 py-1.5 sm:flex">
          <span className="status-dot" data-live={live} />
          <span className="text-[12px] text-[rgb(var(--ink))]">{STATUS_LABEL[status]}</span>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="glass glass-flat glass-hover hidden items-center gap-2 rounded-full px-3 py-1.5 text-[12px] text-muted transition-colors hover:text-[rgb(var(--ink))] lg:flex"
          title="Change model"
        >
          <Cpu size={14} strokeWidth={1.7} className="text-[rgb(var(--accent))]" />
          <span className="max-w-[140px] truncate">{modelLabel}</span>
        </button>
        <Button variant="glass" size="icon" onClick={onTogglePanel} aria-label="Toggle task panel" title="Task panel" className="xl:hidden">
          <PanelRight size={17} strokeWidth={1.7} />
        </Button>
      </div>
    </header>
  )
}
