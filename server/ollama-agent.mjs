/**
 * Local Ollama-backed agent endpoint for NEXORA.
 *
 *   npm run agent:ollama
 *
 * Exposes the same SSE protocol as scripts/mock-agent.mjs, but streams real
 * tokens from a local Ollama model.
 *
 *   VITE_AGENT_ENDPOINT=http://localhost:8788/api/agent npm run dev
 */
import { createServer } from 'node:http'
import { runOllamaAgent, listOllamaModels } from './agent-core.mjs'

const PORT = Number(process.env.PORT ?? 8788)
const ORIGIN = process.env.ALLOW_ORIGIN ?? '*'
const DEFAULT_OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434'

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

  if (request.method === 'GET' && url.pathname === '/api/models') {
    try {
      const ollamaUrl = url.searchParams.get('ollamaUrl') || DEFAULT_OLLAMA_URL
      const models = await listOllamaModels(ollamaUrl)
      response
        .writeHead(200, { ...cors, 'Content-Type': 'application/json' })
        .end(JSON.stringify({ models }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list models'
      response
        .writeHead(503, { ...cors, 'Content-Type': 'application/json' })
        .end(JSON.stringify({ error: message, models: [] }))
    }
    return
  }

  if (request.method !== 'POST' || url.pathname !== '/api/agent') {
    response.writeHead(404, { ...cors, 'Content-Type': 'text/plain' }).end('Not found')
    return
  }

  let prompt = ''
  let model = ''
  let ollamaUrl = DEFAULT_OLLAMA_URL
  try {
    const raw = await readBody(request)
    const parsed = JSON.parse(raw || '{}')
    prompt = typeof parsed.prompt === 'string' ? parsed.prompt : ''
    model = typeof parsed.model === 'string' ? parsed.model : ''
    ollamaUrl = typeof parsed.ollamaUrl === 'string' && parsed.ollamaUrl ? parsed.ollamaUrl : ollamaUrl
  } catch {
    response
      .writeHead(400, { ...cors, 'Content-Type': 'application/json' })
      .end(JSON.stringify({ error: 'Invalid JSON body' }))
    return
  }

  if (!prompt.trim()) {
    response
      .writeHead(400, { ...cors, 'Content-Type': 'application/json' })
      .end(JSON.stringify({ error: 'prompt is required' }))
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
    await runOllamaAgent({ prompt, model, ollamaUrl }, send, controller.signal)
  } catch (error) {
    if (!controller.signal.aborted) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ollama request failed. Is `ollama serve` running and the model pulled?'
      send({ type: 'status', status: 'idle' })
      send({ type: 'error', message })
    }
  } finally {
    response.end()
  }
})

server.listen(PORT, () => {
  console.log(`NEXORA Ollama agent → http://localhost:${PORT}/api/agent`)
  console.log(`Ollama base URL: ${DEFAULT_OLLAMA_URL}`)
})