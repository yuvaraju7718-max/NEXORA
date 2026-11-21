/// <reference types="vite/client" />

export interface DesktopInfo {
  name: string
  version: string
  platform: string
  arch: string
  electron: string
  chrome: string
}

declare global {
  interface Window {
    nexora?: {
      isDesktop: boolean
      platform: string
      getInfo: () => Promise<DesktopInfo>
      openExternal: (url: string) => Promise<boolean>
    }
  }
}
