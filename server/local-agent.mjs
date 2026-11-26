/**
 * Local no-AI-key tool agent for NEXORA.
 *
 *   npm run agent:local
 *
 * Executes real workspace actions (list/read/search/safe commands) and streams
 * the same NEXORA AgentEvent protocol over SSE.
 */
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runLocalToolAgent } from './tool-agent-core.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.PORT ?? 8789)
const ORIGIN = process.env.ALLOW_ORIGIN ?? '*'
const WORKDIR = process.env.NEXORA_WORKDIR ? path.resolve(process.env.NEXORA_WORKDIR) : ROOT

const cors = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 1_000_000) reject(new Error('Request body too large'))
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, cors).end()
    return
  }

  const url = new URL(request.url ?? '/', `http://localhost:${PORT}`)

  if (request.method === 'GET' && url.pathname === '/api/health') {
    response
      .writeHead(200, { ...cors, 'Content-Type': 'application/json' })
      .end(JSON.stringify({ ok: true, workdir: WORKDIR }))
    return
  }

  if (request.method !== 'POST' || url.pathname !== '/api/agent') {
    response.writeHead(404, { ...cors, 'Content-Type': 'text/plain' }).end('Not found')
    return
  }

  let prompt = ''
  let autonomy = 'ask'
  try {
    const raw = await readBody(request)
    const parsed = JSON.parse(raw || '{}')
    prompt = typeof parsed.prompt === 'string' ? parsed.prompt : ''
    autonomy = typeof parsed.autonomy === 'string' ? parsed.autonomy : 'ask'
  } catch {
    response.writeHead(400, { ...cors, 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Invalid JSON body' }))
    return
  }

  if (!prompt.trim()) {
    response.writeHead(400, { ...cors, 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'prompt is required' }))
    return
  }

  response.writeHead(200, {
    ...cors,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  const controller = new AbortController()
  request.on('close', () => controller.abort())
  const send = (event) => {
    if (controller.signal.aborted) return
    response.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  try {
    await runLocalToolAgent({ prompt, workdir: WORKDIR, autonomy }, send, controller.signal)
  } catch (error) {
    if (!controller.signal.aborted) {
      send({ type: 'status', status: 'idle' })
      send({ type: 'error', message: error instanceof Error ? error.message : 'Local agent failed' })
    }
  } finally {
    response.end()
  }
})

server.listen(PORT, () => {
  console.log(`NEXORA local tool agent → http://localhost:${PORT}/api/agent`)
  console.log(`Workspace: ${WORKDIR}`)
})