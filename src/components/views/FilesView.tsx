import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Folder,
  FolderOpen,
  Search,
} from 'lucide-react'
import { FILES, FILE_TREE, type FileRow, type TreeNode } from '../../lib/mock'
import { cn, copyText } from '../../lib/cn'
import { Badge } from '../ui/controls'
import { Button } from '../ui/Button'
import { ViewFrame } from './ViewFrame'

function TreeItem({
  node,
  path,
  depth,
  open,
  onToggle,
  activeName,
  onSelect,
}: {
  node: TreeNode
  path: string
  depth: number
  open: Set<string>
  onToggle: (path: string) => void
  activeName: string
  onSelect: (name: string) => void
}) {
  const fullPath = `${path}/${node.name}`
  const isOpen = open.has(fullPath)
  const isActive = node.kind === 'file' && node.name === activeName

  if (node.kind === 'folder') {
    return (
      <div>
        <button
          type="button"
          onClick={() => onToggle(fullPath)}
          className="flex h-7 w-full items-center gap-1.5 rounded-md pr-2 text-left text-[12px] text-muted transition-colors hover:bg-[rgb(var(--glass-tint)/0.06)] hover:text-[rgb(var(--ink))]"
          style={{ paddingLeft: 6 + depth * 12 }}
        >
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {isOpen ? (
            <FolderOpen size={13} className="shrink-0 text-[rgb(var(--accent))]" />
          ) : (
            <Folder size={13} className="shrink-0 text-[rgb(var(--accent)/0.8)]" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen
          ? node.children?.map((child) => (
              <TreeItem
                key={`${fullPath}/${child.name}`}
                node={child}
                path={fullPath}
                depth={depth + 1}
                open={open}
                onToggle={onToggle}
                activeName={activeName}
                onSelect={onSelect}
              />
            ))
          : null}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(node.name)}
      className={cn(
        'flex h-7 w-full items-center gap-1.5 rounded-md pr-2 text-left text-[12px] transition-colors',
        isActive
          ? 'bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--ink))]'
          : 'text-muted hover:bg-[rgb(var(--glass-tint)/0.06)] hover:text-[rgb(var(--ink))]',
      )}
      style={{ paddingLeft: 20 + depth * 12 }}
    >
      <FileText size={12} className="shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  )
}

function PreviewPanel({ file }: { file: FileRow }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const copy = async () => {
    const ok = await copyText(file.preview)
    setCopyState(ok ? 'copied' : 'failed')
    window.setTimeout(() => setCopyState('idle'), 1600)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{file.name}</p>
          <p className="mt-0.5 text-[10.5px] text-muted">
            {file.type} · {file.size}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={copy} aria-label="Copy preview" title="Copy">
          <Copy size={14} strokeWidth={1.7} />
        </Button>
      </div>
      {copyState !== 'idle' ? (
        <Badge tone={copyState === 'copied' ? 'success' : 'danger'} className="mt-2 w-fit">
          {copyState === 'copied' ? 'Copied' : 'Clipboard blocked'}
        </Badge>
      ) : null}
      <pre className="code-surface scroll-slim mt-3 max-h-[320px] flex-1 overflow-auto whitespace-pre-wrap p-3">
        {file.preview}
      </pre>
    </div>
  )
}

export function FilesView() {
  const [open, setOpen] = useState<Set<string>>(new Set(['root/src', 'root/src/components']))
  const [selectedId, setSelectedId] = useState(FILES[0]!.id)
  const [query, setQuery] = useState('')

  const selected = FILES.find((file) => file.id === selectedId) ?? FILES[0]!

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return FILES
    return FILES.filter(
      (file) => file.name.toLowerCase().includes(needle) || file.type.toLowerCase().includes(needle),
    )
  }, [query])

  const toggle = (path: string) => {
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <ViewFrame title="File Manager" subtitle="Inspect and navigate the workspace without leaving NEXORA.">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[200px_minmax(0,1fr)_320px]">
        <aside className="glass glass-flat hidden rounded-2xl p-2.5 xl:block">
          <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.18em] text-muted">Workspace</p>
          {FILE_TREE.map((node) => (
            <TreeItem
              key={node.name}
              node={node}
              path="root"
              depth={0}
              open={open}
              onToggle={toggle}
              activeName={selected.name}
              onSelect={(name) => {
                const match = FILES.find((file) => file.name === name)
                if (match) setSelectedId(match.id)
              }}
            />
          ))}
        </aside>

        <div className="glass glass-flat overflow-hidden rounded-2xl">
          <div className="flex items-center gap-2 border-b border-[rgb(var(--glass-border)/0.1)] px-3 py-2.5">
            <Search size={14} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter files…"
              aria-label="Filter files"
              className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-[rgb(var(--ink-muted)/0.7)]"
            />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_90px] gap-2 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted sm:grid-cols-[minmax(0,1fr)_110px_80px_96px]">
            <span>Name</span>
            <span className="hidden sm:block">Type</span>
            <span>Size</span>
            <span className="hidden sm:block">Modified</span>
          </div>

          <div className="max-h-[420px] overflow-y-auto scroll-slim">
            {filtered.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => setSelectedId(file.id)}
                className={cn(
                  'grid w-full grid-cols-[minmax(0,1fr)_90px] items-center gap-2 px-3 py-2 text-left text-[12.5px] transition-colors sm:grid-cols-[minmax(0,1fr)_110px_80px_96px]',
                  file.id === selectedId
                    ? 'bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--ink))]'
                    : 'text-muted hover:bg-[rgb(var(--glass-tint)/0.05)] hover:text-[rgb(var(--ink))]',
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {file.kind === 'folder' ? (
                    <Folder size={13} className="shrink-0 text-[rgb(var(--accent))]" />
                  ) : (
                    <FileText size={13} className="shrink-0" />
                  )}
                  <span className="truncate">{file.name}</span>
                </span>
                <span className="hidden truncate text-[11px] sm:block">{file.type}</span>
                <span className="text-[11px]">{file.size}</span>
                <span className="hidden truncate text-[11px] sm:block">{file.modified}</span>
              </button>
            ))}
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12px] text-muted">No files match that filter.</p>
            ) : null}
          </div>
        </div>

        <aside className="glass glass-flat hidden rounded-2xl p-4 lg:block">
          <PreviewPanel file={selected} />
        </aside>
      </div>

      <div className="glass glass-flat mt-3 rounded-2xl p-4 lg:hidden">
        <PreviewPanel file={selected} />
      </div>
    </ViewFrame>
  )
}
