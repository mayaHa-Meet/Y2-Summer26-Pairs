import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, type AgentId, type ChatMessageRow } from '../lib/supabase'
import { createAgentReply, type ChatTurn } from '../lib/anthropic'
import { AGENTS } from '../agents'

export type LocalMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

export function useChat(agent: AgentId, goal: string) {
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesRef = useRef<LocalMessage[]>([])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Load persisted history when switching to this agent.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('agent', agent)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
        } else if (data) {
          const rows = data as ChatMessageRow[]
          setMessages(rows.map((r) => ({ id: r.id, role: r.role, content: r.content })))
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [agent])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || sending) return

      setSending(true)
      setError(null)

      const userMsg: LocalMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed }
      const pendingId = crypto.randomUUID()
      const pendingMsg: LocalMessage = { id: pendingId, role: 'assistant', content: '', pending: true }

      // Compute history before mutating state so we have a clean snapshot.
      const history: ChatTurn[] = messagesRef.current
        .filter((m) => !m.pending)
        .map((m) => ({ role: m.role, content: m.content }))
      history.push({ role: 'user', content: trimmed })

      setMessages((prev) => [...prev, userMsg, pendingMsg])

      const { error: insertErr } = await supabase.from('chat_messages').insert({
        agent,
        role: 'user',
        content: trimmed,
      })
      if (insertErr) {
        setError(insertErr.message)
        setMessages((prev) => prev.filter((m) => m.id !== pendingId))
        setSending(false)
        return
      }

      const system = AGENTS[agent].buildSystem(goal)

      try {
        const reply = await createAgentReply(system, history)
        const assistantMsg: LocalMessage = { id: crypto.randomUUID(), role: 'assistant', content: reply }
        setMessages((prev) => [...prev.filter((m) => m.id !== pendingId), assistantMsg])

        const { error: replyErr } = await supabase.from('chat_messages').insert({
          agent,
          role: 'assistant',
          content: reply,
        })
        if (replyErr) setError(replyErr.message)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to reach the agent.'
        setError(msg)
        setMessages((prev) => prev.filter((m) => m.id !== pendingId))
      } finally {
        setSending(false)
      }
    },
    [agent, goal, sending],
  )

  const clearHistory = useCallback(async () => {
    const { error } = await supabase.from('chat_messages').delete().eq('agent', agent)
    if (error) {
      setError(error.message)
      return
    }
    setMessages([])
  }, [agent])

  return { messages, loading, sending, error, send, clearHistory }
}
