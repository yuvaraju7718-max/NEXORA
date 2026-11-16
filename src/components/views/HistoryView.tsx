import { useState } from 'react'
import { ChevronDown, CircleCheck, CircleX, ClockArrowUp, LoaderCircle, Play } from 'lucide-react'
import { HISTORY, type HistoryItem } from '../../lib/mock'
import type { StepStatus } from '../../types'
import { cn } from '../../lib/cn'
import { Badge } from '../ui/controls'
import { Button } from '../ui/Button'
import { ViewFrame } from './ViewFrame'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'running', label: 'Running' },
  { id: 'error', label: 'Failed' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

const STATUS_TONE = {
  pending: 'neutral',
  running: 'accent',
  completed: 'success',
  error: 'danger',
} as const

const STATUS_LABEL: Record<StepStatus, string> = {
  pending: 'Queued',
  running: 'Running',
  completed: 'Completed',
  error: 'Failed',
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'completed') return <CircleCheck size={15} className="text-[rgb(var(--success))]" />
  if (status === 'running') return <LoaderCircle size={15} className="spin-slow text-[rgb(var(--accent))]" />
  if (status === 'error') return <CircleX size={15} className="text-[rgb(var(--danger))]" />
  return <ClockArrowUp size={15} className="text-muted" />
}

function HistoryRow({ item, onRun }: { item: HistoryItem; onRun: (prompt: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="glass glass-flat glass-hover rounded-2xl">
      <div className="flex items-center gap-3 p-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[rgb(var(--glass-border)/0.16)] bg-[rgb(var(--glass-tint)/0.06)]">
          <StatusIcon status={item.status} />
        </span>

        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-[13px] font-medium">{item.title}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {item.when} · {item.duration} · {item.steps} steps · {item.model}
          </p>
        </button>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
          <Button variant="ghost" size="icon" onClick={() => onRun(item.title)} aria-label="Run again" title="Run again">
            <Play size={13} strokeWidth={2} />
          </Button>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-[rgb(var(--glass-tint)/0.07)] hover:text-[rgb(var(--ink))]"
          >
            <ChevronDown size={15} className={cn('transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-[rgb(var(--glass-border)/0.1)] px-3.5 py-3">
          <p className="text-[12.5px] leading-relaxed text-muted">{item.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="accent">{item.model}</Badge>
            <Badge>{item.duration}</Badge>
            <Badge>{item.steps} steps</Badge>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function HistoryView({ onRun }: { onRun: (prompt: string) => void }) {
  const [filter, setFilter] = useState<FilterId>('all')

  const items = filter === 'all' ? HISTORY : HISTORY.filter((item) => item.status === filter)

  return (
    <ViewFrame
      title="Task History"
      subtitle="Every run NEXORA has performed, with status, duration and a re-run shortcut."
    >
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[11.5px] transition-colors',
              filter === option.id
                ? 'border-[rgb(var(--accent)/0.35)] bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--ink))]'
                : 'border-[rgb(var(--glass-border)/0.16)] text-muted hover:text-[rgb(var(--ink))]',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <HistoryRow key={item.id} item={item} onRun={onRun} />
        ))}
        {items.length === 0 ? (
          <p className="py-10 text-center text-[12.5px] text-muted">No runs match this filter.</p>
        ) : null}
      </div>
    </ViewFrame>
  )
}
