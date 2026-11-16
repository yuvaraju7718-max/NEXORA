import { ExternalLink, KeyRound, Moon, Sun } from 'lucide-react'
import { MODELS, type Autonomy, type Settings } from '../../types'
import { Badge, Field, SectionCard, Toggle } from '../ui/controls'
import { Button } from '../ui/Button'
import { ViewFrame } from './ViewFrame'
import type { Theme } from '../../hooks/useTheme'
import { getAgentEndpoint, isLiveTransport } from '../../lib/agent'

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
}: {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  theme: Theme
  onToggleTheme: () => void
  onOpenApiKey: () => void
  apiKey: { provider: string; key: string }
}) {
  const model = MODELS.find((option) => option.id === settings.model) ?? MODELS[0]!
  const hasKey = apiKey.key.trim().length > 0
  const masked = hasKey ? `••••••••${apiKey.key.slice(-4)}` : 'No key configured'
  const live = isLiveTransport()

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
            <Field label="Model" hint={model.provider}>
              <select
                className="field"
                value={settings.model}
                onChange={(event) => onChange({ model: event.target.value })}
              >
                {MODELS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} — {option.provider}
                  </option>
                ))}
              </select>
            </Field>
            <p className="-mt-2 text-[11.5px] text-muted">{model.hint}</p>

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
          description="Connect a provider to switch the agent from simulation to live runs."
          action={<Badge tone={hasKey ? 'success' : 'neutral'}>{hasKey ? 'Connected' : 'Not connected'}</Badge>}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-[rgb(var(--glass-border)/0.14)] bg-[rgb(var(--glass-base)/0.35)] px-3 py-2.5">
              <KeyRound size={15} className="shrink-0 text-[rgb(var(--accent))]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px]">{masked}</p>
                <p className="text-[10.5px] text-muted">{hasKey ? apiKey.provider : 'Add a key to enable live runs'}</p>
              </div>
              <Button variant="subtle" size="sm" onClick={onOpenApiKey}>
                Manage
                <ExternalLink size={12} strokeWidth={1.8} />
              </Button>
            </div>
            <p className="text-[11.5px] leading-relaxed text-muted">
              This build stores the key locally in your browser. The desktop build encrypts it with the
              OS keychain and never writes it to disk in plain text.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="About" description="What you are running.">
          <dl className="space-y-2.5 text-[12.5px]">
            {[
              ['Version', '0.1.0 · preview'],
              ['Interface', 'Waterglass UI'],
              ['Transport', live ? 'Live endpoint' : 'Simulated agent'],
              ['Endpoint', live ? (getAgentEndpoint() ?? '—') : 'local simulation'],
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
              {live
                ? 'Connected to the configured agent endpoint. Status, task and token events stream in over the wire protocol.'
                : 'Runs are simulated while the agent core is being wired. The UI already speaks the same event contract the live backend will use — set VITE_AGENT_ENDPOINT to switch.'}
            </p>
          </div>
        </SectionCard>
      </div>
    </ViewFrame>
  )
}
