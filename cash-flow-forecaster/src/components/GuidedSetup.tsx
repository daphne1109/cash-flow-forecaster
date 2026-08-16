import { useState } from 'react'
import { isValidDateKey } from '../domain/date'
import { parseMoneyToCents } from '../domain/money'
import type {
  ForecastItem,
  ForecastSettings,
  ItemType,
  Recurrence,
} from '../domain/types'
import { createEstimatedItem } from '../guided/createEstimatedItem'
import type { PersistedPlan } from '../storage/forecastStore'

interface GuidedSetupProps {
  onComplete: (plan: PersistedPlan) => void
  onCancel: () => void
}

interface PromptDefinition {
  title: string
  description: string
  defaultName: string
  type: ItemType
  recurrences: readonly Recurrence[]
  hint: string
}

const prompts: readonly PromptDefinition[] = [
  {
    title: 'When do you usually get paid?',
    description: 'An approximate amount is enough. You can revise this later.',
    defaultName: 'Income',
    type: 'income',
    recurrences: ['monthly', 'weekly'],
    hint: 'For example, salary, allowance, or freelance income.',
  },
  {
    title: 'How often do you buy groceries?',
    description: 'Think about one typical trip, not your whole month.',
    defaultName: 'Groceries',
    type: 'expense',
    recurrences: ['weekly', 'biweekly'],
    hint: 'Use the amount you usually spend on one trip.',
  },
  {
    title: 'Do you regularly pay for petrol or transport?',
    description: 'Add a typical top-up or trip if it is part of your routine.',
    defaultName: 'Petrol',
    type: 'expense',
    recurrences: ['weekly', 'biweekly'],
    hint: 'You can rename this to Transport if that fits better.',
  },
  {
    title: 'Do you have a regular bill?',
    description: 'Think about rent, electricity, water, phone, or internet.',
    defaultName: 'Electricity bill',
    type: 'expense',
    recurrences: ['monthly'],
    hint: 'Choose the next bill you are most likely to forget.',
  },
  {
    title: 'Any subscriptions you pay for?',
    description: 'Small repeat charges are easy to miss in a busy month.',
    defaultName: 'Spotify',
    type: 'expense',
    recurrences: ['monthly'],
    hint: 'Examples: YouTube Premium, iCloud, OneDrive, Duolingo, or Goodnotes.',
  },
  {
    title: 'Anything else expected in the next 30 days?',
    description: 'Add one cost you already know is coming, such as insurance or a trip.',
    defaultName: 'Expected cost',
    type: 'expense',
    recurrences: ['once', 'monthly', 'yearly'],
    hint: 'You can skip this if nothing comes to mind.',
  },
]

/**
 * Guides a user from everyday spending memories to editable source items.
 * Every question is optional so uncertainty never blocks a first forecast.
 */
export function GuidedSetup({ onComplete, onCancel }: GuidedSetupProps) {
  const [step, setStep] = useState(-1)
  const [settings, setSettings] = useState<ForecastSettings | null>(null)
  const [items, setItems] = useState<ForecastItem[]>([])
  const [openingBalance, setOpeningBalance] = useState('')
  const [startDate, setStartDate] = useState(todayDateKey())
  const [name, setName] = useState(prompts[0].defaultName)
  const [amount, setAmount] = useState('')
  const [firstDate, setFirstDate] = useState(todayDateKey())
  const [recurrence, setRecurrence] = useState<Recurrence>(
    prompts[0].recurrences[0],
  )
  const [error, setError] = useState<string | null>(null)

  const prompt = step >= 0 ? prompts[step] : null

  function continueFromBalance() {
    const openingBalanceCents = parseMoneyToCents(openingBalance, {
      allowNegative: true,
    })

    if (openingBalanceCents === null || !isValidDateKey(startDate)) {
      setError('Enter a valid opening balance and forecast start date.')
      return
    }

    setSettings({ openingBalanceCents, startDate, horizonDays: 30 })
    moveToPrompt(0)
  }

  function moveToPrompt(nextStep: number, completedItems = items) {
    if (nextStep >= prompts.length) {
      if (settings === null) {
        return
      }

      onComplete({ version: 1, settings, items: completedItems })
      return
    }

    const nextPrompt = prompts[nextStep]
    setStep(nextStep)
    setName(nextPrompt.defaultName)
    setAmount('')
    setFirstDate(settings?.startDate ?? startDate)
    setRecurrence(nextPrompt.recurrences[0])
    setError(null)
  }

  function addEstimateAndContinue() {
    if (prompt === null) {
      return
    }

    const amountCents = parseMoneyToCents(amount)
    if (
      amountCents === null ||
      name.trim() === '' ||
      !isValidDateKey(firstDate)
    ) {
      setError('Add a name, a positive amount, and a valid next payment date.')
      return
    }

    const estimatedItem = createEstimatedItem({
      id: crypto.randomUUID(),
      name: name.trim(),
      type: prompt.type,
      amountCents,
      firstOccurrenceDate: firstDate,
      recurrence,
    })
    const updatedItems = [...items, estimatedItem]

    setItems(updatedItems)
    moveToPrompt(step + 1, updatedItems)
  }

  if (step === -1) {
    return (
      <section className="setup-card" aria-labelledby="opening-balance-title">
        <p className="step-label">Start with what you know</p>
        <h2 id="opening-balance-title">What is in your account today?</h2>
        <p className="support-copy">
          This is your balance before scheduled payments on the forecast start date.
        </p>
        <div className="form-grid">
          <label>
            Opening balance
            <input
              inputMode="decimal"
              value={openingBalance}
              onChange={(event) => setOpeningBalance(event.target.value)}
              placeholder="RM 1,000.00"
            />
          </label>
          <label>
            Forecast starts
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button className="button-primary" type="button" onClick={continueFromBalance}>
            Continue
          </button>
          <button className="button-quiet" type="button" onClick={onCancel}>
            Back
          </button>
        </div>
      </section>
    )
  }

  if (prompt === null) {
    return null
  }

  return (
    <section className="setup-card" aria-labelledby="guided-prompt-title">
      <p className="step-label">Money check-in · {step + 1} of {prompts.length}</p>
      <div className="progress-rail" aria-label={`Step ${step + 1} of ${prompts.length}`}>
        {prompts.map((_, index) => (
          <span className={index <= step ? 'rail-dot rail-dot-active' : 'rail-dot'} key={index} />
        ))}
      </div>
      <h2 id="guided-prompt-title">{prompt.title}</h2>
      <p className="support-copy">{prompt.description}</p>
      <p className="prompt-hint">{prompt.hint}</p>
      <div className="form-grid">
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Typical amount
          <input
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="RM 0.00"
          />
        </label>
        <label>
          Next payment / trip date
          <input
            type="date"
            value={firstDate}
            onChange={(event) => setFirstDate(event.target.value)}
          />
        </label>
        <label>
          How often?
          <select value={recurrence} onChange={(event) => setRecurrence(event.target.value as Recurrence)}>
            {prompt.recurrences.map((option) => (
              <option value={option} key={option}>{recurrenceLabel(option)}</option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button className="button-primary" type="button" onClick={addEstimateAndContinue}>
          Add estimate and continue
        </button>
        <button className="button-quiet" type="button" onClick={() => moveToPrompt(step + 1)}>
          Skip for now
        </button>
      </div>
      {items.length > 0 && (
        <p className="estimate-count">{items.length} estimated item{items.length === 1 ? '' : 's'} added so far</p>
      )}
    </section>
  )
}

function todayDateKey(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function recurrenceLabel(recurrence: Recurrence): string {
  return recurrence === 'biweekly'
    ? 'Every 2 weeks'
    : recurrence[0].toUpperCase() + recurrence.slice(1)
}
