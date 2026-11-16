import { motion } from 'framer-motion'
import type { ChatMessage, OrbState } from '../types'
import { formatTime } from '../lib/cn'
import { Orb } from './Orb'

function AssistantRow({ message, status }: { message: ChatMessage; status: OrbState }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.3, 1] as [number, number, number, number] }}
      className="flex gap-3"
    >
      <Orb state={message.streaming ? 'thinking' : status} size={34} float={false} />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline gap-2">
          <span className="text-[12.5px] font-medium">NEXORA</span>
          <span className="text-[10.5px] text-muted">{formatTime(message.createdAt)}</span>
        </div>
        <div className="bubble-agent max-w-[78ch] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed text-[rgb(var(--ink))]">
          <span className="whitespace-pre-wrap">
            {message.content}
            {message.streaming ? <span className="caret" /> : null}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function ChatStream({
  messages,
  status,
}: {
  messages: ChatMessage[]
  status: OrbState
}) {
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5 py-2">
      {messages.map((message) =>
        message.role === 'assistant' ? (
          <AssistantRow key={message.id} message={message} status={status} />
        ) : (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.2, 0.7, 0.3, 1] as [number, number, number, number] }}
            className="flex justify-end"
          >
            <div className="max-w-[78%]">
              <div className="bubble-user rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed">
                <span className="whitespace-pre-wrap">{message.content}</span>
              </div>
              <p className="mt-1 text-right text-[10.5px] text-muted">{formatTime(message.createdAt)}</p>
            </div>
          </motion.div>
        ),
      )}

      {messages.length === 0 ? (
        <p className="text-center text-[12.5px] text-muted">Nothing here yet — ask NEXORA to begin.</p>
      ) : null}
    </div>
  )
}
