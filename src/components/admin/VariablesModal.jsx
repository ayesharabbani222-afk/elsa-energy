import { useState, useMemo } from 'react'
import Modal from '../ui/Modal'
import { TextInput, SelectInput, CheckboxInput, RadioInput } from '../ui/FormFields'
import { Plus, Pencil, Trash2, Info, ChevronDown, ChevronUp } from 'lucide-react'
import {
  REGISTER_FUNCTIONS, DATA_FORMATS, NUMBER_FORMATS, READ_WRITE_OPTIONS,
  registerDisplayCode,
} from '../../data/slaveVariables'

const blankVariable = {
  id: null, number: 0, name: '', unit: '', icon: '', identifier: '',
  machineId: '', machineControl: '',
  lineChartColor: '#000000', lineChartLimit: '', lowLimitLineChart: '',
  peakTimeStart: '', peakTimeEnd: '', peakOffTimeStart: '', peakOffTimeEnd: '',
  peakTimeColor: '#00ff00', peakOffTimeColor: '#ff0000',
  variableType: 'Directly collected variables',
  registerFuncCode: REGISTER_FUNCTIONS[0], registerAddress: '',
  dataFormat: 'Unsigned Word', numberFormat: 'Integer', decimalPlacesPadding: false,
  storageVariable: false, storageTiming: false,
  readWrite: 'Read Only',
  acquisitionFormula: '', controlFormula: '',
  mainPageSelection: false, sort: '', defaultUnitSelection: false,
  slaves: [],
}

const ICON_OPTIONS = ['Voltage', 'Current', 'Power', 'Switch', 'Temperature', 'Energy', 'Alarm', 'Gauge']

export default function VariablesModal({ slave, onClose, onUpdate }) {
  const [variables, setVariables] = useState(slave.variables || [])
  const [nameQuery, setNameQuery]   = useState('')
  const [remoteSlave, setRemoteSlave] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')

  const [subModal, setSubModal] = useState(null) // 'addVariable' | 'addEquation' | 'import'
  const [editingVar, setEditingVar] = useState(null)

  const persist = (next) => {
    setVariables(next)
    onUpdate(next)
  }

  const filtered = useMemo(() => {
    if (!appliedQuery.trim()) return variables
    const q = appliedQuery.toLowerCase().trim()
    return variables.filter(v => v.name.toLowerCase().includes(q))
  }, [variables, appliedQuery])

  const handleQuery = () => setAppliedQuery(nameQuery)

  const openAddVariable = () => { setEditingVar({ ...blankVariable, id: `v${Date.now()}` }); setSubModal('addVariable') }
  const openAddEquation = () => { setEditingVar({ ...blankVariable, id: `v${Date.now()}`, variableType: 'Equation variables' }); setSubModal('addEquation') }
  const openEdit = (v) => { setEditingVar({ ...v }); setSubModal(v.variableType === 'Equation variables' ? 'addEquation' : 'addVariable') }
  const closeSub = () => { setSubModal(null); setEditingVar(null) }

  const handleSubmitVariable = () => {
    if (!editingVar.name.trim()) return
    const exists = variables.some(v => v.id === editingVar.id)
    let next
    if (exists) {
      next = variables.map(v => (v.id === editingVar.id ? editingVar : v))
    } else {
      const number = variables.length ? Math.max(...variables.map(v => v.number || 0)) + 1 : 1
      next = [...variables, { ...editingVar, number }]
    }
    persist(next)
    closeSub()
  }

  const handleDeleteVariable = (v) => {
    if (confirm(`Delete variable "${v.name}"?`)) {
      persist(variables.filter(x => x.id !== v.id))
    }
  }

  const handleToggleMainPage = (v) => {
    persist(variables.map(x => (x.id === v.id ? { ...x, mainPageSelection: !x.mainPageSelection } : x)))
  }

  const handleSetDefaultUnit = (v) => {
    persist(variables.map(x => ({ ...x, defaultUnitSelection: x.id === v.id })))
  }

  const handleSortChange = (v, value) => {
    setVariables(prev => prev.map(x => (x.id === v.id ? { ...x, sort: value } : x)))
  }
  const handleSortBlur = () => persist(variables)

  const handleSaveSortOrder = () => {
    const next = [...variables]
      .sort((a, b) => {
        const av = a.sort === '' || a.sort == null ? Infinity : Number(a.sort)
        const bv = b.sort === '' || b.sort == null ? Infinity : Number(b.sort)
        return av - bv
      })
      .map((v, i) => ({ ...v, sort: String(i + 1) }))
    persist(next)
    alert('Sort order saved successfully.')
  }

  const handleExportVariable = () => {
    const header = ['Number', 'Variable Name', 'Variable Type', 'Value Type', 'Register', 'Write & Read', 'Storage Mode']
    const rows = variables.map(v => [
      v.number, v.name, v.variableType, registerDisplayCode(v.dataFormat), v.registerAddress, v.readWrite,
      [v.storageVariable && 'Variable Storage', v.storageTiming && 'Timing Storage'].filter(Boolean).join('-'),
    ])
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${slave.name}-variables.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = () => {
    // Demo import: simply closes the dialog — no destructive/actual parsing is performed
    setSubModal(null)
  }

  return (
    <>
      <Modal open onClose={onClose} title="Variables" size="2xl">
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary" onClick={openAddVariable}><Plus size={14} /> Add Variable</button>
            <button className="btn-primary" onClick={openAddEquation}><Plus size={14} /> Add Equation</button>
            <button className="btn-primary" onClick={() => setSubModal('import')}>Import Variable</button>
            <button className="btn-secondary" onClick={handleExportVariable}>Export Variable</button>
            <button
              className="btn text-white bg-success-600 hover:bg-success-700 active:scale-95"
              onClick={handleSaveSortOrder}
            >
              Save Sort Order
            </button>

            <div className="flex-1 min-w-[10rem]" />

            <select
              className="select py-1.5 px-2 text-xs w-auto"
              value={remoteSlave}
              onChange={e => setRemoteSlave(e.target.value)}
            >
              <option value="">Select Remote Control Slave</option>
              <option value={slave.name}>{slave.name}</option>
            </select>
            <input
              type="text"
              className="input py-1.5 text-xs w-44"
              placeholder="Please Input variable name"
              value={nameQuery}
              onChange={e => setNameQuery(e.target.value)}
            />
            <button className="btn-primary" onClick={handleQuery}>Query</button>
          </div>

          {/* Variables table */}
          <div className="overflow-x-auto border border-surface-200 dark:border-surface-800 rounded-xl">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-16">Main Page Selection</th>
                  <th className="w-16">Sort</th>
                  <th className="w-20">Default Unit Selection</th>
                  <th className="w-14">Number</th>
                  <th>Variable Name</th>
                  <th>Variable Type</th>
                  <th>Value Type</th>
                  <th>Register</th>
                  <th>Write &amp; Read</th>
                  <th>Storage Mode</th>
                  <th className="!text-center">Operation</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-10 text-xs text-surface-400">No variables found.</td>
                  </tr>
                ) : (
                  filtered.map(v => (
                    <tr key={v.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded text-primary-500"
                          checked={!!v.mainPageSelection}
                          onChange={() => handleToggleMainPage(v)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input py-1 px-1.5 text-xs w-12 text-center"
                          placeholder="-"
                          value={v.sort}
                          onChange={e => handleSortChange(v, e.target.value)}
                          onBlur={handleSortBlur}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleSetDefaultUnit(v)}
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mx-auto ${v.defaultUnitSelection ? 'border-info-600' : 'border-surface-300 dark:border-surface-700'}`}
                        >
                          {v.defaultUnitSelection && <span className="w-2 h-2 rounded-full bg-info-600" />}
                        </button>
                      </td>
                      <td className="text-surface-400 font-mono text-xs">{v.number}</td>
                      <td className="font-semibold text-surface-800 dark:text-surface-100">{v.name}</td>
                      <td className="text-xs text-surface-500">{v.variableType}</td>
                      <td className="text-xs text-surface-500">{registerDisplayCode(v.dataFormat)}</td>
                      <td className="font-mono text-xs text-surface-500">{v.registerAddress || '—'}</td>
                      <td className="text-xs text-surface-500">{v.readWrite}</td>
                      <td className="text-xs text-surface-500">
                        {[v.storageVariable && 'Variable Storage', v.storageTiming && 'Timing Storage'].filter(Boolean).join('-') || '—'}
                      </td>
                      <td className="!text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="btn-ghost p-1.5" onClick={() => openEdit(v)} title="Edit"><Pencil size={13} /></button>
                          <button className="btn-danger p-1.5" onClick={() => handleDeleteVariable(v)} title="Delete"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-surface-400">Showing 1 to {filtered.length} of {filtered.length} records</p>
        </div>
      </Modal>

      {subModal === 'addVariable' && editingVar && (
        <AddVariableModal
          value={editingVar}
          isEdit={variables.some(v => v.id === editingVar.id)}
          onChange={setEditingVar}
          onClose={closeSub}
          onSubmit={handleSubmitVariable}
        />
      )}

      {subModal === 'addEquation' && editingVar && (
        <AddEquationModal
          value={editingVar}
          isEdit={variables.some(v => v.id === editingVar.id)}
          onChange={setEditingVar}
          onClose={closeSub}
          onSubmit={handleSubmitVariable}
          slaveName={slave.name}
        />
      )}

      {subModal === 'import' && (
        <ImportVariableModal onClose={() => setSubModal(null)} onImport={handleImportFile} />
      )}
    </>
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={e => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg border border-surface-300 dark:border-surface-800 cursor-pointer p-0.5 bg-white dark:bg-surface-950"
        />
        <input
          type="text"
          className="input flex-1"
          placeholder="#ffffff"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function TimeRangeField({ label, start, end, onStart, onEnd }) {
  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input type="time" className="input" value={start} onChange={e => onStart(e.target.value)} />
        <span className="text-xs text-surface-400 flex-shrink-0">to</span>
        <input type="time" className="input" value={end} onChange={e => onEnd(e.target.value)} />
      </div>
    </div>
  )
}

function AddVariableModal({ value, isEdit, onChange, onClose, onSubmit }) {
  const [showAdvanced, setShowAdvanced] = useState(true)
  const set = (patch) => onChange({ ...value, ...patch })

  const registerDisplay = `${String(value.registerAddress || '0').padStart(5, '0')}(${registerDisplayCode(value.dataFormat)})`

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit Variable' : 'Add Variable'}
      size="2xl"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={onSubmit}>Submit</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextInput label="Variable Name" required placeholder="e.g. Voltage"
            value={value.name} onChange={e => set({ name: e.target.value })} />
          <TextInput label="Variable Unit" placeholder="e.g. V"
            value={value.unit} onChange={e => set({ unit: e.target.value })} />
          <SelectInput label="Icon" placeholder="Icons"
            value={value.icon} onChange={e => set({ icon: e.target.value })}
            options={ICON_OPTIONS} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextInput label="Variable Identifier" value={value.identifier} onChange={e => set({ identifier: e.target.value })} />
          <TextInput label="Machine Id" value={value.machineId} onChange={e => set({ machineId: e.target.value })} />
          <TextInput label="Machine Control" value={value.machineControl} onChange={e => set({ machineControl: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ColorField label="Line Chart Color Picker" value={value.lineChartColor} onChange={v => set({ lineChartColor: v })} />
          <TextInput label="Line Chart Limit" value={value.lineChartLimit} onChange={e => set({ lineChartLimit: e.target.value })} />
          <TextInput label="Low Limit Line Chart" value={value.lowLimitLineChart} onChange={e => set({ lowLimitLineChart: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TimeRangeField label="Peak Time Range" start={value.peakTimeStart} end={value.peakTimeEnd}
            onStart={v => set({ peakTimeStart: v })} onEnd={v => set({ peakTimeEnd: v })} />
          <TimeRangeField label="Peak Off Time Range" start={value.peakOffTimeStart} end={value.peakOffTimeEnd}
            onStart={v => set({ peakOffTimeStart: v })} onEnd={v => set({ peakOffTimeEnd: v })} />
          <ColorField label="Peak Time Color" value={value.peakTimeColor} onChange={v => set({ peakTimeColor: v })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ColorField label="Peak Off Time Color" value={value.peakOffTimeColor} onChange={v => set({ peakOffTimeColor: v })} />
        </div>

        <SelectInput label="Variable Type" required
          value={value.variableType} onChange={e => set({ variableType: e.target.value })}
          options={['Directly collected variables']} />

        <div className="space-y-1.5">
          <label className="label">Register</label>
          <div className="flex flex-wrap items-center gap-2">
            <select className="select w-56" value={value.registerFuncCode} onChange={e => set({ registerFuncCode: e.target.value })}>
              {REGISTER_FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <input type="text" className="input w-32" placeholder="Address" value={value.registerAddress}
              onChange={e => set({ registerAddress: e.target.value.replace(/[^0-9]/g, '') })} />
            <span className="text-xs text-surface-400 font-mono">{registerDisplay}</span>
          </div>
        </div>

        <SelectInput label="Data Format" required
          value={value.dataFormat} onChange={e => set({ dataFormat: e.target.value })}
          options={DATA_FORMATS} />

        <div className="flex flex-wrap items-end gap-4">
          <SelectInput label="Number Format" required className="w-56"
            value={value.numberFormat} onChange={e => set({ numberFormat: e.target.value })}
            options={NUMBER_FORMATS} />
          <CheckboxInput label="decimalPlacesPadding" checked={value.decimalPlacesPadding}
            onChange={v => set({ decimalPlacesPadding: v })} className="pb-2.5" />
        </div>

        <div className="space-y-1.5">
          <span className="label">Storage Format</span>
          <div className="flex flex-wrap gap-5">
            <CheckboxInput label="Variable Storage" checked={value.storageVariable} onChange={v => set({ storageVariable: v })} />
            <CheckboxInput label="Timing Storage" checked={value.storageTiming} onChange={v => set({ storageTiming: v })} />
          </div>
        </div>

        <RadioInput label="Read/Write" name="readWrite" options={READ_WRITE_OPTIONS}
          value={value.readWrite} onChange={v => set({ readWrite: v })} />

        <button
          type="button"
          className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"
          onClick={() => setShowAdvanced(s => !s)}
        >
          Advanced Options {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          <span className="text-surface-400 font-normal ml-2">How to set variable permissions</span>
        </button>

        {showAdvanced && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="label flex items-center gap-1.5">
                Acquisition Formula <Info size={12} className="text-surface-400" title="Formula applied when reading the raw register value" />
              </label>
              <input type="text" className="input" value={value.acquisitionFormula}
                onChange={e => set({ acquisitionFormula: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="label flex items-center gap-1.5">
                Control Formula <Info size={12} className="text-surface-400" title="Formula applied when writing a value to the device" />
              </label>
              <input type="text" className="input" value={value.controlFormula}
                onChange={e => set({ controlFormula: e.target.value })} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function AddEquationModal({ value, isEdit, onChange, onClose, onSubmit, slaveName }) {
  const [slavesOpen, setSlavesOpen] = useState(false)
  const set = (patch) => onChange({ ...value, ...patch })
  const availableSlaves = [slaveName]

  const toggleSlave = (name) => {
    const cur = value.slaves || []
    const next = cur.includes(name) ? cur.filter(s => s !== name) : [...cur, name]
    set({ slaves: next })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit Variable' : 'Add Variable'}
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={onSubmit}>Submit</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextInput label="Variable Name" required placeholder="e.g. Total Power"
            value={value.name} onChange={e => set({ name: e.target.value })} />
          <TextInput label="Variable Unit" placeholder="e.g. kW"
            value={value.unit} onChange={e => set({ unit: e.target.value })} />
          <SelectInput label="Icon" placeholder="Icons"
            value={value.icon} onChange={e => set({ icon: e.target.value })}
            options={ICON_OPTIONS} />
        </div>

        <TextInput label="Variable Identifier" value={value.identifier} onChange={e => set({ identifier: e.target.value })} />

        <SelectInput label="Variable Type" required disabled
          value="" placeholder="Directly collected variables" options={[]} />

        <div className="pt-2 border-t border-surface-100 dark:border-surface-800">
          <h4 className="text-sm font-bold text-surface-900 dark:text-surface-100 mt-3 mb-3">Equation Variables</h4>

          <div className="space-y-1.5 relative">
            <label className="label">Slaves <span className="text-danger-600">*</span></label>
            <button
              type="button"
              onClick={() => setSlavesOpen(o => !o)}
              className="select text-left flex items-center justify-between"
            >
              <span className={value.slaves?.length ? 'text-surface-800 dark:text-surface-100' : 'text-surface-400'}>
                {value.slaves?.length ? value.slaves.join(', ') : 'Please select slaves'}
              </span>
              <ChevronDown size={14} className="text-surface-400 flex-shrink-0" />
            </button>
            {slavesOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-floating overflow-hidden">
                {availableSlaves.map(s => (
                  <label key={s} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded text-primary-500"
                      checked={(value.slaves || []).includes(s)}
                      onChange={() => toggleSlave(s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5 mt-4">
            <label className="label flex items-center gap-1.5">
              Control Formula (Slave Name$$Variable Name) <Info size={12} className="text-surface-400" title="Reference other slave variables like SlaveName$$VariableName" />
            </label>
            <input type="text" className="input" placeholder={`e.g. ${slaveName}$$Voltage + ${slaveName}$$Current`}
              value={value.controlFormula} onChange={e => set({ controlFormula: e.target.value })} />
          </div>
        </div>
      </div>
    </Modal>
  )
}

function ImportVariableModal({ onClose, onImport }) {
  const [fileName, setFileName] = useState('')

  return (
    <Modal
      open
      onClose={onClose}
      title="Import Variable"
      size="sm"
      footer={
        <>
          <button className="btn-danger" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onImport}>Ok</button>
        </>
      }
    >
      <div className="space-y-1.5">
        <label className="label">Select the File</label>
        <div className="flex items-center gap-2">
          <label className="btn-secondary cursor-pointer !py-1.5 !px-3 text-xs">
            Choose File
            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={e => setFileName(e.target.files?.[0]?.name || '')}
            />
          </label>
          <span className="text-xs text-surface-400 truncate">{fileName || 'No file chosen'}</span>
        </div>
      </div>
    </Modal>
  )
}
