import { AGENTS, AGENT_ORDER } from '../agents'
import type { AgentId } from '../lib/supabase'

type Props = {
  active: AgentId
  onChange: (id: AgentId) => void
}

export function AgentTabs({ active, onChange }: Props) {
  return (
    <nav className="tabs" role="tablist" aria-label="Choose an agent">
      {AGENT_ORDER.map((id) => {
        const agent = AGENTS[id]
        const isActive = id === active
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            className={`tab ${isActive ? 'tab--active' : ''}`}
            onClick={() => onChange(id)}
            style={
              isActive
                ? { borderColor: agent.accent, background: agent.accentSoft, color: agent.accent }
                : undefined
            }
          >
            <span className="tab__avatar" style={{ background: agent.accent }}>
              {agent.name[0]}
            </span>
            <span className="tab__text">
              <span className="tab__name">{agent.name}</span>
              <span className="tab__tagline">{agent.tagline}</span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}
