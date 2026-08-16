/**
 * Application shell.
 *
 * Product features are introduced in later milestones; keeping this component
 * deliberately small verifies that the React entry point is healthy without
 * coupling the initial scaffold to unfinished forecast behaviour.
 */
import { useState } from 'react'
import { formatCents } from './domain/money'
import { GuidedSetup } from './components/GuidedSetup'
import { createDemoPlan } from './storage/demoPlan'
import { loadPlan, savePlan, type PersistedPlan } from './storage/forecastStore'

/**
 * Owns the local-first onboarding state until the dashboard is implemented.
 * Guided setup produces ordinary forecast source records, then this boundary
 * persists them before a later dashboard reads and calculates the forecast.
 */
function App() {
  const [plan, setPlan] = useState<PersistedPlan | null>(() => loadPlan())
  const [isSettingUp, setIsSettingUp] = useState(false)

  function completeSetup(nextPlan: PersistedPlan) {
    savePlan(nextPlan)
    setPlan(nextPlan)
    setIsSettingUp(false)
  }

  function loadDemo() {
    completeSetup(createDemoPlan())
  }

  if (isSettingUp) {
    return (
      <main className="app-shell">
        <GuidedSetup onComplete={completeSetup} onCancel={() => setIsSettingUp(false)} />
      </main>
    )
  }

  if (plan !== null) {
    return (
      <main className="app-shell">
        <section className="setup-card plan-ready" aria-labelledby="plan-ready-title">
          <p className="step-label">Your starting plan is saved</p>
          <h1 id="plan-ready-title">You have {plan.items.length} item{plan.items.length === 1 ? '' : 's'} to forecast.</h1>
          <p className="support-copy">The next dashboard step will turn these estimates into a daily cash forecast.</p>
          <ul className="estimate-list">
            {plan.items.map((item) => (
              <li key={item.id}>
                <span>{item.name} <small>Estimated</small></span>
                <strong>{item.type === 'income' ? '+' : '-'}{formatCents(item.amountCents)}</strong>
              </li>
            ))}
          </ul>
          <button className="button-quiet" type="button" onClick={() => setIsSettingUp(true)}>
            Start a new guided setup
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="welcome" aria-labelledby="app-title">
        <p className="eyebrow">Cashflow · your next 30 days</p>
        <h1 id="app-title">Start with everyday habits, not a perfect budget.</h1>
        <p>Answer a few practical questions about money coming in and going out. Each rough answer becomes an estimate you can adjust later.</p>
        <div className="form-actions">
          <button className="button-primary" type="button" onClick={() => setIsSettingUp(true)}>Build my first forecast</button>
          <button className="button-quiet" type="button" onClick={loadDemo}>Load demo data</button>
        </div>
      </section>
    </main>
  )
}

export default App
