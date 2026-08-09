import { useState } from 'react'
import {
  AlertTriangle, Gauge, Activity, Zap, PieChart, Package,
  Waves, TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import { organizations, devices } from '../../data/dummy'

const READOUTS = [
  { key: 'voltageA',      label: 'VoltageA',        value: '233.2', unit: 'V' },
  { key: 'voltageB',      label: 'VoltageB',        value: '235.8', unit: 'V' },
  { key: 'voltageC',      label: 'VoltageC',        value: '231.4', unit: 'V' },
  { key: 'phaseVoltageA', label: 'Phase VoltageA',  value: '406.4', unit: 'V' },
  { key: 'phaseVoltageB', label: 'Phase VoltageB',  value: '406',   unit: 'V' },
  { key: 'phaseVoltageC', label: 'Phase VoltageC',  value: '400.8', unit: 'V' },
  { key: 'currentA',      label: 'CurrentA',        value: '0.23',  unit: 'A' },
  { key: 'currentB',      label: 'CurrentB',        value: '11.12', unit: 'A' },
  { key: 'currentC',      label: 'CurrentC',        value: '18.78', unit: 'A' },
  { key: 'activePower',   label: 'Active Power',    value: '6.5',   unit: 'kW' },
  { key: 'reactivePower', label: 'Reactive Power',  value: '2.2',   unit: 'kVar' },
  { key: 'apparentPower', label: 'Apparent Power',  value: '7.02',  unit: 'kVA' },
  { key: 'powerConsumption', label: 'Power Consumption', value: '33385.54', unit: 'kWh' },
  { key: 'exportPower',   label: 'Export Power',    value: '0.84',  unit: 'kWh' },
  { key: 'powerFactor',   label: 'Power Factor',    value: '0.92',  unit: '', icon: PieChart },
  { key: 'frequency',     label: 'Frequency',       value: '50.38', unit: 'Hz' },
  { key: 'thdUa',         label: 'THDUa',           value: '2',     unit: '%' },
  { key: 'thdUb',         label: 'THDUb',           value: '1.7',   unit: '%' },
  { key: 'thdUc',         label: 'THDUc',           value: '1.8',   unit: '%' },
  { key: 'thdIa',         label: 'THDIa',           value: '0',     unit: '%' },
  { key: 'thdIb',         label: 'THDIb',           value: '17',    unit: '%' },
  { key: 'thdIc',         label: 'THDIc',           value: '12.7',  unit: '%' },
  { key: 'totalCost',     label: 'Total cost pertif', value: '0.00', unit: 'PKR', icon: Package },
]

const SAVINGS = [
  { label: 'Daily',   pct: -11.6, sub: '326.65 vs 292.61 kWh', trend: 'down' },
  { label: 'Weekly',  pct: 12.7,  sub: '2,024.6 vs 2,379.94 kWh', trend: 'up' },
  { label: 'Monthly', pct: 0.0,   sub: '0 vs 0 kWh', trend: 'flat' },
]

function readoutIcon(row) {
  if (row.icon) return row.icon
  if (row.key.startsWith('voltage') || row.key.startsWith('phaseVoltage')) return AlertTriangle
  if (row.key.startsWith('current')) return Gauge
  if (row.key.includes('Power')) return Activity
  if (row.key.startsWith('thd')) return Waves
  if (row.key === 'frequency') return Zap
  return Activity
}

export default function UserDashboardDetail() {
  const [org, setOrg]     = useState('Delicia Warehouse')
  const [slave, setSlave] = useState('Main Wapda')

  const orgDevices = devices.filter(d => d.org === org)

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <label className="label">Device</label>
          <select className="select" value={org} onChange={e => setOrg(e.target.value)}>
            {organizations.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
          </select>
        </div>
        <div className="w-56">
          <label className="label">Slave</label>
          <select className="select" value={slave} onChange={e => setSlave(e.target.value)}>
            {orgDevices.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            {orgDevices.length === 0 && <option value={slave}>{slave}</option>}
          </select>
        </div>
      </div>

      {/* Readout grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {READOUTS.map(row => {
          const Icon = readoutIcon(row)
          return (
            <div key={row.key} className="card p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2">
                <Icon size={13} className="text-primary-600 flex-shrink-0" />
                <span>{row.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-surface-900 dark:text-surface-100">{row.value}</span>
                {row.unit && <span className="text-xs font-semibold text-surface-400">{row.unit}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Energy Savings Comparison */}
      <div>
        <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-3">Energy Savings Comparison</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SAVINGS.map(s => {
            const TrendIcon = s.trend === 'up' ? TrendingUp : s.trend === 'down' ? TrendingDown : Minus
            const barColor  = s.trend === 'up' ? 'bg-success-600' : s.trend === 'down' ? 'bg-danger-600' : 'bg-surface-300'
            const textColor = s.trend === 'up' ? 'text-success-600' : s.trend === 'down' ? 'text-danger-600' : 'text-surface-400'
            const bg        = s.trend === 'up' ? 'bg-success-100/50 text-success-700' : s.trend === 'down' ? 'bg-danger-100/50 text-danger-700' : 'bg-surface-100 text-surface-500'
            return (
              <div key={s.label} className="card p-4 text-center relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${barColor}`} />
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center mb-2 ${bg}`}>
                  <TrendIcon size={15} />
                </div>
                <p className="text-xs text-surface-400 font-semibold">{s.label}</p>
                <p className={`text-lg font-bold mt-1 ${textColor}`}>{s.pct > 0 ? '+' : ''}{s.pct.toFixed(1)}%</p>
                <p className="text-[10px] text-surface-400 mt-1">{s.sub}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
