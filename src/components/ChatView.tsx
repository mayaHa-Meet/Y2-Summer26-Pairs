import { useEffect, useRef } from 'react'
import { ChatInput } from './ChatInput'
import { MessageBubble } from './MessageBubble'
import { useChat } from '../hooks/useChat'
import { AGENTS } from '../agents'
import type { AgentId } from '../lib/supabase'

type Props = {
  agent: AgentId
  goal: string
}

export function ChatView({ agent, goal }: Props) {
  const { messages, loading, sending, error, send, clearHistory } = useChat(agent, goal)
  const scrollRef = useRef<HTMLDivElement>(null)
  const config = AGENTS[agent]

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  return (
    <section className="chat-view" style={{ ['--accent' as any]: config.accent }}>
      <header className="chat-view__header">
        <div>
          <h2 className="chat-view__title">{config.name}</h2>
          <p className="chat-view__subtitle">{config.description}</p>
        </div>
        {messages.length > 0 && (
          <button className="chat-view__clear" onClick={clearHistory} title="Clear conversation">
            Clear
          </button>
        )}
      </header>

      <div className="chat-view__scroll" ref={scrollRef}>
        {loading ? (
          <SkeletonLines />
        ) : messages.length === 0 ? (
          <EmptyState accent={config.accent} accentSoft={config.accentSoft} name={config.name} />
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              accent={config.accent}
              accentSoft={config.accentSoft}
              agentName={config.name}
            />
          ))
        )}
      </div>

      {error && <div className="chat-view__error">{error}</div>}

      <ChatInput onSend={send} disabled={sending} />
    </section>
  )
}

function SkeletonLines() {
  return (
    <div className="skeleton">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton__row" style={{ width: `${70 - i * 15}%` }} />
      ))}
    </div>
  )
}

function EmptyState({
  accent,
  accentSoft,
  name,
}: {
  accent: string
  accentSoft: string
  name: string
}) {
  return (
    <div className="empty">
      <div className="empty__avatar" style={{ background: accent }}>
        {name[0]}
      </div>
      <h3 className="empty__title">Start a conversation with {name}</h3>
      <p className="empty__hint" style={{ background: accentSoft, color: accent }}>
        Ask a question below — your chat history is saved automatically.
      </p>
    </div>
  )
}
