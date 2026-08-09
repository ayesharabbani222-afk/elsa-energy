import { useState } from 'react'
import { LayoutDashboard, Receipt, HeartPulse, Coins, CalendarClock, Sun, Mic } from 'lucide-react'
import Overview from './elsa/Overview'
import TariffBill from './elsa/TariffBill'
import LoadHealth from './elsa/LoadHealth'
import RupeeTriggers from './elsa/RupeeTriggers'
import AutoSchedule from './elsa/AutoSchedule'
import SourceFlow from './elsa/SourceFlow'
import VoiceAssistant from './elsa/VoiceAssistant'
import { rupeeTriggers as initialTriggers, goalPlan, evStatus, autoModePlan } from '../../data/elsaData'

const TAB_META = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'tariff', label: 'Bill & Tariff', icon: Receipt },
  { key: 'load-health', label: 'Load Health', icon: HeartPulse },
  { key: 'triggers', label: 'Rupee Triggers', icon: Coins },
  { key: 'auto-schedule', label: 'Auto Schedule & EV', icon: CalendarClock },
  { key: 'sources', label: 'Source Flow', icon: Sun },
  { key: 'voice', label: 'Hey ELSA', icon: Mic },
]

export default function ElsaAI({ variant = 'user' }) {
  const [tab, setTab] = useState('overview')

  // Cross-tab state lives here (not inside each tab component) so switching
  // tabs never discards what the user just did — a trigger they added, a load
  // they selected, the voice conversation, etc. all survive tab navigation.
  const [triggers, setTriggers] = useState(initialTriggers)
  const [autoMode, setAutoMode] = useState(false)
  const [evPrefs, setEvPrefs] = useState({ solarPriority: evStatus.solarPriority, offPeakOnly: evStatus.offPeakOnly })
  const [stageStatus, setStageStatus] = useState(() =>
    Object.fromEntries(goalPlan.stages.map(s => [s.stage, s.status]))
  )
  const [selectedLoadId, setSelectedLoadId] = useState(null)
  const [showSolution, setShowSolution] = useState(false)
  const [loadResolutions, setLoadResolutions] = useState({}) // { [loadId]: 'booked' | 'diy-started' | 'applied' }
  const [scheduleMode, setScheduleMode] = useState('auto') // 'manual' | 'auto'
  const [manualSchedules, setManualSchedules] = useState([])
  const [editableAutoPlan, setEditableAutoPlan] = useState(() =>
    autoModePlan.map(p => {
      const [start, end] = p.time.split('–')
      return { ...p, start, end }
    })
  )
  const [conversation, setConversation] = useState([
    { from: 'elsa', text: "Hey! I'm ELSA — ask me about your bill, load health, or auto mode. Aap Urdu ya English, dono mein pooch sakte hain." },
  ])

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2 className="page-title">ELSA AI</h2>
          <p className="breadcrumb">Rupee-Based Automation &middot; Bill Intelligence &middot; Load Health</p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-surface-200 dark:border-surface-800 overflow-x-auto">
        {TAB_META.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3 pb-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* All panels stay mounted (hidden via CSS, not unmounted) so charts don't
          have to re-measure from zero and so each panel's own local UI state
          (e.g. which pie slice is expanded) survives a tab switch too. */}
      <div className={tab === 'overview' ? '' : 'hidden'}>
        <Overview variant={variant} onNavigate={setTab} />
      </div>
      <div className={tab === 'tariff' ? '' : 'hidden'}>
        <TariffBill />
      </div>
      <div className={tab === 'load-health' ? '' : 'hidden'}>
        <LoadHealth
          selectedLoadId={selectedLoadId}
          setSelectedLoadId={setSelectedLoadId}
          showSolution={showSolution}
          setShowSolution={setShowSolution}
          resolutions={loadResolutions}
          setResolutions={setLoadResolutions}
        />
      </div>
      <div className={tab === 'triggers' ? '' : 'hidden'}>
        <RupeeTriggers triggers={triggers} setTriggers={setTriggers} />
      </div>
      <div className={tab === 'auto-schedule' ? '' : 'hidden'}>
        <AutoSchedule
          autoMode={autoMode} setAutoMode={setAutoMode}
          evPrefs={evPrefs} setEvPrefs={setEvPrefs}
          stageStatus={stageStatus} setStageStatus={setStageStatus}
          scheduleMode={scheduleMode} setScheduleMode={setScheduleMode}
          manualSchedules={manualSchedules} setManualSchedules={setManualSchedules}
          editableAutoPlan={editableAutoPlan} setEditableAutoPlan={setEditableAutoPlan}
        />
      </div>
      <div className={tab === 'sources' ? '' : 'hidden'}>
        <SourceFlow />
      </div>
      <div className={tab === 'voice' ? '' : 'hidden'}>
        <VoiceAssistant conversation={conversation} setConversation={setConversation} />
      </div>
    </div>
  )
}
