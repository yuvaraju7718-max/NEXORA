import { useCallback, useEffect, useRef, useState } from 'react'
import type { AgentTask, ChatMessage, OrbState } from '../types'
import { runAgent, type AgentRun } from '../lib/agent'
import { uid } from '../lib/cn'

export interface UseAgent {
  messages: ChatMessage[]
  task: AgentTask | null
  status: OrbState
  busy: boolean
  send: (prompt: string) => void
  cancel: () => void
  reset: () => void
}

export function useAgent(): UseAgent {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [task, setTask] = useState<AgentTask | null>(null)
  const [status, setStatus] = useState<OrbState>('idle')
  const [busy, setBusy] = useState(false)

  const runRef = useRef<AgentRun | null>(null)
  const busyRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      runRef.current?.cancel()
    }
  }, [])

  const send = useCallback((raw: string) => {
    const prompt = raw.trim()
    if (!prompt || busyRef.current) return

    const assistantId = uid()
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: 'user', content: prompt, createdAt: Date.now() },
      { id: assistantId, role: 'assistant', content: '', createdAt: Date.now(), streaming: true },
    ])

    busyRef.current = true
    setBusy(true)
    runRef.current?.cancel()

    runRef.current = runAgent(prompt, {
      onStatus: (next) => {
        if (mountedRef.current) setStatus(next)
      },
      onTask: (next) => {
        if (mountedRef.current) setTask(next)
      },
      onToken: (delta) => {
        if (!mountedRef.current) return
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId ? { ...message, content: message.content + delta } : message,
          ),
        )
      },
      onDone: () => {
        if (!mountedRef.current) return
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId ? { ...message, streaming: false } : message,
          ),
        )
        busyRef.current = false
        setBusy(false)
        setStatus('idle')
      },
      onError: (message) => {
        if (!mountedRef.current) return
        setMessages((prev) =>
          prev.map((item) =>
            item.id === assistantId
              ? { ...item, content: item.content || `Something went wrong — ${message}`, streaming: false }
              : item,
          ),
        )
        busyRef.current = false
        setBusy(false)
        setStatus('idle')
      },
    })
  }, [])

  const cancel = useCallback(() => {
    runRef.current?.cancel()
    busyRef.current = false
    setBusy(false)
    setStatus('idle')
    setTask((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        status: 'error',
        error: 'Cancelled by user',
        activity: 'Execution stopped',
        steps: prev.steps.map((step) =>
          step.status === 'running' ? { ...step, status: 'error' } : step,
        ),
      }
    })
    setMessages((prev) =>
      prev.map((message) =>
        message.streaming
          ? {
              ...message,
              content: message.content || 'Run stopped before the response started.',
              streaming: false,
            }
          : message,
      ),
    )
  }, [])

  const reset = useCallback(() => {
    runRef.current?.cancel()
    busyRef.current = false
    setMessages([])
    setTask(null)
    setStatus('idle')
    setBusy(false)
  }, [])

  return { messages, task, status, busy, send, cancel, reset }
}
