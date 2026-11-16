import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Globe,
  LoaderCircle,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react'
import { BROWSER_PREVIEW, BROWSER_TABS, type BrowserTab } from '../../lib/mock'
import { uid } from '../../lib/cn'
import { Badge } from '../ui/controls'
import { Button } from '../ui/Button'
import { ViewFrame } from './ViewFrame'

export function BrowserView({ onRun }: { onRun: (prompt: string) => void }) {
  const [tabs, setTabs] = useState<BrowserTab[]>(BROWSER_TABS)
  const [activeId, setActiveId] = useState(BROWSER_TABS[0]!.id)
  const [address, setAddress] = useState(BROWSER_TABS[0]!.url)
  const [loading, setLoading] = useState(false)

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0]!

  const navigate = () => {
    const target = address.trim()
    if (!target) return
    setLoading(true)
    setTabs((current) =>
      current.map((tab) => (tab.id === activeId ? { ...tab, url: target, title: BROWSER_PREVIEW.title } : tab)),
    )
    window.setTimeout(() => setLoading(false), 750)
  }

  const addTab = () => {
    const tab: BrowserTab = { id: uid(), title: 'New tab', url: 'about:blank' }
    setTabs((current) => [...current, tab])
    setActiveId(tab.id)
    setAddress('')
  }

  const closeTab = (id: string) => {
    setTabs((current) => {
      const next = current.filter((tab) => tab.id !== id)
      return next.length ? next : [{ id: uid(), title: 'New tab', url: 'about:blank' }]
    })
  }

  return (
    <ViewFrame
      title="Browser"
      subtitle="A controlled surface for navigation and extraction. Real browsing arrives with the desktop bridge."
      action={
        <Button variant="primary" size="sm" onClick={() => onRun(`Automate a browser task on ${active.url}`)}>
          <Sparkles size={14} strokeWidth={1.8} />
          Automate page
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1 overflow-x-auto scroll-slim pb-1">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className="browser-tab group flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[rgb(var(--glass-border)/0.14)] bg-[rgb(var(--glass-tint)/0.05)] pl-2.5 pr-1 text-[11.5px]"
              data-active={tab.id === activeId}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveId(tab.id)
                  setAddress(tab.url)
                }}
                className="browser-tab-label max-w-[160px] truncate text-muted transition-colors hover:text-[rgb(var(--ink))]"
              >
                {tab.title}
              </button>
              <button
                type="button"
                aria-label={`Close ${tab.title}`}
                onClick={() => closeTab(tab.id)}
                className="rounded p-0.5 text-muted transition-colors hover:text-[rgb(var(--danger))]"
              >
                <X size={11} strokeWidth={2} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTab}
            aria-label="New tab"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-[rgb(var(--glass-tint)/0.07)] hover:text-[rgb(var(--ink))]"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 rounded-2xl border border-[rgb(var(--glass-border)/0.16)] bg-[rgb(var(--glass-base)/0.4)] p-1.5 backdrop-blur-xl">
          <Button variant="ghost" size="icon" disabled aria-label="Back">
            <ArrowLeft size={16} />
          </Button>
          <Button variant="ghost" size="icon" disabled aria-label="Forward">
            <ArrowRight size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setLoading(true)
              window.setTimeout(() => setLoading(false), 750)
            }}
            aria-label="Reload"
          >
            {loading ? (
              <LoaderCircle size={16} className="spin-slow text-[rgb(var(--accent))]" />
            ) : (
              <RefreshCw size={15} />
            )}
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[rgb(var(--glass-border)/0.14)] bg-[rgb(var(--glass-base)/0.5)] px-3 py-1.5">
            <Globe size={13} className="shrink-0 text-[rgb(var(--accent))]" />
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') navigate()
              }}
              placeholder="Enter a URL"
              aria-label="Address bar"
              className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-[rgb(var(--ink-muted)/0.7)]"
            />
          </div>
          <Button variant="subtle" size="sm" onClick={navigate}>
            Go
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[rgb(var(--glass-border)/0.16)] bg-[rgb(var(--glass-base)/0.35)]">
          {loading ? <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden"><div className="shimmer-bar h-full w-full" /></div> : null}

          <div className="flex items-center justify-between gap-2 border-b border-[rgb(var(--glass-border)/0.1)] px-4 py-2.5">
            <span className="flex items-center gap-2 text-[11px] text-muted">
              <span className="h-2 w-2 rounded-full bg-[rgb(var(--danger)/0.7)]" />
              <span className="h-2 w-2 rounded-full bg-[rgb(var(--accent)/0.7)]" />
              <span className="h-2 w-2 rounded-full bg-[rgb(var(--success)/0.7)]" />
              <span className="ml-2 truncate">{active.url}</span>
            </span>
            <Badge tone="accent">Preview</Badge>
          </div>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow mb-3">Waterglass Studio</p>
              <h3 className="display text-[26px] leading-tight sm:text-[32px]">{BROWSER_PREVIEW.headline}</h3>
              <p className="mx-auto mt-2.5 max-w-lg text-[13px] leading-relaxed text-muted">
                {BROWSER_PREVIEW.body}
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <span className="btn btn-primary btn-md">
                  View work
                  <ExternalLink size={14} />
                </span>
                <span className="btn btn-glass btn-md">Read notes</span>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {BROWSER_PREVIEW.cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-[rgb(var(--glass-border)/0.14)] bg-[rgb(var(--glass-tint)/0.05)] p-3.5"
                >
                  <p className="text-[12.5px] font-medium">{card.title}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-[11.5px] text-muted">
          Simulated page surface. Connect the desktop bridge to let NEXORA drive a real browser with
          the same safety gates.
        </p>
      </div>
    </ViewFrame>
  )
}
