import { useEffect, useState } from 'react'
import { Check, Circle, CircleX, Clock, LoaderCircle, ShieldCheck, Square, SquareTerminal, X } from 'lucide-react'
import type { AgentTask, OrbState, StepStatus } from '../types'
import { cn, formatElapsed } from '../lib/cn'
import { Orb } from './Orb'
import { Badge } from './ui/controls'
import { Button } from './ui/Button'

function useElapsed(start?: number, end?: number): string {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!start || end) return
    const handle = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(handle)
  }, [start, end])

  if (!start) return '—'
  return formatElapsed((end ?? now) - start)
}

function StepMarker({ status }: { status: StepStatus }) {
  if (status === 'completed') {
    return (
      <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border border-[rgb(var(--success)/0.35)] bg-[rgb(var(--success)/0.12)] text-[rgb(var(--success))]">
        <Check size={13} strokeWidth={2.4} />
      </span>
    )
  }
  if (status === 'running') {
    return (
      <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border border-[rgb(var(--accent)/0.4)] bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))]">
        <LoaderCircle size={14} className="spin-slow" />
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.12)] text-[rgb(var(--danger))]">
        <CircleX size={14} />
      </span>
    )
  }
  return (
    <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border border-[rgb(var(--glass-border)/0.18)] text-muted">
      <Circle size={7} fill="currentColor" />
    </span>
  )
}

const STATUS_TONE: Record<StepStatus, 'neutral' | 'accent' | 'success' | 'danger'> = {
  pending: 'neutral',
  running: 'accent',
  completed: 'success',
  error: 'danger',
}

const STATUS_TEXT: Record<StepStatus, string> = {
  pending: 'Queued',
  running: 'Running',
  completed: 'Completed',
  error: 'Failed',
}

export function TaskPanel({
  task,
  status,
  onCancel,
  onClose,
}: {
  task: AgentTask | null
  status: OrbState
  onCancel: () => void
  onClose?: () => void
}) {
  const elapsed = useElapsed(task?.startedAt, task?.finishedAt)
  const completed = task ? task.steps.filter((step) => step.status === 'completed').length : 0
  const total = task?.steps.length ?? 0
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const running = status === 'thinking' || status === 'executing'
  const activity = task?.activity ?? 'Preparing the workspace…'

  return (
    <aside className="glass flex h-full w-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[rgb(var(--glass-border)/0.12)] px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[12.5px] font-medium">Task execution</span>
          {task ? <Badge tone={STATUS_TONE[task.status]}>{STATUS_TEXT[task.status]}</Badge> : null}
        </div>
        {onClose ? (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close task panel">
            <X size={16} strokeWidth={1.8} />
          </Button>
        ) : (
          <span className="text-[10.5px] uppercase tracking-[0.16em] text-muted">Live</span>
        )}
      </header>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto p-4">
        {!task ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 py-10 text-center">
            <Orb state={status} size={104} />
            <div>
              <p className="text-[13.5px] font-medium">No task in flight</p>
              <p className="mx-auto mt-1 max-w-[220px] text-[12px] leading-relaxed text-muted">
                Send a command and NEXORA will stream every step here as it works.
              </p>
            </div>
            <div className="w-full space-y-2">
              {[
                { icon: ShieldCheck, label: 'Safety-gated tool calls' },
                { icon: Clock, label: 'Full audit trail' },
                { icon: SquareTerminal, label: 'Workspace sandbox' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-xl border border-[rgb(var(--glass-border)/0.12)] bg-[rgb(var(--glass-tint)/0.04)] px-3 py-2 text-left"
                >
                  <Icon size={14} strokeWidth={1.7} className="text-[rgb(var(--accent))]" />
                  <span className="text-[11.5px] text-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.18em] text-muted">Current task</p>
              <h3 className="mt-1 text-[15px] font-medium leading-snug">{task.title}</h3>
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-[11px] text-muted">Progress</span>
                <span className="text-[11.5px] font-medium text-[rgb(var(--accent-2))]">{progress}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.max(progress, task.status === 'running' ? 6 : 0)}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-[rgb(var(--glass-border)/0.12)] bg-[rgb(var(--glass-base)/0.35)] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Activity</p>
              <div className="mt-1 flex items-center gap-2">
                {running ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--accent))] animate-pulse" /> : null}
                <p className="truncate text-[12px] text-[rgb(var(--ink))]">{activity}</p>
              </div>
              {running ? <div className="shimmer-bar mt-2 h-[3px] w-full rounded-full" /> : null}
            </div>

            <div>
              <p className="mb-2.5 text-[10.5px] uppercase tracking-[0.18em] text-muted">Steps</p>
              <ol className="space-y-0">
                {task.steps.map((step, index) => (
                  <li key={step.id} className="relative flex gap-3 pb-3.5 last:pb-0">
                    {index < task.steps.length - 1 ? <span className="step-line" /> : null}
                    <StepMarker status={step.status} />
                    <div className="min-w-0 pt-0.5">
                      <p
                        className={cn(
                          'text-[12.5px] leading-snug',
                          step.status === 'pending' ? 'text-muted' : 'text-[rgb(var(--ink))]',
                        )}
                      >
                        {step.title}
                      </p>
                      {step.detail ? (
                        <p className="mt-0.5 truncate text-[11px] text-muted">{step.detail}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {task.error ? (
              <div className="rounded-xl border border-[rgb(var(--danger)/0.3)] bg-[rgb(var(--danger)/0.08)] px-3 py-2.5">
                <div className="flex items-center gap-2 text-[rgb(var(--danger))]">
                  <CircleX size={14} strokeWidth={2} />
                  <span className="text-[12px] font-medium">{task.error}</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {task ? (
        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-[rgb(var(--glass-border)/0.12)] px-4 py-3">
          <span className="text-[11.5px] text-muted">
            {completed}/{total} steps · {elapsed}
          </span>
          {running ? (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <Square size={12} strokeWidth={2.2} />
              Stop
            </Button>
          ) : (
            <Badge tone={task.status === 'error' ? 'danger' : 'success'}>{STATUS_TEXT[task.status]}</Badge>
          )}
        </footer>
      ) : null}
    </aside>
  )
}
