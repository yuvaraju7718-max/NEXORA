import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Braces,
  FolderSearch,
  Globe,
  LayoutTemplate,
  MessageSquare,
  SquareTerminal,
  type LucideIcon,
} from 'lucide-react'
import type { UseAgent } from '../hooks/useAgent'
import { Orb } from './Orb'
import { ChatStream } from './ChatStream'
import { CommandComposer } from './CommandComposer'
import { Button } from './ui/Button'

const SUGGESTIONS: Array<{ label: string; icon: LucideIcon; prompt: string }> = [
  { label: 'Build a website', icon: LayoutTemplate, prompt: 'Build a portfolio website' },
  { label: 'Create a Python project', icon: Braces, prompt: 'Create a Python project with tests' },
  { label: 'Analyze my files', icon: FolderSearch, prompt: 'Analyze my workspace files' },
  { label: 'Automate a browser task', icon: Globe, prompt: 'Automate a browser task' },
  { label: 'Execute a terminal command', icon: SquareTerminal, prompt: 'Execute a terminal command' },
]

export function Workspace({
  agent,
  draft,
  onDraftChange,
  listening,
  onListeningChange,
}: {
  agent: UseAgent
  draft: string
  onDraftChange: (value: string) => void
  listening: boolean
  onListeningChange: (listening: boolean) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(null)

  const empty = agent.messages.length === 0
  const orbState = listening ? 'listening' : agent.status

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
  }, [agent.messages, agent.busy])

  useEffect(() => {
    if (!notice) return
    const handle = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(handle)
  }, [notice])

  const notify = (message: string) => setNotice({ id: Date.now(), message })

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="scroll-slim min-h-0 flex-1 overflow-y-auto pr-1">
        {empty ? (
          <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-7 px-4 py-6 text-center">
            <Orb state={orbState} size={224} />

            <div className="max-w-xl">
              <p className="eyebrow mb-2">NEXORA · Waterglass Agent</p>
              <h2 className="display text-[28px] leading-tight sm:text-[34px]">
                Hello! I&apos;m your <span className="text-water">AI Agent</span>.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
                What would you like me to build or automate today?
              </p>
            </div>
          </div>
        ) : (
          <ChatStream messages={agent.messages} status={agent.status} />
        )}
      </div>

      <div className="shrink-0 pt-3">
        <div className="mx-auto w-full max-w-[880px]">
          <CommandComposer
            value={draft}
            onChange={onDraftChange}
            onSend={agent.send}
            onStop={agent.cancel}
            busy={agent.busy}
            listening={listening}
            onListeningChange={onListeningChange}
            onNotice={notify}
          />

          {empty ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {SUGGESTIONS.map(({ label, icon: Icon, prompt }) => (
                <button
                  key={label}
                  type="button"
                  className="chip"
                  onClick={() => agent.send(prompt)}
                >
                  <Icon size={14} strokeWidth={1.7} className="text-[rgb(var(--accent))]" />
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-2.5 flex items-center justify-between px-1">
              <p className="text-[11.5px] text-muted">
                {agent.busy ? 'NEXORA is working — you can stop it any time.' : 'Run complete. Ask a follow-up anytime.'}
              </p>
              <Button variant="ghost" size="sm" onClick={agent.reset}>
                <MessageSquare size={13} strokeWidth={1.8} />
                New chat
              </Button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {notice ? (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="glass glass-strong pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-[12px]"
            role="status"
          >
            {notice.message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
