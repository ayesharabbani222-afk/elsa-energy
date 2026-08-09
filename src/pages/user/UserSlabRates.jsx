import { useState } from 'react'
import { Eye, Pencil, Trash2, Plus } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput } from '../../components/ui/FormFields'
import { devices } from '../../data/dummy'

const blank = { slave: '', unitFrom: '', unitTo: '', rate: '', onPeakRate: '', offPeakRate: '' }

export default function UserSlabRates() {
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
    if (confirm(`Delete slab rate for "${row.slave}"?`)) setData(d => d.filter(r => r.id !== row.id))
  }

  const filtered = data.filter(r => !deviceFilter || r.slave === deviceFilter)

  const columns = [
    { key: 'slave',       label: 'Slave' },
    { key: 'unitFrom',    label: 'Unit From' },
    { key: 'unitTo',      label: 'Unit To' },
    { key: 'rate',        label: 'Rate' },
    { key: 'onPeakRate',  label: 'On-Peak Rate' },
    { key: 'offPeakRate', label: 'Off-Peak Rate' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Slab Rates</h2>
          <p className="breadcrumb">Manage Slab Rates &ndash; List</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Slab Rate</button>
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
        searchPlaceholder="Search slab rates..."
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
        title={modal === 'add' ? 'Add Slab Rate' : 'Edit Slab Rate'}
        footer={<>
          <button className="btn-secondary" onClick={close}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>{modal === 'add' ? 'Create' : 'Save Changes'}</button>
        </>}
      >
        <div className="space-y-4">
          <SelectInput label="Slave" required placeholder="Select device"
            value={form.slave} onChange={e => setForm(f => ({ ...f, slave: e.target.value }))}
            options={devices.map(d => ({ value: d.name, label: d.name }))} />
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Unit From" value={form.unitFrom} onChange={e => setForm(f => ({ ...f, unitFrom: e.target.value }))} />
            <TextInput label="Unit To" value={form.unitTo} onChange={e => setForm(f => ({ ...f, unitTo: e.target.value }))} />
          </div>
          <TextInput label="Rate" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="On-Peak Rate" value={form.onPeakRate} onChange={e => setForm(f => ({ ...f, onPeakRate: e.target.value }))} />
            <TextInput label="Off-Peak Rate" value={form.offPeakRate} onChange={e => setForm(f => ({ ...f, offPeakRate: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'view'} onClose={close} title="Slab Rate Details" size="sm">
        {selected && (
          <div className="space-y-3">
            {[
              ['Slave',          selected.slave],
              ['Unit From',      selected.unitFrom],
              ['Unit To',        selected.unitTo],
              ['Rate',           selected.rate],
              ['On-Peak Rate',   selected.onPeakRate],
              ['Off-Peak Rate',  selected.offPeakRate],
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
