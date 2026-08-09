import { useState } from 'react'
import { Eye, Pencil, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput } from '../../components/ui/FormFields'

const variableOptions = ['Voltage Phase A','Voltage Phase B','Voltage Phase C','Current Phase A','Current Phase B','Current Phase C','Active Power','Power Factor','Frequency']
const conditionOptions = ['>','<','=','>=','<=']

const blank = { name: '', org: 'Delicia Warehouse', template: '', variable: variableOptions[0], condition: '>', threshold: '', status: 'Active' }

export default function UserAlarmTemplate() {
  const [data, setData]         = useState([])
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(blank)

  const openAdd  = () => { setForm(blank); setModal('add') }
  const openEdit = (row) => { setSelected(row); setForm({ ...row }); setModal('edit') }
  const openView = (row) => { setSelected(row); setModal('view') }
  const close    = () => { setModal(null); setSelected(null) }

  const handleSave = () => {
    if (!form.name.trim()) return
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    if (modal === 'add') setData(d => [...d, { ...form, id: Date.now(), founder: 'Me', updatedAt: now }])
    else setData(d => d.map(r => r.id === selected.id ? { ...r, ...form, updatedAt: now } : r))
    close()
  }

  const handleDelete = (row) => {
    if (confirm(`Delete trigger "${row.name}"?`)) setData(d => d.filter(r => r.id !== row.id))
  }

  const toggle = (row) => {
    setData(d => d.map(r => r.id === row.id ? { ...r, status: r.status === 'Active' ? 'Inactive' : 'Active' } : r))
  }

  const columns = [
    { key: 'name',      label: 'Trigger Name' },
    { key: 'org',       label: 'Organization' },
    { key: 'template',  label: 'Template Name' },
    { key: 'founder',   label: 'Founder' },
    { key: 'updatedAt', label: 'Update Time' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Alarm Templates</h2>
          <p className="breadcrumb">Manage Alarm Templates &ndash; List</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Alarm Templates</button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search alarm templates..."
        emptyMessage="No data available in table"
        actions={(row) => (
          <>
            <button className="btn-ghost p-1.5" onClick={() => openView(row)} title="View"><Eye size={14} /></button>
            <button className="btn-ghost p-1.5" onClick={() => openEdit(row)} title="Edit"><Pencil size={14} /></button>
            <button className="btn-ghost p-1.5" onClick={() => toggle(row)} title="Toggle Status">
              {row.status === 'Active' ? <ToggleRight size={14} className="text-success-600" /> : <ToggleLeft size={14} className="text-surface-500" />}
            </button>
            <button className="btn-danger p-1.5" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={14} /></button>
          </>
        )}
      />

      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={close}
        title={modal === 'add' ? 'Add Alarm Template' : 'Edit Alarm Template'}
        footer={<>
          <button className="btn-secondary" onClick={close}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>{modal === 'add' ? 'Create' : 'Save Changes'}</button>
        </>}
      >
        <div className="space-y-4">
          <TextInput label="Trigger Name" required placeholder="e.g. Overvoltage"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <TextInput label="Template Name" placeholder="e.g. Main Wapda Template"
            value={form.template} onChange={e => setForm(f => ({ ...f, template: e.target.value }))} />
          <SelectInput label="Variable" value={form.variable}
            onChange={e => setForm(f => ({ ...f, variable: e.target.value }))}
            options={variableOptions} />
          <div className="grid grid-cols-2 gap-4">
            <SelectInput label="Condition" value={form.condition}
              onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
              options={conditionOptions} />
            <TextInput label="Threshold" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'view'} onClose={close} title="Alarm Template Details" size="sm">
        {selected && (
          <div className="space-y-3">
            {[
              ['Trigger Name',   selected.name],
              ['Organization',   selected.org],
              ['Template Name',  selected.template],
              ['Variable',       selected.variable],
              ['Condition',      selected.condition],
              ['Threshold',      selected.threshold],
              ['Founder',        selected.founder],
              ['Status',         selected.status],
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
