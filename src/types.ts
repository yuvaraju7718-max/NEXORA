export type ViewId =
  | 'home'
  | 'new-chat'
  | 'projects'
  | 'browser'
  | 'files'
  | 'terminal'
  | 'history'
  | 'settings'
  | 'api-key'

export type OrbState = 'idle' | 'listening' | 'thinking' | 'executing' | 'completed'

export type StepStatus = 'pending' | 'running' | 'completed' | 'error'

export type Autonomy = 'safe' | 'ask' | 'auto'

export interface TaskStep {
  id: string
  title: string
  detail?: string
  status: StepStatus
}

export interface AgentTask {
  id: string
  title: string
  status: StepStatus
  steps: TaskStep[]
  activity: string
  error?: string
  startedAt: number
  finishedAt?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  streaming?: boolean
}

export interface Settings {
  model: string
  autonomy: Autonomy
  reducedMotion: boolean
}

export interface ModelOption {
  id: string
  label: string
  provider: string
  hint: string
}

export const MODELS: ModelOption[] = [
  {
    id: 'claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    hint: 'Balanced · recommended',
  },
  { id: 'claude-opus-4-1', label: 'Claude Opus 4.1', provider: 'Anthropic', hint: 'Deepest reasoning' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', provider: 'Anthropic', hint: 'Fastest responses' },
  { id: 'gpt-5-1', label: 'GPT-5.1', provider: 'OpenAI', hint: 'General purpose' },
  { id: 'gemini-3-pro', label: 'Gemini 3 Pro', provider: 'Google', hint: 'Long context' },
  { id: 'ollama-local', label: 'Local · Ollama', provider: 'Local', hint: 'Private · no API key' },
]

export const DEFAULT_SETTINGS: Settings = {
  model: 'claude-sonnet-4-5',
  autonomy: 'ask',
  reducedMotion: false,
}
