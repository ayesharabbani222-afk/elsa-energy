import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput, TextareaInput } from '../../components/ui/FormFields'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { deviceTemplates as initialData, organizations } from '../../data/dummy'

const blank = { name: '', org: '', method: 'Edge Computing', description: '' }

export default function AdminDeviceTemplates() {
  const navigate = useNavigate()
  const [data, setData]         = useState(initialData)
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(blank)
  const [selectedIds, setSelectedIds] = useState([])

  const [orgFilter, setOrgFilter] = useState('')
  const [nameQuery, setNameQuery] = useState('')
  const [applied, setApplied]     = useState({ org: '', name: '' })

  const openAdd       = () => { setForm(blank); setModal('add') }
  const openEdit      = (row) => { setSelected(row); setForm({ name: row.name, org: row.org, method: row.method, description: row.description || '' }); setModal('edit') }
  const openView      = (row) => { setSelected(row); setModal('view') }
  const openSlaves    = (row) => { navigate(`/admin/device-templates/${row.id}/slaves`) }
  const close         = () => { setModal(null); setSelected(null) }

  const handleSave = () => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    if (modal === 'add') {
      setData(d => [...d, { id: Date.now(), variables: 12, devices: 0, updatedAt: now, ...form }])
    } else {
      setData(d => d.map(r => r.id === selected.id ? { ...r, ...form, updatedAt: now } : r))
    }
    close()
  }

  const handleDelete = (row) => {
    if (confirm(`Delete template "${row.name}"?`)) setData(d => d.filter(r => r.id !== row.id))
  }

  const handleBatchDelete = () => {
    if (!selectedIds.length) return
    if (confirm(`Delete ${selectedIds.length} selected template(s)?`)) {
      setData(d => d.filter(r => !selectedIds.includes(r.id)))
      setSelectedIds([])
    }
  }

  const handleQuery = () => setApplied({ org: orgFilter, name: nameQuery })

  const filtered = data.filter(r =>
    (!applied.org || r.org === applied.org) &&
    (!applied.name || r.name.toLowerCase().includes(applied.name.toLowerCase()))
  )

  const columns = [
    { key: 'name',      label: 'Template Name' },
    { key: 'org',       label: 'Organization' },
    { key: 'variables', label: 'Total No Of Variables' },
    { key: 'devices',   label: 'NO Of Associated Devices' },
    { key: 'method',    label: 'Acquisition Methods' },
    { key: 'updatedAt', label: 'Update Time' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Device Templates</h2>
          <p className="breadcrumb">Manage Device Templates &ndash; List</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Template</button>
          <button className="btn-secondary" onClick={handleBatchDelete}>Batch Delete</button>
        </div>
      </div>

      {/* Filter row */}
      <div className="card p-4 mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48">
            <SelectInput label="Organization" placeholder="All" value={orgFilter}
              onChange={e => setOrgFilter(e.target.value)}
              options={organizations.map(o => ({ value:o.name, label:o.name }))} />
          </div>
          <div className="flex-1 min-w-48">
            <TextInput label="Template Name" placeholder="Please input template name"
              value={nameQuery} onChange={e => setNameQuery(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={handleQuery}>Query</button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search templates..."
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        actions={(row) => (
          <>
            <button className="btn-ghost p-1.5 text-warning-600" onClick={() => openView(row)} title="View"><Eye size={14} /></button>
            <button className="btn-ghost p-1.5" onClick={() => openEdit(row)} title="Edit"><Pencil size={14} /></button>
            <button className="btn-ghost p-1.5 text-info-600 font-bold" onClick={() => openSlaves(row)} title="Slaves">S</button>
            <button className="btn-danger p-1.5" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={14} /></button>
          </>
        )}
      />

      {/* Add / Edit */}
      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={close}
        title={modal === 'add' ? 'Add Template' : 'Edit Template'}
        footer={
          <>
            <button className="btn-secondary" onClick={close}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>{modal === 'add' ? 'Create' : 'Save Changes'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <TextInput label="Template Name" required placeholder="e.g. CF Smart Main Panel"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <SelectInput label="Organization" placeholder="Select organization"
            value={form.org} onChange={e => setForm(f => ({ ...f, org: e.target.value }))}
            options={organizations.map(o => ({ value: o.name, label: o.name }))} />
          <SelectInput label="Acquisition Method"
            value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
            options={['Cloud Polling', 'Edge Computing']} />
          <TextareaInput label="Description" placeholder="Template description..."
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </Modal>

      {/* View */}
      <Modal open={modal === 'view'} onClose={close} title="Template Details">
        {selected && (
          <div className="space-y-3">
            {[
              ['Template Name', selected.name],
              ['Organization', selected.org],
              ['Variables', selected.variables],
              ['Devices', selected.devices],
              ['Method', selected.method],
              ['Last Updated', selected.updatedAt],
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
