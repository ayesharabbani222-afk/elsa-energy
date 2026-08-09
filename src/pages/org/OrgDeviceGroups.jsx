import { useState, useMemo, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Boxes, Plus, Edit2, Trash2, Cpu, Users, Wifi, UserPlus } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { useDeviceGroups } from '../../context/DeviceGroupContext'
import { useAuth } from '../../context/AuthContext'
import { devices as devicesData, users as usersData, gateways as gatewaysData } from '../../data/dummy'

const EMPTY_FORM = { name: '', description: '', gateway: '', deviceIds: [], userIds: [] }
const EMPTY_ERRORS = { name: '', gateway: '', deviceIds: '', userIds: '' }
const DRAFT_KEY = 'cf-ems-devicegroup-draft'

function saveDraft(mode, editId, form) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ mode, editId, form }))
  } catch { /* ignore */ }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch { /* ignore */ }
}

function loadDevices() {
  try {
    const saved = localStorage.getItem('cf-ems-devices')
    return saved ? JSON.parse(saved) : devicesData
  } catch {
    return devicesData
  }
}

function loadUsers() {
  try {
    const saved = localStorage.getItem('cf-ems-users')
    return saved ? JSON.parse(saved) : usersData
  } catch {
    return usersData
  }
}

function loadGateways() {
  try {
    const saved = localStorage.getItem('cf-ems-gateways')
    return saved ? JSON.parse(saved) : gatewaysData
  } catch {
    return gatewaysData
  }
}

export default function OrgDeviceGroups() {
  const { user } = useAuth()
  const orgName = user?.name || 'Ambition'
  const { getDeviceGroupsForOrg, createDeviceGroup, updateDeviceGroup, deleteDeviceGroup } = useDeviceGroups()

  const [allDevices]  = useState(loadDevices)
  const [allUsers]    = useState(loadUsers)
  const [allGateways] = useState(loadGateways)

  const orgDevices  = useMemo(() => allDevices.filter(d => d.org === orgName), [allDevices, orgName])
  const orgUsers    = useMemo(() => allUsers.filter(u => u.org === orgName), [allUsers, orgName])
  const orgGateways = useMemo(() => allGateways.filter(g => g.org === orgName), [allGateways, orgName])
  const groups = useMemo(() => getDeviceGroupsForOrg(orgName), [getDeviceGroupsForOrg, orgName])

  const [modalMode, setModalMode] = useState(null) // 'create' | 'edit' | null
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState(EMPTY_ERRORS)

  const location = useLocation()

  // Deep-link support: cards on the Organization Dashboard flow chart can
  // navigate here with state to open the Edit or Delete flow directly,
  // reusing this page's existing modals — no new UI is created.
  useEffect(() => {
    if (!location.state) return
    if (location.state.editId != null) {
      const row = groups.find(g => g.id === location.state.editId)
      if (row) openEdit(row)
    } else if (location.state.deleteId != null) {
      const row = groups.find(g => g.id === location.state.deleteId)
      if (row) setDeleteId(row.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, groups])

  // Resume an in-progress "Create/Edit Device Group" draft after the user
  // was sent to the Devices or Users page to add a missing device/user.
  useEffect(() => {
    if (location.state?.editId != null || location.state?.deleteId != null) return
    const draft = loadDraft()
    if (!draft) return
    setForm(draft.form)
    setErrors(EMPTY_ERRORS)
    setEditId(draft.editId ?? null)
    setModalMode(draft.mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setForm(EMPTY_FORM)
    setErrors(EMPTY_ERRORS)
    setModalMode('create')
  }

  function openEdit(row) {
    setForm({
      name: row.name,
      description: row.description || '',
      gateway: row.gateway || '',
      deviceIds: [...row.deviceIds],
      userIds: [...(row.userIds || [])],
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
    clearDraft()
  }

  // Called right before navigating away to the Devices/Users page, so the
  // in-progress Device Group form is restored when the user comes back.
  function goAddDevice() {
    saveDraft(modalMode, editId, form)
  }

  function goAddUser() {
    saveDraft(modalMode, editId, form)
  }

  function validateForm() {
    const next = { ...EMPTY_ERRORS }
    if (!form.name.trim()) next.name = 'Group name is required.'
    if (!form.gateway) next.gateway = 'Please select a gateway.'
    if (form.deviceIds.length === 0) next.deviceIds = 'Select at least one device.'
    if (form.userIds.length === 0) next.userIds = 'Select at least one user.'
    setErrors(next)
    return !next.name && !next.gateway && !next.deviceIds && !next.userIds
  }

  function handleSave() {
    if (!validateForm()) return
    if (modalMode === 'create') {
      createDeviceGroup({
        name: form.name.trim(),
        description: form.description.trim(),
        gateway: form.gateway,
        org: orgName,
        deviceIds: form.deviceIds,
        userIds: form.userIds,
        createdBy: 'org',
      })
    } else {
      updateDeviceGroup(editId, {
        name: form.name.trim(),
        description: form.description.trim(),
        gateway: form.gateway,
        deviceIds: form.deviceIds,
        userIds: form.userIds,
      })
    }
    closeModal()
  }

  function handleDelete() {
    deleteDeviceGroup(deleteId)
    setDeleteId(null)
  }

  function toggleDevice(id) {
    setForm(prev => ({
      ...prev,
      deviceIds: prev.deviceIds.includes(id)
        ? prev.deviceIds.filter(x => x !== id)
        : [...prev.deviceIds, id],
    }))
    setErrors(prev => ({ ...prev, deviceIds: '' }))
  }

  function toggleUser(id) {
    setForm(prev => ({
      ...prev,
      userIds: prev.userIds.includes(id)
        ? prev.userIds.filter(x => x !== id)
        : [...prev.userIds, id],
    }))
    setErrors(prev => ({ ...prev, userIds: '' }))
  }

  const deleteTarget = groups.find(g => g.id === deleteId)

  const columns = [
    { key: 'name', label: 'Group Name', sortable: true },
    {
      key: 'description',
      label: 'Description',
      render: (v) => <span className="text-xs text-surface-400">{v || '—'}</span>,
    },
    {
      key: 'gateway',
      label: 'Gateway',
      render: (v) => v
        ? <span className="badge badge-neutral flex items-center gap-1 w-fit"><Wifi size={10} /> {v}</span>
        : <span className="text-xs text-surface-400">—</span>,
    },
    {
      key: 'deviceIds',
      label: 'Devices',
      render: (ids) => (
        <span className="badge badge-neutral">{ids.length} device{ids.length !== 1 ? 's' : ''}</span>
      ),
    },
    {
      key: 'userIds',
      label: 'Users',
      render: (ids = []) => (
        <span className="badge badge-info">{ids.length} user{ids.length !== 1 ? 's' : ''}</span>
      ),
    },
    { key: 'createdAt', label: 'Created At', sortable: true },
  ]

  const actions = (row) => (
    <>
      <button
        type="button"
        onClick={() => openEdit(row)}
        className="btn-ghost text-xs py-1 px-2 flex items-center gap-1"
      >
        <Edit2 size={11} /> Edit
      </button>
      <button
        type="button"
        onClick={() => setDeleteId(row.id)}
        className="btn-ghost text-xs py-1 px-2 text-danger-600 hover:bg-danger-50 flex items-center gap-1"
      >
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
            <Boxes size={20} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-surface-900 dark:text-surface-100 tracking-tight">
              Device Groups
            </h1>
            <p className="text-xs text-surface-400 mt-0.5">
              Group related devices together under <span className="font-bold text-surface-600">{orgName}</span> — e.g. all washing machines, all boilers, or any custom set you need
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 flex-shrink-0"
        >
          <Plus size={13} /> Create Group
        </button>
      </div>

      {/* Groups table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={groups}
          searchable
          searchPlaceholder="Search device groups..."
          pageSize={10}
          actions={actions}
          emptyMessage="No device groups yet. Create one to organize devices like 'Washing Area' or 'Boilers'."
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalMode !== null}
        onClose={closeModal}
        size="md"
        title={modalMode === 'create' ? 'Create Device Group' : 'Edit Device Group'}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeModal} className="btn-secondary text-xs py-1.5 px-3">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary text-xs py-1.5 px-3"
            >
              {modalMode === 'create' ? 'Create Group' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Group name — fully free-form, e.g. "Washing Area", "Boilers", "G1", "G2" */}
          <div>
            <label className="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1.5">
              Group Name <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              className={`input text-sm w-full ${errors.name ? 'border-danger-600 ring-2 ring-danger-600/20' : ''}`}
              placeholder="e.g. Washing Area, Boilers, G1..."
              value={form.name}
              onChange={e => {
                setForm(prev => ({ ...prev, name: e.target.value }))
                setErrors(prev => ({ ...prev, name: '' }))
              }}
            />
            {errors.name && (
              <p className="text-xs text-danger-600 flex items-center gap-1 mt-1">
                <span className="text-[10px]">⚠</span> {errors.name}
              </p>
            )}
          </div>

          {/* Gateway — required */}
          <div>
            <label className="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1.5">
              Gateway <span className="text-danger-500">*</span>
            </label>
            {orgGateways.length === 0 ? (
              <p className="text-xs text-surface-400 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                No gateways found for {orgName}.
              </p>
            ) : (
              <select
                className={`select text-sm w-full ${errors.gateway ? 'border-danger-600 ring-2 ring-danger-600/20' : ''}`}
                value={form.gateway}
                onChange={e => {
                  setForm(prev => ({ ...prev, gateway: e.target.value }))
                  setErrors(prev => ({ ...prev, gateway: '' }))
                }}
              >
                <option value="">Select a gateway...</option>
                {orgGateways.map(g => (
                  <option key={g.id} value={g.name}>
                    {g.name} {g.status === 'Offline' ? '(Offline)' : ''}
                  </option>
                ))}
              </select>
            )}
            {errors.gateway && (
              <p className="text-xs text-danger-600 flex items-center gap-1 mt-1">
                <span className="text-[10px]">⚠</span> {errors.gateway}
              </p>
            )}
          </div>

          {/* Optional description */}
          <div>
            <label className="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1.5">
              Description <span className="text-surface-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              className="input text-sm w-full"
              placeholder="e.g. All washing machines on ground floor"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Device selection */}
          <div>
            <label className="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1.5">
              Add Devices to this Group <span className="text-danger-500">*</span>
              <span className="ml-1 text-surface-400 font-normal">
                ({form.deviceIds.length} of {orgDevices.length} selected)
              </span>
            </label>
            {orgDevices.length === 0 ? (
              <div className={`text-xs p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg space-y-2 ${errors.deviceIds ? 'border border-danger-600' : ''}`}>
                <p className="text-surface-400">No devices found for {orgName}.</p>
                <Link
                  to="/org/devices"
                  onClick={goAddDevice}
                  className="inline-flex items-center gap-1.5 text-primary-600 font-bold hover:underline"
                >
                  <Plus size={12} /> Add Device
                </Link>
                <p className="text-surface-400">You'll come right back here to finish this group.</p>
              </div>
            ) : (
              <div className={`border rounded-xl overflow-hidden divide-y divide-surface-100 dark:divide-surface-800 max-h-64 overflow-y-auto ${errors.deviceIds ? 'border-danger-600 ring-2 ring-danger-600/20' : 'border-surface-200 dark:border-surface-700'}`}>
                {orgDevices.map(d => (
                  <label
                    key={d.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      checked={form.deviceIds.includes(d.id)}
                      onChange={() => toggleDevice(d.id)}
                    />
                    <Cpu size={13} className="text-surface-400 flex-shrink-0" />
                    <span className="text-sm text-surface-800 dark:text-surface-200 flex-1">{d.name}</span>
                    <span className={`badge text-[9px] flex-shrink-0 ${d.status === 'Online' ? 'badge-success' : 'badge-neutral'}`}>
                      {d.status}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {errors.deviceIds && (
              <p className="text-xs text-danger-600 flex items-center gap-1 mt-1">
                <span className="text-[10px]">⚠</span> {errors.deviceIds}
              </p>
            )}
            {orgDevices.length > 0 && (
              <Link
                to="/org/devices"
                onClick={goAddDevice}
                className="inline-flex items-center gap-1.5 text-xs text-primary-600 font-bold hover:underline mt-1.5"
              >
                <Plus size={11} /> Don't see the device you need? Add a new one
              </Link>
            )}
          </div>

          {/* User selection */}
          <div>
            <label className="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1.5">
              Add Users to this Group <span className="text-danger-500">*</span>
              <span className="ml-1 text-surface-400 font-normal">
                ({form.userIds.length} of {orgUsers.length} selected)
              </span>
            </label>
            {orgUsers.length === 0 ? (
              <div className={`text-xs p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg space-y-2 ${errors.userIds ? 'border border-danger-600' : ''}`}>
                <p className="text-surface-400">No users found for {orgName}.</p>
                <Link
                  to="/org/users"
                  onClick={goAddUser}
                  className="inline-flex items-center gap-1.5 text-primary-600 font-bold hover:underline"
                >
                  <UserPlus size={12} /> Add User
                </Link>
                <p className="text-surface-400">You'll come right back here to finish this group.</p>
              </div>
            ) : (
              <div className={`border rounded-xl overflow-hidden divide-y divide-surface-100 dark:divide-surface-800 max-h-56 overflow-y-auto ${errors.userIds ? 'border-danger-600 ring-2 ring-danger-600/20' : 'border-surface-200 dark:border-surface-700'}`}>
                {orgUsers.map(u => (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      checked={form.userIds.includes(u.id)}
                      onChange={() => toggleUser(u.id)}
                    />
                    <Users size={13} className="text-surface-400 flex-shrink-0" />
                    <span className="text-sm text-surface-800 dark:text-surface-200 flex-1">{u.name}</span>
                    <span className="text-[10px] text-surface-400 flex-shrink-0">{u.role}</span>
                  </label>
                ))}
              </div>
            )}
            {errors.userIds && (
              <p className="text-xs text-danger-600 flex items-center gap-1 mt-1">
                <span className="text-[10px]">⚠</span> {errors.userIds}
              </p>
            )}
            {orgUsers.length > 0 && (
              <Link
                to="/org/users"
                onClick={goAddUser}
                className="inline-flex items-center gap-1.5 text-xs text-primary-600 font-bold hover:underline mt-1.5"
              >
                <Plus size={11} /> Don't see the user you need? Add a new one
              </Link>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        size="sm"
        variant="danger"
        title="Delete Device Group"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteId(null)} className="btn-secondary text-xs py-1.5 px-3">
              Cancel
            </button>
            <button type="button" onClick={handleDelete} className="btn-danger text-xs py-1.5 px-3">
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-surface-700 dark:text-surface-300">
          Are you sure you want to delete{' '}
          <span className="font-bold">"{deleteTarget?.name}"</span>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
