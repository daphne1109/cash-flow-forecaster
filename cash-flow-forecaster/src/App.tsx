/**
 * Application shell.
 *
 * Product features are introduced in later milestones; keeping this component
 * deliberately small verifies that the React entry point is healthy without
 * coupling the initial scaffold to unfinished forecast behaviour.
 */
import { useState } from 'react'
import { ForecastDashboard } from './components/ForecastDashboard'
import { GuidedSetup } from './components/GuidedSetup'
import { createDemoPlan } from './storage/demoPlan'
import { loadPlan, savePlan, type PersistedPlan } from './storage/forecastStore'

/** Owns saved source data and routes between onboarding and the forecast view. */
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

  if (plan !== null) return <ForecastDashboard plan={plan} onPlanChange={completeSetup} onRestart={() => setIsSettingUp(true)} />

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
