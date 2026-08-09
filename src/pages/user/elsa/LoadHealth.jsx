import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { ChevronRight, Wrench, Zap as ZapIcon, Star, CheckCircle2, ListChecks } from 'lucide-react'
import { loads, roomRanking, solutionRouting, electricianPartners } from '../../../data/elsaData'
import { GradeBadge } from './elsaUi'

const DIY_STEPS = [
  'Turn off power to the unit at the breaker.',
  'Clean or replace the filter / clear the obstruction.',
  'Restore power and monitor for 24 hours.',
  'Re-check the grade on this screen next week.',
]

export default function LoadHealth({ selectedLoadId, setSelectedLoadId, showSolution, setShowSolution, resolutions, setResolutions }) {
  const selected = loads.find(l => l.id === selectedLoadId) || null

  const openLoad = (l) => { setSelectedLoadId(l.id); setShowSolution(false) }

  const setResolution = (loadId, value) => setResolutions(prev => ({ ...prev, [loadId]: value }))
  const resolution = selected ? resolutions[selected.id] : null

  return (
    <div className="space-y-5">
      {/* Room ranking (Tap 1 context) */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-1">Room-Wise Ranking</h3>
        <p className="text-xs text-surface-400 mb-3">Which room is using the most electricity</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roomRanking} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ECEEE6" vertical={false} />
              <XAxis dataKey="room" tick={{ fontSize: 11, fill: '#9AA09A' }} stroke="#D1D5C8" />
              <YAxis tick={{ fontSize: 11, fill: '#9AA09A' }} stroke="#D1D5C8" unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="pct" fill="#F5A623" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Load grid — Tap 1: bill/loads → Tap 2 opens detail */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-3">Per-Load Health Report</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loads.map(l => (
            <button
              type="button"
              key={l.id}
              onClick={() => openLoad(l)}
              className={`text-left rounded-lg border px-3.5 py-3 transition-colors ${selected?.id === l.id ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-500/10' : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/40'}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-surface-800 dark:text-surface-200 truncate">{l.name}</span>
                <GradeBadge grade={l.grade} />
              </div>
              <p className="text-xs text-surface-400">{l.room} · {l.watts}W · {l.source}</p>
              <p className="text-xs text-surface-500 mt-1.5 line-clamp-2">{l.verdict}</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 mt-2">
                {resolutions[l.id] ? 'View detail — resolved' : 'View detail'} <ChevronRight size={13} />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tap 2: Load detail */}
      {selected && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">{selected.name} — Detail</h3>
              <p className="text-xs text-surface-400">{selected.room} · {selected.circuit}</p>
            </div>
            <GradeBadge grade={selected.grade} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Voltage</p>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-100">{selected.voltage} V</p>
            </div>
            <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Current</p>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-100">{selected.current} A</p>
            </div>
            <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Power Factor</p>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-100">{selected.pf}</p>
            </div>
            <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Efficiency</p>
              <p className={`text-xl font-bold ${selected.efficiencyPct >= 90 ? 'text-success-700' : selected.efficiencyPct >= 75 ? 'text-primary-600' : 'text-danger-600'}`}>{selected.efficiencyPct}%</p>
            </div>
            <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Fed From</p>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-100 capitalize">{selected.source}</p>
            </div>
          </div>

          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selected.trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECEEE6" />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#9AA09A' }} stroke="#D1D5C8" />
                <YAxis tick={{ fontSize: 11, fill: '#9AA09A' }} stroke="#D1D5C8" />
                <Tooltip />
                <Line type="monotone" dataKey="v" stroke="#F5A623" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 rounded-lg bg-surface-50 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-800 px-3 py-2.5">
            <p className="text-sm text-surface-700 dark:text-surface-300">{selected.verdict}</p>
          </div>

          <div className="mt-3 rounded-lg bg-info-100/30 dark:bg-info-700/10 border border-info-600/20 px-3 py-2.5">
            <p className="text-[10px] font-bold text-info-700 dark:text-info-300 uppercase tracking-widest mb-1">Predictive Maintenance — based on last 3 months</p>
            <p className="text-sm text-info-700 dark:text-info-200">{selected.predictiveMaintenance}</p>
          </div>

          {!showSolution && (
            <button className="btn-primary mt-4" onClick={() => setShowSolution(true)}>
              View Solution <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Tap 3: Solution routing */}
      {selected && showSolution && (
        <div className="card p-4">
          <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-3">Solution — {solutionRouting[selected.faultClass]?.label || 'General'}</h3>

          {selected.faultClass === 'electrical' && resolution !== 'booked' && (
            <div>
              <button className="btn-primary" onClick={() => setResolution(selected.id, 'booked')}>
                <Wrench size={14} /> Book an Electrician
              </button>
              <p className="text-xs text-surface-400 mt-2">This is an expert's job — DIY is disabled, with a note explaining why.</p>
            </div>
          )}

          {selected.faultClass === 'electrical' && resolution === 'booked' && (
            <div className="space-y-2">
              <p className="text-sm text-success-700 dark:text-success-300 font-semibold flex items-center gap-1.5"><CheckCircle2 size={15} /> Booking request sent — certified partners near you:</p>
              {electricianPartners.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{p.name}</p>
                    <p className="text-xs text-surface-400">{p.area} · {p.jobs} jobs</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-primary-600"><Star size={12} className="fill-primary-500 text-primary-500" /> {p.rating}</span>
                </div>
              ))}
              <p className="text-xs text-surface-400 mt-2">Post-fix: a re-grade check runs next month — closing the loop with an 'now Grade A' confirmation.</p>
            </div>
          )}

          {selected.faultClass === 'behavioral' && resolution !== 'diy-started' && (
            <div>
              <button className="btn-secondary" onClick={() => setResolution(selected.id, 'diy-started')}>
                <ZapIcon size={14} /> Do It Yourself — Step Guide
              </button>
              <p className="text-xs text-surface-400 mt-2">Electrician optional if the issue persists.</p>
            </div>
          )}

          {selected.faultClass === 'behavioral' && resolution === 'diy-started' && (
            <div className="space-y-2">
              <p className="text-sm text-success-700 dark:text-success-300 font-semibold flex items-center gap-1.5"><ListChecks size={15} /> Step guide started:</p>
              <ol className="text-sm text-surface-700 dark:text-surface-300 list-decimal list-inside space-y-1">
                {DIY_STEPS.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
              <p className="text-xs text-surface-400 mt-2">Still not resolved? <button type="button" className="text-primary-600 font-semibold hover:underline" onClick={() => setResolution(selected.id, 'booked')}>Book an electrician instead</button>.</p>
            </div>
          )}

          {selected.faultClass === 'settings' && resolution !== 'applied' && (
            <div>
              <button className="btn-primary" onClick={() => setResolution(selected.id, 'applied')}>Let ELSA Handle It — One-tap Apply</button>
              <p className="text-xs text-surface-400 mt-2">Manual edit is also available.</p>
            </div>
          )}

          {selected.faultClass === 'settings' && resolution === 'applied' && (
            <p className="text-sm text-success-700 dark:text-success-300 font-semibold flex items-center gap-1.5"><CheckCircle2 size={15} /> Applied — ELSA will manage this automatically from now on.</p>
          )}

          {selected.faultClass === 'none' && (
            <p className="text-sm text-surface-500">No action needed — this load is within its normal envelope.</p>
          )}
        </div>
      )}
    </div>
  )
}
