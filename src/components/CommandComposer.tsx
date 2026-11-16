import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Mic, Paperclip, Square, X } from 'lucide-react'
import { cn } from '../lib/cn'
import { Button } from './ui/Button'

interface SpeechRecognitionResultLike {
  readonly length: number
  [index: number]: { transcript: string }
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: { readonly length: number; [index: number]: SpeechRecognitionResultLike }
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

export function CommandComposer({
  value,
  onChange,
  onSend,
  onStop,
  busy,
  listening,
  onListeningChange,
  onNotice,
}: {
  value: string
  onChange: (value: string) => void
  onSend: (value: string) => void
  onStop: () => void
  busy: boolean
  listening: boolean
  onListeningChange: (listening: boolean) => void
  onNotice: (message: string) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const [attachments, setAttachments] = useState<string[]>([])

  useEffect(() => {
    const handle = window.setTimeout(() => textareaRef.current?.focus(), 350)
    return () => window.clearTimeout(handle)
  }, [])

  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = '0px'
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`
  }, [value])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      recognitionRef.current = null
    }
  }, [])

  const submit = () => {
    const prompt = value.trim()
    if (!prompt || busy) return
    onSend(prompt)
    onChange('')
    setAttachments([])
  }

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const speechWindow = window as SpeechWindow
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Recognition) {
      onNotice('Voice input is not available in this browser.')
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event) => {
      let transcript = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index]![0].transcript
      }
      const clean = transcript.trim()
      if (clean) onChange(value ? `${value} ${clean}` : clean)
    }
    recognition.onend = () => {
      onListeningChange(false)
      recognitionRef.current = null
    }
    recognition.onerror = () => {
      onListeningChange(false)
      recognitionRef.current = null
      onNotice('Voice capture stopped — microphone permission may be blocked.')
    }

    recognitionRef.current = recognition
    recognition.start()
    onListeningChange(true)
  }

  return (
    <div className="composer relative px-3 pb-3 pt-3">
      <textarea
        ref={textareaRef}
        id="nexora-composer"
        rows={1}
        value={value}
        placeholder="Ask NEXORA to build, analyze, or automate something…"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
        aria-label="Command input"
      />

      {attachments.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {attachments.map((name) => (
            <span key={name} className="badge max-w-[220px]">
              <Paperclip size={11} strokeWidth={1.8} />
              <span className="truncate">{name}</span>
              <button
                type="button"
                aria-label={`Remove ${name}`}
                className="ml-0.5 text-muted transition-colors hover:text-[rgb(var(--ink))]"
                onClick={() => setAttachments((current) => current.filter((item) => item !== name))}
              >
                <X size={11} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []).map((file) => file.name)
              if (files.length) setAttachments((current) => [...new Set([...current, ...files])])
              event.target.value = ''
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Attach files"
            title="Attach files"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={17} strokeWidth={1.7} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={listening ? 'Stop listening' : 'Start voice input'}
            title={listening ? 'Stop listening' : 'Voice input'}
            onClick={toggleListening}
            className={cn(listening && 'text-[rgb(var(--accent))]')}
          >
            <Mic size={17} strokeWidth={1.7} className={cn(listening && 'animate-pulse')} />
          </Button>
          <span className="ml-1 hidden text-[11.5px] text-muted sm:inline">
            {listening ? 'Listening…' : 'Enter to send · Shift+Enter for a new line'}
          </span>
        </div>

        {busy ? (
          <Button variant="subtle" size="sm" onClick={onStop} aria-label="Stop execution">
            <Square size={12} strokeWidth={2.2} />
            Stop
          </Button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim()}
            aria-label="Send command"
            className={cn(
              'btn btn-primary btn-icon h-9 w-9 rounded-xl',
              !value.trim() && 'cursor-not-allowed opacity-45',
            )}
          >
            <ArrowUp size={18} strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  )
}
