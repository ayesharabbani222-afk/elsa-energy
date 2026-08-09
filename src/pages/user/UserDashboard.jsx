import { useState } from 'react'
import { Download, Zap, Activity, Gauge, Heart, TrendingUp, AlertTriangle, Waves, Radio, Image as ImageIcon } from 'lucide-react'
import MetricRangeCard from '../../components/ui/MetricRangeCard'
import { organizations, devices } from '../../data/dummy'

export default function UserDashboard() {
  const [org, setOrg]     = useState('Delicia Warehouse')
  const [slave, setSlave] = useState('Main Wapda')

  const orgDevices = devices.filter(d => d.org === org)

  const handleDownload = () => {
    const blob = new Blob([`Dashboard export for ${org} / ${slave}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'dashboard.csv'; a.click()
    URL.revokeObjectURL(url)
  }

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
        <button className="btn-primary" onClick={handleDownload}>
          <Download size={14} /> Download Data
        </button>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricRangeCard icon={Zap}          title="Total Power Consumption"          value="0.00" unit="kWh" />
        <MetricRangeCard icon={Zap}          title="Total Export Power"               value="0.00" unit="kWh" />
        <MetricRangeCard icon={Zap}          title="Voltage Imbalance (%)"            value="0.00" />
        <MetricRangeCard icon={Activity}     title="Current Imbalance"                value="0.00" />
        <MetricRangeCard icon={Heart}        title="Real Time Power Factor (Avg & Trend)" value="0.00" />
        <MetricRangeCard icon={TrendingUp}   title="Predicted Consumption"            value="0.00" />
        <MetricRangeCard icon={AlertTriangle} title="Anomalies Detected (Count & Type)" emptyLabel="No anomalies detected" />
        <MetricRangeCard icon={Waves}        title="THD-V"                            value="0.00" unit="%" />
        <MetricRangeCard icon={Waves}        title="THD-I"                            value="0.00" unit="%" />
        <MetricRangeCard icon={Radio}        title="Frequency"                        value="0.00" unit="Hz" />

        {/* Additional metric placeholders */}
        {[1, 2].map(i => (
          <div key={i} className="card p-4 flex flex-col items-center justify-center text-center min-h-[180px]">
            <ImageIcon size={28} className="text-surface-300 mb-2" />
            <p className="text-xs text-surface-400">No Additional Metrics</p>
          </div>
        ))}
      </div>
    </div>
  )
}
