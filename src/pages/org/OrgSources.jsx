import { useState, useMemo, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Zap, Plus, Edit2, Trash2, Wifi } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput, TextareaInput, ToggleInput } from '../../components/ui/FormFields'
import { metaForSourceType } from '../../components/ui/PowerFlowMindMap'
import { useSources } from '../../context/SourceContext'
import { useAuth } from '../../context/AuthContext'
import { gateways as gatewaysData } from '../../data/dummy'

const SOURCE_TYPES = ['Grid', 'Solar', 'Generator', 'Battery', 'Other']

const EMPTY_FORM = { name: '', type: '', capacity: '', gateway: '', description: '', active: true }
const EMPTY_ERRORS = { name: '', type: '', capacity: '', gateway: '' }

function loadGateways() {
  try {
    const saved = localStorage.getItem('cf-ems-gateways')
    return saved ? JSON.parse(saved) : gatewaysData
  } catch {
    return gatewaysData
  }
}

export default function OrgSources() {
  const { user } = useAuth()
  const orgName = user?.name || 'Ambition'
  const { getSourcesForOrg, createSource, updateSource, deleteSource } = useSources()

  const [allGateways] = useState(loadGateways)
  const orgGateways = useMemo(() => allGateways.filter(g => g.org === orgName), [allGateways, orgName])
  const sourceList = getSourcesForOrg(orgName)

  const [modalMode, setModalMode] = useState(null) // 'create' | 'edit' | null
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState(EMPTY_ERRORS)

  const location = useLocation()

  // Deep-link support: the "Edit source" button on the Organization Dashboard
  // mind map navigates here with state to open this exact modal directly.
  useEffect(() => {
    if (location.state?.editId == null) return
    const row = sourceList.find(s => s.id === location.state.editId)
    if (row) openEdit(row)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  function openCreate() {
    setForm(EMPTY_FORM)
    setErrors(EMPTY_ERRORS)
    setModalMode('create')
  }

  function openEdit(row) {
    setForm({
      name: row.name,
      type: row.type,
      capacity: String(row.capacity),
      gateway: row.gateway || '',
      description: row.description || '',
      active: row.status !== 'Inactive',
    })
    setErrors(EMPTY_ERRORS)
    setEditId(row.id)
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setEditId(null)
    setForm(EMPTY_FORM)
    setErrors(EMPTY_ERRORS)
  }

  function validateForm() {
    const next = { ...EMPTY_ERRORS }
    if (!form.name.trim()) next.name = 'Source name is required.'
    if (!form.type) next.type = 'Please select a source type.'
    const capNum = parseFloat(form.capacity)
    if (form.capacity === '' || isNaN(capNum) || capNum <= 0) {
      next.capacity = 'Enter a rated capacity greater than 0 kW.'
    }
    if (!form.gateway) next.gateway = 'Please select a gateway.'
    setErrors(next)
    return !next.name && !next.type && !next.capacity && !next.gateway
  }

  function handleSave() {
    if (!validateForm()) return
    const payload = {
      name: form.name.trim(),
      type: form.type,
      capacity: parseFloat(form.capacity),
      gateway: form.gateway,
      description: form.description.trim(),
      status: form.active ? 'Active' : 'Inactive',
    }
    if (modalMode === 'create') {
      createSource({ ...payload, org: orgName, createdBy: 'org' })
    } else {
      // Editing the capacity by hand here is an explicit manual override,
      // same as editing the value inline on the dashboard mind map.
      updateSource(editId, { ...payload, overridden: true })
    }
    closeModal()
  }

  function handleDelete() {
    deleteSource(deleteId)
    setDeleteId(null)
  }

  const deleteTarget = sourceList.find(s => s.id === deleteId)

  const columns = [
    {
      key: 'name',
      label: 'Source Name',
      sortable: true,
      render: (v, row) => {
        const { Icon } = metaForSourceType(row.type)
        return (
          <span className="flex items-center gap-2">
            <Icon size={13} className="text-surface-400 flex-shrink-0" />
            <span className="font-semibold">{v}</span>
          </span>
        )
      },
    },
    {
      key: 'type',
      label: 'Type',
      render: (v) => <span className="badge badge-info">{v}</span>,
    },
    {
      key: 'capacity',
      label: 'Rated Capacity',
      render: (v) => <span className="text-xs font-bold text-surface-700 dark:text-surface-200">{Number(v).toFixed(1)} kW</span>,
    },
    {
      key: 'gateway',
      label: 'Gateway',
      render: (v) => v
        ? <span className="badge badge-neutral flex items-center gap-1 w-fit"><Wifi size={10} /> {v}</span>
        : <span className="text-xs text-surface-400">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <span className={`badge ${v === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{v}</span>,
    },
    { key: 'createdAt', label: 'Created At', sortable: true },
  ]

  const actions = (row) => (
    <>
      <button type="button" onClick={() => openEdit(row)} className="btn-ghost text-xs py-1 px-2 flex items-center gap-1">
        <Edit2 size={11} /> Edit
      </button>
      <button type="button" onClick={() => setDeleteId(row.id)} className="btn-ghost text-xs py-1 px-2 text-danger-600 hover:bg-danger-50 flex items-center gap-1">
        <Trash2 size={11} /> Delete
      </button>
    </>
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 dark:bg-primary-950/30 rounded-xl">
            <Zap size={20} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-surface-900 dark:text-surface-100 tracking-tight">
              Sources
            </h1>
            <p className="text-xs text-surface-400 mt-0.5">
              Manage the energy sources feeding <span className="font-bold text-surface-600">{orgName}</span> — Grid, Solar, Generator, Battery, or any custom source. These automatically appear on the{' '}
              <Link to="/org" className="text-primary-600 font-bold hover:underline">Organization Dashboard</Link> mind map.
            </p>
          </div>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 flex-shrink-0">
          <Plus size={13} /> Add Source
        </button>
      </div>

      {/* Sources table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={sourceList}
          searchable
          searchPlaceholder="Search sources..."
          pageSize={10}
          actions={actions}
          emptyMessage="No sources yet. Add Grid, Solar, Generator, Battery, or a custom source."
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalMode !== null}
        onClose={closeModal}
        size="md"
        title={modalMode === 'create' ? 'Add Source' : 'Edit Source'}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeModal} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
            <button type="button" onClick={handleSave} className="btn-primary text-xs py-1.5 px-3">
              {modalMode === 'create' ? 'Create Source' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Source Name" required
              placeholder="e.g. Grid, Solar Array 1, Diesel Generator"
              value={form.name}
              error={errors.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })) }}
            />
            <SelectInput
              label="Source Type" required placeholder="Select type"
              value={form.type}
              error={errors.type}
              options={SOURCE_TYPES}
              onChange={e => { setForm(f => ({ ...f, type: e.target.value })); setErrors(er => ({ ...er, type: '' })) }}
            />
          </div>

          <TextInput
            label="Rated Capacity (kW)" required type="number" step="0.1" min="0"
            placeholder="e.g. 50"
            value={form.capacity}
            error={errors.capacity}
            onChange={e => { setForm(f => ({ ...f, capacity: e.target.value })); setErrors(er => ({ ...er, capacity: '' })) }}
          />

          <SelectInput
            label="Gateway" required
            placeholder={orgGateways.length ? 'Select a gateway' : `No gateways found for ${orgName}`}
            value={form.gateway}
            error={errors.gateway}
            onChange={e => { setForm(f => ({ ...f, gateway: e.target.value })); setErrors(er => ({ ...er, gateway: '' })) }}
            options={orgGateways.map(g => ({ value: g.name, label: `${g.name}${g.status === 'Offline' ? ' (Offline)' : ''}` }))}
          />

          <TextareaInput
            label="Description (optional)"
            placeholder="e.g. Rooftop solar array feeding the main panel"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />

          <ToggleInput
            label="Active"
            checked={form.active}
            onChange={v => setForm(f => ({ ...f, active: v }))}
            description="Active sources appear on the Organization Dashboard mind map"
          />
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        size="sm"
        variant="danger"
        title="Delete Source"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteId(null)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
            <button type="button" onClick={handleDelete} className="btn-danger text-xs py-1.5 px-3">Delete</button>
          </div>
        }
      >
        <p className="text-sm text-surface-700 dark:text-surface-300">
          Are you sure you want to delete <span className="font-bold">"{deleteTarget?.name}"</span>? This will remove it from the Organization Dashboard mind map. This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
