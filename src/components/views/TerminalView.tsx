import { useEffect, useRef, useState } from 'react'
import { Play, SquareTerminal, Trash } from 'lucide-react'
import { cn, copyText, uid } from '../../lib/cn'
import { Badge } from '../ui/controls'
import { Button } from '../ui/Button'
import { ViewFrame } from './ViewFrame'

type LineKind = 'cmd' | 'out' | 'dim' | 'ok' | 'err'

interface Line {
  id: string
  kind: LineKind
  text: string
}

const PROMPT = 'nexora@workspace:~$'
const CWD = 'C:\\Users\\yuvar\\OneDrive\\Desktop\\NEXORA'

const WELCOME: Line[] = [
  { id: 'w1', kind: 'dim', text: 'NEXORA sandbox terminal · simulated shell' },
  { id: 'w2', kind: 'dim', text: "Type 'help' for commands. Real execution arrives with the desktop agent." },
  { id: 'w3', kind: 'out', text: '' },
]

const KIND_CLASS: Record<LineKind, string> = {
  cmd: 'text-[rgb(var(--ink))]',
  out: 'text-[rgb(var(--ink-muted))]',
  dim: 'term-dim',
  ok: 'term-ok',
  err: 'term-err',
}

export function TerminalView({ onRun }: { onRun: (prompt: string) => void }) {
  const [lines, setLines] = useState<Line[]>(WELCOME)
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const element = outputRef.current
    if (!element) return
    element.scrollTop = element.scrollHeight
  }, [lines])

  const push = (...entries: Array<{ kind: LineKind; text: string }>) => {
    setLines((current) => [...current, ...entries.map((entry) => ({ id: uid(), ...entry }))])
  }

  const execute = (raw: string) => {
    const command = raw.trim()
    if (!command) return

    push({ kind: 'cmd', text: `${PROMPT} ${command}` })
    setHistory((current) => [...current, command])
    setHistoryIndex(null)

    const [name, ...rest] = command.split(/\s+/)
    const argument = rest.join(' ')
    const cmd = (name ?? '').toLowerCase()

    switch (cmd) {
      case 'help':
        push(
          { kind: 'ok', text: 'Available commands' },
          { kind: 'out', text: '  help            show this list' },
          { kind: 'out', text: '  ls, dir         list workspace files' },
          { kind: 'out', text: '  pwd             print working directory' },
          { kind: 'out', text: '  echo <text>     print text' },
          { kind: 'out', text: '  date            current date and time' },
          { kind: 'out', text: '  whoami          current user' },
          { kind: 'out', text: '  nexora          agent status' },
          { kind: 'out', text: '  copy            copy the session output' },
          { kind: 'out', text: '  clear, cls      clear the screen' },
          { kind: 'out', text: '  agent <prompt>  hand a task to NEXORA' },
        )
        break
      case 'ls':
      case 'dir':
        push(
          { kind: 'out', text: 'src/' },
          { kind: 'out', text: 'public/' },
          { kind: 'out', text: 'package.json       1.1 KB' },
          { kind: 'out', text: 'vite.config.ts     0.2 KB' },
          { kind: 'out', text: 'tsconfig.json      0.6 KB' },
          { kind: 'out', text: 'README.md          3.4 KB' },
        )
        break
      case 'pwd':
        push({ kind: 'out', text: CWD })
        break
      case 'echo':
        push({ kind: 'out', text: argument || '' })
        break
      case 'date':
        push({ kind: 'out', text: new Date().toString() })
        break
      case 'whoami':
        push({ kind: 'out', text: 'yuvar' })
        break
      case 'nexora':
        push(
          { kind: 'ok', text: 'NEXORA 0.1.0 · waterglass preview' },
          { kind: 'out', text: 'agent: simulated transport' },
          { kind: 'out', text: 'model: Claude Sonnet 4.5' },
          { kind: 'out', text: 'safety: ask before risky commands' },
        )
        break
      case 'agent':
        if (!argument) {
          push({ kind: 'err', text: 'usage: agent <prompt>' })
        } else {
          push({ kind: 'ok', text: 'Dispatching to NEXORA…' })
          onRun(argument)
        }
        break
      case 'clear':
      case 'cls':
        setLines([])
        return
      case 'copy': {
        const text = lines.map((line) => line.text).join('\n')
        void copyText(text).then((ok) => {
          setCopied(ok)
          if (ok) window.setTimeout(() => setCopied(false), 1500)
          push({
            kind: ok ? 'dim' : 'err',
            text: ok ? 'Session output copied.' : 'Clipboard blocked by the browser.',
          })
        })
        break
      }
      default:
        push({ kind: 'err', text: `${name}: command not found — type 'help' for the list` })
    }

    push({ kind: 'out', text: '' })
  }

  return (
    <ViewFrame
      title="Terminal"
      subtitle="A safe, sandboxed shell surface. Every real command will be classified and audited."
      action={
        <div className="flex items-center gap-2">
          {copied ? <Badge tone="success">Copied</Badge> : null}
          <Button variant="ghost" size="sm" onClick={() => setLines([])}>
            <Trash size={13} strokeWidth={1.8} />
            Clear
          </Button>
        </div>
      }
    >
      <div className="code-surface flex min-h-[440px] flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-[rgb(255_255_255/0.08)] px-4 py-2.5">
          <span className="flex items-center gap-2 text-[11px] text-[rgb(160_190_210)]">
            <SquareTerminal size={13} />
            workspace — powershell
          </span>
          <span className="flex items-center gap-1.5 text-[10.5px] text-[rgb(160_190_210)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--success))]" />
            sandboxed
          </span>
        </div>

        <div ref={outputRef} className="scroll-slim min-h-0 flex-1 overflow-y-auto p-4">
          {lines.map((line) => (
            <p key={line.id} className={cn('term-line', KIND_CLASS[line.kind])}>
              {line.text || '\u00A0'}
            </p>
          ))}
        </div>

        <form
          className="flex items-center gap-2 border-t border-[rgb(255_255_255/0.08)] px-4 py-2.5"
          onClick={() => inputRef.current?.focus()}
          onSubmit={(event) => {
            event.preventDefault()
            execute(value)
            setValue('')
          }}
        >
          <span className="shrink-0 font-mono text-[12px] text-[rgb(var(--success))]">{PROMPT}</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                if (!history.length) return
                const nextIndex = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1)
                setHistoryIndex(nextIndex)
                setValue(history[nextIndex] ?? '')
              }
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                if (historyIndex === null) return
                const nextIndex = historyIndex + 1
                if (nextIndex >= history.length) {
                  setHistoryIndex(null)
                  setValue('')
                } else {
                  setHistoryIndex(nextIndex)
                  setValue(history[nextIndex] ?? '')
                }
              }
            }}
            aria-label="Terminal input"
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent font-mono text-[12.5px] text-[rgb(230_248_255)] outline-none placeholder:text-[rgb(130_165_190)]"
            placeholder="type a command…"
          />
          <Button variant="subtle" size="sm" type="submit" aria-label="Run command" className="shrink-0">
            <Play size={12} strokeWidth={2} />
            Run
          </Button>
        </form>
      </div>
    </ViewFrame>
  )
}
