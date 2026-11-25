import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FolderKanban,
  FolderOpen,
  House,
  Settings as SettingsIcon,
  SquareTerminal,
  type LucideIcon,
} from 'lucide-react'
import { WaterglassBackground } from './components/WaterglassBackground'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Workspace } from './components/Workspace'
import { TaskPanel } from './components/TaskPanel'
import { QuickActions } from './components/QuickActions'
import { ProjectsView } from './components/views/ProjectsView'
import { BrowserView } from './components/views/BrowserView'
import { FilesView } from './components/views/FilesView'
import { TerminalView } from './components/views/TerminalView'
import { HistoryView } from './components/views/HistoryView'
import { SettingsView } from './components/views/SettingsView'
import { ApiKeyView } from './components/views/ApiKeyView'
import { useAgent } from './hooks/useAgent'
import { useTheme } from './hooks/useTheme'
import { usePersistentState } from './hooks/usePersistentState'
import { cn, formatDuration, formatTime, uid } from './lib/cn'
import { type HistoryItem } from './lib/mock'
import { DEFAULT_OLLAMA_SETTINGS, normalizeOllamaSettings, type OllamaSettings } from './lib/ollama'
import { DEFAULT_SETTINGS, MODELS, type Settings, type ViewId } from './types'
import type { DesktopInfo } from './vite-env'

const MOBILE_NAV: Array<{ id: ViewId; label: string; icon: LucideIcon }> = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'files', label: 'Files', icon: FolderOpen },
  { id: 'terminal', label: 'Terminal', icon: SquareTerminal },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [settings, setSettings] = usePersistentState<Settings>('nexora.settings', DEFAULT_SETTINGS)
  const [apiKey, setApiKey] = usePersistentState('nexora.apikey', { provider: 'Anthropic', key: '' })
  const [recordedRuns, setRecordedRuns] = usePersistentState<HistoryItem[]>('nexora.history', [])
  const [ollama, setOllama] = usePersistentState<OllamaSettings>('nexora.ollama', DEFAULT_OLLAMA_SETTINGS)

  const ollamaSettings = normalizeOllamaSettings(ollama)
  const modelLabel = ollamaSettings.enabled
    ? ollamaSettings.model || 'Ollama (local)'
    : (MODELS.find((option) => option.id === settings.model)?.label ?? MODELS[0]!.label)

  const agent = useAgent((result) => {
    const entry: HistoryItem = {
      id: uid(),
      title: result.title,
      status: result.status,
      model: modelLabel,
      when: `Today · ${formatTime(Date.now())}`,
      duration: formatDuration(result.durationMs),
      steps: result.steps,
      summary: result.summary,
      live: true,
    }
    setRecordedRuns((current) => [entry, ...current].slice(0, 40))
  })

  const [view, setView] = useState<ViewId>('home')
  const [collapsed, setCollapsed] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [listening, setListening] = useState(false)
  const [desktopInfo, setDesktopInfo] = useState<DesktopInfo | null>(null)

  useEffect(() => {
    if (!window.nexora?.isDesktop) return
    let active = true
    void window.nexora.getInfo().then((info) => {
      if (active) setDesktopInfo(info)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.motion = settings.reducedMotion ? 'reduced' : 'full'
  }, [settings.reducedMotion])

  useEffect(() => {
    document.documentElement.style.colorScheme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#DFF1FA' : '#06182B')
  }, [theme])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setView('home')
        window.setTimeout(() => document.getElementById('nexora-composer')?.focus(), 90)
      }
      if (event.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const navigate = (next: ViewId) => {
    if (next === 'new-chat') {
      agent.reset()
      setDraft('')
      setListening(false)
      setView('home')
      setPanelOpen(false)
      return
    }
    setView(next)
    setPanelOpen(false)
  }

  const runPrompt = (prompt: string) => {
    setView('home')
    setDraft('')
    agent.send(prompt)
  }

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }

  const updateOllama = (patch: Partial<OllamaSettings>) => {
    setOllama((current) => normalizeOllamaSettings({ ...current, ...patch }))
  }

  const renderView = () => {
    switch (view) {
      case 'projects':
        return <ProjectsView onRun={runPrompt} />
      case 'browser':
        return <BrowserView onRun={runPrompt} />
      case 'files':
        return <FilesView />
      case 'terminal':
        return <TerminalView onRun={runPrompt} />
      case 'history':
        return <HistoryView onRun={runPrompt} recorded={recordedRuns} onClear={() => setRecordedRuns([])} />
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onChange={updateSettings}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenApiKey={() => navigate('api-key')}
            apiKey={apiKey}
            desktopInfo={desktopInfo}
            ollama={ollamaSettings}
            onOllamaChange={updateOllama}
          />
        )
      case 'api-key':
        return <ApiKeyView value={apiKey} onSave={setApiKey} onBack={() => navigate('settings')} />
      default:
        return (
          <Workspace
            agent={agent}
            draft={draft}
            onDraftChange={setDraft}
            listening={listening}
            onListeningChange={setListening}
          />
        )
    }
  }

  return (
    <div className="relative flex h-screen w-screen gap-3 overflow-hidden p-3">
      <WaterglassBackground />

      <Sidebar
        view={view}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((current) => !current)}
        theme={theme}
        onToggleTheme={toggleTheme}
        modelLabel={modelLabel}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-3">
        <TopBar
          view={view}
          status={listening ? 'listening' : agent.status}
          modelLabel={modelLabel}
          onOpenSettings={() => navigate('settings')}
          onTogglePanel={() => setPanelOpen(true)}
        />

        <div className="flex min-h-0 flex-1 gap-3">
          <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            {renderView()}
            <div className="hidden sm:block">
              <QuickActions onNavigate={navigate} />
            </div>
          </main>

          <div className="hidden w-[340px] shrink-0 xl:block xl:w-[356px]">
            <TaskPanel task={agent.task} status={agent.status} onCancel={agent.cancel} />
          </div>
        </div>

        <nav className="glass flex shrink-0 items-center justify-around gap-1 p-1.5 md:hidden">
          {MOBILE_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => navigate(id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] transition-colors',
                view === id
                  ? 'bg-[rgb(var(--glass-tint)/0.12)] text-[rgb(var(--ink))]'
                  : 'text-muted',
              )}
            >
              <Icon size={17} strokeWidth={1.7} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence>
        {panelOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 xl:hidden"
          >
            <div
              className="absolute inset-0 bg-[rgb(3_14_26/0.6)] backdrop-blur-sm"
              onClick={() => setPanelOpen(false)}
            />
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="absolute inset-y-3 right-3 w-[min(360px,92vw)]"
            >
              <TaskPanel
                task={agent.task}
                status={agent.status}
                onCancel={agent.cancel}
                onClose={() => setPanelOpen(false)}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
