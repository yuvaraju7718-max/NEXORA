const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('nexora', {
  isDesktop: true,
  platform: process.platform,
  getInfo: () => ipcRenderer.invoke('nexora:info'),
  openExternal: (url) => ipcRenderer.invoke('nexora:open-external', url),
})
