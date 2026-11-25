import { useEffect, useState } from 'react'
import { ExternalLink, KeyRound, Moon, Plug, RefreshCw, Sun } from 'lucide-react'
import { MODELS, type Autonomy, type Settings } from '../../types'
import { Badge, Field, SectionCard, Toggle } from '../ui/controls'
import { Button } from '../ui/Button'
import { ViewFrame } from './ViewFrame'
import type { Theme } from '../../hooks/useTheme'
import { getAgentEndpoint, getAgentTransport } from '../../lib/agent'
import { fetchOllamaModels, type OllamaSettings } from '../../lib/ollama'
import type { DesktopInfo } from '../../vite-env'

const AUTONOMY_COPY: Record<Autonomy, string> = {
  safe: 'Read-only tools run freely. Anything that writes or changes state asks first.',
  ask: 'Safe commands auto-run; risky commands and file writes need your approval.',
  auto: 'Everything runs without prompting. Fastest, and the easiest way to lose work.',
}

export function SettingsView({
  settings,
  onChange,
  theme,
  onToggleTheme,
  onOpenApiKey,
  apiKey,
  desktopInfo,
  ollama,
  onOllamaChange,
}: {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  theme: Theme
  onToggleTheme: () => void
  onOpenApiKey: () => void
  apiKey: { provider: string; key: string }
  desktopInfo?: DesktopInfo | null
  ollama: OllamaSettings
  onOllamaChange: (patch: Partial<OllamaSettings>) => void
}) {
  const model = MODELS.find((option) => option.id === settings.model) ?? MODELS[0]!
  const hasKey = apiKey.key.trim().length > 0
  const masked = hasKey ? `••••••••${apiKey.key.slice(-4)}` : 'No key configured'
  const transport = getAgentTransport()
  const live = transport !== 'simulation'
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [ollamaError, setOllamaError] = useState<string | null>(null)

  const refreshOllamaModels = async () => {
    setOllamaStatus('loading')
    setOllamaError(null)
    try {
      const models =
        window.nexora?.isDesktop && window.nexora.listOllamaModels
          ? (await window.nexora.listOllamaModels(ollama.ollamaUrl)).models
          : await fetchOllamaModels(ollama.ollamaUrl, ollama.endpoint)
      setOllamaModels(models)
      setOllamaStatus('ok')
      if (models.length > 0 && !models.includes(ollama.model)) {
        onOllamaChange({ model: models[0]! })
      }
    } catch (error) {
      setOllamaModels([])
      setOllamaStatus('error')
      setOllamaError(error instanceof Error ? error.message : 'Could not reach Ollama')
    }
  }

  useEffect(() => {
    if (!ollama.enabled) return
    void refreshOllamaModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ollama.enabled, ollama.ollamaUrl])

  return (
    <ViewFrame title="Settings" subtitle="Model, autonomy and the waterglass appearance.">
      <div className="grid gap-3 xl:grid-cols-2">
        <SectionCard title="Appearance" description="Pure waterglass, tuned for long sessions.">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13.5px] font-medium">Theme</p>
                <p className="mt-0.5 text-[12.5px] text-muted">Deep ocean or daylight ice.</p>
              </div>
              <div className="segmented shrink-0">
                <button
                  type="button"
                  data-active={theme === 'dark'}
                  onClick={() => {
                    if (theme !== 'dark') onToggleTheme()
                  }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Moon size={12} />
                  Dark
                </button>
                <button
                  type="button"
                  data-active={theme === 'light'}
                  onClick={() => {
                    if (theme !== 'light') onToggleTheme()
                  }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Sun size={12} />
                  Light
                </button>
              </div>
            </div>

            <div className="hairline" />

            <Toggle
              label="Reduce motion"
              description="Stops the background drift, orb rotation and shimmer effects."
              checked={settings.reducedMotion}
              onChange={(reducedMotion) => onChange({ reducedMotion })}
            />
          </div>
        </SectionCard>

        <SectionCard title="Agent" description="How NEXORA thinks and how much it asks before acting.">
          <div className="space-y-4">
            <div className="rounded-xl border border-[rgb(var(--glass-border)/0.16)] bg-[rgb(var(--glass-tint)/0.05)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium">Local model (Ollama)</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
                    Run a local model with no API key. Requires Ollama running on this machine.
                  </p>
                </div>
                <Badge tone={ollama.enabled ? 'success' : 'neutral'}>
                  {ollama.enabled ? 'Enabled' : 'Off'}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant={ollama.enabled ? 'primary' : 'subtle'}
                  size="sm"
                  onClick={() => onOllamaChange({ enabled: !ollama.enabled })}
                >
                  <Plug size={14} />
                  {ollama.enabled ? 'Disable Ollama' : 'Use Ollama'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void refreshOllamaModels()}>
                  <RefreshCw size={14} className={ollamaStatus === 'loading' ? 'animate-spin' : ''} />
                  Refresh models
                </Button>
              </div>

              {ollama.enabled ? (
                <div className="mt-3 space-y-3">
                  <Field label="Ollama URL" hint="local">
                    <input
                      className="field"
                      value={ollama.ollamaUrl}
                      onChange={(event) => onOllamaChange({ ollamaUrl: event.target.value })}
                      placeholder="http://localhost:11434"
                      spellCheck={false}
                    />
                  </Field>
                  <Field label="Agent endpoint" hint="SSE bridge">
                    <input
                      className="field"
                      value={ollama.endpoint}
                      onChange={(event) => onOllamaChange({ endpoint: event.target.value })}
                      placeholder="http://localhost:8788/api/agent"
                      spellCheck={false}
                    />
                  </Field>
                  <Field
                    label="Local model"
                    hint={ollamaStatus === 'ok' ? `${ollamaModels.length} found` : ollamaStatus}
                  >
                    {ollamaModels.length > 0 ? (
                      <select
                        className="field"
                        value={ollama.model}
                        onChange={(event) => onOllamaChange({ model: event.target.value })}
                      >
                        {ollamaModels.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="field"
                        value={ollama.model}
                        onChange={(event) => onOllamaChange({ model: event.target.value })}
                        placeholder="llama3.2"
                        spellCheck={false}
                      />
                    )}
                  </Field>
                  {ollamaError ? (
                    <p className="text-[11.5px] leading-relaxed text-[rgb(var(--danger))]">
                      {ollamaError}. Make sure Ollama is installed and `ollama serve` is running.
                    </p>
                  ) : ollamaStatus === 'ok' ? (
                    <p className="text-[11.5px] text-muted">
                      Connected. Responses stream locally — no API key required.
                    </p>
                  ) : (
                    <p className="text-[11.5px] text-muted">
                      Tip: run `npm run agent:ollama` and pull a model like `ollama pull llama3.2`.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <Field label="Hosted model" hint={model.provider}>
              <select
                className="field"
                value={settings.model}
                onChange={(event) => onChange({ model: event.target.value })}
                disabled={ollama.enabled}
              >
                {MODELS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} — {option.provider}
                  </option>
                ))}
              </select>
            </Field>
            <p className="-mt-2 text-[11.5px] text-muted">
              {ollama.enabled ? 'Ollama overrides the hosted model while enabled.' : model.hint}
            </p>

            <Field label="Autonomy" hint="Approval policy">
              <div className="segmented w-full">
                {(['safe', 'ask', 'auto'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    data-active={settings.autonomy === level}
                    onClick={() => onChange({ autonomy: level })}
                    className="flex-1 capitalize"
                  >
                    {level}
                  </button>
                ))}
              </div>
            </Field>
            <p className="-mt-2 text-[11.5px] leading-relaxed text-muted">{AUTONOMY_COPY[settings.autonomy]}</p>
          </div>
        </SectionCard>

        <SectionCard
          title="API key"
          description="Optional hosted-provider fallback. Ollama needs no key."
          action={<Badge tone={hasKey ? 'success' : 'neutral'}>{hasKey ? 'Stored' : 'Not set'}</Badge>}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-[rgb(var(--glass-border)/0.14)] bg-[rgb(var(--glass-base)/0.35)] px-3 py-2.5">
              <KeyRound size={15} className="shrink-0 text-[rgb(var(--accent))]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px]">{masked}</p>
                <p className="text-[10.5px] text-muted">
                  {hasKey ? apiKey.provider : 'Optional — only for hosted providers'}
                </p>
              </div>
              <Button variant="subtle" size="sm" onClick={onOpenApiKey}>
                Manage
                <ExternalLink size={12} strokeWidth={1.8} />
              </Button>
            </div>
            <p className="text-[11.5px] leading-relaxed text-muted">
              {ollama.enabled
                ? 'Ollama is active, so no hosted API key is required for chat.'
                : 'This build stores the key locally in your browser. Use Ollama above for a free local option.'}
            </p>
          </div>
        </SectionCard>

        <SectionCard title="About" description="What you are running.">
          <dl className="space-y-2.5 text-[12.5px]">
            {[
              ...(desktopInfo
                ? ([
                    ['Shell', `Electron ${desktopInfo.electron}`],
                    ['Platform', `${desktopInfo.platform} · ${desktopInfo.arch}`],
                  ] as Array<[string, string]>)
                : []),
              ['Version', '0.1.0 · preview'],
              ['Interface', 'Waterglass UI'],
              ['Transport', transport === 'ollama' ? 'Ollama (local)' : transport === 'desktop' ? 'Desktop bridge' : live ? 'Live endpoint' : 'Simulated agent'],
              ['Model', ollama.enabled ? ollama.model || 'Not selected' : model.label],
              ['Endpoint', transport === 'desktop' ? 'Electron IPC → Ollama' : live ? (getAgentEndpoint() ?? '—') : 'local simulation'],
              ['Stack', 'React 19 · Vite · Tailwind 4'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-muted">{label}</dt>
                <dd className="truncate text-right font-medium" title={value}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 rounded-xl border border-[rgb(var(--accent)/0.2)] bg-[rgb(var(--accent)/0.07)] px-3 py-2.5">
            <p className="text-[11.5px] leading-relaxed text-muted">
              {transport === 'ollama' || transport === 'desktop'
                ? 'Local Ollama mode is active. Prompts go to your local model, and tokens stream back over the same AgentEvent contract — no hosted API key needed.'
                : live
                  ? 'Connected to the configured agent endpoint. Status, task and token events stream in over the wire protocol.'
                  : 'Runs are simulated. Enable Ollama above for a free local model, or set VITE_AGENT_ENDPOINT for a hosted/backend agent.'}
            </p>
          </div>
        </SectionCard>
      </div>
    </ViewFrame>
  )
}
