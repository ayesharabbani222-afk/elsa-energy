import { useState } from 'react'
import { Eye, Pencil, Trash2, Plus } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput, ToggleInput } from '../../components/ui/FormFields'
import { devices } from '../../data/dummy'

const INITIAL = [
  { id:1, slave:'Main Wapda', variable:'Active Power', action:'OFF', time:'08:30 AM', repeat:'Daily', status:'Active' },
]

const blank = { slave: '', variable: '', action: 'OFF', time: '08:00 AM', repeat: 'Daily', status: 'Active' }

export default function UserSchedule() {
  const [data, setData]         = useState([])
  const [deviceFilter, setDeviceFilter] = useState('')
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(blank)

  const openAdd  = () => { setForm(blank); setModal('add') }
  const openEdit = (row) => { setSelected(row); setForm({ ...row }); setModal('edit') }
  const openView = (row) => { setSelected(row); setModal('view') }
  const close    = () => { setModal(null); setSelected(null) }

  const handleSave = () => {
    if (!form.slave) return
    if (modal === 'add') setData(d => [...d, { ...form, id: Date.now() }])
    else setData(d => d.map(r => r.id === selected.id ? { ...r, ...form } : r))
    close()
  }

  const handleDelete = (row) => {
    if (confirm(`Delete task for "${row.slave}"?`)) setData(d => d.filter(r => r.id !== row.id))
  }

  const filtered = data.filter(r => !deviceFilter || r.slave === deviceFilter)

  const columns = [
    { key: 'slave',    label: 'Slave' },
    { key: 'variable', label: 'Variable' },
    { key: 'action',   label: 'Action', render: v => <span className={`badge ${v === 'ON' ? 'badge-success' : 'badge-neutral'}`}>{v}</span> },
    { key: 'time',     label: 'Scheduled Time' },
    { key: 'repeat',   label: 'Repeat Type' },
    { key: 'status',   label: 'Status', render: v => <span className={`badge ${v === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{v}</span> },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Schedule</h2>
          <p className="breadcrumb">Manage Scheduled &ndash; List</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Scheduled Task</button>
      </div>

      <div className="card p-4 mb-5">
        <div className="w-56">
          <label className="label">Device</label>
          <select className="select" value={deviceFilter} onChange={e => setDeviceFilter(e.target.value)}>
            <option value="">All locations</option>
            {devices.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search tasks..."
        emptyMessage="No data available in table"
        actions={(row) => (
          <>
            <button className="btn-ghost p-1.5" onClick={() => openView(row)} title="View"><Eye size={14} /></button>
            <button className="btn-ghost p-1.5" onClick={() => openEdit(row)} title="Edit"><Pencil size={14} /></button>
            <button className="btn-danger p-1.5" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={14} /></button>
          </>
        )}
      />

      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={close}
        title={modal === 'add' ? 'Add Scheduled Task' : 'Edit Scheduled Task'}
        footer={<>
          <button className="btn-secondary" onClick={close}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>{modal === 'add' ? 'Create' : 'Save Changes'}</button>
        </>}
      >
        <div className="space-y-4">
          <SelectInput label="Slave" required placeholder="Select device"
            value={form.slave} onChange={e => setForm(f => ({ ...f, slave: e.target.value }))}
            options={devices.map(d => ({ value: d.name, label: d.name }))} />
          <TextInput label="Variable" required placeholder="e.g. Active Power"
            value={form.variable} onChange={e => setForm(f => ({ ...f, variable: e.target.value }))} />
          <SelectInput label="Action" value={form.action}
            onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            options={['ON', 'OFF']} />
          <TextInput label="Scheduled Time" placeholder="e.g. 08:30 AM"
            value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          <SelectInput label="Repeat Type" value={form.repeat}
            onChange={e => setForm(f => ({ ...f, repeat: e.target.value }))}
            options={['Daily', 'Weekly', 'Monthly', 'Once']} />
          <ToggleInput label="Status (Active)" checked={form.status === 'Active'}
            onChange={v => setForm(f => ({ ...f, status: v ? 'Active' : 'Inactive' }))} />
        </div>
      </Modal>

      <Modal open={modal === 'view'} onClose={close} title="Task Details" size="sm">
        {selected && (
          <div className="space-y-3">
            {[
              ['Slave',           selected.slave],
              ['Variable',        selected.variable],
              ['Action',          selected.action],
              ['Scheduled Time',  selected.time],
              ['Repeat Type',     selected.repeat],
              ['Status',          selected.status],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-surface-400">{label}</span>
                <span className="text-surface-900 font-medium">{val}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
