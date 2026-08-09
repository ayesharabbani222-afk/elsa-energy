import { useState } from 'react'
import { Sun, Battery, Zap, Fuel, Car, Mic, Power, X } from 'lucide-react'
import { sourceLadder, moneyBar, savingsTicker, dashboardAlerts, loads, evStatus } from '../../../data/elsaData'
import { rs, GradeBadge, AlertDot } from './elsaUi'

const ICONS = { solar: Sun, battery: Battery, grid: Zap, generator: Fuel }

export default function Overview({ variant = 'user', onNavigate }) {
  const pace = moneyBar.monthProjectedRs <= moneyBar.targetRs ? 'success' : 'danger'
  const [alerts, setAlerts] = useState(dashboardAlerts)
  const [loadStates, setLoadStates] = useState(() => Object.fromEntries(loads.map(l => [l.id, l.isOn !== false])))
  const [justHandled, setJustHandled] = useState(null)

  const dismissAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id))

  const turnOffLoad = (alert) => {
    if (alert.loadId) setLoadStates(prev => ({ ...prev, [alert.loadId]: false }))
    setJustHandled(alert.id)
    setTimeout(() => dismissAlert(alert.id), 900)
  }

  return (
    <div className="space-y-5">
      {/* Zone 1 — Live flow */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-3">Live Source Flow</h3>
        <div className="flex flex-wrap items-center gap-2">
          {sourceLadder.map((s, i) => {
            const Icon = ICONS[s.id]
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold ${s.active ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300' : 'border-surface-200 dark:border-surface-800 text-surface-400'}`}>
                  <Icon size={14} /> {s.label} {s.active && '· live'}
                </div>
                {i < sourceLadder.length - 1 && <span className="text-surface-300">→</span>}
              </div>
            )
          })}
          <span className="text-surface-300">→</span>
          <div className="px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-800 text-xs font-semibold text-surface-600 dark:text-surface-300">Home + EV</div>
        </div>
      </div>

      {/* Zone 2 — Money bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Today (estimate)</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{rs(moneyBar.todayRs)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Month Projected</p>
          <p className={`text-2xl font-bold ${pace === 'success' ? 'text-success-700' : 'text-danger-600'}`}>{rs(moneyBar.monthProjectedRs)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Target</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{rs(moneyBar.targetRs)}</p>
        </div>
      </div>

      {/* Zone 3 — Savings ticker */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-2">What ELSA Saved You Today</h3>
        <div className="flex flex-wrap gap-2">
          {savingsTicker.map(s => (
            <span key={s.label} className="badge-success">{s.label}: {rs(s.rs)}</span>
          ))}
          <span className="badge-info">Total: {rs(savingsTicker.reduce((a, b) => a + b.rs, 0))}</span>
        </div>
      </div>

      {/* Org variant — feeder / MDI / PF / THD */}
      {variant === 'org' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">MDI Gauge</p>
            <p className="text-xl font-bold text-surface-900 dark:text-surface-100">4.1 kW</p>
            <p className="text-xs text-surface-400">of 7 kW sanctioned</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">PF Dial</p>
            <p className="text-xl font-bold text-surface-900 dark:text-surface-100">0.89</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">THD Strip</p>
            <p className="text-xl font-bold text-surface-900 dark:text-surface-100">3.2%</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Feeders Online</p>
            <p className="text-xl font-bold text-surface-900 dark:text-surface-100">6 / 6</p>
          </div>
        </div>
      )}

      {/* Zone 4 — Load grid */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-3">Load Grid</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {loads.map(l => (
            <div key={l.id} className={`rounded-lg border px-2.5 py-2 transition-colors ${loadStates[l.id] === false ? 'border-surface-200 dark:border-surface-800 opacity-50' : 'border-surface-200 dark:border-surface-800'}`}>
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-semibold text-surface-700 dark:text-surface-300 truncate">{l.name}</p>
                <Power size={11} className={loadStates[l.id] === false ? 'text-surface-300' : 'text-success-600'} />
              </div>
              <p className="text-[11px] text-surface-400">{loadStates[l.id] === false ? 'Off' : `${l.watts}W`}</p>
              <div className="mt-1"><GradeBadge grade={l.grade} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone 5 — EV card */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Car size={15} className="text-primary-600" />
          <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">EV Charging Status</h3>
        </div>
        <p className="text-sm text-surface-700 dark:text-surface-300">
          Ready by {evStatus.readyByTime} — {evStatus.currentPct}% / {evStatus.targetPct}% · {rs(evStatus.costSoFarRs)} so far vs {rs(evStatus.petrolEquivalentRs)} petrol equivalent
        </p>
      </div>

      {/* Zone 6 — Alerts rail */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-3">Alerts</h3>
        <div className="space-y-2">
          {alerts.length === 0 && <p className="text-sm text-surface-400">No active alerts — everything looks normal.</p>}
          {alerts.map(a => (
            <div key={a.id} className={`rounded-lg border px-3 py-2.5 transition-colors ${justHandled === a.id ? 'border-success-500 bg-success-50/40 dark:bg-success-700/10' : 'border-surface-200 dark:border-surface-800'}`}>
              <div className="flex items-start gap-2.5">
                <AlertDot level={a.level} />
                <button
                  type="button"
                  onClick={() => onNavigate?.(a.module)}
                  className="flex-1 text-left text-sm text-surface-700 dark:text-surface-300 hover:text-primary-600"
                >
                  {a.text}
                </button>
              </div>
              {/* Ghost-AC style actionable alert: two real buttons, matching the approved storyboard */}
              {a.actionable && justHandled !== a.id && (
                <div className="flex items-center gap-2 mt-2 ml-5">
                  <button type="button" className="btn-primary !py-1 !px-2.5 !text-xs" onClick={() => turnOffLoad(a)}>
                    <Power size={12} /> Turn It Off Now
                  </button>
                  <button type="button" className="btn-secondary !py-1 !px-2.5 !text-xs" onClick={() => dismissAlert(a.id)}>
                    <X size={12} /> Ignore
                  </button>
                </div>
              )}
              {justHandled === a.id && (
                <p className="text-xs text-success-700 dark:text-success-300 font-semibold mt-1.5 ml-5">ELSA ne dekha. Aap ne band kiya. Bas.</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Zone 7 — Voice button */}
      <button type="button" onClick={() => onNavigate?.('voice')} className="btn-secondary">
        <Mic size={14} /> Hey ELSA
      </button>
    </div>
  )
}
