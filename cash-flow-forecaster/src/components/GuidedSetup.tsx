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
import { billCategories } from '../guided/billCategories'
import { subscriptionCategories } from '../guided/subscriptionCategories'
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
  allowsMultiple: boolean
  addActionLabel: string
  kind: 'single' | 'bills' | 'subscriptions'
}

const prompts: readonly PromptDefinition[] = [
  {
    title: 'When do you usually get paid?',
    description: 'An approximate amount is enough. You can revise this later.',
    defaultName: 'Income',
    type: 'income',
    recurrences: ['monthly', 'weekly'],
    hint: 'For example, salary, allowance, or freelance income.',
    allowsMultiple: false,
    addActionLabel: 'Add estimate and continue',
    kind: 'single',
  },
  {
    title: 'How often do you buy groceries?',
    description: 'Think about one typical trip, not your whole month.',
    defaultName: 'Groceries',
    type: 'expense',
    recurrences: ['weekly', 'biweekly'],
    hint: 'Use the amount you usually spend on one trip.',
    allowsMultiple: false,
    addActionLabel: 'Add estimate and continue',
    kind: 'single',
  },
  {
    title: 'Do you regularly pay for petrol or transport?',
    description: 'Add a typical top-up or trip if it is part of your routine.',
    defaultName: 'Petrol',
    type: 'expense',
    recurrences: ['weekly', 'biweekly'],
    hint: 'You can rename this to Transport if that fits better.',
    allowsMultiple: false,
    addActionLabel: 'Add estimate and continue',
    kind: 'single',
  },
  {
    title: 'Which bills sound familiar?',
    description: 'Choose every category you pay for. You can select more than one.',
    defaultName: '',
    type: 'expense',
    recurrences: ['monthly'],
    hint: 'Choose the next bill you are most likely to forget.',
    allowsMultiple: true,
    addActionLabel: 'Add bill',
    kind: 'bills',
  },
  {
    title: 'Which subscriptions sound familiar?',
    description: 'Choose every service you pay for. Small repeat charges are easy to miss.',
    defaultName: '',
    type: 'expense',
    recurrences: ['monthly'],
    hint: 'Nothing is added until you enter the amount and next billing date.',
    allowsMultiple: false,
    addActionLabel: '',
    kind: 'subscriptions',
  },
  {
    title: 'Anything else expected in the next 30 days?',
    description: 'Add one cost you already know is coming, such as insurance or a trip.',
    defaultName: 'Expected cost',
    type: 'expense',
    recurrences: ['once', 'monthly', 'yearly'],
    hint: 'You can skip this if nothing comes to mind.',
    allowsMultiple: false,
    addActionLabel: 'Add estimate and continue',
    kind: 'single',
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
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([])
  const [billAnswers, setBillAnswers] = useState<Record<string, BillAnswer>>({})
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState<string[]>([])
  const [subscriptionAnswers, setSubscriptionAnswers] = useState<Record<string, BillAnswer>>({})

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
    setSelectedBillIds([])
    setBillAnswers({})
    setSelectedSubscriptionIds([])
    setSubscriptionAnswers({})
    setError(null)
  }

  function addEstimate(shouldContinue: boolean) {
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
    if (shouldContinue) {
      moveToPrompt(step + 1, updatedItems)
      return
    }

    // Repeatable prompts reset only their local answer fields. Previously added
    // bills/subscriptions stay in the plan and remain visible in the counter.
    setName('')
    setAmount('')
    setFirstDate(settings?.startDate ?? startDate)
    setError(null)
  }

  /** Selects a recognised bill category and creates a local draft for it. */
  function toggleBillCategory(categoryId: string) {
    const category = billCategories.find((candidate) => candidate.id === categoryId)
    if (!category) {
      return
    }

    if (selectedBillIds.includes(categoryId)) {
      setSelectedBillIds((currentIds) => currentIds.filter((id) => id !== categoryId))
      setBillAnswers((currentAnswers) => {
        const { [categoryId]: _, ...remainingAnswers } = currentAnswers
        return remainingAnswers
      })
      return
    }

    setSelectedBillIds((currentIds) => [...currentIds, categoryId])
    setBillAnswers((currentAnswers) => ({
      ...currentAnswers,
      [categoryId]: {
        name: category.defaultName,
        amount: '',
        firstDate: settings?.startDate ?? startDate,
      },
    }))
  }

  function updateBillAnswer(
    categoryId: string,
    field: keyof BillAnswer,
    value: string,
  ) {
    setBillAnswers((currentAnswers) => ({
      ...currentAnswers,
      [categoryId]: { ...currentAnswers[categoryId]!, [field]: value },
    }))
  }

  /** Mirrors bill selection for optional recurring services. */
  function toggleSubscriptionCategory(categoryId: string) {
    const category = subscriptionCategories.find((candidate) => candidate.id === categoryId)
    if (!category) {
      return
    }

    if (selectedSubscriptionIds.includes(categoryId)) {
      setSelectedSubscriptionIds((currentIds) => currentIds.filter((id) => id !== categoryId))
      setSubscriptionAnswers((currentAnswers) => {
        const { [categoryId]: _, ...remainingAnswers } = currentAnswers
        return remainingAnswers
      })
      return
    }

    setSelectedSubscriptionIds((currentIds) => [...currentIds, categoryId])
    setSubscriptionAnswers((currentAnswers) => ({
      ...currentAnswers,
      [categoryId]: {
        name: category.defaultName,
        amount: '',
        firstDate: settings?.startDate ?? startDate,
      },
    }))
  }

  function updateSubscriptionAnswer(
    categoryId: string,
    field: keyof BillAnswer,
    value: string,
  ) {
    setSubscriptionAnswers((currentAnswers) => ({
      ...currentAnswers,
      [categoryId]: { ...currentAnswers[categoryId]!, [field]: value },
    }))
  }

  /** Validates all selected bills as a batch, then adds distinct source items. */
  function addBillsAndContinue() {
    if (selectedBillIds.length === 0) {
      moveToPrompt(step + 1)
      return
    }

    const billItems: ForecastItem[] = []
    for (const categoryId of selectedBillIds) {
      const answer = billAnswers[categoryId]
      const amountCents = answer ? parseMoneyToCents(answer.amount) : null

      if (
        answer === undefined ||
        amountCents === null ||
        answer.name.trim() === '' ||
        !isValidDateKey(answer.firstDate)
      ) {
        setError('Add a name, amount, and next payment date for every selected bill.')
        return
      }

      billItems.push(
        createEstimatedItem({
          id: crypto.randomUUID(),
          name: answer.name.trim(),
          type: 'expense',
          amountCents,
          firstOccurrenceDate: answer.firstDate,
          recurrence: 'monthly',
        }),
      )
    }

    const updatedItems = [...items, ...billItems]
    setItems(updatedItems)
    moveToPrompt(step + 1, updatedItems)
  }

  /** Adds every selected subscription as an independent monthly estimate. */
  function addSubscriptionsAndContinue() {
    if (selectedSubscriptionIds.length === 0) {
      moveToPrompt(step + 1)
      return
    }

    const subscriptionItems: ForecastItem[] = []
    for (const categoryId of selectedSubscriptionIds) {
      const answer = subscriptionAnswers[categoryId]
      const amountCents = answer ? parseMoneyToCents(answer.amount) : null

      if (
        answer === undefined ||
        amountCents === null ||
        answer.name.trim() === '' ||
        !isValidDateKey(answer.firstDate)
      ) {
        setError('Add a name, amount, and next billing date for every selected subscription.')
        return
      }

      subscriptionItems.push(
        createEstimatedItem({
          id: crypto.randomUUID(),
          name: answer.name.trim(),
          type: 'expense',
          amountCents,
          firstOccurrenceDate: answer.firstDate,
          recurrence: 'monthly',
        }),
      )
    }

    const updatedItems = [...items, ...subscriptionItems]
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

  if (prompt.kind === 'bills') {
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
        <div className="category-grid" aria-label="Bill categories">
          {billCategories.map((category) => {
            const isSelected = selectedBillIds.includes(category.id)
            return (
              <button
                aria-pressed={isSelected}
                className={isSelected ? 'category-choice category-choice-selected' : 'category-choice'}
                key={category.id}
                onClick={() => toggleBillCategory(category.id)}
                type="button"
              >
                {category.label}
              </button>
            )
          })}
        </div>
        {selectedBillIds.length > 0 && (
          <div className="bill-answer-list">
            <p className="selected-heading">Add what you remember for each selected bill</p>
            {selectedBillIds.map((categoryId) => {
              const answer = billAnswers[categoryId]!
              return (
                <div className="bill-answer" key={categoryId}>
                  <label>
                    Bill name
                    <input value={answer.name} onChange={(event) => updateBillAnswer(categoryId, 'name', event.target.value)} />
                  </label>
                  <label>
                    Typical amount
                    <input inputMode="decimal" value={answer.amount} onChange={(event) => updateBillAnswer(categoryId, 'amount', event.target.value)} placeholder="RM 0.00" />
                  </label>
                  <label>
                    Next payment date
                    <input type="date" value={answer.firstDate} onChange={(event) => updateBillAnswer(categoryId, 'firstDate', event.target.value)} />
                  </label>
                </div>
              )
            })}
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button className="button-primary" type="button" onClick={addBillsAndContinue}>
            {selectedBillIds.length === 0 ? 'Skip for now' : 'Add selected bills and continue'}
          </button>
        </div>
      </section>
    )
  }

  if (prompt.kind === 'subscriptions') {
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
        <div className="category-grid" aria-label="Subscription choices">
          {subscriptionCategories.map((category) => {
            const isSelected = selectedSubscriptionIds.includes(category.id)
            return (
              <button
                aria-pressed={isSelected}
                className={isSelected ? 'category-choice category-choice-selected' : 'category-choice'}
                key={category.id}
                onClick={() => toggleSubscriptionCategory(category.id)}
                type="button"
              >
                {category.label}
              </button>
            )
          })}
        </div>
        {selectedSubscriptionIds.length > 0 && (
          <div className="bill-answer-list">
            <p className="selected-heading">Add what you remember for each selected service</p>
            {selectedSubscriptionIds.map((categoryId) => {
              const answer = subscriptionAnswers[categoryId]!
              return (
                <div className="bill-answer" key={categoryId}>
                  <label>
                    Subscription name
                    <input value={answer.name} onChange={(event) => updateSubscriptionAnswer(categoryId, 'name', event.target.value)} />
                  </label>
                  <label>
                    Typical amount
                    <input inputMode="decimal" value={answer.amount} onChange={(event) => updateSubscriptionAnswer(categoryId, 'amount', event.target.value)} placeholder="RM 0.00" />
                  </label>
                  <label>
                    Next billing date
                    <input type="date" value={answer.firstDate} onChange={(event) => updateSubscriptionAnswer(categoryId, 'firstDate', event.target.value)} />
                  </label>
                </div>
              )
            })}
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button className="button-primary" type="button" onClick={addSubscriptionsAndContinue}>
            {selectedSubscriptionIds.length === 0 ? 'Skip for now' : 'Add selected subscriptions and continue'}
          </button>
        </div>
      </section>
    )
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
        {prompt.allowsMultiple ? (
          <>
            <button className="button-primary" type="button" onClick={() => addEstimate(false)}>
              {prompt.addActionLabel}
            </button>
            <button className="button-quiet" type="button" onClick={() => moveToPrompt(step + 1)}>
              Continue when finished
            </button>
          </>
        ) : (
          <>
            <button className="button-primary" type="button" onClick={() => addEstimate(true)}>
              {prompt.addActionLabel}
            </button>
            <button className="button-quiet" type="button" onClick={() => moveToPrompt(step + 1)}>
              Skip for now
            </button>
          </>
        )}
      </div>
      {items.length > 0 && (
        <p className="estimate-count">{items.length} estimated item{items.length === 1 ? '' : 's'} added so far</p>
      )}
    </section>
  )
}

interface BillAnswer {
  name: string
  amount: string
  firstDate: string
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
