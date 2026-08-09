import { useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import DataCenterFilterBar from '../../components/ui/DataCenterFilterBar'
import { Eye, CheckCircle, Download } from 'lucide-react'
import { devices } from '../../data/dummy'

const INITIAL_ALARMS = [
  { id:1, device:'Main Wapda',      trigger:'Import Power', triggerType:'High', slave:'Slave 1', variable:'Voltage Phase A', currentValue:'238V',  condition:'> 235V',   time:'2026-06-10 10:22', state:'Active',   processState:'Unprocessed' },
  { id:2, device:'CF Smart Panel',  trigger:'Import Power', triggerType:'High', slave:'Slave 1', variable:'Current Phase B', currentValue:'27.3A', condition:'> 25A',    time:'2026-06-10 09:15', state:'Active',   processState:'Unprocessed' },
  { id:3, device:'Fico Furnace 1',  trigger:'Power Factor Watch', triggerType:'Low', slave:'Slave 1', variable:'Power Factor', currentValue:'0.79', condition:'< 0.85',   time:'2026-06-09 18:44', state:'Resolved', processState:'Processed' },
  { id:4, device:'EMS Panel',       trigger:'Voltage Watch', triggerType:'Low', slave:'Slave 2', variable:'Voltage Phase C', currentValue:'207V',  condition:'< 210V',   time:'2026-06-09 14:30', state:'Resolved', processState:'Processed' },
  { id:5, device:'Supra Furnace A', trigger:'Import Power', triggerType:'High', slave:'Slave 1', variable:'Active Power',    currentValue:'22.1kW',condition:'> 20kW',   time:'2026-06-09 11:05', state:'Active',   processState:'Unprocessed' },
]

export default function AdminVariableAlarms() {
  const [data, setData]         = useState(INITIAL_ALARMS)
  const [selected, setSelected] = useState(null)
  const [modal, setModal]       = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

  const [device, setDevice]     = useState(devices[0]?.name || '')
  const [trigger, setTrigger]   = useState('Import Power')
  const [variable, setVariable] = useState('Voltage A (40097)')
  const [dateFrom, setDateFrom] = useState('2026-06-28')
  const [dateTo, setDateTo]     = useState('2026-07-27')
  const [applied, setApplied]   = useState({ device: devices[0]?.name || '' })

  const openView = (row) => { setSelected(row); setModal('view') }
  const close    = () => { setModal(null); setSelected(null) }

  const markResolved = (row) => {
    setData(d => d.map(r => r.id === row.id ? { ...r, state: 'Resolved', processState: 'Processed' } : r))
  }

  const handleBatchDelete = () => {
    if (!selectedIds.length) return
    if (confirm(`Delete ${selectedIds.length} selected record(s)?`)) {
      setData(d => d.filter(r => !selectedIds.includes(r.id)))
      setSelectedIds([])
    }
  }

  const handleDownload = () => {
    const header = ['Device Name','Trigger Name','Trigger Type','Slave Name','Variable','Current Value','Triggering Condition','Alarm Time','Alarm State','Process State']
    const rows = filtered.map(r => [r.device, r.trigger, r.triggerType, r.slave, r.variable, r.currentValue, r.condition, r.time, r.state, r.processState])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'variable_alarm_record.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleQuery = () => setApplied({ device })

  const filtered = data.filter(r => !applied.device || r.device === applied.device)

  const columns = [
    { key: 'device',       label: 'Device Name' },
    { key: 'trigger',      label: 'Trigger Name' },
    { key: 'triggerType',  label: 'Trigger Type', render: v => <span className={`badge ${v === 'High' ? 'badge-danger' : 'badge-warning'}`}>{v}</span> },
    { key: 'slave',        label: 'Slave Name' },
    { key: 'variable',     label: 'Variable' },
    { key: 'currentValue', label: 'Current Value', render: v => <span className="font-mono text-xs text-primary-600">{v}</span> },
    { key: 'condition',    label: 'Triggering Condition', render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'time',         label: 'Alarm Time', render: v => <span className="text-xs text-surface-400">{v}</span> },
    { key: 'state',        label: 'Alarm State', render: v => <span className={`badge ${v === 'Active' ? 'badge-danger' : 'badge-success'}`}>{v}</span> },
    { key: 'processState', label: 'Process State', render: v => <span className={`badge ${v === 'Processed' ? 'badge-success' : 'badge-neutral'}`}>{v}</span> },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Data Center</h2>
          <p className="breadcrumb">Data Center &ndash; Variable Alarm Record</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={handleDownload}><Download size={14} /> Download Data</button>
          <button className="btn-secondary" onClick={handleBatchDelete}>Batch Delete</button>
        </div>
      </div>

      <DataCenterFilterBar
        devices={devices.map(d => d.name)}
        device={device} onDeviceChange={setDevice}
        triggerOptions={['Import Power', 'Power Factor Watch', 'Voltage Watch']}
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
        searchPlaceholder="Search alarms..."
        emptyMessage="No data available in table"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        actions={(row) => (
          <>
            <button className="btn-ghost p-1.5" onClick={() => openView(row)} title="View"><Eye size={14} /></button>
            {row.state === 'Active' && (
              <button className="btn-ghost p-1.5 text-success-600" onClick={() => markResolved(row)} title="Mark Resolved">
                <CheckCircle size={14} />
              </button>
            )}
          </>
        )}
      />

      <Modal open={modal === 'view'} onClose={close} title="Alarm Details">
        {selected && (
          <div className="space-y-3">
            {[
              ['Device',     selected.device],
              ['Trigger',    selected.trigger],
              ['Type',       selected.triggerType],
              ['Slave',      selected.slave],
              ['Variable',   selected.variable],
              ['Current Value', selected.currentValue],
              ['Condition',  selected.condition],
              ['Alarm Time', selected.time],
              ['State',      selected.state],
              ['Process',    selected.processState],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4">
                <span className="text-xs text-surface-500 w-28 flex-shrink-0">{label}</span>
                <span className="text-xs text-surface-800">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
