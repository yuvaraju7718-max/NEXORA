import { useState } from 'react'
import { ArrowLeft, CircleCheck, CircleX, Eye, EyeOff, KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react'
import { Badge, Field, SectionCard } from '../ui/controls'
import { Button } from '../ui/Button'
import { ViewFrame } from './ViewFrame'

const PROVIDERS = [
  { id: 'Anthropic', prefix: 'sk-ant-', hint: 'console.anthropic.com' },
  { id: 'OpenAI', prefix: 'sk-', hint: 'platform.openai.com' },
  { id: 'Google', prefix: 'AIza', hint: 'aistudio.google.com' },
  { id: 'Local', prefix: '', hint: 'no key required' },
] as const

type Validation = { state: 'idle' | 'checking' | 'ok' | 'error'; message: string }

export function ApiKeyView({
  value,
  onSave,
  onBack,
}: {
  value: { provider: string; key: string }
  onSave: (next: { provider: string; key: string }) => void
  onBack: () => void
}) {
  const [provider, setProvider] = useState(value.provider || 'Anthropic')
  const [key, setKey] = useState(value.key)
  const [visible, setVisible] = useState(false)
  const [validation, setValidation] = useState<Validation>({ state: 'idle', message: '' })

  const providerMeta = PROVIDERS.find((item) => item.id === provider) ?? PROVIDERS[0]
  const isLocal = provider === 'Local'

  const validate = () => {
    if (isLocal) {
      setValidation({ state: 'ok', message: 'Local models do not need a key.' })
      return
    }
    if (!key.trim()) {
      setValidation({ state: 'error', message: 'Enter a key before validating.' })
      return
    }
    setValidation({ state: 'checking', message: 'Checking key format…' })
    window.setTimeout(() => {
      if (key.trim().startsWith(providerMeta.prefix)) {
        setValidation({ state: 'ok', message: 'Format looks valid. Save to use it.' })
      } else {
        setValidation({
          state: 'error',
          message: `That does not look like a ${provider} key — expected it to start with ${providerMeta.prefix}.`,
        })
      }
    }, 750)
  }

  const save = () => {
    onSave({ provider, key: isLocal ? '' : key.trim() })
    setValidation({ state: 'ok', message: isLocal ? 'Saved. Local models will be used.' : 'Key saved locally.' })
  }

  return (
    <ViewFrame
      title="API Key"
      subtitle="Connect NEXORA to the model provider that powers live runs."
      action={
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={13} strokeWidth={1.9} />
          Back
        </Button>
      }
    >
      <div className="mx-auto grid w-full max-w-3xl gap-3">
        <SectionCard
          title="Provider"
          description="Where NEXORA sends model requests."
          action={<Badge tone="accent">Local only</Badge>}
        >
          <div className="space-y-4">
            <Field label="Provider" hint={providerMeta.hint}>
              <select
                className="field"
                value={provider}
                onChange={(event) => {
                  setProvider(event.target.value)
                  setValidation({ state: 'idle', message: '' })
                }}
              >
                {PROVIDERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="API key" hint={isLocal ? 'not required' : 'stored locally'}>
              <div className="relative">
                <input
                  className="field pr-11"
                  type={visible ? 'text' : 'password'}
                  value={key}
                  disabled={isLocal}
                  placeholder={isLocal ? 'Local models run without a key' : `${providerMeta.prefix}…`}
                  onChange={(event) => {
                    setKey(event.target.value)
                    setValidation({ state: 'idle', message: '' })
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setVisible((current) => !current)}
                  disabled={isLocal}
                  aria-label={visible ? 'Hide key' : 'Show key'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted transition-colors hover:text-[rgb(var(--ink))] disabled:opacity-40"
                >
                  {visible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            {validation.state !== 'idle' ? (
              <div
                className="flex items-start gap-2 rounded-xl border px-3 py-2.5"
                style={{
                  borderColor:
                    validation.state === 'error'
                      ? 'rgb(var(--danger) / 0.32)'
                      : 'rgb(var(--success) / 0.3)',
                  background:
                    validation.state === 'error' ? 'rgb(var(--danger) / 0.08)' : 'rgb(var(--success) / 0.07)',
                }}
              >
                <span className="mt-0.5 shrink-0">
                  {validation.state === 'checking' ? (
                    <LoaderCircle size={14} className="spin-slow text-[rgb(var(--accent))]" />
                  ) : validation.state === 'error' ? (
                    <CircleX size={14} className="text-[rgb(var(--danger))]" />
                  ) : (
                    <CircleCheck size={14} className="text-[rgb(var(--success))]" />
                  )}
                </span>
                <p className="text-[12px] leading-relaxed text-muted">{validation.message}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" size="md" onClick={save}>
                <KeyRound size={14} strokeWidth={1.9} />
                Save key
              </Button>
              <Button variant="glass" size="md" onClick={validate} disabled={validation.state === 'checking'}>
                Validate format
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Security" description="How the key is handled in this prototype.">
          <ul className="space-y-2.5">
            {[
              'The key stays in this browser’s local storage — it is never uploaded to NEXORA servers.',
              'Live requests go directly from your machine to the provider you select.',
              'The desktop build stores keys with OS-level encryption (DPAPI / safeStorage).',
              'Format validation is local; it does not contact the provider or spend tokens.',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-muted">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[rgb(var(--accent))]" />
                {line}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </ViewFrame>
  )
}
