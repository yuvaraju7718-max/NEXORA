/**
 * Start Vite and open the Electron shell against it.
 *
 *   npm run dev:desktop
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const devUrl = process.env.NEXORA_DEV_URL || 'http://localhost:5173'
const env = { ...process.env, NEXORA_DEV_URL: devUrl }
const children = []

async function waitForServer(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return true
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return false
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill()
  }
  process.exit(code)
}

const vite = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', '5173', '--strictPort'], {
  stdio: 'inherit',
  env,
})
children.push(vite)

vite.on('exit', (code) => {
  if (code && code !== 0) shutdown(code)
})

const ready = await waitForServer(devUrl)
if (!ready) {
  console.error(`NEXORA: dev server did not become ready at ${devUrl}`)
  shutdown(1)
}

const electron = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'electron', 'cli.js'), '.'], {
  stdio: 'inherit',
  env,
})
children.push(electron)
electron.on('exit', (code) => shutdown(code ?? 0))

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(0))
}
