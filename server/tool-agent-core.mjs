import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const snapshot = (task) => JSON.parse(JSON.stringify(task))

const MAX_READ_BYTES = 120_000
const MAX_TREE_ENTRIES = 120
const MAX_CMD_OUTPUT = 24_000
const COMMAND_TIMEOUT_MS = 60_000

const DENY_PATTERNS = [
  /\brm\s+-rf\b/i,
  /\bdel\s+\/[sq]\b/i,
  /\brmdir\s+\/s\b/i,
  /\bformat\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /:\(\)\s*\{\s*:|:&\s*\};:/, // fork bomb
  /\bRemove-Item\b.*\b-Recurse\b.*\b-Force\b/i,
]

function safeResolve(workdir, target = '.') {
  const root = path.resolve(workdir)
  const resolved = path.resolve(root, target)
  const rel = path.relative(root, resolved)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Path escapes the workspace root')
  }
  return { root, resolved, rel: rel || '.' }
}

async function listTree(workdir, target = '.', depth = 2) {
  const { resolved, rel } = safeResolve(workdir, target)
  const entries = []
  async function walk(dir, prefix, level) {
    if (entries.length >= MAX_TREE_ENTRIES || level > depth) return
    let items = []
    try {
      items = await fs.readdir(dir, { withFileTypes: true })
    } catch (error) {
      entries.push(`${prefix}[unreadable: ${error instanceof Error ? error.message : 'error'}]`)
      return
    }
    items.sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name))
    for (const item of items) {
      if (entries.length >= MAX_TREE_ENTRIES) break
      if (['node_modules', '.git', 'dist', '.vite'].includes(item.name)) continue
      const mark = item.isDirectory() ? '/' : ''
      entries.push(`${prefix}${item.name}${mark}`)
      if (item.isDirectory() && level < depth) {
        await walk(path.join(dir, item.name), `${prefix}  `, level + 1)
      }
    }
  }
  await walk(resolved, '', 0)
  return { rel, entries }
}

async function readFileSafe(workdir, target) {
  const { resolved, rel } = safeResolve(workdir, target)
  const stat = await fs.stat(resolved)
  if (!stat.isFile()) throw new Error('Target is not a file')
  const buf = await fs.readFile(resolved)
  const clipped = buf.subarray(0, MAX_READ_BYTES)
  const text = clipped.toString('utf8')
  return {
    rel,
    size: stat.size,
    truncated: buf.length > MAX_READ_BYTES,
    text,
  }
}

async function searchFiles(workdir, query, target = '.') {
  const { resolved } = safeResolve(workdir, target)
  const q = query.toLowerCase()
  const hits = []
  async function walk(dir) {
    if (hits.length >= 40) return
    let items = []
    try { items = await fs.readdir(dir, { withFileTypes: true }) } catch { return }
    for (const item of items) {
      if (hits.length >= 40) break
      if (['node_modules', '.git', 'dist', '.vite'].includes(item.name)) continue
      const full = path.join(dir, item.name)
      const rel = path.relative(path.resolve(workdir), full).replaceAll('\\', '/')
      if (item.name.toLowerCase().includes(q) || rel.toLowerCase().includes(q)) {
        hits.push(rel + (item.isDirectory() ? '/' : ''))
      }
      if (item.isDirectory()) await walk(full)
    }
  }
  await walk(resolved)
  return hits
}

function isDeniedCommand(command) {
  return DENY_PATTERNS.some((pattern) => pattern.test(command))
}

function runCommand(command, workdir, signal) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd: workdir,
      shell: true,
      env: process.env,
      windowsHide: true,
    })
    let output = ''
    const append = (chunk) => {
      if (output.length >= MAX_CMD_OUTPUT) return
      output += chunk.toString()
      if (output.length > MAX_CMD_OUTPUT) output = output.slice(0, MAX_CMD_OUTPUT) + '\n…[truncated]'
    }
    child.stdout.on('data', append)
    child.stderr.on('data', append)
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      resolve({ output: output + '\n[timeout]', code: 124 })
    }, COMMAND_TIMEOUT_MS)
    const onAbort = () => {
      child.kill('SIGTERM')
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    child.on('error', (error) => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      resolve({ output, code: code ?? 0 })
    })
  })
}

function detectIntent(prompt) {
  const p = prompt.trim()
  const lower = p.toLowerCase()

  const readMatch = p.match(/(?:read|open|show|cat)\s+(?:file\s+)?["`']?([^\n"`']+\.[\w]+)["`']?/i)
  if (readMatch) return { kind: 'read', target: readMatch[1].trim() }

  const searchMatch = p.match(/(?:find|search|locate|where(?:'s| is)?)\s+(?:file(?:s)?\s+)?["`']?([^"`'\n]+)["`']?/i)
  if (searchMatch && !/(run|command|terminal|npm|git|build)/.test(lower)) {
    return { kind: 'search', query: searchMatch[1].trim().replace(/[?.!]+$/, '') }
  }

  if (/(list|show|tree|what(?:'s| is)? in|files in|folder structure|workspace files)/.test(lower)) {
    const pathMatch = p.match(/(?:in|under|for)\s+["`']?([./\w-]+)["`']?/i)
    return { kind: 'tree', target: pathMatch?.[1]?.trim() || '.' }
  }

  const cmdMatch = p.match(/(?:run|execute|command)\s*[:`]\s*(.+)$/i) || p.match(/^[$>]\s*(.+)$/)
  if (cmdMatch) return { kind: 'command', command: cmdMatch[1].trim() }

  if (/^(npm|pnpm|yarn|git|node|python|pip|cargo|go)\b/.test(lower)) {
    return { kind: 'command', command: p }
  }

  return { kind: 'chat' }
}

export function createTask(prompt, intent) {
  const title =
    intent.kind === 'read' ? `Read ${intent.target}` :
    intent.kind === 'search' ? `Search for ${intent.query}` :
    intent.kind === 'tree' ? 'Inspect workspace' :
    intent.kind === 'command' ? 'Run workspace command' :
    'Local agent response'
  const steps =
    intent.kind === 'command'
      ? [
          { title: 'Validate command', detail: 'Checking safety and workspace scope' },
          { title: 'Execute command', detail: 'Running in the workspace' },
          { title: 'Report output', detail: 'Streaming results' },
        ]
      : intent.kind === 'chat'
        ? [
            { title: 'Understand request', detail: 'Parsing the prompt' },
            { title: 'Prepare response', detail: 'Using local agent capabilities' },
            { title: 'Report output', detail: 'Streaming results' },
          ]
        : [
            { title: 'Understand request', detail: 'Parsing the prompt' },
            { title: 'Inspect workspace', detail: 'Reading real files safely' },
            { title: 'Report output', detail: 'Streaming results' },
          ]
  return {
    id: randomUUID(),
    title,
    status: 'pending',
    steps: steps.map((s, i) => ({ id: `step-${i}`, status: 'pending', ...s })),
    activity: 'Preparing…',
    startedAt: Date.now(),
  }
}

function emitTask(emit, task) {
  emit({ type: 'task', task: snapshot(task) })
}

export async function runLocalToolAgent({ prompt, workdir = process.cwd(), autonomy = 'ask' }, emit, signal) {
  const intent = detectIntent(prompt)
  const task = createTask(prompt, intent)
  const safeEmit = (event) => { if (!signal?.aborted) emit(event) }

  safeEmit({ type: 'status', status: 'thinking' })
  emitTask(safeEmit, task)
  await sleep(150)
  if (signal?.aborted) return

  task.status = 'running'
  task.steps[0].status = 'running'
  task.activity = task.steps[0].detail
  safeEmit({ type: 'status', status: 'executing' })
  emitTask(safeEmit, task)
  await sleep(120)
  if (signal?.aborted) return
  task.steps[0].status = 'completed'

  try {
    if (intent.kind === 'tree') {
      task.steps[1].status = 'running'
      task.activity = 'Listing workspace files'
      emitTask(safeEmit, task)
      const { rel, entries } = await listTree(workdir, intent.target, 2)
      task.steps[1].status = 'completed'
      task.steps[2].status = 'running'
      task.activity = 'Reporting output'
      emitTask(safeEmit, task)
      const lines = [`Workspace tree for \`${rel}\`:\n`, ...entries.map((e) => `- ${e}`)]
      if (entries.length >= MAX_TREE_ENTRIES) lines.push(`\n…showing first ${MAX_TREE_ENTRIES} entries.`)
      safeEmit({ type: 'token', delta: lines.join('\n') })
    } else if (intent.kind === 'read') {
      task.steps[1].status = 'running'
      task.activity = `Reading ${intent.target}`
      emitTask(safeEmit, task)
      const file = await readFileSafe(workdir, intent.target)
      task.steps[1].status = 'completed'
      task.steps[2].status = 'running'
      task.activity = 'Reporting output'
      emitTask(safeEmit, task)
      safeEmit({
        type: 'token',
        delta:
          `File \`${file.rel}\` (${file.size} bytes${file.truncated ? ', truncated' : ''}):\n\n` +
          '```\n' + file.text.replace(/```/g, '``\\`') + '\n```',
      })
    } else if (intent.kind === 'search') {
      task.steps[1].status = 'running'
      task.activity = `Searching for ${intent.query}`
      emitTask(safeEmit, task)
      const hits = await searchFiles(workdir, intent.query)
      task.steps[1].status = 'completed'
      task.steps[2].status = 'running'
      task.activity = 'Reporting output'
      emitTask(safeEmit, task)
      safeEmit({
        type: 'token',
        delta: hits.length
          ? `Found ${hits.length} match(es) for "${intent.query}":\n\n${hits.map((h) => `- ${h}`).join('\n')}`
          : `No files matched "${intent.query}" in the workspace.`,
      })
    } else if (intent.kind === 'command') {
      task.steps[1].status = 'running'
      task.activity = `Running: ${intent.command}`
      emitTask(safeEmit, task)
      if (isDeniedCommand(intent.command)) {
        throw new Error('Command blocked by safety policy.')
      }
      if (autonomy === 'safe') {
        throw new Error('Autonomy is set to Safe mode; terminal commands require Ask or Auto.')
      }
      const result = await runCommand(intent.command, workdir, signal)
      if (signal?.aborted) return
      task.steps[1].status = 'completed'
      task.steps[2].status = 'running'
      task.activity = 'Reporting output'
      emitTask(safeEmit, task)
      safeEmit({
        type: 'token',
        delta:
          `Command: \`${intent.command}\`\nExit code: ${result.code}\n\n` +
          '```\n' + (result.output || '(no output)').replace(/```/g, '``\\`') + '\n```',
      })
    } else {
      task.steps[1].status = 'running'
      task.activity = 'Preparing local response'
      emitTask(safeEmit, task)
      const { entries } = await listTree(workdir, '.', 1)
      task.steps[1].status = 'completed'
      task.steps[2].status = 'running'
      task.activity = 'Reporting output'
      emitTask(safeEmit, task)
      safeEmit({
        type: 'token',
        delta:
          `I can run real local workspace actions with no API key.\n\n` +
          `Try:\n- \`list files\`\n- \`read README.md\`\n- \`search agent\`\n- \`run: git status --short\`\n\n` +
          `Current workspace top level:\n${entries.slice(0, 20).map((e) => `- ${e}`).join('\n')}`,
      })
    }

    if (signal?.aborted) return
    for (const step of task.steps) if (step.status !== 'completed') step.status = 'completed'
    task.status = 'completed'
    task.activity = 'Task complete'
    task.finishedAt = Date.now()
    emitTask(safeEmit, task)
    safeEmit({ type: 'status', status: 'completed' })
    await sleep(100)
    if (signal?.aborted) return
    safeEmit({ type: 'status', status: 'idle' })
    safeEmit({ type: 'done' })
  } catch (error) {
    if (signal?.aborted) return
    for (const step of task.steps) if (step.status === 'running') step.status = 'error'
    task.status = 'error'
    task.error = error instanceof Error ? error.message : 'Local agent failed'
    task.activity = 'Task failed'
    task.finishedAt = Date.now()
    emitTask(safeEmit, task)
    safeEmit({ type: 'status', status: 'idle' })
    safeEmit({ type: 'error', message: task.error })
  }
}