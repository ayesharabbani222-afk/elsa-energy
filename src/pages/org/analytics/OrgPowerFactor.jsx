import AnalyticsDetailPage from '../../../components/ui/AnalyticsDetailPage'

const predictedData = ['12:00 AM','01:00 AM','02:00 AM','03:00 AM','04:00 AM','05:00 AM','06:00 AM','07:00 AM','08:00 AM','09:00 AM']
  .map((t, i) => ({ t, v: [2.7, 1.9, 2.0, 2.4, 1.9, 2.1, 2.6, 2.3, 1.9, 3.4][i] }))

const overTimeData = Array.from({ length: 17 }, (_, i) => ({
  t: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'} AM`,
  v: 0.7 + Math.abs(Math.sin(i)) * 0.2,
}))

export default function OrgPowerFactor() {
  return (
    <AnalyticsDetailPage
      title="Power Factor Details"
      valueLabel="Power Factor"
      value="0.84"
      anomalyType="Low Power Factor"
      anomalyCount={20}
      predictedTitle="Predicted Power Factor"
      predictedType="line"
      predictedData={predictedData}
      predictedColor="#3B82F6"
      overTimeTitle="Power Factor Over Time"
      overTimeType="bar"
      overTimeData={overTimeData}
      overTimeColor="#3B82F6"
      backTo="/org"
    />
  )
}
