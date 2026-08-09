import { useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput, TextareaInput } from '../../components/ui/FormFields'
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react'

const TYPES = ['Logo', 'Text', 'Number', 'Color']

const INITIAL_SETTINGS = [
  { id: 1, key: 'AdminLoginLogo', type: 'Logo', preview: '/elsa_logo.jpeg', description: 'Logo displayed on the admin login screen', updatedAt: '12/02/2026 01:23 PM' },
]

const blankForm = { key: '', type: 'Logo', value: '', description: '' }

export default function AdminSettings() {
  const [data, setData]         = useState(INITIAL_SETTINGS)
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(blankForm)
  const [toast, setToast]       = useState(null)

  const [typeFilter, setTypeFilter] = useState('')
  const [keyQuery, setKeyQuery]     = useState('')
  const [applied, setApplied]       = useState({ type: '', key: '' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openAdd  = () => { setForm(blankForm); setModal('add') }
  const openEdit = (row) => { setSelected(row); setForm({ key: row.key, type: row.type, value: '', description: row.description }); setModal('edit') }
  const close    = () => { setModal(null); setSelected(null) }

  const handleSave = () => {
    if (!form.key.trim()) return
    const now = new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    if (modal === 'add') {
      setData(d => [...d, { id: Date.now(), key: form.key, type: form.type, description: form.description, preview: null, updatedAt: now }])
      showToast('Setting created successfully')
    } else {
      setData(d => d.map(r => r.id === selected.id ? { ...r, key: form.key, type: form.type, description: form.description, updatedAt: now } : r))
      showToast('Setting updated successfully')
    }
    close()
  }

  const handleDelete = (row) => {
    if (confirm(`Delete setting "${row.key}"?`)) {
      setData(d => d.filter(r => r.id !== row.id))
      showToast('Setting deleted', 'danger')
    }
  }

  const handleQuery = () => setApplied({ type: typeFilter, key: keyQuery })

  const filtered = data.filter(r =>
    (!applied.type || r.type === applied.type) &&
    (!applied.key || r.key.toLowerCase().includes(applied.key.toLowerCase()))
  )

  const columns = [
    { key: 'key',  label: 'Key', render: v => <span className="text-primary-600 font-medium">{v}</span> },
    { key: 'type', label: 'Type', render: v => <span className="badge badge-info">{v}</span> },
    {
      key: 'preview', label: 'Value Preview', sortable: false,
      render: (v) => v
        ? <img src={v} alt="preview" className="w-10 h-10 rounded-lg object-cover border border-surface-200" />
        : <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-950 flex items-center justify-center text-surface-400"><ImageIcon size={16} /></div>,
    },
    { key: 'description', label: 'Description', render: v => <span className="text-xs text-surface-500">{v}</span> },
    { key: 'updatedAt', label: 'Last Updated' },
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
          <h2 className="page-title">Manage Settings</h2>
          <p className="breadcrumb">Manage Settings &ndash; List</p>
        </div>
      </div>

      {/* Filter row */}
      <div className="card p-4 mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <SelectInput label="Setting Type" placeholder="Setting Type" value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              options={TYPES} />
          </div>
          <div className="flex-1 min-w-48">
            <TextInput label="Key" placeholder="Search by key..."
              value={keyQuery} onChange={e => setKeyQuery(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={handleQuery}>Query</button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search settings..."
        actions={(row) => (
          <>
            <button className="btn-ghost p-1.5" onClick={() => openEdit(row)} title="Edit"><Pencil size={14} /></button>
            <button className="btn-danger p-1.5" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={14} /></button>
          </>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={close}
        title={modal === 'add' ? 'Add Setting' : 'Edit Setting'}
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
          <TextInput label="Key" required placeholder="e.g. AdminLoginLogo"
            value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} />
          <SelectInput label="Type" value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            options={TYPES} />
          {form.type === 'Logo' ? (
            <div>
              <label className="label">Upload Image</label>
              <input type="file" accept="image/*"
                className="w-full text-sm text-surface-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer" />
            </div>
          ) : (
            <TextInput label="Value" placeholder="Setting value"
              value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
          )}
          <TextareaInput label="Description" placeholder="What this setting controls..."
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
