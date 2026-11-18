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

export interface AgentRunResult {
  title: string
  status: 'completed' | 'error'
  durationMs: number
  steps: number
  summary: string
}

export function useAgent(onRunEnd?: (result: AgentRunResult) => void): UseAgent {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [task, setTask] = useState<AgentTask | null>(null)
  const [status, setStatus] = useState<OrbState>('idle')
  const [busy, setBusy] = useState(false)

  const runRef = useRef<AgentRun | null>(null)
  const busyRef = useRef(false)
  const mountedRef = useRef(true)
  const taskRef = useRef<AgentTask | null>(null)
  const onRunEndRef = useRef(onRunEnd)
  const endRunRef = useRef<((status: 'completed' | 'error', summary: string) => void) | null>(null)

  useEffect(() => {
    onRunEndRef.current = onRunEnd
  }, [onRunEnd])

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
    let assistantText = ''
    let ended = false

    const recordEnd = (status: 'completed' | 'error', summary: string) => {
      if (ended) return
      ended = true
      endRunRef.current = null
      const current = taskRef.current
      const durationMs = current?.startedAt
        ? (current.finishedAt ?? Date.now()) - current.startedAt
        : 0
      onRunEndRef.current?.({
        title: current?.title ?? prompt,
        status,
        durationMs,
        steps: current?.steps.length ?? 0,
        summary,
      })
    }
    endRunRef.current = recordEnd

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
        taskRef.current = next
        if (mountedRef.current) setTask(next)
      },
      onToken: (delta) => {
        assistantText += delta
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
        recordEnd('completed', assistantText.trim() || 'Run complete.')
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
        recordEnd('error', message)
      },
    })
  }, [])

  const cancel = useCallback(() => {
    endRunRef.current?.('error', 'Cancelled by user')
    runRef.current?.cancel()
    busyRef.current = false
    setBusy(false)
    setStatus('idle')
    setTask((prev) => {
      if (!prev) return prev
      const next: AgentTask = {
        ...prev,
        status: 'error',
        error: 'Cancelled by user',
        activity: 'Execution stopped',
        finishedAt: prev.finishedAt ?? Date.now(),
        steps: prev.steps.map((step) =>
          step.status === 'running' ? { ...step, status: 'error' } : step,
        ),
      }
      taskRef.current = next
      return next
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
    endRunRef.current?.('error', 'Cancelled before completion')
    runRef.current?.cancel()
    busyRef.current = false
    taskRef.current = null
    setMessages([])
    setTask(null)
    setStatus('idle')
    setBusy(false)
  }, [])

  return { messages, task, status, busy, send, cancel, reset }
}
