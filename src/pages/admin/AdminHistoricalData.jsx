import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import DataTable from '../../components/ui/DataTable'
import { Download, Trash2, X } from 'lucide-react'
import { historicalData, devices } from '../../data/dummy'

const VARIABLES = [
  { value: 'voltageA',  label: 'Voltage A (40097)', unit: 'V', color: '#F5A623' },
  { value: 'currentA',  label: 'Current A (40101)', unit: 'A', color: '#3B82F6' },
  { value: 'power',     label: 'Import Power (40200)', unit: 'W', color: '#10B981' },
]

export default function AdminHistoricalData() {
  const [device, setDevice]     = useState(devices[0]?.name || '')
  const [dateFrom, setDateFrom] = useState('2026-07-27')
  const [dateTo, setDateTo]     = useState('2026-07-27')
  const [variableKey, setVariableKey] = useState('voltageA')
  const [primaryTag, setPrimaryTag]   = useState('Import Power')
  const [loaded, setLoaded]     = useState(true)

  const varMeta   = VARIABLES.find(v => v.value === variableKey)
  const chartData = historicalData.map(row => ({ time: row.time, value: row[variableKey] }))
  const tableData = chartData.map((row, i) => ({ id: i, variable: varMeta.label, value: row.value, time: `2026-07-27 ${row.time}` }))

  const handleDownload = () => {
    const header = ['Variable Name', 'Display Value', 'Received Time']
    const rows = tableData.map(r => [r.variable, r.value, r.time])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'historical_data.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteData = () => {
    if (confirm('Delete data for the selected range?')) setLoaded(false)
  }

  const tableColumns = [
    { key: 'variable', label: 'Variable Name' },
    { key: 'value',    label: 'Display Value', render: v => <span className="font-mono text-primary-600">{v}</span> },
    { key: 'time',     label: 'Received Time', render: v => <span className="text-xs text-surface-400">{v}</span> },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Data Center</h2>
          <p className="breadcrumb">Data Center &ndash; Historical Data</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-44">
              <label className="label">Device</label>
              <select className="select" value={device} onChange={e => setDevice(e.target.value)}>
                {devices.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div className="w-56">
              <label className="label">Date Range</label>
              <div className="flex items-center gap-1.5">
                <input type="date" className="input text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                <span className="text-surface-400 text-xs">-</span>
                <input type="date" className="input text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>
            <div className="w-44">
              <label className="label">Trigger</label>
              <div className="input flex items-center justify-between text-xs">
                <span>{primaryTag}</span>
                <button type="button" onClick={() => setPrimaryTag('')} className="text-surface-400 hover:text-surface-700"><X size={12} /></button>
              </div>
            </div>
            <div className="w-44">
              <label className="label">Variable</label>
              <select className="select" value={variableKey} onChange={e => setVariableKey(e.target.value)}>
                {VARIABLES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary" onClick={handleDownload}><Download size={14} /> Download Data</button>
            <button className="btn-danger" onClick={handleDeleteData}><Trash2 size={14} /> Delete Data</button>
          </div>
        </div>
      </div>

      {/* Table + chart side by side */}
      {loaded ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DataTable
            columns={tableColumns}
            data={tableData}
            searchPlaceholder="Search data..."
            pageSize={50}
            pageSizeOptions={[10, 25, 50, 100]}
            emptyMessage="No data available in table"
          />

          <div className="card p-5">
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECEEE6" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9AA09A' }} stroke="#D1D5C8" />
                <YAxis tick={{ fontSize: 11, fill: '#9AA09A' }} stroke="#D1D5C8" />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #ECEEE6', borderRadius: 8, fontSize: 12, color: '#1F2937' }}
                  itemStyle={{ color: '#1F2937' }}
                  labelStyle={{ color: '#6B7280', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#6B7280' }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={varMeta.label}
                  stroke={varMeta.color}
                  strokeWidth={2}
                  dot={{ fill: varMeta.color, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card p-16 text-center text-surface-500 text-sm">Data cleared for the selected range.</div>
      )}
    </div>
  )
}
