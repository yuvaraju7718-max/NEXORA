import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST_INDEX = path.join(ROOT, 'dist', 'index.html')
const DEV_URL = process.env.NEXORA_DEV_URL || 'http://localhost:5173'

let mainWindow = null

function isSafeExternal(url) {
  return /^https?:\/\//i.test(url)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1020,
    minHeight: 680,
    title: 'NEXORA — AI Agent OS',
    backgroundColor: '#06182B',
    show: false,
    webPreferences: {
      preload: path.join(ROOT, 'electron', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  const target = process.env.NEXORA_DEV_URL ? DEV_URL : existsSync(DIST_INDEX) ? DIST_INDEX : DEV_URL
  if (target === DIST_INDEX) {
    void mainWindow.loadFile(DIST_INDEX)
  } else {
    void mainWindow.loadURL(target).catch(() => {
      // The dev runner may not have started Vite yet; retry briefly.
      let attempts = 0
      const timer = setInterval(() => {
        attempts += 1
        if (!mainWindow || mainWindow.isDestroyed()) {
          clearInterval(timer)
          return
        }
        void mainWindow.loadURL(target).catch(() => {})
        if (attempts >= 20 || mainWindow.webContents.getURL().startsWith('http')) {
          clearInterval(timer)
        }
      }, 500)
    })
  }

  if (process.env.NEXORA_DEBUG === '1') {
    const probe = (label) => {
      void mainWindow?.webContents
        .executeJavaScript(
          `(async () => ({
            title: document.title,
            bridge: !!window.nexora?.isDesktop,
            mounted: !!document.getElementById('root')?.children.length,
            h1: document.querySelector('h1')?.innerText,
            ipc: window.nexora ? await window.nexora.getInfo() : null,
          }))()`,
        )
        .then((info) => console.log(`[NEXORA desktop:${label}]`, JSON.stringify(info)))
        .catch((error) => console.error('[NEXORA desktop] probe failed', error))
    }
    mainWindow.webContents.on('did-finish-load', () => {
      probe('load')
      setTimeout(() => probe('settled'), 1500)
    })
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternal(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isSafeExternal(url) && url !== DEV_URL) {
      event.preventDefault()
      void shell.openExternal(url)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function bootstrap() {
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return
  }

  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  ipcMain.handle('nexora:info', () => ({
    name: 'NEXORA',
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  }))

  ipcMain.handle('nexora:open-external', (_event, url) => {
    if (typeof url !== 'string' || !isSafeExternal(url)) return false
    void shell.openExternal(url)
    return true
  })

  Menu.setApplicationMenu(null)

  app.whenReady().then(createWindow)

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}

void bootstrap()
