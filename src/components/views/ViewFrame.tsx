import type { ReactNode } from 'react'
import { PageHeader } from '../ui/controls'

export function ViewFrame({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="glass flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-5 pt-5">
        <PageHeader title={title} subtitle={subtitle} action={action} />
      </div>
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
    </section>
  )
}
