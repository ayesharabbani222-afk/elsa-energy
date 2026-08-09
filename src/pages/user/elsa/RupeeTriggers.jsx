import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { triggerTemplates, triggerOptions, loads } from '../../../data/elsaData'

export default function RupeeTriggers({ triggers, setTriggers }) {
  const [condition, setCondition] = useState(triggerOptions.conditions[0])
  const [comparator, setComparator] = useState(triggerOptions.comparators[0])
  const [amount, setAmount] = useState('1500')
  const [action, setAction] = useState(triggerOptions.actions[0])
  const [selectedLoadId, setSelectedLoadId] = useState(loads[0].id)
  const [justAddedId, setJustAddedId] = useState(null)

  const needsLoad = condition === "This Load's Spend"
  const selectedLoad = loads.find(l => l.id === selectedLoadId)
  const amountValid = Number(amount) > 0
  const sentence = needsLoad
    ? `WHEN ${selectedLoad?.name}'s Spend ${comparator} Rs ${amount || 0} THEN ${action} ${selectedLoad?.name}`
    : `WHEN ${condition} ${comparator} Rs ${amount || 0} THEN ${action}`

  const flashAdded = (id) => {
    setJustAddedId(id)
    setTimeout(() => setJustAddedId(cur => (cur === id ? null : cur)), 2000)
  }

  const addTrigger = () => {
    if (!amountValid) return
    const id = `t${Date.now()}`
    setTriggers(prev => [
      { id, sentence, active: true, log: 'Just created — not yet triggered' },
      ...prev,
    ])
    flashAdded(id)
  }

  const toggle = (id) => setTriggers(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t))

  const addTemplate = (templateSentence) => {
    const id = `t${Date.now()}`
    setTriggers(prev => [
      { id, sentence: templateSentence, active: true, log: 'Added from template — not yet triggered' },
      ...prev,
    ])
    flashAdded(id)
  }

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-1">Rupee Triggers</h3>
        <p className="text-xs text-surface-400 mb-4">Default automation unit = rupees, not amps. Applies to any load in your system — not only predefined appliances.</p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-52">
            <label className="label">WHEN</label>
            <select className="select" value={condition} onChange={e => setCondition(e.target.value)}>
              {triggerOptions.conditions.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {needsLoad && (
            <div className="w-52">
              <label className="label">Select Load</label>
              <select className="select" value={selectedLoadId} onChange={e => setSelectedLoadId(e.target.value)}>
                {loads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.room}</option>)}
              </select>
            </div>
          )}
          <div className="w-40">
            <label className="label">Comparator</label>
            <select className="select" value={comparator} onChange={e => setComparator(e.target.value)}>
              {triggerOptions.comparators.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-32">
            <label className="label">Rs</label>
            <input
              className="input"
              inputMode="numeric"
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ''))}
              aria-invalid={!amountValid}
            />
          </div>
          <div className="w-56">
            <label className="label">THEN</label>
            <select className="select" value={action} onChange={e => setAction(e.target.value)}>
              {triggerOptions.actions.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <button className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed" onClick={addTrigger} disabled={!amountValid}>
            <Plus size={14} /> Add Trigger
          </button>
        </div>
        {!amountValid && <p className="text-xs text-danger-600 mt-1.5">Enter a rupee amount greater than 0.</p>}

        <div className="mt-3 rounded-lg bg-surface-50 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-800 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 font-mono">
          {sentence}
        </div>

        <div className="mt-4">
          <p className="label mb-2 flex items-center gap-1"><Sparkles size={12} /> Templates — tap to add directly</p>
          <div className="flex flex-wrap gap-2">
            {triggerTemplates.map(t => (
              <button key={t.id} type="button" onClick={() => addTemplate(t.sentence)} className="badge-info hover:opacity-80">
                {t.sentence}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-3">Active Triggers</h3>
        <div className="space-y-2">
          {triggers.length === 0 && (
            <p className="text-sm text-surface-400">No triggers yet — build one above or tap a template.</p>
          )}
          {triggers.map(t => (
            <div key={t.id} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors ${justAddedId === t.id ? 'border-success-500 bg-success-50/40 dark:bg-success-700/10' : 'border-surface-200 dark:border-surface-800'}`}>
              <div className="min-w-0">
                <p className="text-sm text-surface-700 dark:text-surface-300">{t.sentence}</p>
                <p className="text-xs text-surface-400 mt-0.5">{t.log}</p>
              </div>
              <label className="inline-flex items-center cursor-pointer flex-shrink-0" aria-label={`${t.active ? 'Disable' : 'Enable'} trigger: ${t.sentence}`}>
                <input type="checkbox" className="sr-only peer" checked={t.active} onChange={() => toggle(t.id)} />
                <div className="w-9 h-5 bg-surface-300 dark:bg-surface-700 rounded-full peer-checked:bg-primary-500 transition-colors relative">
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${t.active ? 'translate-x-4' : ''}`} />
                </div>
              </label>
            </div>
          ))}
        </div>
        <p className="text-xs text-surface-400 mt-3">Safety loads (fridge, medical, security) stay protected — never auto-shed. Min 15-min gap between opposing actions.</p>
      </div>
    </div>
  )
}
