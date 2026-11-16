/**
 * Minimal mock of the NEXORA agent backend.
 *
 *   npm run mock:agent
 *
 * Streams the same SSE protocol the real backend will use, so the UI can be
 * exercised end-to-end without a model provider:
 *
 *   VITE_AGENT_ENDPOINT=http://localhost:8787/api/agent npm run dev
 */
import { createServer } from 'node:http'

const PORT = Number(process.env.PORT ?? 8787)
const ORIGIN = process.env.ALLOW_ORIGIN ?? '*'

const cors = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, cors).end()
    return
  }

  if (request.method !== 'POST' || !request.url?.startsWith('/api/agent')) {
    response.writeHead(404, { ...cors, 'Content-Type': 'text/plain' }).end('Not found')
    return
  }

  let body = ''
  for await (const chunk of request) body += chunk

  let prompt = 'Untitled request'
  try {
    prompt = String(JSON.parse(body || '{}').prompt ?? prompt)
  } catch {
    // keep the default prompt
  }

  response.writeHead(200, {
    ...cors,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  let closed = false
  request.on('close', () => {
    closed = true
  })

  const send = (event) => {
    if (closed) return
    response.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  const task = {
    id: `live-${Date.now()}`,
    title: `Live run · ${prompt.slice(0, 42)}`,
    status: 'pending',
    activity: 'Preparing the workspace…',
    startedAt: Date.now(),
    steps: [
      { id: 'live-step-0', title: 'Accepted by backend', detail: 'Prompt received over HTTP', status: 'pending' },
      { id: 'live-step-1', title: 'Planning', detail: 'Building the step graph', status: 'pending' },
      { id: 'live-step-2', title: 'Streaming result', detail: 'Sending tokens to the UI', status: 'pending' },
    ],
  }

  send({ type: 'status', status: 'thinking' })
  send({ type: 'task', task })
  await wait(500)

  task.status = 'running'
  send({ type: 'task', task })

  for (const step of task.steps) {
    if (closed) return
    step.status = 'running'
    task.activity = step.detail
    send({ type: 'task', task })
    await wait(600)
    step.status = 'completed'
    send({ type: 'task', task })
  }

  task.status = 'completed'
  task.activity = 'Task complete'
  task.finishedAt = Date.now()
  send({ type: 'task', task })
  send({ type: 'status', status: 'completed' })

  const reply =
    `Live response from the mock backend for “${prompt}”. ` +
    'This text travelled over Server-Sent Events and was streamed token by token ' +
    'through the same AgentHandlers contract the real agent will use.'

  for (const chunk of reply.split(/(\s+)/)) {
    if (closed) return
    send({ type: 'token', delta: chunk })
    await wait(18)
  }

  send({ type: 'status', status: 'idle' })
  send({ type: 'done' })
  response.end()
})

server.listen(PORT, () => {
  console.log(`NEXORA mock agent → http://localhost:${PORT}/api/agent`)
})
