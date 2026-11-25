const { contextBridge, ipcRenderer } = require('electron')

function subscribeRun(runID, handlers) {
  const listener = (_event, payload) => {
    if (!payload || payload.runID !== runID) return
    const event = payload.event
    if (!event || typeof event.type !== 'string') return

    switch (event.type) {
      case 'status':
        handlers.onStatus?.(event.status)
        break
      case 'task':
        handlers.onTask?.(event.task)
        break
      case 'token':
        handlers.onToken?.(event.delta ?? '')
        break
      case 'done':
        handlers.onDone?.()
        ipcRenderer.removeListener('nexora:run-event', listener)
        break
      case 'error':
        handlers.onError?.(event.message ?? 'Agent request failed')
        ipcRenderer.removeListener('nexora:run-event', listener)
        break
    }
  }

  ipcRenderer.on('nexora:run-event', listener)
  return () => ipcRenderer.removeListener('nexora:run-event', listener)
}

contextBridge.exposeInMainWorld('nexora', {
  isDesktop: true,
  platform: process.platform,
  getInfo: () => ipcRenderer.invoke('nexora:info'),
  openExternal: (url) => ipcRenderer.invoke('nexora:open-external', url),
  listOllamaModels: (ollamaUrl) => ipcRenderer.invoke('nexora:ollama-models', ollamaUrl),
  run: (prompt, config, handlers) => {
    let unsub = () => {}
    let runID = null
    let cancelled = false

    void ipcRenderer
      .invoke('nexora:run-start', {
        prompt,
        model: config?.model ?? '',
        ollamaUrl: config?.ollamaUrl ?? '',
      })
      .then((result) => {
        if (cancelled) {
          if (result?.runID) void ipcRenderer.invoke('nexora:run-cancel', result.runID)
          return
        }
        if (result?.error) {
          handlers.onError?.(result.error)
          return
        }
        runID = result?.runID ?? null
        if (runID) unsub = subscribeRun(runID, handlers)
      })
      .catch((error) => {
        if (!cancelled) handlers.onError?.(error?.message ?? 'Failed to start agent run')
      })

    return {
      cancel: () => {
        cancelled = true
        unsub()
        if (runID) void ipcRenderer.invoke('nexora:run-cancel', runID)
      },
    }
  },
})
