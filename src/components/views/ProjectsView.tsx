import { useMemo, useState } from 'react'
import { ArrowUpRight, FolderKanban, Plus, X } from 'lucide-react'
import { PROJECTS, type Project } from '../../lib/mock'
import { uid } from '../../lib/cn'
import { Badge, EmptyState, Field } from '../ui/controls'
import { Button } from '../ui/Button'
import { ViewFrame } from './ViewFrame'

const STATUS_TONE = {
  active: 'accent',
  paused: 'neutral',
  shipped: 'success',
} as const

const STATUS_LABEL = {
  active: 'Active',
  paused: 'Paused',
  shipped: 'Shipped',
} as const

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return (
    <article className="glass glass-flat glass-hover flex flex-col rounded-[20px] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--glass-border)/0.16)] bg-[rgb(var(--glass-tint)/0.07)] text-[rgb(var(--accent))]">
          <FolderKanban size={16} strokeWidth={1.7} />
        </span>
        <Badge tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</Badge>
      </div>

      <h3 className="text-[15px] font-medium leading-snug">{project.name}</h3>
      <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-muted">{project.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.stack.map((tech) => (
          <span
            key={tech}
            className="rounded-md border border-[rgb(var(--glass-border)/0.14)] bg-[rgb(var(--glass-tint)/0.05)] px-1.5 py-0.5 text-[10.5px] text-muted"
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[10.5px] text-muted">
          <span>Progress</span>
          <span className="text-[rgb(var(--accent-2))]">{project.progress}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill transition-[width] duration-700" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-[10.5px] text-muted">{project.updated}</span>
        <Button variant="subtle" size="sm" onClick={onOpen}>
          Open
          <ArrowUpRight size={13} strokeWidth={1.8} />
        </Button>
      </div>
    </article>
  )
}

export function ProjectsView({ onRun }: { onRun: (prompt: string) => void }) {
  const [projects, setProjects] = useState<Project[]>(PROJECTS)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return projects
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(needle) ||
        project.stack.some((tech) => tech.toLowerCase().includes(needle)),
    )
  }, [projects, query])

  const create = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setProjects((current) => [
      {
        id: uid(),
        name: trimmed,
        description: 'New project — describe the outcome and NEXORA will plan the steps.',
        stack: ['New'],
        progress: 0,
        updated: 'just now',
        status: 'active',
      },
      ...current,
    ])
    setName('')
    setCreating(false)
  }

  return (
    <ViewFrame
      title="Projects"
      subtitle="Everything NEXORA is building for you. Open one to continue in the workspace."
      action={
        <Button variant="primary" size="sm" onClick={() => setCreating((current) => !current)}>
          {creating ? <X size={14} strokeWidth={2} /> : <Plus size={14} strokeWidth={2} />}
          {creating ? 'Cancel' : 'New project'}
        </Button>
      }
    >
      {creating ? (
        <div className="glass glass-flat mb-4 rounded-2xl p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Project name" className="flex-1">
              <input
                className="field"
                value={name}
                autoFocus
                placeholder="e.g. Invoice dashboard"
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') create()
                }}
              />
            </Field>
            <Button variant="primary" size="md" onClick={create} disabled={!name.trim()}>
              Create project
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mb-4">
        <input
          className="field sm:max-w-xs"
          value={query}
          placeholder="Search projects or stacks…"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={18} />}
          title="No projects match"
          description="Try a different search, or create a new project to get started."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => onRun(`Continue working on the ${project.name} project`)}
            />
          ))}
        </div>
      )}
    </ViewFrame>
  )
}
