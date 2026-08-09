import { useState } from 'react'
import { Car, Sparkles, CheckCircle2, Circle, Plus, Trash2, RotateCcw, Pencil } from 'lucide-react'
import { autoModePlan, monthlySavingsCard, goalPlan, evStatus, loads } from '../../../data/elsaData'
import { rs } from './elsaUi'

const PRIORITIES = ['High', 'Medium', 'Low']

export default function AutoSchedule({
  autoMode, setAutoMode, evPrefs, setEvPrefs, stageStatus, setStageStatus,
  scheduleMode, setScheduleMode, manualSchedules, setManualSchedules,
  editableAutoPlan, setEditableAutoPlan,
}) {
  const toggleEvPref = (key) => setEvPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  const applyStage = (stage) => setStageStatus(prev => ({ ...prev, [stage]: 'applied' }))

  const [manualLoadId, setManualLoadId] = useState(loads[0].id)
  const [manualStart, setManualStart] = useState('23:00')
  const [manualEnd, setManualEnd] = useState('05:00')
  const [manualPriority, setManualPriority] = useState('Medium')
  const [editingIdx, setEditingIdx] = useState(null)

  const addManualSchedule = () => {
    const load = loads.find(l => l.id === manualLoadId)
    setManualSchedules(prev => [
      { id: `ms${Date.now()}`, loadId: manualLoadId, loadName: load?.name, start: manualStart, end: manualEnd, priority: manualPriority },
      ...prev,
    ])
  }
  const removeManualSchedule = (id) => setManualSchedules(prev => prev.filter(s => s.id !== id))

  const updatePlanTime = (idx, field, value) => {
    setEditableAutoPlan(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }
  const resetAutoPlan = () => setEditableAutoPlan(autoModePlan.map(p => {
    const [start, end] = p.time.split('–')
    return { ...p, start, end }
  }))

  return (
    <div className="space-y-5">
      {/* Mode switch — Manual vs Auto are two distinct modes per spec */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">Scheduling Mode</h3>
            <p className="text-xs text-surface-400">Manual: build your own schedule for any load. Auto: ELSA optimizes it for you — either way, nothing here is fixed.</p>
          </div>
          <div className="flex gap-1 rounded-lg border border-surface-200 dark:border-surface-800 p-1">
            <button type="button" onClick={() => setScheduleMode('manual')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${scheduleMode === 'manual' ? 'bg-primary-500 text-white' : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'}`}>Manual Mode</button>
            <button type="button" onClick={() => setScheduleMode('auto')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${scheduleMode === 'auto' ? 'bg-primary-500 text-white' : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'}`}>Auto Mode</button>
          </div>
        </div>
      </div>

      {/* Manual Mode — build custom schedules for any load, with priority */}
      {scheduleMode === 'manual' && (
        <div className="card p-4">
          <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-1">Manual Schedule Builder</h3>
          <p className="text-xs text-surface-400 mb-4">Assign a custom operating window and priority to any appliance or load.</p>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-52">
              <label className="label">Load</label>
              <select className="select" value={manualLoadId} onChange={e => setManualLoadId(e.target.value)}>
                {loads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.room}</option>)}
              </select>
            </div>
            <div className="w-32">
              <label className="label">Start Time</label>
              <input type="time" className="input" value={manualStart} onChange={e => setManualStart(e.target.value)} />
            </div>
            <div className="w-32">
              <label className="label">End Time</label>
              <input type="time" className="input" value={manualEnd} onChange={e => setManualEnd(e.target.value)} />
            </div>
            <div className="w-36">
              <label className="label">Priority</label>
              <select className="select" value={manualPriority} onChange={e => setManualPriority(e.target.value)}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <button className="btn-primary" onClick={addManualSchedule}>
              <Plus size={14} /> Add Schedule
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {manualSchedules.length === 0 && (
              <p className="text-sm text-surface-400">No manual schedules yet — build one above.</p>
            )}
            {manualSchedules.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{s.loadName}</p>
                  <p className="text-xs text-surface-400">{s.start} – {s.end} · Priority: {s.priority}</p>
                </div>
                <button type="button" onClick={() => removeManualSchedule(s.id)} className="text-danger-600 hover:text-danger-700 flex-shrink-0" aria-label={`Remove schedule for ${s.loadName}`}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto Mode — default plan is editable, not fixed */}
      {scheduleMode === 'auto' && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">Autonomous Schedule — "ELSA Will Handle Everything"</h3>
            <button
              className={autoMode ? 'btn-secondary' : 'btn-primary'}
              onClick={() => setAutoMode(v => !v)}
            >
              {autoMode ? 'Auto Mode: ON' : 'Enable Auto Mode'}
            </button>
          </div>
          <p className="text-xs text-surface-400 mb-4">Reads 30 days of usage + tariff windows + solar profile and generates a starting schedule — every window below is editable, nothing is locked in.</p>

          {autoMode && (
            <div className="space-y-2">
              <div className="flex justify-end">
                <button type="button" onClick={resetAutoPlan} className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1">
                  <RotateCcw size={12} /> Reset to Recommended
                </button>
              </div>
              {editableAutoPlan.map((p, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Pencil size={11} className="text-surface-400" />
                      <input type="time" className="input !py-1 !text-xs !w-24" value={p.start} onChange={e => updatePlanTime(i, 'start', e.target.value)} />
                      <span className="text-xs text-surface-400">to</span>
                      <input type="time" className="input !py-1 !text-xs !w-24" value={p.end} onChange={e => updatePlanTime(i, 'end', e.target.value)} />
                    </div>
                    <p className="text-sm text-surface-700 dark:text-surface-300">{p.action}</p>
                  </div>
                  <span className="text-xs font-semibold text-success-700 flex-shrink-0">{p.reasonRs}</span>
                </div>
              ))}
              <div className="rounded-lg bg-success-100/40 dark:bg-success-700/10 border border-success-600/20 px-3 py-2.5 text-sm text-success-700 dark:text-success-200">
                Monthly savings (estimate): {rs(monthlySavingsCard.billDeltaRs)} bill delta + {rs(monthlySavingsCard.fuelSubstitutionRs)} petrol substitution
              </div>
            </div>
          )}
        </div>
      )}

      {/* EV dispatch */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Car size={16} className="text-primary-600" />
          <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">EV Charging</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs text-surface-400 mb-1">
              <span>Ready by {evStatus.readyByTime}</span>
              <span>{evStatus.currentPct}% / {evStatus.targetPct}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-200 dark:bg-surface-800 overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(evStatus.currentPct / evStatus.targetPct) * 100}%` }} />
            </div>
            <p className="text-sm text-surface-700 dark:text-surface-300 mt-2">
              Car will be {evStatus.targetPct}% ready by {evStatus.readyByTime} — {rs(evStatus.costSoFarRs)} (solar {evStatus.sourceMix.solar}% + off-peak {evStatus.sourceMix.offPeak}%). Petrol equivalent would be {rs(evStatus.petrolEquivalentRs)}.
            </p>
            {!evPrefs.solarPriority && !evPrefs.offPeakOnly && (
              <p className="text-xs text-primary-600 mt-1.5">Both preferences off — ELSA will charge from whichever source is cheapest at the time, including peak grid if needed.</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="flex items-center justify-between rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-2 cursor-pointer">
              <span className="text-sm text-surface-700 dark:text-surface-300">Solar Priority</span>
              <input type="checkbox" checked={evPrefs.solarPriority} onChange={() => toggleEvPref('solarPriority')} className="accent-primary-500 w-4 h-4" />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-2 cursor-pointer">
              <span className="text-sm text-surface-700 dark:text-surface-300">Off-Peak Only</span>
              <input type="checkbox" checked={evPrefs.offPeakOnly} onChange={() => toggleEvPref('offPeakOnly')} className="accent-primary-500 w-4 h-4" />
            </label>
          </div>
        </div>
      </div>

      {/* goal_plan */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={15} className="text-primary-600" />
          <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">Goal Plan — Bill Target</h3>
        </div>
        <p className="text-xs text-surface-400 mb-4">Target: {rs(goalPlan.targetRs)} · Current projection: {rs(goalPlan.currentProjectionRs)}</p>

        <div className="space-y-3">
          {goalPlan.stages.map(s => {
            const status = stageStatus[s.stage]
            return (
              <div key={s.stage} className="flex items-start gap-3 rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-3">
                {status === 'applied'
                  ? <CheckCircle2 size={18} className="text-success-600 flex-shrink-0 mt-0.5" />
                  : <Circle size={18} className={`flex-shrink-0 mt-0.5 ${status === 'ready' ? 'text-primary-500' : 'text-surface-300'}`} />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">Stage {s.stage}: {s.title}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{s.feasibility}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-success-700">{rs(s.impactRs)}</p>
                  {status === 'applied' && <span className="badge-success mt-1 inline-block">Applied</span>}
                  {status === 'ready' && <button className="btn-primary mt-1 !py-1 !px-2 !text-xs" onClick={() => applyStage(s.stage)}>Apply</button>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
