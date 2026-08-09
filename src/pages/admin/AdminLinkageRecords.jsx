import { useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import DataCenterFilterBar from '../../components/ui/DataCenterFilterBar'
import { Eye, Download } from 'lucide-react'
import { devices } from '../../data/dummy'

const INITIAL_RECORDS = [
  { id:1, device:'Main Wapda',     trigger:'Overload Shutoff',  triggerType:'High', slave:'Slave 1', variable:'Current Phase A', condition:'> 30A',  tgtDevice:'CF Smart Panel',  time:'2026-05-10 09:12' },
  { id:2, device:'CF Smart Panel', trigger:'Low Voltage Alert', triggerType:'Low',  slave:'Slave 1', variable:'Voltage Phase A', condition:'< 210V', tgtDevice:'Fico Furnace 1',  time:'2026-05-15 13:40' },
  { id:3, device:'EMS Panel',      trigger:'Gen Auto Start',    triggerType:'Low',  slave:'Slave 2', variable:'Voltage Phase B', condition:'< 200V', tgtDevice:'C Power Gen',     time:'2026-05-20 07:55' },
  { id:4, device:'Main Wapda',     trigger:'Backup Pump Switch',triggerType:'Low',  slave:'Slave 1', variable:'Power Factor',    condition:'< 0.80', tgtDevice:'Supra Furnace A', time:'2026-06-01 21:03' },
]

export default function AdminLinkageRecords() {
  const [data, setData]         = useState(INITIAL_RECORDS)
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

  const [device, setDevice]     = useState(devices[0]?.name || '')
  const [trigger, setTrigger]   = useState('Import Power')
  const [variable, setVariable] = useState('Voltage A (40097)')
  const [dateFrom, setDateFrom] = useState('2026-06-28')
  const [dateTo, setDateTo]     = useState('2026-07-27')
  const [applied, setApplied]   = useState({ device: devices[0]?.name || '' })

  const openView = (row) => { setSelected(row); setModal('view') }
  const close    = () => { setModal(null); setSelected(null) }

  const handleBatchDelete = () => {
    if (!selectedIds.length) return
    if (confirm(`Delete ${selectedIds.length} selected record(s)?`)) {
      setData(d => d.filter(r => !selectedIds.includes(r.id)))
      setSelectedIds([])
    }
  }

  const handleDownload = () => {
    const header = ['Device Name','Trigger Name','Trigger Type','Slave Name','Variable Name','Triggering Condition','Trigger Device','Linkage Time']
    const rows = filtered.map(r => [r.device, r.trigger, r.triggerType, r.slave, r.variable, r.condition, r.tgtDevice, r.time])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'linkage_record.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleQuery = () => setApplied({ device })

  const filtered = data.filter(r => !applied.device || r.device === applied.device)

  const columns = [
    { key: 'device',      label: 'Device Name' },
    { key: 'trigger',     label: 'Trigger Name' },
    { key: 'triggerType', label: 'Trigger Type', render: v => <span className={`badge ${v === 'High' ? 'badge-danger' : 'badge-warning'}`}>{v}</span> },
    { key: 'slave',       label: 'Slave Name' },
    { key: 'variable',    label: 'Variable Name' },
    { key: 'condition',   label: 'Triggering Condition', render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'tgtDevice',   label: 'Trigger Device' },
    { key: 'time',        label: 'Linkage Time', render: v => <span className="text-xs text-surface-400">{v}</span> },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Data Center</h2>
          <p className="breadcrumb">Data Center &ndash; Linkage Record</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={handleDownload}><Download size={14} /> Download Data</button>
          <button className="btn-secondary" onClick={handleBatchDelete}>Batch Delete</button>
        </div>
      </div>

      <DataCenterFilterBar
        devices={devices.map(d => d.name)}
        device={device} onDeviceChange={setDevice}
        triggerOptions={['Import Power', 'Overload Shutoff', 'Low Voltage Alert']}
        trigger={trigger} onTriggerChange={setTrigger}
        variableOptions={['Voltage A (40097)', 'Voltage B (40098)', 'Voltage C (40099)']}
        variable={variable} onVariableChange={setVariable}
        dateFrom={dateFrom} dateTo={dateTo}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo}
        onQuery={handleQuery}
      />

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search linkages..."
        emptyMessage="No data available in table"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        actions={(row) => (
          <button className="btn-ghost p-1.5" onClick={() => openView(row)} title="View"><Eye size={14} /></button>
        )}
      />

      <Modal open={modal === 'view'} onClose={close} title="Linkage Details">
        {selected && (
          <div className="space-y-3">
            {[
              ['Device',           selected.device],
              ['Trigger',          selected.trigger],
              ['Trigger Type',     selected.triggerType],
              ['Slave',            selected.slave],
              ['Variable',         selected.variable],
              ['Condition',        selected.condition],
              ['Trigger Device',   selected.tgtDevice],
              ['Linkage Time',     selected.time],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4">
                <span className="text-xs text-surface-500 w-32 flex-shrink-0">{label}</span>
                <span className="text-xs text-surface-800">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
