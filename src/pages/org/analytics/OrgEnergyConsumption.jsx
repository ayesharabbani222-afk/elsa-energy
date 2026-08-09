import { useState } from 'react'
import AnalyticsDetailPage from '../../../components/ui/AnalyticsDetailPage'

const predictedData = ['12:00 AM','01:00 AM','02:00 AM','03:00 AM','04:00 AM','05:00 AM','06:00 AM','07:00 AM','08:00 AM','09:00 AM']
  .map((t, i) => ({ t, v: [2.7, 1.9, 2.0, 2.4, 1.9, 2.1, 2.6, 2.3, 1.9, 3.4][i] }))

const overTimeData = Array.from({ length: 10 }, (_, i) => ({
  t: `Blk ${i + 1}`,
  v: [15, 17, 16.5, 14.5, 13.5, 16, 13, 10, 5, 2][i],
}))

const UNIT_OPTIONS = ['Power Consumption (kWh)', 'Export Power (kWh)', 'Cost (PKR)']

export default function OrgEnergyConsumption() {
  const [unit, setUnit] = useState(UNIT_OPTIONS[0])

  return (
    <AnalyticsDetailPage
      title="Total Power Consumption"
      valueLabel="Total Power Consumption"
      value="131.78 kWh"
      noAnomalies
      extraAnomalyColumn="Consumption"
      predictedTitle="Predicted Power Consumption"
      predictedType="line"
      predictedData={predictedData}
      predictedColor="#3B82F6"
      overTimeTitle="Power Consumption Imbalance Over Time"
      overTimeType="bar"
      overTimeData={overTimeData}
      overTimeColor="#3B82F6"
      backTo="/org"
      extraFilter={
        <div className="w-56">
          <label className="label">Unit (kWh)</label>
          <select className="select" value={unit} onChange={e => setUnit(e.target.value)}>
            {UNIT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      }
    />
  )
}
