export type AgentMode = 'simulation' | 'local' | 'ollama'

export interface OllamaSettings {
  mode: AgentMode
  enabled: boolean // legacy compat: true when mode !== 'simulation'
  model: string
  ollamaUrl: string
  endpoint: string
  localEndpoint: string
}

export const OLLAMA_STORAGE_KEY = 'nexora.ollama'

export const DEFAULT_OLLAMA_SETTINGS: OllamaSettings = {
  mode: 'simulation',
  enabled: false,
  model: '',
  ollamaUrl: 'http://localhost:11434',
  endpoint: 'http://localhost:8788/api/agent',
  localEndpoint: 'http://localhost:8789/api/agent',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeOllamaSettings(value: unknown): OllamaSettings {
  const raw = isRecord(value) ? value : {}
  const legacyEnabled = typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_OLLAMA_SETTINGS.enabled
  const modeRaw = raw.mode
  const mode: AgentMode =
    modeRaw === 'local' || modeRaw === 'ollama' || modeRaw === 'simulation'
      ? modeRaw
      : legacyEnabled
        ? 'ollama'
        : 'simulation'
  return {
    mode,
    enabled: mode !== 'simulation',
    model: typeof raw.model === 'string' ? raw.model : DEFAULT_OLLAMA_SETTINGS.model,
    ollamaUrl:
      typeof raw.ollamaUrl === 'string' && raw.ollamaUrl.trim()
        ? raw.ollamaUrl.trim().replace(/\/+$/, '')
        : DEFAULT_OLLAMA_SETTINGS.ollamaUrl,
    endpoint:
      typeof raw.endpoint === 'string' && raw.endpoint.trim()
        ? raw.endpoint.trim().replace(/\/+$/, '')
        : DEFAULT_OLLAMA_SETTINGS.endpoint,
    localEndpoint:
      typeof raw.localEndpoint === 'string' && raw.localEndpoint.trim()
        ? raw.localEndpoint.trim().replace(/\/+$/, '')
        : DEFAULT_OLLAMA_SETTINGS.localEndpoint,
  }
}

export function loadOllamaSettings(): OllamaSettings {
  try {
    const raw = localStorage.getItem(OLLAMA_STORAGE_KEY)
    if (!raw) return DEFAULT_OLLAMA_SETTINGS
    return normalizeOllamaSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_OLLAMA_SETTINGS
  }
}

export async function fetchOllamaModels(ollamaUrl: string, agentEndpoint?: string): Promise<string[]> {
  const base = ollamaUrl.replace(/\/+$/, '')

  // Prefer the NEXORA agent bridge when available — it avoids browser CORS
  // issues with Ollama's API and works even when Ollama only listens locally.
  if (agentEndpoint) {
    try {
      const bridgeUrl = new URL(agentEndpoint)
      bridgeUrl.pathname = '/api/models'
      bridgeUrl.search = ''
      bridgeUrl.searchParams.set('ollamaUrl', base)
      const bridgeRes = await fetch(bridgeUrl.toString(), { headers: { Accept: 'application/json' } })
      const data = (await bridgeRes.json().catch(() => null)) as
        | { models?: Array<{ name?: string } | string>; error?: string }
        | null
      const models = Array.isArray(data?.models)
        ? data.models
            .map((model) => (typeof model === 'string' ? model : typeof model?.name === 'string' ? model.name : ''))
            .filter(Boolean)
        : []
      if (models.length > 0) return models
      if (bridgeRes.ok) return models
      if (data?.error) throw new Error(data.error)
    } catch {
      // fall through to direct Ollama call
    }
  }

  const response = await fetch(`${base}/api/tags`, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status} ${response.statusText}`.trim())
  }
  const data = (await response.json()) as { models?: Array<{ name?: string }> }
  return Array.isArray(data.models)
    ? data.models
        .map((model) => (typeof model.name === 'string' ? model.name : ''))
        .filter(Boolean)
    : []
}