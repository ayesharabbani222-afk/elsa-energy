import { useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput, ToggleInput } from '../../components/ui/FormFields'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { devices } from '../../data/dummy'

const INITIAL_TASKS = [
  { id: 77, serial: 77, device: 'Fico', variable: 'Furnace', action: 'OFF', time: '08:30 AM', repeat: 'Daily', status: 'Active', createdBy: 'Zia ul Islam' },
  { id: 81, serial: 81, device: 'Fico', variable: 'Furnace', action: 'OFF', time: '08:30 AM', repeat: 'Daily', status: 'Active', createdBy: 'Zia ul Islam' },
  { id: 87, serial: 87, device: 'Red Chilli', variable: 'Power Factor', action: 'ON', time: '02:53 PM', repeat: 'Daily', status: 'Active', createdBy: 'C Solar' },
]

const blankForm = {
  device: '', variable: '', action: 'OFF', time: '08:00 AM', repeat: 'Daily', status: 'Active',
}

export default function AdminScheduleTasks() {
  const [data, setData]         = useState(INITIAL_TASKS)
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(blankForm)
  const [toast, setToast]       = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openAdd  = () => { setForm(blankForm); setModal('add') }
  const openEdit = (row) => { setSelected(row); setForm({ device: row.device, variable: row.variable, action: row.action, time: row.time, repeat: row.repeat, status: row.status }); setModal('edit') }
  const openView = (row) => { setSelected(row); setModal('view') }
  const close    = () => { setModal(null); setSelected(null) }

  const nextSerial = () => Math.max(0, ...data.map(d => d.serial)) + 1

  const handleSave = () => {
    if (!form.device.trim()) return
    if (modal === 'add') {
      setData(d => [...d, { ...form, id: Date.now(), serial: nextSerial(), createdBy: 'Admin' }])
      showToast('Scheduled task created successfully')
    } else {
      setData(d => d.map(r => r.id === selected.id ? { ...r, ...form } : r))
      showToast('Scheduled task updated successfully')
    }
    close()
  }

  const handleDelete = (row) => {
    if (confirm(`Delete task for "${row.device} - ${row.variable}"?`)) {
      setData(d => d.filter(r => r.id !== row.id))
      showToast('Task deleted', 'danger')
    }
  }

  const columns = [
    { key: 'serial', label: 'Serial No.' },
    {
      key: 'variable', label: 'Device Variable', sortable: false,
      render: (_, row) => <span>{row.device} - {row.variable}</span>,
    },
    { key: 'action',  label: 'Action', render: v => <span className={`badge ${v === 'ON' ? 'badge-success' : 'badge-neutral'}`}>{v}</span> },
    { key: 'time',    label: 'Scheduled Time' },
    { key: 'repeat',  label: 'Repeat Type' },
    { key: 'status',  label: 'Status', render: v => <span className={`badge ${v === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{v}</span> },
    { key: 'createdBy', label: 'Created by' },
  ]

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === 'danger' ? 'bg-danger-600 text-white' : 'bg-success-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Tasks</h2>
          <p className="breadcrumb">Manage Scheduled Tasks &ndash; List</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Scheduled Task</button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search tasks..."
        actions={(row) => (
          <>
            <button className="btn-ghost p-1.5" onClick={() => openEdit(row)} title="Edit"><Pencil size={14} /></button>
            <button className="btn-ghost p-1.5" onClick={() => openView(row)} title="View"><Eye size={14} /></button>
            <button className="btn-danger p-1.5" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={14} /></button>
          </>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={close}
        title={modal === 'add' ? 'Add Scheduled Task' : 'Edit Scheduled Task'}
        footer={
          <>
            <button className="btn-secondary" onClick={close}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>
              {modal === 'add' ? 'Create' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <SelectInput label="Device" required placeholder="Select device"
            value={form.device} onChange={e => setForm(f => ({ ...f, device: e.target.value }))}
            options={devices.map(d => ({ value: d.name, label: d.name }))} />
          <TextInput label="Variable" required placeholder="e.g. Furnace"
            value={form.variable} onChange={e => setForm(f => ({ ...f, variable: e.target.value }))} />
          <SelectInput label="Action" value={form.action}
            onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            options={['ON', 'OFF']} />
          <div>
            <label className="label">Scheduled Time</label>
            <input type="text" className="input" placeholder="e.g. 08:30 AM" value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>
          <SelectInput label="Repeat Type" value={form.repeat}
            onChange={e => setForm(f => ({ ...f, repeat: e.target.value }))}
            options={['Daily', 'Weekly', 'Monthly', 'Once']} />
          <ToggleInput label="Status (Active)" checked={form.status === 'Active'}
            onChange={v => setForm(f => ({ ...f, status: v ? 'Active' : 'Inactive' }))} />
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === 'view'} onClose={close} title="Scheduled Task Details">
        {selected && (
          <div className="space-y-3">
            {[
              ['Serial No.',      selected.serial],
              ['Device',          selected.device],
              ['Variable',        selected.variable],
              ['Action',          selected.action],
              ['Scheduled Time',  selected.time],
              ['Repeat Type',     selected.repeat],
              ['Status',          selected.status],
              ['Created by',      selected.createdBy],
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
