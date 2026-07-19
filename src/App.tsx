import { useState } from 'react'
import { AgentTabs } from './components/AgentTabs'
import { ChatView } from './components/ChatView'
import { AGENTS } from './agents'
import type { AgentId } from './lib/supabase'

export default function App() {
  const [active, setActive] = useState<AgentId>('tal')
  const [goal, setGoal] = useState('')
  const [goalSet, setGoalSet] = useState(false)

  const activeConfig = AGENTS[active]
  const needsGoal = activeConfig.asksGoal && !goalSet

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__brand">
          <span className="app__brand-dot" style={{ background: AGENTS.tal.accent }} />
          <span className="app__brand-dot" style={{ background: AGENTS.talia.accent }} />
          Tal &amp; Talia
        </h1>
        <p className="app__tagline">A dual-agent coding assistant</p>
      </header>

      <AgentTabs active={active} onChange={(id) => { setActive(id); setGoalSet(false) }} />

      <main className="app__main">
        {needsGoal ? (
          <GoalPrompt
            accent={activeConfig.accent}
            accentSoft={activeConfig.accentSoft}
            onSubmit={(g) => {
              setGoal(g)
              setGoalSet(true)
            }}
          />
        ) : (
          <ChatView agent={active} goal={goal} />
        )}
      </main>
    </div>
  )
}

function GoalPrompt({
  accent,
  accentSoft,
  onSubmit,
}: {
  accent: string
  accentSoft: string
  onSubmit: (goal: string) => void
}) {
  const [value, setValue] = useState('')

  const submit = () => {
    if (!value.trim()) return
    onSubmit(value.trim())
  }

  return (
    <section className="goal" style={{ ['--accent' as any]: accent }}>
      <div className="goal__card" style={{ borderColor: accent, background: accentSoft }}>
        <h2 className="goal__title" style={{ color: accent }}>
          What's your goal for this session?
        </h2>
        <p className="goal__hint">
          Tal keeps your goal in mind while debugging. Tell him what you're trying to build.
        </p>
        <textarea
          className="goal__field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Build a todo app in React and fix the bugs that come up."
          rows={3}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <button
          className="goal__button"
          style={{ background: accent }}
          onClick={submit}
          disabled={!value.trim()}
        >
          Start debugging
        </button>
      </div>
    </section>
  )
}
