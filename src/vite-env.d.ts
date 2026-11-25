/// <reference types="vite/client" />

export interface DesktopInfo {
  name: string
  version: string
  platform: string
  arch: string
  electron: string
  chrome: string
}

export interface DesktopAgentEvent {
  type: 'status' | 'task' | 'token' | 'done' | 'error'
  [key: string]: unknown
}

declare global {
  interface Window {
    nexora?: {
      isDesktop: boolean
      platform: string
      getInfo: () => Promise<DesktopInfo>
      openExternal: (url: string) => Promise<boolean>
      listOllamaModels?: (ollamaUrl?: string) => Promise<{ models: string[]; error?: string }>
      run?: (
        prompt: string,
        config: { model?: string | null; ollamaUrl?: string | null },
        handlers: {
          onStatus: (status: import('./types').OrbState) => void
          onTask: (task: import('./types').AgentTask) => void
          onToken: (delta: string) => void
          onDone: () => void
          onError: (message: string) => void
        },
      ) => { cancel: () => void }
    }
  }
}
