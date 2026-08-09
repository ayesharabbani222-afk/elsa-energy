import AnalyticsDetailPage from '../../components/ui/AnalyticsDetailPage'

const predictedData = ['12:00 AM','01:00 AM','02:00 AM','03:00 AM','04:00 AM','05:00 AM','06:00 AM','07:00 AM','08:00 AM','09:00 AM']
  .map((t, i) => ({ t, v: [2.6, 1.9, 1.9, 2.5, 1.9, 2.0, 2.6, 2.3, 1.9, 3.4][i] }))

const overTimeData = Array.from({ length: 17 }, (_, i) => {
  const hrs = Math.floor(i / 2)
  const mins = i % 2 === 0 ? '00' : '30'
  const t = `${(hrs % 12) || 12}:${mins} ${hrs < 12 ? 'AM' : 'PM'}`
  return { t, v: 280 + Math.round(Math.sin(i) * 40) }
})

export default function UserVoltageImbalance() {
  return (
    <AnalyticsDetailPage
      title="Voltage Imbalance Details"
      valueLabel="Voltage Imbalance"
      value="27.63"
      anomalyType="Overvoltage"
      anomalyCount={55}
      predictedTitle="Predicted Voltage"
      predictedType="bar"
      predictedData={predictedData}
      predictedColor="#3B82F6"
      overTimeTitle="Voltage Over Time"
      overTimeType="bar"
      overTimeData={overTimeData}
      overTimeColor="#3B82F6"
      backTo="/user"
    />
  )
}
