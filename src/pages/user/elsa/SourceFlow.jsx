import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Sun, Battery, Zap, Fuel, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { sourceLadder, solarVsConsumption, batterySoc, netMetering } from '../../../data/elsaData'
import { rs } from './elsaUi'

const ICONS = { solar: Sun, battery: Battery, grid: Zap, generator: Fuel }

export default function SourceFlow() {
  return (
    <div className="space-y-5">
      <div className="card p-4">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-1">Source Orchestration — Cheapest Safe Source First</h3>
        <p className="text-xs text-surface-400 mb-4">The house is on solar right now, the car is charging from battery, and the generator is asleep.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sourceLadder.map(s => {
            const Icon = ICONS[s.id]
            return (
              <div key={s.id} className={`rounded-lg border px-3.5 py-3 ${s.active ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-500/10' : 'border-surface-200 dark:border-surface-800'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-surface-800 dark:text-surface-200">
                    <Icon size={15} className={s.active ? 'text-primary-600' : 'text-surface-400'} /> {s.label}
                  </span>
                  {s.active && <span className="badge-success">Active</span>}
                </div>
                <p className="text-lg font-bold text-surface-900 dark:text-surface-100">Rs {s.costRs}/unit</p>
                {s.soc !== undefined && <p className="text-xs text-surface-400">SoC: {s.soc}%</p>}
                <p className="text-xs text-surface-500 mt-1">{s.note}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-1">Solar Generation vs Consumption</h3>
        <p className="text-xs text-surface-400 mb-4">Selling cheap during the day, buying expensive at night — leak/export zone shaded.</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={solarVsConsumption} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ECEEE6" />
              <XAxis dataKey="hour" interval={3} tick={{ fontSize: 10, fill: '#9AA09A' }} stroke="#D1D5C8" />
              <YAxis tick={{ fontSize: 11, fill: '#9AA09A' }} stroke="#D1D5C8" unit=" kW" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="solar" name="Solar Generation" stroke="#F5A623" fill="#F5A623" fillOpacity={0.25} />
              <Area type="monotone" dataKey="load" name="House Consumption" stroke="#5B8DEF" fill="#5B8DEF" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-1">Battery — Auto Charge / Discharge</h3>
        <p className="text-xs text-surface-400 mb-4">ELSA decides on its own when to charge and when to discharge — the user just sees a lower bill.</p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="flex items-center gap-1.5 rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-1.5 text-xs font-semibold text-surface-600 dark:text-surface-300">
            <ArrowUpFromLine size={12} className="text-danger-500" /> Export: Rs {netMetering.exportRs}/unit
          </span>
          <span className="flex items-center gap-1.5 rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-1.5 text-xs font-semibold text-surface-600 dark:text-surface-300">
            <ArrowDownToLine size={12} className="text-success-600" /> Import: Rs {netMetering.importRs}/unit
          </span>
          <span className="badge-warning">Rs {netMetering.gapRs} gap — store it, don't sell it</span>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={batterySoc} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ECEEE6" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9AA09A' }} stroke="#D1D5C8" />
              <YAxis tick={{ fontSize: 11, fill: '#9AA09A' }} stroke="#D1D5C8" unit="%" domain={[0, 100]} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="soc" name="Battery SoC" stroke="#4C9F70" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
