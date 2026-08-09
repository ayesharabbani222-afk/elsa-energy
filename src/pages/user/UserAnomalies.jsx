import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LabelList, Cell,
} from 'recharts'
import { ArrowLeft } from 'lucide-react'
import { organizations, devices } from '../../data/dummy'

const RANGES = ['1h', '24h', '7d', '30d']

const ISSUES = [
  { key: 'overvoltage', label: 'Overvoltage', category: 'Voltage', count: 51, color: '#EF4444' },
  { key: 'lowpf',       label: 'Low Power Factor', category: 'Power Factor', count: 14, color: '#F5A623' },
  { key: 'criticalpf',  label: 'Critical Low PF', category: 'Power Factor', count: 3,  color: '#F97316' },
]

const timelineData = Array.from({ length: 17 }, (_, i) => ({
  t: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'} AM`,
  v: 0,
}))

export default function UserAnomalies() {
  const navigate = useNavigate()
  const [org, setOrg]     = useState('Delicia Warehouse')
  const [slave, setSlave] = useState('Main Wapda')
  const [timelineRange, setTimelineRange] = useState('1h')
  const [breakdownRange, setBreakdownRange] = useState('1h')

  const orgDevices = devices.filter(d => d.org === org)
  const totalAnomalies = ISSUES.reduce((s, i) => s + i.count, 0)

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2 className="page-title">Anomalies Details</h2>
          <p className="breadcrumb">Dashboard &ndash; Anomalies</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/user')}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-52">
          <label className="label">Device</label>
          <select className="select" value={org} onChange={e => setOrg(e.target.value)}>
            {organizations.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
          </select>
        </div>
        <div className="w-52">
          <label className="label">Slave</label>
          <select className="select" value={slave} onChange={e => setSlave(e.target.value)}>
            {orgDevices.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            {orgDevices.length === 0 && <option value={slave}>{slave}</option>}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Anomalies + Timeline */}
        <div className="space-y-5">
          <div>
            <p className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-1">Anomalies</p>
            <p className="text-5xl font-black text-danger-600">{totalAnomalies}</p>
            <p className="text-xs text-surface-400 mt-1">Count aims to trend downward</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">Timeline</h3>
              <div className="flex items-center gap-1">
                {RANGES.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTimelineRange(r)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                      timelineRange === r
                        ? 'bg-primary-500 text-surface-950'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECEEE6" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#9AA09A' }} stroke="#D1D5C8" />
                <YAxis domain={[0, 4]} tick={{ fontSize: 10, fill: '#9AA09A' }} stroke="#D1D5C8" />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #ECEEE6', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#EF4444" fill="#FEE2E2" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Issues Breakdown */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">Issues Breakdown</h3>
            <div className="flex items-center gap-1">
              {RANGES.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setBreakdownRange(r)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                    breakdownRange === r
                      ? 'bg-primary-500 text-surface-950'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ISSUES} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ECEEE6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9AA09A' }} stroke="#D1D5C8" />
              <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11, fill: '#6B7280' }} stroke="#D1D5C8" />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #ECEEE6', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {ISSUES.map(i => <Cell key={i.key} fill={i.color} />)}
                <LabelList dataKey="count" position="insideRight" fill="#ffffff" fontSize={11} fontWeight="bold" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
            {ISSUES.map(issue => (
              <div key={issue.key} className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: issue.color }} />
                <div>
                  <p className="text-xs font-bold text-surface-900 dark:text-surface-100">{issue.label}</p>
                  <p className="text-[10px] text-surface-400">{issue.category}</p>
                  <p className="text-[10px] text-surface-400">Low Priority &middot; {issue.count} occurrences</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
