import { randomUUID } from 'node:crypto'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const snapshot = (task) => JSON.parse(JSON.stringify(task))

const DEFAULT_OLLAMA_URL = 'http://localhost:11434'
const DEFAULT_MODEL = 'llama3.2'

function planFor(prompt) {
  const p = prompt.toLowerCase()
  if (/(website|web ?site|portfolio|landing|html|css|react page)/.test(p)) {
    return {
      title: 'Build a portfolio website',
      steps: [
        { title: 'Understanding request', detail: 'Interpreting goals, sections and tone' },
        { title: 'Planning with local model', detail: 'Using Ollama to draft the response' },
        { title: 'Streaming answer', detail: 'Sending tokens as they arrive' },
        { title: 'Final output', detail: 'Completing the handoff' },
      ],
    }
  }
  if (/(python|script|automation script|data pipeline)/.test(p)) {
    return {
      title: 'Create a Python project',
      steps: [
        { title: 'Understanding request', detail: 'Defining entry points and dependencies' },
        { title: 'Planning with local model', detail: 'Using Ollama to draft the response' },
        { title: 'Streaming answer', detail: 'Sending tokens as they arrive' },
        { title: 'Final output', detail: 'Completing the handoff' },
      ],
    }
  }
  if (/(file|folder|analy[sz]e|workspace|duplicate|clean ?up)/.test(p)) {
    return {
      title: 'Analyze workspace files',
      steps: [
        { title: 'Understanding request', detail: 'Parsing the workspace question' },
        { title: 'Planning with local model', detail: 'Using Ollama to reason through it' },
        { title: 'Streaming answer', detail: 'Sending tokens as they arrive' },
        { title: 'Final output', detail: 'Summarizing the result' },
      ],
    }
  }
  return {
    title: 'Plan and execute request',
    steps: [
      { title: 'Understanding request', detail: 'Parsing intent and constraints' },
      { title: 'Planning with local model', detail: 'Using Ollama to generate the response' },
      { title: 'Streaming answer', detail: 'Sending tokens as they arrive' },
      { title: 'Final output', detail: 'Completing the response' },
    ],
  }
}

export function createTask(prompt) {
  const plan = planFor(prompt)
  return {
    id: randomUUID(),
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
}

async function readOllamaStream(body, onDelta, signal) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    if (signal?.aborted) break
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let index = buffer.indexOf('\n')
    while (index !== -1) {
      const line = buffer.slice(0, index).trim()
      buffer = buffer.slice(index + 1)
      if (line) {
        let parsed
        try {
          parsed = JSON.parse(line)
        } catch {
          parsed = null
        }
        if (parsed?.message?.content) onDelta(parsed.message.content)
        if (parsed?.error) throw new Error(String(parsed.error))
      }
      index = buffer.indexOf('\n')
    }
  }

  const tail = buffer.trim()
  if (tail) {
    try {
      const parsed = JSON.parse(tail)
      if (parsed?.message?.content) onDelta(parsed.message.content)
      if (parsed?.error) throw new Error(String(parsed.error))
    } catch {
      // ignore incomplete tail
    }
  }
}

/**
 * Run a prompt against a local Ollama instance and emit NEXORA AgentEvents.
 * `emit` receives plain event objects; the caller decides how to transport them.
 */
export async function runOllamaAgent({ prompt, model, ollamaUrl }, emit, signal) {
  const task = createTask(prompt)
  const safeEmit = (event) => {
    if (!signal?.aborted) emit(event)
  }

  safeEmit({ type: 'status', status: 'thinking' })
  safeEmit({ type: 'task', task: snapshot(task) })
  await sleep(250)
  if (signal?.aborted) return

  task.status = 'running'
  task.steps[0].status = 'completed'
  task.steps[1].status = 'running'
  task.activity = task.steps[1].detail
  safeEmit({ type: 'status', status: 'executing' })
  safeEmit({ type: 'task', task: snapshot(task) })

  const url = `${(ollamaUrl || DEFAULT_OLLAMA_URL).replace(/\/+$/, '')}/api/chat`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            'You are NEXORA, a helpful local AI agent assistant. Be clear, practical, and concise. ' +
            'When the user asks to build or modify something, explain the plan and the key steps.',
        },
        { role: 'user', content: prompt },
      ],
    }),
    signal,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `Ollama ${response.status} ${response.statusText}${detail ? ` — ${detail.slice(0, 160)}` : ''}`.trim(),
    )
  }

  if (signal?.aborted) return
  task.steps[1].status = 'completed'
  task.steps[2].status = 'running'
  task.activity = task.steps[2].detail
  safeEmit({ type: 'task', task: snapshot(task) })

  let sawToken = false
  await readOllamaStream(
    response.body,
    (delta) => {
      if (signal?.aborted || !delta) return
      sawToken = true
      safeEmit({ type: 'token', delta })
    },
    signal,
  )

  if (signal?.aborted) return
  if (!sawToken) {
    safeEmit({ type: 'token', delta: 'Ollama returned an empty response. Make sure the model is pulled and ready.' })
  }

  task.steps[2].status = 'completed'
  task.steps[3].status = 'completed'
  task.status = 'completed'
  task.activity = 'Task complete'
  task.finishedAt = Date.now()
  safeEmit({ type: 'task', task: snapshot(task) })
  safeEmit({ type: 'status', status: 'completed' })
  await sleep(150)
  if (signal?.aborted) return
  safeEmit({ type: 'status', status: 'idle' })
  safeEmit({ type: 'done' })
}

export async function listOllamaModels(ollamaUrl = DEFAULT_OLLAMA_URL) {
  const url = `${ollamaUrl.replace(/\/+$/, '')}/api/tags`
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status} ${response.statusText}`.trim())
  }
  const data = await response.json()
  return Array.isArray(data.models) ? data.models.map((m) => m.name).filter(Boolean) : []
}