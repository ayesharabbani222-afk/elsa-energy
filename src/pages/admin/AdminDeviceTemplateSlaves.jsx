import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput, ToggleInput } from '../../components/ui/FormFields'
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import { deviceTemplates } from '../../data/dummy'
import { loadSlaves, saveSlaves, PROTOCOL_OPTIONS } from '../../data/slaveVariables'
import VariablesModal from '../../components/admin/VariablesModal'

const blankSlave = { name: '', protocol: 'Modbus RTU', isDefault: false }

export default function AdminDeviceTemplateSlaves() {
  const { templateId } = useParams()
  const navigate = useNavigate()

  const template = deviceTemplates.find(t => String(t.id) === String(templateId))

  const [slaves, setSlaves] = useState(() => loadSlaves(templateId, template))

  useEffect(() => {
    saveSlaves(templateId, slaves)
  }, [templateId, slaves])

  const [modal, setModal]       = useState(null) // 'add' | 'edit' | 'variables'
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(blankSlave)
  const [selectedIds, setSelectedIds] = useState([])

  const openAdd  = () => { setForm(blankSlave); setModal('add') }
  const openEdit = (row) => { setSelected(row); setForm({ name: row.name, protocol: row.protocol, isDefault: row.isDefault }); setModal('edit') }
  const openVariables = (row) => { setSelected(row); setModal('variables') }
  const close    = () => { setModal(null); setSelected(null) }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (modal === 'add') {
      const newSlave = {
        id: Date.now(),
        name: form.name,
        protocol: form.protocol,
        isDefault: form.isDefault || slaves.length === 0,
        variables: [],
      }
      setSlaves(prev => {
        const next = form.isDefault ? prev.map(s => ({ ...s, isDefault: false })) : prev
        return [...next, newSlave]
      })
    } else {
      setSlaves(prev => prev.map(s => {
        if (s.id !== selected.id) return form.isDefault ? { ...s, isDefault: false } : s
        return { ...s, name: form.name, protocol: form.protocol, isDefault: form.isDefault }
      }))
    }
    close()
  }

  const handleDelete = (row) => {
    if (confirm(`Delete slave "${row.name}"?`)) {
      setSlaves(prev => prev.filter(s => s.id !== row.id))
      setSelectedIds(prev => prev.filter(id => id !== row.id))
    }
  }

  const handleBatchDelete = () => {
    if (!selectedIds.length) return
    if (confirm(`Delete ${selectedIds.length} selected slave(s)?`)) {
      setSlaves(prev => prev.filter(s => !selectedIds.includes(s.id)))
      setSelectedIds([])
    }
  }

  const setDefaultSlave = (row) => {
    setSlaves(prev => prev.map(s => ({ ...s, isDefault: s.id === row.id })))
  }

  const handleVariablesUpdate = (slaveId, nextVariables) => {
    setSlaves(prev => prev.map(s => (s.id === slaveId ? { ...s, variables: nextVariables } : s)))
    setSelected(prev => (prev && prev.id === slaveId ? { ...prev, variables: nextVariables } : prev))
  }

  const columns = [
    { key: 'name',     label: 'Slave Name' },
    { key: 'protocol', label: 'Protocols & Drivers' },
    {
      key: 'variables', label: 'No Of Variables', sortable: false,
      render: (_v, row) => row.variables.length,
    },
    {
      key: 'isDefault', label: 'Default', sortable: false,
      render: (v, row) => (
        <button
          type="button"
          onClick={() => setDefaultSlave(row)}
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${v ? 'border-info-600' : 'border-surface-300 dark:border-surface-700'}`}
          title={v ? 'Default slave' : 'Set as default'}
        >
          {v && <span className="w-2 h-2 rounded-full bg-info-600" />}
        </button>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Device Template Slave</h2>
          <p className="breadcrumb">{template?.name || 'Template'} &ndash; Slave List</p>
          <p className="text-xs text-surface-400 mt-0.5">Acquisition Methods &ndash; {template?.method || '—'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Slave</button>
          <button className="btn-secondary" onClick={() => navigate('/admin/device-templates')}>
            <ArrowLeft size={14} /> Back to Templates
          </button>
          <button className="btn-secondary" onClick={handleBatchDelete}>Batch Delete</button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={slaves}
        searchPlaceholder="Search slaves..."
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        actions={(row) => (
          <>
            <button className="btn-ghost p-1.5" onClick={() => openEdit(row)} title="Edit"><Pencil size={14} /></button>
            <button className="btn-ghost p-1.5 text-info-600 font-bold" onClick={() => openVariables(row)} title="Variables">V</button>
            <button className="btn-danger p-1.5" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={14} /></button>
          </>
        )}
      />

      {/* Add / Edit Slave */}
      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={close}
        title={modal === 'add' ? 'Add Slave' : 'Edit Slave'}
        footer={
          <>
            <button className="btn-secondary" onClick={close}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>{modal === 'add' ? 'Create' : 'Save Changes'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <TextInput label="Slave Name" required placeholder="e.g. EVBCharger"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <SelectInput label="Protocols & Drivers"
            value={form.protocol} onChange={e => setForm(f => ({ ...f, protocol: e.target.value }))}
            options={PROTOCOL_OPTIONS} />
          <ToggleInput label="Default Slave" description="Use this slave's variables on the device main page"
            checked={form.isDefault} onChange={v => setForm(f => ({ ...f, isDefault: v }))} />
        </div>
      </Modal>

      {/* Variables modal */}
      {modal === 'variables' && selected && (
        <VariablesModal
          slave={selected}
          onClose={close}
          onUpdate={(next) => handleVariablesUpdate(selected.id, next)}
        />
      )}
    </div>
  )
}
