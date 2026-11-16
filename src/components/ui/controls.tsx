import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-[rgb(var(--ink))]">{label}</span>
        {hint ? <span className="text-[11.5px] text-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-[rgb(var(--ink))]">{label}</p>
        {description ? <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        data-on={checked}
        className="toggle"
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  )
}

type BadgeTone = 'neutral' | 'accent' | 'success' | 'danger'

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn('badge', className)} data-tone={tone}>
      {children}
    </span>
  )
}

export function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string
  description?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="glass glass-flat rounded-[20px] p-5">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-medium">{title}</h3>
          {description ? <p className="mt-1 text-[12.5px] text-muted">{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="display text-[24px]">{title}</h2>
        {subtitle ? <p className="mt-1 max-w-xl text-[13px] text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  )
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[rgb(var(--glass-border)/0.18)] bg-[rgb(var(--glass-tint)/0.06)] text-[rgb(var(--accent))]">
        {icon}
      </div>
      <p className="text-[14px] font-medium">{title}</p>
      <p className="max-w-xs text-[12.5px] leading-relaxed text-muted">{description}</p>
    </div>
  )
}
