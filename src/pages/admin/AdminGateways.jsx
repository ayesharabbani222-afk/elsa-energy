import { useState, useEffect } from 'react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput } from '../../components/ui/FormFields'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { gateways as initialData, organizations } from '../../data/dummy'

export default function AdminGateways() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('cf-ems-gateways')
      return saved ? JSON.parse(saved) : initialData
    } catch {
      return initialData
    }
  })

  useEffect(() => {
    localStorage.setItem('cf-ems-gateways', JSON.stringify(data))
  }, [data])

  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState({ name:'', serial:'', model:'CF-G200', org:'', status:'Online' })
  const [selectedIds, setSelectedIds] = useState([])

  // Filters
  const [orgFilter, setOrgFilter]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modelFilter, setModelFilter]   = useState('')
  const [snQuery, setSnQuery]           = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ org:'', status:'', model:'', sn:'' })

  const openAdd  = () => { setForm({ name:'', serial:'', model:'CF-G200', org:'', status:'Online' }); setModal('add') }
  const openEdit = (row) => { setSelected(row); setForm({ name:row.name, serial:row.serial, model:row.model, org:row.org, status:row.status }); setModal('edit') }
  const openView = (row) => { setSelected(row); setModal('view') }
  const close    = () => { setModal(null); setSelected(null) }

  const handleSave = () => {
    if (modal === 'add') {
      setData(d => [...d, { id: Date.now(), devices:0, ...form }])
    } else {
      setData(d => d.map(r => r.id === selected.id ? { ...r, ...form } : r))
    }
    close()
  }

  const handleDelete = (row) => {
    if (confirm(`Delete gateway "${row.name}"?`)) setData(d => d.filter(r => r.id !== row.id))
  }

  const handleBatchDelete = () => {
    if (!selectedIds.length) return
    if (confirm(`Delete ${selectedIds.length} selected gateway(s)?`)) {
      setData(d => d.filter(r => !selectedIds.includes(r.id)))
      setSelectedIds([])
    }
  }

  const handleQuery = () => setAppliedFilters({ org: orgFilter, status: statusFilter, model: modelFilter, sn: snQuery })

  const filtered = data.filter(r =>
    (!appliedFilters.org || r.org === appliedFilters.org) &&
    (!appliedFilters.status || r.status === appliedFilters.status) &&
    (!appliedFilters.model || r.model === appliedFilters.model) &&
    (!appliedFilters.sn || r.serial.toLowerCase().includes(appliedFilters.sn.toLowerCase()) || r.name.toLowerCase().includes(appliedFilters.sn.toLowerCase()))
  )

  const totalCount   = data.length
  const onlineCount  = data.filter(d => d.status === 'Online').length
  const offlineCount = data.filter(d => d.status === 'Offline').length

  const columns = [
    { key:'status',  label:'Gateway Status', render: v => <span className={`badge ${v === 'Online' ? 'badge-success' : 'badge-neutral'}`}>{v}</span> },
    { key:'name',    label:'Gateway Name' },
    { key:'serial',  label:'Serial Number', render: v => <span className="font-mono text-xs text-surface-400">{v}</span> },
    { key:'model',   label:'Gateway Model' },
    { key:'devices', label:'No Of Associated Devices' },
    { key:'org',     label:'Organization' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Gateways</h2>
          <p className="breadcrumb">Manage Gateways &ndash; List</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add Gateway
          </button>
          <button className="btn-secondary" onClick={handleBatchDelete}>
            Batch Delete
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="card px-5 py-3 mb-5 flex items-center gap-4 text-xs">
        <span className="text-surface-600">Total Gateways <strong className="text-surface-900">{totalCount}</strong></span>
        <span className="text-surface-300">|</span>
        <span className="flex items-center gap-1.5 text-surface-600">
          <span className="w-2 h-2 rounded-full bg-success-600 inline-block" /> Online Gateway <strong className="text-surface-900">{onlineCount}</strong>
        </span>
        <span className="text-surface-300">|</span>
        <span className="flex items-center gap-1.5 text-surface-600">
          <span className="w-2 h-2 rounded-full bg-surface-400 inline-block" /> Offline Gateway <strong className="text-surface-900">{offlineCount}</strong>
        </span>
      </div>

      {/* Filter row */}
      <div className="card p-4 mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <SelectInput label="Organization" placeholder="All" value={orgFilter}
              onChange={e => setOrgFilter(e.target.value)}
              options={organizations.map(o => ({ value:o.name, label:o.name }))} />
          </div>
          <div className="w-44">
            <SelectInput label="Status" placeholder="All Status" value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={['Online', 'Offline', 'Upgrading', 'In Configuration', 'Gateway Alarms', 'Disabled']} />
          </div>
          <div className="w-36">
            <SelectInput label="Model" placeholder="All Models" value={modelFilter}
              onChange={e => setModelFilter(e.target.value)}
              options={['CF-G100', 'CF-G200', 'CF-G300']} />
          </div>
          <div className="flex-1 min-w-48">
            <TextInput label="Search" placeholder="Please Enter SN or gateway name"
              value={snQuery} onChange={e => setSnQuery(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={handleQuery}>Query</button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search gateways..."
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        actions={(row) => (
          <>
            <button className="btn-ghost p-1.5" onClick={() => openEdit(row)} title="Edit"><Pencil size={14} /></button>
            <button className="btn-ghost p-1.5" onClick={() => openView(row)} title="View"><Eye size={14} /></button>
            <button className="btn-danger p-1.5" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={14} /></button>
          </>
        )}
      />

      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={close}
        title={modal === 'add' ? 'Add Gateway' : 'Edit Gateway'}
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
            <TextInput label="Gateway Name" required placeholder="e.g. CF-GW-001"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextInput label="Serial Number" required placeholder="e.g. SN-10021"
              value={form.serial} onChange={e => setForm(f => ({ ...f, serial: e.target.value }))} />
          </div>
          <SelectInput label="Organization" required
            value={form.org} onChange={e => setForm(f => ({ ...f, org: e.target.value }))}
            placeholder="Select organization"
            options={organizations.map(o => ({ value: o.name, label: o.name }))} />
          <div className="grid grid-cols-2 gap-4">
            <SelectInput label="Model" value={form.model}
              onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
              options={['CF-G100', 'CF-G200', 'CF-G300']} />
            <SelectInput label="Status" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={['Online', 'Offline']} />
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'view'} onClose={close} title="Gateway Details">
        {selected && (
          <div className="space-y-3">
            {[
              ['Name',         selected.name],
              ['Serial',       selected.serial],
              ['Model',        selected.model],
              ['Organization', selected.org],
              ['Devices',      selected.devices],
              ['Status',       selected.status],
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
