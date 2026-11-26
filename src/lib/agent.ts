import type { AgentTask, OrbState } from '../types'
import { uid } from './cn'
import { loadOllamaSettings } from './ollama'

/**
 * NEXORA agent transport.
 *
 * Today this file ships a high-fidelity local simulation so the whole interface
 * can be exercised without a backend. To go live, keep the same `AgentHandlers`
 * contract and replace the body of `runAgent` with one of:
 *
 *   • `POST /api/agent` + Server-Sent Events (web / browser build)
 *   • `window.nexora.run(prompt)` over Electron IPC (desktop build)
 *
 * Nothing in the UI needs to change — components only speak `AgentHandlers`.
 */

export interface AgentHandlers {
  onStatus: (status: OrbState) => void
  onTask: (task: AgentTask) => void
  onToken: (delta: string) => void
  onDone: () => void
  onError: (message: string) => void
}

export interface AgentRun {
  cancel: () => void
}

/**
 * Wire protocol shared with the live backend.
 * Send any of these as SSE `data:` frames, NDJSON lines, or a single JSON array.
 */
export type AgentEvent =
  | { type: 'status'; status: OrbState }
  | { type: 'task'; task: AgentTask }
  | { type: 'token'; delta: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

const ENV_AGENT_ENDPOINT = import.meta.env.VITE_AGENT_ENDPOINT as string | undefined

export interface AgentConfig {
  endpoint?: string | null
  model?: string | null
  ollamaUrl?: string | null
  autonomy?: string | null
}

export type AgentTransport = 'desktop' | 'ollama' | 'local' | 'remote' | 'simulation'

function readAutonomy(): string {
  try {
    const raw = localStorage.getItem('nexora.settings')
    if (!raw) return 'ask'
    const parsed = JSON.parse(raw) as { autonomy?: string }
    return typeof parsed.autonomy === 'string' ? parsed.autonomy : 'ask'
  } catch {
    return 'ask'
  }
}

export function getAgentEndpoint(): string | null {
  if (ENV_AGENT_ENDPOINT) return ENV_AGENT_ENDPOINT
  const settings = loadOllamaSettings()
  if (settings.mode === 'ollama') return settings.endpoint
  if (settings.mode === 'local') return settings.localEndpoint
  return null
}

export function getAgentTransport(): AgentTransport {
  if (typeof window !== 'undefined' && window.nexora?.isDesktop && loadOllamaSettings().mode === 'ollama') return 'desktop'
  if (ENV_AGENT_ENDPOINT) return 'remote'
  const settings = loadOllamaSettings()
  if (settings.mode === 'ollama') return 'ollama'
  if (settings.mode === 'local') return 'local'
  return 'simulation'
}

export function isLiveTransport(): boolean {
  return getAgentTransport() !== 'simulation'
}

interface PlannedStep {
  title: string
  detail: string
}

interface AgentPlan {
  title: string
  steps: PlannedStep[]
  response: string
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const snapshot = (task: AgentTask): AgentTask => JSON.parse(JSON.stringify(task)) as AgentTask

function planFor(prompt: string): AgentPlan {
  const p = prompt.toLowerCase()

  if (/(website|web ?site|portfolio|landing|html|css|react page)/.test(p)) {
    return {
      title: 'Build a portfolio website',
      steps: [
        { title: 'Understanding request', detail: 'Interpreting goals, sections and tone' },
        { title: 'Creating project structure', detail: 'Scaffolding folders and entry files' },
        { title: 'Writing HTML and CSS', detail: 'Composing layout and waterglass styles' },
        { title: 'Testing application', detail: 'Verifying render and responsiveness' },
        { title: 'Final output', detail: 'Preparing preview and handoff notes' },
      ],
      response:
        'I mapped your portfolio into a single-page layout: hero, selected work, about, and contact. The structure is scaffolded and the waterglass styling is applied with layered glass panels, soft cyan highlights and a floating hero orb. Next I would wire the project cards to real data and run a responsive pass at 1280, 768 and 390 pixels. This run is simulated — connect the agent core to execute the real build.',
    }
  }

  if (/(python|script|automation script|data pipeline)/.test(p)) {
    return {
      title: 'Create a Python project',
      steps: [
        { title: 'Understanding request', detail: 'Defining entry points and dependencies' },
        { title: 'Setting up environment', detail: 'Preparing virtual environment' },
        { title: 'Writing modules', detail: 'Drafting package and core logic' },
        { title: 'Adding tests', detail: 'Generating pytest coverage' },
        { title: 'Running test suite', detail: 'Executing checks and reporting' },
      ],
      response:
        'The Python project is laid out with a package entry point, typed modules and a pytest suite. Dependencies are declared in pyproject.toml, and a virtual environment is prepared before the first run. I would execute the tests next and surface any failures directly in this panel. This run is simulated — connect the agent core to create the files for real.',
    }
  }

  if (/(file|folder|analy[sz]e|workspace|duplicate|clean ?up)/.test(p)) {
    return {
      title: 'Analyze workspace files',
      steps: [
        { title: 'Indexing files', detail: 'Walking the project tree' },
        { title: 'Reading metadata', detail: 'Sizes, types and timestamps' },
        { title: 'Detecting duplicates', detail: 'Hashing candidate groups' },
        { title: 'Summarizing structure', detail: 'Preparing the report' },
      ],
      response:
        'I indexed the workspace and grouped files by type, size and last-modified time. No blocking issues were found, and the largest folders are build output that can be excluded from future scans. A duplicate report is ready for review before anything is removed. This run is simulated — connect the agent core to scan your real disk.',
    }
  }

  if (/(browser|scrap|crawl|automat|website task|open site)/.test(p)) {
    return {
      title: 'Automate a browser task',
      steps: [
        { title: 'Launching session', detail: 'Starting a controlled browser' },
        { title: 'Navigating', detail: 'Opening the target page' },
        { title: 'Extracting content', detail: 'Reading structure and text' },
        { title: 'Verifying result', detail: 'Confirming expected outcome' },
      ],
      response:
        'A controlled browser session is ready: it navigates, waits for the page to settle, then extracts the requested content. Every step is gated by the safety policy, so form submissions and file downloads ask for approval first. This run is simulated — the desktop bridge enables real browsing.',
    }
  }

  if (/(terminal|command|shell|run |execute|npm|git |build|install)/.test(p)) {
    return {
      title: 'Execute terminal command',
      steps: [
        { title: 'Validating command', detail: 'Checking syntax and target directory' },
        { title: 'Checking permissions', detail: 'Classifying against the safety policy' },
        { title: 'Executing', detail: 'Running inside the workspace sandbox' },
        { title: 'Capturing output', detail: 'Collecting stdout, stderr and exit code' },
      ],
      response:
        'The command passes validation and runs inside the workspace sandbox with a 60 second timeout. Output is captured in full, truncated in the panel if it grows past 24 KB, and every invocation is appended to the audit log. Destructive commands pause for your approval before executing. This run is simulated — connect the agent core to run real commands.',
    }
  }

  return {
    title: 'Plan and execute request',
    steps: [
      { title: 'Understanding request', detail: 'Parsing intent and constraints' },
      { title: 'Forming a plan', detail: 'Ordering steps and tool calls' },
      { title: 'Executing steps', detail: 'Working inside the workspace' },
      { title: 'Reviewing output', detail: 'Checking the result for correctness' },
      { title: 'Final output', detail: 'Summarizing what changed' },
    ],
    response:
      'I broke your request into an ordered plan and started working through it inside the workspace. Each tool call is checked against the safety policy before it runs, and anything destructive waits for your approval. When the plan completes I summarize exactly what changed. This run is simulated — connect the agent core to execute for real.',
  }
}

export function runLocalAgent(prompt: string, handlers: AgentHandlers): AgentRun {
  const plan = planFor(prompt)
  let cancelled = false

  const task: AgentTask = {
    id: uid(),
    title: plan.title,
    status: 'pending',
    steps: plan.steps.map((step, index) => ({
      id: `step-${index}`,
      title: step.title,
      detail: step.detail,
      status: 'pending',
    })),
    activity: 'Preparing the workspace…',
    startedAt: Date.now(),
  }

  const execute = async () => {
    handlers.onStatus('thinking')
    handlers.onTask(snapshot(task))
    await sleep(700)
    if (cancelled) return

    task.status = 'running'
    handlers.onTask(snapshot(task))

    for (const step of task.steps) {
      if (cancelled) return
      step.status = 'running'
      task.activity = step.detail ?? step.title
      handlers.onTask(snapshot(task))
      handlers.onStatus('executing')
      await sleep(850 + Math.random() * 750)
      if (cancelled) return
      step.status = 'completed'
      handlers.onTask(snapshot(task))
    }

    if (cancelled) return
    task.status = 'completed'
    task.activity = 'Task complete'
    task.finishedAt = Date.now()
    handlers.onTask(snapshot(task))
    handlers.onStatus('completed')
    await sleep(450)

    const chunks = plan.response.split(/(\s+)/)
    for (const chunk of chunks) {
      if (cancelled) return
      handlers.onToken(chunk)
      await sleep(16)
    }

    handlers.onStatus('idle')
    await sleep(900)
    if (!cancelled) handlers.onDone()
  }

  void execute()

  return {
    cancel: () => {
      cancelled = true
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Live transport                                                     */
/* ------------------------------------------------------------------ */

function parseSseFrame(frame: string): string | null {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).replace(/^ /, ''))
    .join('\n')
  return data.trim() ? data : null
}

async function pumpStream(
  body: ReadableStream<Uint8Array>,
  delimiter: string,
  onFrame: (frame: string) => void,
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let index = buffer.indexOf(delimiter)
    while (index !== -1) {
      const frame = buffer.slice(0, index)
      buffer = buffer.slice(index + delimiter.length)
      onFrame(frame)
      index = buffer.indexOf(delimiter)
    }
  }

  buffer += decoder.decode()
  if (buffer.trim()) onFrame(buffer)
}

/**
 * Talks to a real backend. Emits the same `AgentHandlers` events as the local
 * simulation, so the UI is transport-agnostic.
 */
export function runRemoteAgent(
  endpoint: string,
  prompt: string,
  handlers: AgentHandlers,
  config: AgentConfig = {},
): AgentRun {
  const controller = new AbortController()
  let cancelled = false
  let finished = false

  const finish = (type: 'done' | 'error', message?: string) => {
    if (finished || cancelled) return
    finished = true
    if (type === 'done') {
      handlers.onDone()
    } else {
      handlers.onStatus('idle')
      handlers.onError(message ?? 'Agent request failed')
    }
  }

  const dispatch = (event: AgentEvent) => {
    if (cancelled || finished) return
    switch (event.type) {
      case 'status':
        handlers.onStatus(event.status)
        break
      case 'task':
        handlers.onTask(event.task)
        break
      case 'token':
        handlers.onToken(event.delta)
        break
      case 'done':
        finish('done')
        break
      case 'error':
        finish('error', event.message)
        break
    }
  }

  const dispatchPayload = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    if (trimmed === '[DONE]') {
      finish('done')
      return
    }
    try {
      const parsed = JSON.parse(trimmed) as AgentEvent | AgentEvent[]
      if (Array.isArray(parsed)) parsed.forEach(dispatch)
      else dispatch(parsed)
    } catch {
      // Ignore a malformed frame rather than tearing down the whole stream.
    }
  }

  const run = async () => {
    handlers.onStatus('thinking')

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream, application/x-ndjson, application/json',
        },
        body: JSON.stringify({
          prompt,
          model: config.model ?? undefined,
          ollamaUrl: config.ollamaUrl ?? undefined,
          autonomy: config.autonomy ?? undefined,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Agent endpoint returned ${response.status} ${response.statusText}`.trim())
      }

      const contentType = (response.headers.get('content-type') ?? '').toLowerCase()

      if (contentType.includes('application/json') || !response.body) {
        dispatchPayload(await response.text())
      } else if (contentType.includes('text/event-stream')) {
        await pumpStream(response.body, '\n\n', (frame) => {
          const data = parseSseFrame(frame)
          if (data) dispatchPayload(data)
        })
      } else {
        await pumpStream(response.body, '\n', dispatchPayload)
      }

      finish('done')
    } catch (error) {
      if (cancelled) return
      if (error instanceof DOMException && error.name === 'AbortError') return
      finish('error', error instanceof Error ? error.message : 'Agent request failed')
    }
  }

  void run()

  return {
    cancel: () => {
      if (finished) return
      cancelled = true
      finished = true
      controller.abort()
    },
  }
}

/**
 * Single entry point used by the UI.
 * Priority: env endpoint → desktop Ollama bridge → configured local/ollama endpoint → simulation.
 */
export function runAgent(prompt: string, handlers: AgentHandlers): AgentRun {
  const settings = loadOllamaSettings()
  const config: AgentConfig = {
    model: settings.model,
    ollamaUrl: settings.ollamaUrl,
    autonomy: readAutonomy(),
  }

  if (ENV_AGENT_ENDPOINT) return runRemoteAgent(ENV_AGENT_ENDPOINT, prompt, handlers, config)

  if (typeof window !== 'undefined' && window.nexora?.run && settings.mode === 'ollama') {
    return window.nexora.run(prompt, config, handlers)
  }

  if (settings.mode === 'ollama') return runRemoteAgent(settings.endpoint, prompt, handlers, config)
  if (settings.mode === 'local') return runRemoteAgent(settings.localEndpoint, prompt, handlers, config)

  return runLocalAgent(prompt, handlers)
}
