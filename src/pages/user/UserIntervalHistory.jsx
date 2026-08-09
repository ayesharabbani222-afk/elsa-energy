import { useState } from 'react'
import { Eye, Pencil, Trash2, Plus } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput } from '../../components/ui/FormFields'
import { devices } from '../../data/dummy'

const blank = { variableName: '', slaveName: '', totalUnit: '', tariff: '', startDate: '', endDate: '' }

export default function UserIntervalHistory() {
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
    if (!form.variableName) return
    if (modal === 'add') setData(d => [...d, { ...form, id: Date.now() }])
    else setData(d => d.map(r => r.id === selected.id ? { ...r, ...form } : r))
    close()
  }

  const handleDelete = (row) => {
    if (confirm(`Delete interval "${row.variableName}"?`)) setData(d => d.filter(r => r.id !== row.id))
  }

  const filtered = data.filter(r => !deviceFilter || r.slaveName === deviceFilter)

  const columns = [
    { key: 'variableName', label: 'Variable Name' },
    { key: 'slaveName',    label: 'Slave Name' },
    { key: 'totalUnit',    label: 'Total Unit' },
    { key: 'tariff',       label: 'Tariff' },
    { key: 'startDate',    label: 'Start Date' },
    { key: 'endDate',      label: 'End Date' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Interval History</h2>
          <p className="breadcrumb">Manage Interval History &ndash; List</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Interval</button>
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
        searchPlaceholder="Search intervals..."
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
        title={modal === 'add' ? 'Add Interval' : 'Edit Interval'}
        footer={<>
          <button className="btn-secondary" onClick={close}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>{modal === 'add' ? 'Create' : 'Save Changes'}</button>
        </>}
      >
        <div className="space-y-4">
          <TextInput label="Variable Name" required placeholder="e.g. Active Power"
            value={form.variableName} onChange={e => setForm(f => ({ ...f, variableName: e.target.value }))} />
          <SelectInput label="Slave Name" required placeholder="Select device"
            value={form.slaveName} onChange={e => setForm(f => ({ ...f, slaveName: e.target.value }))}
            options={devices.map(d => ({ value: d.name, label: d.name }))} />
          <TextInput label="Total Unit" value={form.totalUnit} onChange={e => setForm(f => ({ ...f, totalUnit: e.target.value }))} />
          <TextInput label="Tariff" value={form.tariff} onChange={e => setForm(f => ({ ...f, tariff: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'view'} onClose={close} title="Interval Details" size="sm">
        {selected && (
          <div className="space-y-3">
            {[
              ['Variable Name', selected.variableName],
              ['Slave Name',    selected.slaveName],
              ['Total Unit',    selected.totalUnit],
              ['Tariff',        selected.tariff],
              ['Start Date',    selected.startDate],
              ['End Date',      selected.endDate],
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
