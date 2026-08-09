import AnalyticsDetailPage from '../../components/ui/AnalyticsDetailPage'

const predictedData = ['12:00 AM','01:00 AM','02:00 AM','03:00 AM','04:00 AM','05:00 AM','06:00 AM','07:00 AM','08:00 AM','09:00 AM']
  .map((t, i) => ({ t, v: [2500, 1950, 1900, 2450, 1900, 2000, 2550, 2250, 1850, 3200][i] }))

const overTimeData = Array.from({ length: 15 }, (_, i) => ({
  t: `${String(i).padStart(2, '0')}:00 AM`,
  v: Math.max(1400, 2500 - i * 70),
}))

export default function UserCurrentImbalance() {
  return (
    <AnalyticsDetailPage
      title="Current Imbalance Details"
      valueLabel="Current Imbalance"
      value="38.95"
      noAnomalies
      predictedTitle="Predicted Current"
      predictedType="bar"
      predictedData={predictedData}
      predictedColor="#3B82F6"
      overTimeTitle="Current Over Time"
      overTimeType="bar"
      overTimeData={overTimeData}
      overTimeColor="#3B82F6"
      backTo="/user"
    />
  )
}
