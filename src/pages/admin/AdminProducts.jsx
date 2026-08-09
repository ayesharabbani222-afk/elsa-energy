import { useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput, TextareaInput } from '../../components/ui/FormFields'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { products as initialData } from '../../data/dummy'

const blank = { name: '', description: '', price: '', status: 'Active' }

export default function AdminProducts() {
  const [data, setData]         = useState(initialData)
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(blank)

  const openAdd  = () => { setForm(blank); setModal('add') }
  const openEdit = (row) => { setSelected(row); setForm({ name: row.name, description: row.description, price: row.price, status: row.status }); setModal('edit') }
  const close    = () => { setModal(null); setSelected(null) }

  const handleSave = () => {
    if (modal === 'add') {
      setData(d => [...d, { id: Date.now(), ...form }])
    } else {
      setData(d => d.map(r => r.id === selected.id ? { ...r, ...form } : r))
    }
    close()
  }

  const handleDelete = (row) => {
    if (confirm(`Delete product "${row.name}"?`)) setData(d => d.filter(r => r.id !== row.id))
  }

  const columns = [
    { key: 'name',        label: 'Product Name' },
    { key: 'price',       label: 'Price', render: v => <span className="font-mono text-xs text-primary-600">{v}</span> },
    {
      key: 'image', label: 'Product Image', sortable: false,
      render: () => (
        <div className="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-950 flex items-center justify-center text-surface-400 border border-surface-200 dark:border-surface-800">
          <Package size={20} />
        </div>
      ),
    },
    { key: 'description', label: 'Description', render: v => <span className="text-xs text-surface-500 line-clamp-2 max-w-md block">{v}</span> },
    { key: 'status',      label: 'Status', render: v => <span className={`badge ${v === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{v}</span> },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Products</h2>
          <p className="breadcrumb">Manage Products &ndash; List</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Product</button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search products..."
        actions={(row) => (
          <>
            <button className="btn-ghost p-1.5" onClick={() => openEdit(row)} title="Edit"><Pencil size={14} /></button>
            <button className="btn-danger p-1.5" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={14} /></button>
          </>
        )}
      />

      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={close}
        title={modal === 'add' ? 'Add Product' : 'Edit Product'}
        footer={
          <>
            <button className="btn-secondary" onClick={close}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>{modal === 'add' ? 'Create' : 'Save Changes'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <TextInput label="Product Name" required placeholder="e.g. M100"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <TextareaInput label="Description" placeholder="Product description..."
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <TextInput label="Price" placeholder="e.g. 35000"
            value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          <div>
            <label className="label">Product Image</label>
            <input type="file" accept="image/*"
              className="w-full text-sm text-surface-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer" />
          </div>
          <SelectInput label="Status" value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            options={['Active', 'Inactive']} />
        </div>
      </Modal>
    </div>
  )
}
