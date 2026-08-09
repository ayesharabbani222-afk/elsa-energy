import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import DataTable from '../../components/ui/DataTable'
import { organizations, devices } from '../../data/dummy'

const TABS = ['Next 10 Minutes', 'Next 5 Hours', 'Next 7 Days', 'Custom']
const VARIABLE_OPTIONS = ['Voltage Phase A', 'Current Phase A', 'Active Power', 'Power Factor', 'Frequency']

export default function OrgAIAnalytics() {
  const [tab, setTab]         = useState('Next 10 Minutes')
  const [org, setOrg]         = useState('Delicia Warehouse')
  const [slave, setSlave]     = useState('Main Wapda')
  const [variables, setVariables] = useState([])

  const orgDevices = devices.filter(d => d.org === org)
  const flatChart  = Array.from({ length: 6 }, (_, i) => ({ t: `T${i}`, v: 0 }))

  const toggleVariable = (v) => {
    setVariables(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  const columns = [
    { key: 'variable', label: 'Variable Name' },
    { key: 'value',    label: 'Display Value' },
    { key: 'time',     label: 'Received Time' },
  ]

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2 className="page-title">AI Analytics</h2>
          <p className="breadcrumb">AI Analytics &ndash; AI Analytics Readings</p>
        </div>
      </div>

      {/* Range tabs */}
      <div className="flex items-center gap-6 border-b border-surface-200 dark:border-surface-800">
        {TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`pb-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-800'
            }`}
          >
            {t}
          </button>
        ))}
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
        <div className="flex-1 min-w-56">
          <label className="label">Variables</label>
          {variables.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 input h-auto py-1.5">
              {variables.map(v => (
                <span key={v} className="badge badge-info flex items-center gap-1">
                  {v}
                  <button type="button" onClick={() => toggleVariable(v)} className="hover:text-danger-600">×</button>
                </span>
              ))}
            </div>
          ) : (
            <select className="select" value="" onChange={e => e.target.value && toggleVariable(e.target.value)}>
              <option value="">Select Variables (Multiple - No Limits)</option>
              {VARIABLE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Table + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DataTable
          columns={columns}
          data={[]}
          searchPlaceholder="Search readings..."
          pageSize={50}
          emptyMessage="No data available in table"
        />
        <div className="card p-4">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={flatChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ECEEE6" />
              <XAxis dataKey="t" tick={{ fontSize: 11, fill: '#9AA09A' }} stroke="#D1D5C8" />
              <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: '#9AA09A' }} stroke="#D1D5C8" />
              <Line type="monotone" dataKey="v" stroke="#F5A623" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
