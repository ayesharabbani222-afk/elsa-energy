import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput } from '../../components/ui/FormFields'
import { Plus, Pencil, Trash2, LogIn } from 'lucide-react'
import { users as initialData } from '../../data/dummy'
import { useAuth, ROLES } from '../../context/AuthContext'

const EMPTY_FORM = { name: '', email: '', phone: '', role: 'Customer', status: 'Active' }

export default function OrgUsers() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const orgName = user?.name || 'Ambition'

  const [allUsers, setAllUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('cf-ems-users')
      return saved ? JSON.parse(saved) : initialData
    } catch {
      return initialData
    }
  })

  useEffect(() => {
    localStorage.setItem('cf-ems-users', JSON.stringify(allUsers))
  }, [allUsers])

  // Only this organization's users are shown/managed here
  const orgUsers = useMemo(() => allUsers.filter(u => u.org === orgName), [allUsers, orgName])

  const [modal, setModal]       = useState(null) // 'add' | 'edit' | null
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)

  const openAdd  = () => { setForm(EMPTY_FORM); setModal('add') }
  const openEdit = (row) => {
    setSelected(row)
    setForm({ name: row.name, email: row.email, phone: row.phone, role: row.role, status: row.status })
    setModal('edit')
  }
  const close = () => { setModal(null); setSelected(null) }

  // Reuses the same "login as user" mechanism as the Admin Users page —
  // switches the session into that user's dashboard.
  const handleLoginAsUser = (row) => {
    login(ROLES.USER, { name: row.name, email: row.email })
    navigate('/user')
  }

  const handleSave = () => {
    if (modal === 'add') {
      setAllUsers(d => [...d, { id: Date.now(), org: orgName, ...form, createdAt: new Date().toISOString().slice(0, 10) }])
    } else {
      setAllUsers(d => d.map(r => r.id === selected.id ? { ...r, ...form } : r))
    }
    close()
  }

  const handleDelete = (row) => {
    if (confirm(`Delete user "${row.name}"?`)) setAllUsers(d => d.filter(r => r.id !== row.id))
  }

  const columns = [
    { key: 'name',  label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'role',  label: 'Role', render: v => <span className="badge badge-info">{v}</span> },
    { key: 'status', label: 'Status', render: v => <span className={`badge ${v === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{v}</span> },
    { key: 'createdAt', label: 'Creation Time' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Users</h2>
          <p className="breadcrumb">Organization / Users</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add User
        </button>
      </div>

      <DataTable
        columns={columns}
        data={orgUsers}
        searchPlaceholder="Search users..."
        emptyMessage={`No users yet for ${orgName}. Add one to get started.`}
        actions={(row) => (
          <>
            <button className="btn-ghost p-1.5" onClick={() => openEdit(row)} title="Edit"><Pencil size={14} /></button>
            <button className="btn-danger p-1.5" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={14} /></button>
            <button
              className="btn-ghost p-1.5 text-primary-600 hover:text-primary-300"
              onClick={() => handleLoginAsUser(row)}
              title="Go to User Dashboard"
            >
              <LogIn size={14} />
            </button>
          </>
        )}
      />

      {/* Note about Operations column */}
      <p className="text-xs text-surface-600 mt-3">
        <LogIn size={11} className="inline mr-1" />
        The <span className="text-primary-600">Go to User Dashboard</span> action opens that user's dashboard (Operations column).
      </p>

      {/* Add / Edit Modal */}
      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={close}
        title={modal === 'add' ? 'Add User' : 'Edit User'}
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
            <TextInput label="Full Name" required placeholder="e.g. Miss Maryam"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextInput label="Phone Number" placeholder="+92-300-0000000"
              value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <TextInput label="Email Address" required type="email" placeholder="user@example.com"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <SelectInput label="Role" value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              options={['Admin', 'Customer']} />
            <SelectInput label="Status" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={['Active', 'Inactive']} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
