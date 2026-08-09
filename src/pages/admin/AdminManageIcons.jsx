import { useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, ToggleInput } from '../../components/ui/FormFields'
import {
  Plus, Pencil, Trash2, Fan, Zap, Activity, Flame, Waves, Lightbulb, Gauge,
  Sun, Wind, Shield, Settings, Droplets, Cpu,
} from 'lucide-react'

const ICON_MAP = {
  AC: Fan, Current: Zap, Frequency: Activity, Furnace: Flame, Harmonics: Waves,
  Light: Lightbulb, Meter: Gauge, 'Solar Panel': Sun, Generator: Wind,
  Switchgear: Shield, Motor: Settings, Pump: Droplets, 'Capacitor Bank': Cpu,
}

const INITIAL_ICONS = [
  { id: 1, name: 'AC',            active: true },
  { id: 2, name: 'Current',       active: true },
  { id: 3, name: 'Frequency',     active: true },
  { id: 4, name: 'Furnace',       active: true },
  { id: 5, name: 'Harmonics',     active: true },
  { id: 6, name: 'Light',         active: true },
  { id: 7, name: 'Meter',         active: true },
  { id: 8, name: 'Solar Panel',   active: true },
  { id: 9, name: 'Generator',     active: true },
  { id:10, name: 'Switchgear',    active: true },
  { id:11, name: 'Motor',         active: true },
  { id:12, name: 'Pump',          active: true },
  { id:13, name: 'Capacitor Bank',active: true },
]

const blank = { name: '', active: true, file: '' }

export default function AdminManageIcons() {
  const [icons, setIcons]       = useState(INITIAL_ICONS)
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(blank)
  const [nameQuery, setNameQuery] = useState('')

  const openAdd  = () => { setForm(blank); setModal('add') }
  const openEdit = (icon) => { setSelected(icon); setForm({ name: icon.name, active: icon.active, file: '' }); setModal('edit') }
  const close    = () => { setModal(null); setSelected(null) }

  const handleSave = () => {
    if (modal === 'add') {
      setIcons(d => [...d, { id: Date.now(), name: form.name, active: form.active }])
    } else {
      setIcons(d => d.map(r => r.id === selected.id ? { ...r, name: form.name, active: form.active } : r))
    }
    close()
  }

  const handleDelete = (icon) => {
    if (confirm(`Delete icon "${icon.name}"?`)) setIcons(d => d.filter(r => r.id !== icon.id))
  }

  const filtered = icons.filter(i => !nameQuery || i.name.toLowerCase().includes(nameQuery.toLowerCase()))

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'icon', label: 'Icon', sortable: false,
      render: (_, row) => {
        const IconComp = ICON_MAP[row.name] || Gauge
        return (
          <div className="w-9 h-9 rounded-lg bg-surface-100 dark:bg-surface-950 flex items-center justify-center text-surface-700 dark:text-surface-300">
            <IconComp size={18} />
          </div>
        )
      },
    },
    { key: 'active', label: 'Active', render: v => <span className={`badge ${v ? 'badge-success' : 'badge-neutral'}`}>{v ? 'Active' : 'Inactive'}</span> },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Icons</h2>
          <p className="breadcrumb">Manage Icons &ndash; List</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Icon</button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search icons..."
        actions={(row) => (
          <>
            <button className="btn-ghost p-1.5" onClick={() => openEdit(row)} title="Edit">
              <Pencil size={13} />
            </button>
            <button className="btn-danger p-1.5" onClick={() => handleDelete(row)} title="Delete">
              <Trash2 size={13} />
            </button>
          </>
        )}
      />

      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={close}
        title={modal === 'add' ? 'Add Icon' : 'Edit Icon'}
        footer={
          <>
            <button className="btn-secondary" onClick={close}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>{modal === 'add' ? 'Upload' : 'Save Changes'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <TextInput label="Icon Name" required placeholder="e.g. AC"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div>
            <label className="label">Icon File</label>
            <input type="file" accept="image/*"
              className="w-full text-sm text-surface-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer"
              onChange={e => setForm(f => ({ ...f, file: e.target.value }))} />
          </div>
          <ToggleInput label="Active" checked={form.active}
            onChange={v => setForm(f => ({ ...f, active: v }))} />
        </div>
      </Modal>
    </div>
  )
}
