// Seed data + persistence helpers for Device Template → Slaves → Variables.
// Mirrors the "EVBCharger" reference screens: each Device Template has one or
// more Slaves (protocol endpoints), and each Slave has a list of Variables.

const STORAGE_PREFIX = 'cf-ems-template-slaves-'

function defaultVariables() {
  return [
    {
      id: 'v1', number: 1, name: 'Voltage', unit: 'V', icon: '', identifier: '',
      machineId: '', machineControl: '',
      lineChartColor: '#000000', lineChartLimit: '', lowLimitLineChart: '',
      peakTimeStart: '', peakTimeEnd: '', peakOffTimeStart: '', peakOffTimeEnd: '',
      peakTimeColor: '#00ff00', peakOffTimeColor: '#ff0000',
      variableType: 'Directly collected variables',
      registerFuncCode: '3(Holding Register)', registerAddress: '40258',
      dataFormat: 'Unsigned Word', numberFormat: 'Integer', decimalPlacesPadding: false,
      storageVariable: true, storageTiming: true,
      readWrite: 'Read Only',
      acquisitionFormula: '', controlFormula: '',
      mainPageSelection: false, sort: '', defaultUnitSelection: false,
      slaves: [],
    },
    {
      id: 'v2', number: 2, name: 'Current', unit: 'A', icon: '', identifier: '',
      machineId: '', machineControl: '',
      lineChartColor: '#000000', lineChartLimit: '', lowLimitLineChart: '',
      peakTimeStart: '', peakTimeEnd: '', peakOffTimeStart: '', peakOffTimeEnd: '',
      peakTimeColor: '#00ff00', peakOffTimeColor: '#ff0000',
      variableType: 'Directly collected variables',
      registerFuncCode: '3(Holding Register)', registerAddress: '40260',
      dataFormat: 'Unsigned Word', numberFormat: 'Integer', decimalPlacesPadding: false,
      storageVariable: true, storageTiming: true,
      readWrite: 'Read Only',
      acquisitionFormula: '', controlFormula: '',
      mainPageSelection: false, sort: '', defaultUnitSelection: false,
      slaves: [],
    },
    {
      id: 'v3', number: 3, name: 'Power', unit: 'kW', icon: '', identifier: '',
      machineId: '', machineControl: '',
      lineChartColor: '#000000', lineChartLimit: '', lowLimitLineChart: '',
      peakTimeStart: '', peakTimeEnd: '', peakOffTimeStart: '', peakOffTimeEnd: '',
      peakTimeColor: '#00ff00', peakOffTimeColor: '#ff0000',
      variableType: 'Directly collected variables',
      registerFuncCode: '3(Holding Register)', registerAddress: '40277',
      dataFormat: 'Unsigned Word', numberFormat: 'Integer', decimalPlacesPadding: false,
      storageVariable: true, storageTiming: true,
      readWrite: 'Read Only',
      acquisitionFormula: '', controlFormula: '',
      mainPageSelection: false, sort: '', defaultUnitSelection: false,
      slaves: [],
    },
    {
      id: 'v4', number: 4, name: 'ON/OFF', unit: '', icon: '', identifier: '',
      machineId: '', machineControl: '',
      lineChartColor: '#000000', lineChartLimit: '', lowLimitLineChart: '',
      peakTimeStart: '', peakTimeEnd: '', peakOffTimeStart: '', peakOffTimeEnd: '',
      peakTimeColor: '#00ff00', peakOffTimeColor: '#ff0000',
      variableType: 'Directly collected variables',
      registerFuncCode: '0(Coils Status)', registerAddress: '34609',
      dataFormat: 'Bit', numberFormat: 'Integer', decimalPlacesPadding: false,
      storageVariable: true, storageTiming: true,
      readWrite: 'Write Only',
      acquisitionFormula: '', controlFormula: '',
      mainPageSelection: false, sort: '', defaultUnitSelection: false,
      slaves: [],
    },
    {
      id: 'v5', number: 5, name: 'Value', unit: '', icon: '', identifier: '',
      machineId: '', machineControl: '',
      lineChartColor: '#000000', lineChartLimit: '', lowLimitLineChart: '',
      peakTimeStart: '', peakTimeEnd: '', peakOffTimeStart: '', peakOffTimeEnd: '',
      peakTimeColor: '#00ff00', peakOffTimeColor: '#ff0000',
      variableType: 'Directly collected variables',
      registerFuncCode: '0(Coils Status)', registerAddress: '30515',
      dataFormat: 'Bit', numberFormat: 'Integer', decimalPlacesPadding: false,
      storageVariable: true, storageTiming: true,
      readWrite: 'Write Only',
      acquisitionFormula: '', controlFormula: '',
      mainPageSelection: false, sort: '', defaultUnitSelection: false,
      slaves: [],
    },
  ]
}

export function seedSlavesForTemplate(template) {
  return [
    {
      id: 1,
      name: (template?.name || 'SLAVE').toUpperCase().replace(/\s+/g, ''),
      protocol: template?.method === 'Cloud Polling' ? 'Modbus TCP' : 'Modbus RTU',
      isDefault: true,
      variables: defaultVariables(),
    },
  ]
}

export function loadSlaves(templateId, template) {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + templateId)
    if (saved) return JSON.parse(saved)
  } catch {
    /* ignore */
  }
  return seedSlavesForTemplate(template)
}

export function saveSlaves(templateId, slaves) {
  try {
    localStorage.setItem(STORAGE_PREFIX + templateId, JSON.stringify(slaves))
  } catch {
    /* ignore */
  }
}

export const REGISTER_FUNCTIONS = [
  '0(Coils Status)',
  '1(Input Status)',
  '3(Holding Register)',
  '4(Input Register)',
]

export const DATA_FORMATS = [
  'Bit', 'Unsigned Word', 'Signed Word', 'Unsigned Long', 'Signed Long',
  'Unsigned Long Long', 'Signed Long Long', 'Float', 'Double', 'ASCII',
]

export const NUMBER_FORMATS = ['Integer', 'Decimal']

export const READ_WRITE_OPTIONS = ['Write&Read', 'Read Only', 'Write Only']

export const PROTOCOL_OPTIONS = ['Modbus RTU', 'Modbus TCP', 'Modbus ASCII']

export function registerDisplayCode(dataFormat) {
  const map = {
    'Bit': 'bit', 'Unsigned Word': 'ushort', 'Signed Word': 'short',
    'Unsigned Long': 'ulong', 'Signed Long': 'long',
    'Unsigned Long Long': 'ulonglong', 'Signed Long Long': 'longlong',
    'Float': 'float', 'Double': 'double', 'ASCII': 'ascii',
  }
  return map[dataFormat] || 'ushort'
}
