import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { AlertTriangle, Info, Receipt, Gauge, Sun, Snowflake } from 'lucide-react'
import {
  activeTariff, billCycle, billBreakup, resolveBillBreakup, billWarnings, discoProfiles,
  icp25Relief, fpaConfig, mdiConfig, touSeasons, activeTouSeason, touUsage,
} from '../../../data/elsaData'
import { rs, ReducibleTag } from './elsaUi'

export default function TariffBill() {
  const [expanded, setExpanded] = useState(null)
  const [fpaRate, setFpaRate] = useState(fpaConfig.currentRatePerUnit)
  const [touTab, setTouTab] = useState('peak')
  const resolvedBillBreakup = resolveBillBreakup(billBreakup)
  const total = resolvedBillBreakup.reduce((s, b) => s + b.value, 0)
  const unitsLeft = billCycle.nextSlabAt - billCycle.unitsToDate
  const season = touSeasons[activeTouSeason]
  const currentMdiKw = Math.max(...mdiConfig.intervalReadingsKw)
  const mdiIntervalChart = mdiConfig.intervalReadingsKw.map((kw, i) => ({
    t: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
    kw,
  }))

  return (
    <div className="space-y-5">
      {/* Tariff Engine */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">Tariff Engine</h3>
            <p className="text-xs text-surface-400">DISCO rate built-in — every unit shown in rupees automatically</p>
          </div>
          <div className="w-52">
            <label className="label">DISCO / Connection</label>
            <select className="select" defaultValue={discoProfiles[0].id}>
              {discoProfiles.map(d => <option key={d.id} value={d.id}>{d.name} — {d.connection}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Current Slab Rate</p>
            <p className="text-xl font-bold text-surface-900 dark:text-surface-100">Rs {billCycle.currentSlabRate}/unit</p>
          </div>
          <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Units This Cycle</p>
            <p className="text-xl font-bold text-surface-900 dark:text-surface-100">{billCycle.unitsToDate}</p>
          </div>
          <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest flex items-center gap-1">
              {activeTouSeason === 'summer' ? <Sun size={11} /> : <Snowflake size={11} />} {season.label}
            </p>
            <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{season.peak}<br/><span className="text-surface-400">{season.offPeak}</span></p>
          </div>
          <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Fixed Charge</p>
            <p className="text-xl font-bold text-surface-900 dark:text-surface-100">{rs(activeTariff.fixedCharge)}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-info-100/40 dark:bg-info-700/10 border border-info-600/20 px-3 py-2.5 text-xs text-info-700 dark:text-info-200">
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          You're {unitsLeft > 0 ? `${unitsLeft} units away` : 'already into the next slab'} — crossing the {billCycle.nextSlabAt}-unit slab will move the rate from Rs {billCycle.currentSlabRate} to Rs {billCycle.nextSlabRate}.
        </div>

        <div className="mt-4">
          <p className="label mb-2">Slab Table</p>
          <div className="flex flex-wrap gap-2">
            {activeTariff.slabs.map((s, i) => (
              <div key={i} className={`px-3 py-1.5 rounded-lg text-xs border ${s.rate === billCycle.currentSlabRate ? 'border-primary-500 bg-primary-100/40 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 font-bold' : 'border-surface-200 dark:border-surface-800 text-surface-500'}`}>
                {i === 0 ? '0' : activeTariff.slabs[i - 1].upto} – {s.upto ?? '∞'} units: Rs {s.rate}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOU/TOD — Peak vs Off-Peak, tracked as separate unit buckets, seasonal timings */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">Time-of-Use (TOU/TOD) Billing</h3>
            <p className="text-xs text-surface-400">Peak and off-peak units are tracked and billed separately — timings follow the DISCO's seasonal schedule.</p>
          </div>
          <div className="flex gap-1 rounded-lg border border-surface-200 dark:border-surface-800 p-1">
            <button type="button" onClick={() => setTouTab('peak')} className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${touTab === 'peak' ? 'bg-danger-500 text-white' : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'}`}>Peak</button>
            <button type="button" onClick={() => setTouTab('offpeak')} className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${touTab === 'offpeak' ? 'bg-success-600 text-white' : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'}`}>Off-Peak</button>
          </div>
        </div>

        {touTab === 'peak' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-danger-600/30 bg-danger-100/30 dark:bg-danger-700/10 p-3">
              <p className="text-[10px] font-bold text-danger-600 uppercase tracking-widest">Peak Window ({season.label.split(' ')[0]})</p>
              <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{season.peak}</p>
            </div>
            <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Peak Units</p>
              <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{touUsage.peakUnits} units</p>
            </div>
            <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Peak Cost</p>
              <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{rs(Math.round(touUsage.peakUnits * touUsage.peakRate))}</p>
              <p className="text-[11px] text-surface-400">Rs {touUsage.peakRate}/unit</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-success-600/30 bg-success-100/30 dark:bg-success-700/10 p-3">
              <p className="text-[10px] font-bold text-success-700 uppercase tracking-widest">Off-Peak Window ({season.label.split(' ')[0]})</p>
              <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{season.offPeak}</p>
            </div>
            <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Off-Peak Units</p>
              <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{touUsage.offPeakUnits} units</p>
            </div>
            <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Off-Peak Cost</p>
              <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{rs(Math.round(touUsage.offPeakUnits * touUsage.offPeakRate))}</p>
              <p className="text-[11px] text-surface-400">Rs {touUsage.offPeakRate}/unit</p>
            </div>
          </div>
        )}
        <p className="text-xs text-surface-400 mt-3">Other season — {activeTouSeason === 'summer' ? touSeasons.winter.label : touSeasons.summer.label}: peak {activeTouSeason === 'summer' ? touSeasons.winter.peak : touSeasons.summer.peak}, off-peak {activeTouSeason === 'summer' ? touSeasons.winter.offPeak : touSeasons.summer.offPeak}.</p>
      </div>

      {/* MDI Monitor — NOT a fixed charge: billed on the highest 30-min demand reading this cycle */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-1">
          <Gauge size={16} className="text-primary-600" />
          <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">MDI Monitor (Maximum Demand Indicator)</h3>
        </div>
        <p className="text-xs text-surface-400 mb-4">Meter samples demand every 30 minutes — the single highest reading each cycle sets the MDI charge. It is not a fixed number.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Sanctioned MDI</p>
            <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{mdiConfig.sanctionedKw} kW</p>
          </div>
          <div className="rounded-lg border border-primary-500/40 bg-primary-100/30 dark:bg-primary-500/10 p-3">
            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">This Cycle's MDI</p>
            <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{currentMdiKw.toFixed(1)} kW</p>
          </div>
          <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Demand Rate</p>
            <p className="text-lg font-bold text-surface-900 dark:text-surface-100">Rs {mdiConfig.demandChargePerKw}/kW</p>
          </div>
          <div className="rounded-lg border border-surface-200 dark:border-surface-800 p-3">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">MDI Charge (this cycle)</p>
            <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{rs(Math.round(currentMdiKw * mdiConfig.demandChargePerKw))}</p>
          </div>
        </div>

        <p className="label mb-2">30-Minute Interval Readings (today)</p>
        <div className="h-40 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mdiIntervalChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ECEEE6" />
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#9AA09A' }} stroke="#D1D5C8" interval={3} />
              <YAxis tick={{ fontSize: 10, fill: '#9AA09A' }} stroke="#D1D5C8" unit="kW" />
              <Tooltip formatter={(v) => `${v} kW`} />
              <Line type="monotone" dataKey="kw" stroke="#3F8F6B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="label mb-2">MDI by Billing Cycle — varies month to month</p>
        <div className="flex flex-wrap gap-2">
          {mdiConfig.cycleHistory.map((c, i) => (
            <div key={i} className={`px-3 py-1.5 rounded-lg text-xs border ${i === mdiConfig.cycleHistory.length - 1 ? 'border-primary-500 bg-primary-100/40 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 font-bold' : 'border-surface-200 dark:border-surface-800 text-surface-500'}`}>
              {c.cycle}: {c.mdiKw} kW
            </div>
          ))}
        </div>
      </div>

      {/* FPA — configurable, republished monthly by the DISCO */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">Fuel Price Adjustment (FPA)</h3>
            <p className="text-xs text-surface-400">Varies month to month with the generation fuel mix — configurable here, not hardcoded.</p>
          </div>
          <div className="w-40">
            <label className="label">Rate for {fpaConfig.currentMonth}</label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-surface-500">Rs</span>
              <input
                type="number"
                step="0.1"
                className="input"
                value={fpaRate}
                onChange={e => setFpaRate(e.target.value)}
              />
              <span className="text-sm text-surface-500">/unit</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {fpaConfig.history.map((h, i) => (
            <div key={i} className="px-3 py-1.5 rounded-lg text-xs border border-surface-200 dark:border-surface-800 text-surface-500">
              {h.month}: Rs {h.ratePerUnit}/unit
            </div>
          ))}
        </div>
      </div>

      {/* Bill Breakup */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Receipt size={16} className="text-primary-600" />
          <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">Bill Breakup</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resolvedBillBreakup.filter(b => b.value > 0)}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  onClick={(d) => setExpanded(d.key)}
                >
                  {resolvedBillBreakup.filter(b => b.value > 0).map(b => <Cell key={b.key} fill={b.color} className="cursor-pointer" />)}
                </Pie>
                <Tooltip formatter={(v) => rs(v)} />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-surface-400 -mt-2">Net Total: {rs(total)}</p>
          </div>

          <div className="lg:col-span-3 space-y-2">
            {resolvedBillBreakup.map(b => (
              <button
                type="button"
                key={b.key}
                onClick={() => setExpanded(expanded === b.key ? null : b.key)}
                className={`w-full text-left flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors ${expanded === b.key ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-500/10' : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/40'}`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">{b.label}</span>
                </span>
                <span className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-sm font-bold ${b.value < 0 ? 'text-success-700' : 'text-surface-900 dark:text-surface-100'}`}>{b.value < 0 ? `− ${rs(Math.abs(b.value))}` : rs(b.value)}</span>
                  <ReducibleTag flag={b.reducible} />
                </span>
              </button>
            ))}
            {icp25Relief.applicable && (
              <p className="text-xs text-surface-400 px-1">{icp25Relief.note}</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Warnings */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-3">AI Warnings</h3>
        <div className="space-y-2">
          {billWarnings.map(w => (
            <div key={w.id} className="flex items-start gap-2.5 rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-2.5">
              <AlertTriangle size={15} className={`mt-0.5 flex-shrink-0 ${w.severity === 'warning' ? 'text-primary-500' : 'text-info-500'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-surface-700 dark:text-surface-300">{w.text}</p>
              </div>
              <span className="text-xs font-bold text-danger-600 flex-shrink-0">{rs(w.impactRs)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
