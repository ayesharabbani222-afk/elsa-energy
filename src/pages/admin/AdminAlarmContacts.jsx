import { useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput, TextareaInput } from '../../components/ui/FormFields'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { alarmContacts as initialRaw, organizations } from '../../data/dummy'

const initialData = initialRaw.map(r => ({ ...r, addPeople: 'App-Admin' }))

const blankForm = {
  name: '', org: '', phone: '', email: '', whatsapp: '', remark: '', addPeople: 'App-Admin',
}

export default function AdminAlarmContacts() {
  const [data, setData]         = useState(initialData)
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(blankForm)
  const [toast, setToast]       = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

  const [orgFilter, setOrgFilter] = useState('')
  const [query, setQuery]         = useState('')
  const [applied, setApplied]     = useState({ org: '', query: '' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openAdd  = () => { setForm(blankForm); setModal('add') }
  const openEdit = (row) => {
    setSelected(row)
    setForm({ name: row.name, org: row.org, phone: row.phone, email: row.email, whatsapp: row.whatsapp, remark: row.remark, addPeople: row.addPeople })
    setModal('edit')
  }
  const close    = () => { setModal(null); setSelected(null) }

  const handleSave = () => {
    if (!form.name.trim()) return
    const now = new Date().toISOString().slice(0, 10)
    if (modal === 'add') {
      setData(d => [...d, { ...form, id: Date.now(), updatedAt: now }])
      showToast('Alarm contact added successfully')
    } else {
      setData(d => d.map(r => r.id === selected.id ? { ...r, ...form, updatedAt: now } : r))
      showToast('Alarm contact updated successfully')
    }
    close()
  }

  const handleDelete = (row) => {
    if (confirm(`Delete contact "${row.name}"?`)) {
      setData(d => d.filter(r => r.id !== row.id))
      showToast('Contact deleted', 'danger')
    }
  }

  const handleBatchDelete = () => {
    if (!selectedIds.length) return
    if (confirm(`Delete ${selectedIds.length} selected contact(s)?`)) {
      setData(d => d.filter(r => !selectedIds.includes(r.id)))
      setSelectedIds([])
    }
  }

  const handleQuery = () => setApplied({ org: orgFilter, query })

  const filtered = data.filter(r =>
    (!applied.org || r.org === applied.org) &&
    (!applied.query || r.name.toLowerCase().includes(applied.query.toLowerCase()) || String(r.phone).includes(applied.query))
  )

  const columns = [
    { key: 'name',      label: 'Contact Name' },
    { key: 'org',       label: 'Organization' },
    { key: 'phone',     label: 'Mobile Phone', render: v => <span className="text-xs">{v || '--'}</span> },
    { key: 'email',     label: 'Email' },
    { key: 'whatsapp',  label: 'Whatsapp' },
    { key: 'remark',    label: 'Remark' },
    { key: 'addPeople', label: 'Add People' },
    { key: 'updatedAt', label: 'Update Time' },
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
          <h2 className="page-title">Alarm linkage</h2>
          <p className="breadcrumb">Alarm contacts &ndash; Contacts List</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add</button>
          <button className="btn-secondary" onClick={handleBatchDelete}>Batch Delete</button>
        </div>
      </div>

      {/* Filter row */}
      <div className="card p-4 mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <SelectInput label="Organization" placeholder="All" value={orgFilter}
              onChange={e => setOrgFilter(e.target.value)}
              options={organizations.map(o => ({ value:o.name, label:o.name }))} />
          </div>
          <div className="flex-1 min-w-48">
            <TextInput label="Contact" placeholder="Contact name, phone number"
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={handleQuery}>Query</button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search contacts..."
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
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
        title={modal === 'add' ? 'Add Alarm Contact' : 'Edit Alarm Contact'}
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
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Full Name" required placeholder="e.g. Huzaifa Ahmed"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <SelectInput label="Organization" required placeholder="Select organization"
              value={form.org} onChange={e => setForm(f => ({ ...f, org: e.target.value }))}
              options={organizations.map(o => ({ value: o.name, label: o.name }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Mobile Phone" placeholder="+92-300-0000000"
              value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <TextInput label="WhatsApp Number" placeholder="+92-300-0000000"
              value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
          </div>
          <TextInput label="Email Address" type="email" placeholder="contact@example.com"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <SelectInput label="Add People" value={form.addPeople}
            onChange={e => setForm(f => ({ ...f, addPeople: e.target.value }))}
            options={['App-Admin', 'Org-Admin', 'User']} />
          <TextareaInput label="Remark" placeholder="e.g. Primary on-call contact"
            value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
