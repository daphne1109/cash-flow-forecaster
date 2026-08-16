import { useEffect, useState } from 'react'
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { parseDateKey } from '../domain/date'
import { generateForecast } from '../domain/forecast'
import { formatCents, parseMoneyToCents } from '../domain/money'
import type { ForecastItem, Recurrence } from '../domain/types'
import { validateForecastItem } from '../domain/types'
import type { PersistedPlan } from '../storage/forecastStore'

interface ForecastDashboardProps {
  plan: PersistedPlan
  onPlanChange: (plan: PersistedPlan) => void
  onRestart: () => void
}

/** Renders one auditable forecast result as insights, chart, source items, and ledger. */
export function ForecastDashboard({ plan, onPlanChange, onRestart }: ForecastDashboardProps) {
  const [editingItem, setEditingItem] = useState<ForecastItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const forecast = generateForecast(plan.settings, plan.items)

  function saveItem(item: ForecastItem) {
    const items = isCreating
      ? [...plan.items, item]
      : plan.items.map((current) => current.id === item.id ? item : current)
    onPlanChange({ ...plan, items })
    setEditingItem(null)
    setIsCreating(false)
  }

  function removeItem(item: ForecastItem) {
    if (window.confirm(`Remove ${item.name}?`)) {
      onPlanChange({ ...plan, items: plan.items.filter((current) => current.id !== item.id) })
    }
  }

  return <main className="dashboard-shell">
    <header className="dashboard-header">
      <div><p className="eyebrow">Cashflow · 30-day outlook</p><h1>Know the tight days before they arrive.</h1></div>
      <button className="button-quiet" type="button" onClick={onRestart}>Start a new plan</button>
    </header>

    <section className="insight-grid" aria-label="Forecast insights">
      <article className="insight-card"><span>Lowest projected balance</span><strong>{formatCents(forecast.lowestBalanceCents)}</strong><p>{formatDate(forecast.lowestBalanceDate)}</p></article>
      <article className={forecast.firstNegativeDate ? 'insight-card insight-card-warning' : 'insight-card'}>
        <span>{forecast.firstNegativeDate ? 'First shortfall' : 'Outlook'}</span>
        <strong>{forecast.firstNegativeDate ? formatDate(forecast.firstNegativeDate) : 'No shortfall projected'}</strong>
        <p>{forecast.firstNegativeDate ? 'Your end-of-day balance first falls below RM 0.' : 'Your projected balance stays at or above RM 0.'}</p>
      </article>
    </section>

    <section className="dashboard-grid">
      <article className="chart-panel" aria-labelledby="chart-title">
        <div className="panel-heading"><div><p className="step-label">Balance over time</p><h2 id="chart-title">Your cash tide</h2></div><span className="chart-note">End-of-day balance</span></div>
        <div className="forecast-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={forecast.days.map((day) => ({ date: day.date, balance: day.endingBalanceCents / 100, net: day.netChangeCents / 100 }))} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis tickFormatter={(value) => `RM${value}`} tickLine={false} axisLine={false} width={70} />
          <Tooltip content={<BalanceTooltip />} />
          <ReferenceLine y={0} stroke="#b3c9c4" strokeDasharray="4 4" />
          <Line dataKey="balance" type="monotone" stroke="#14766e" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
        </LineChart></ResponsiveContainer></div>
        <p className="chart-caption">The line shows your balance after each day&apos;s scheduled items.</p>
      </article>

      <aside className="items-panel" aria-labelledby="items-title">
        <div className="panel-heading"><div><p className="step-label">Your inputs</p><h2 id="items-title">Scheduled money</h2></div><button className="button-quiet" type="button" onClick={() => { setEditingItem(null); setIsCreating(true) }}>Add item</button></div>
        <ul className="dashboard-item-list">
          {plan.items.length === 0 ? <li className="empty-items">No items yet. Add one to make the forecast more useful.</li> : plan.items.map((item) => <li key={item.id}>
            <div><strong>{item.name}</strong><span>{item.source === 'guided-estimate' ? 'Estimated · ' : ''}{recurrenceLabel(item.recurrence, item.customIntervalDays)} · {formatDate(item.firstOccurrenceDate)}</span></div>
            <div className="item-actions"><b className={item.type === 'income' ? 'income-amount' : 'expense-amount'}>{item.type === 'income' ? '+' : '-'}{formatCents(item.amountCents)}</b><button type="button" onClick={() => { setEditingItem(item); setIsCreating(false) }}>Edit</button><button type="button" onClick={() => removeItem(item)}>Remove</button></div>
          </li>)}
        </ul>
      </aside>
    </section>

    {(isCreating || editingItem) && <ItemEditor item={editingItem} onCancel={() => { setEditingItem(null); setIsCreating(false) }} onSave={saveItem} />}

    <section className="ledger-panel" aria-labelledby="ledger-title">
      <div className="panel-heading"><div><p className="step-label">Why the balance moves</p><h2 id="ledger-title">Daily ledger</h2></div><span className="chart-note">All 30 days</span></div>
      <div className="ledger-scroll"><table><thead><tr><th>Date</th><th>Scheduled items</th><th>Daily change</th><th>End-of-day balance</th></tr></thead><tbody>
        {forecast.days.map((day) => {
          const isLowestDay = day.date === forecast.lowestBalanceDate
          const isFirstNegativeDay = day.date === forecast.firstNegativeDate

          return <tr className={isLowestDay ? 'ledger-lowest' : isFirstNegativeDay ? 'ledger-negative' : ''} key={day.date}>
          <td>{formatDate(day.date)}{isLowestDay && <span className="ledger-badge">Lowest balance</span>}{isFirstNegativeDay && <span className="ledger-badge ledger-badge-warning">First shortfall</span>}</td>
          <td>{day.occurrences.length === 0 ? <span className="muted">No scheduled items</span> : day.occurrences.map((item) => <span className="ledger-occurrence" key={`${item.itemId}-${item.date}`}>{item.itemName} {item.signedAmountCents >= 0 ? '+' : '-'}{formatCents(Math.abs(item.signedAmountCents))}</span>)}</td>
          <td className={day.netChangeCents < 0 ? 'expense-amount' : day.netChangeCents > 0 ? 'income-amount' : ''}>{signedCents(day.netChangeCents)}</td>
          <td className={day.endingBalanceCents < 0 ? 'expense-amount' : ''}>{formatCents(day.endingBalanceCents)}</td>
        </tr>
        })}
      </tbody></table></div>
    </section>
    <footer className="product-note">Your plan is stored only in this browser. Cashflow is a planning tool, not financial advice.</footer>
  </main>
}

interface ItemEditorProps { item: ForecastItem | null; onCancel: () => void; onSave: (item: ForecastItem) => void }

/** Edits the source data only; the parent immediately recalculates derived forecast rows. */
function ItemEditor({ item, onCancel, onSave }: ItemEditorProps) {
  const [name, setName] = useState(item?.name ?? '')
  const [type, setType] = useState(item?.type ?? 'expense')
  const [amount, setAmount] = useState(item ? String(item.amountCents / 100) : '')
  const [firstDate, setFirstDate] = useState(item?.firstOccurrenceDate ?? '')
  const [recurrence, setRecurrence] = useState<Recurrence>(item?.recurrence ?? 'once')
  const [customIntervalDays, setCustomIntervalDays] = useState(item?.customIntervalDays ? String(item.customIntervalDays) : '3')
  const [error, setError] = useState<string | null>(null)

  // Escape gives keyboard users the same quick exit as the visible close action.
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onCancel])

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amountCents = parseMoneyToCents(amount)
    if (amountCents === null) { setError('Enter a positive amount in Ringgit.'); return }
    const parsedCustomInterval = parseCustomIntervalDays(customIntervalDays)
    const next: ForecastItem = { id: item?.id ?? crypto.randomUUID(), name: name.trim(), type, amountCents, firstOccurrenceDate: firstDate, recurrence, customIntervalDays: recurrence === 'custom' ? parsedCustomInterval ?? undefined : undefined, source: item?.source ?? 'manual' }
    const validation = validateForecastItem(next)
    if (!validation.isValid) { setError(validation.errors[0] ?? 'Check this item and try again.'); return }
    onSave(next)
  }
  return <div className="editor-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onCancel() }}>
    <section aria-describedby="item-editor-description" aria-labelledby="item-editor-title" aria-modal="true" className="editor-panel editor-modal" role="dialog">
      <div className="panel-heading"><div><p className="step-label">Forecast input</p><h2 id="item-editor-title">{item ? `Edit ${item.name}` : 'Add scheduled item'}</h2></div><button aria-label="Close editor" className="editor-close" type="button" onClick={onCancel}>×</button></div>
      <p className="editor-description" id="item-editor-description">Update the schedule, then save to recalculate your forecast.</p>
      <form className="form-grid" onSubmit={submit}>
    <label>Name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Gym membership" /></label>
    <label>Type<select value={type} onChange={(event) => setType(event.target.value as ForecastItem['type'])}><option value="expense">Expense</option><option value="income">Income</option></select></label>
    <label>Amount<input value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value)} placeholder="RM 0.00" /></label>
    <label>First date<input type="date" value={firstDate} onChange={(event) => setFirstDate(event.target.value)} /></label>
    <label>Recurrence<select value={recurrence} onChange={(event) => setRecurrence(event.target.value as Recurrence)}>{(['once', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'custom'] as const).map((value) => <option value={value} key={value}>{recurrenceLabel(value)}</option>)}</select></label>
    {recurrence === 'custom' && <label>Every how many days?<input inputMode="numeric" value={customIntervalDays} onChange={(event) => setCustomIntervalDays(event.target.value)} placeholder="e.g. 3" /></label>}
    <div className="form-actions editor-actions"><button className="button-primary" type="submit">Save item</button><button className="button-quiet" type="button" onClick={onCancel}>Cancel</button></div>
      </form>{error && <p className="form-error" role="alert">{error}</p>}
    </section>
  </div>
}

function BalanceTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: { date: string; balance: number; net: number } }> }) {
  if (!active || !payload?.[0]?.payload) return null
  const point = payload[0].payload
  return <div className="chart-tooltip"><strong>{formatDate(point.date)}</strong><span>Balance: {formatCents(Math.round(point.balance * 100))}</span><span>Change: {signedCents(Math.round(point.net * 100))}</span></div>
}

/** Formats date keys locally; it never parses a key as a UTC timestamp. */
function formatDate(key: string): string { const { year, month, day } = parseDateKey(key); return new Intl.DateTimeFormat('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(year, month - 1, day)) }
function shortDate(key: string): string { const { month, day } = parseDateKey(key); return `${day}/${month}` }
function signedCents(cents: number): string { return cents === 0 ? '—' : `${cents > 0 ? '+' : '-'}${formatCents(Math.abs(cents))}` }
function recurrenceLabel(value: Recurrence, customIntervalDays?: number): string { return value === 'custom' ? `Every ${customIntervalDays ?? '?'} days` : value === 'biweekly' ? 'Every 2 weeks' : value === 'once' ? 'One-off' : value[0].toUpperCase() + value.slice(1) }
function parseCustomIntervalDays(value: string): number | null { return /^\d+$/.test(value) && Number(value) >= 2 && Number(value) <= 365 ? Number(value) : null }
