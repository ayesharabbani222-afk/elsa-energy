import { useLocation } from 'react-router-dom'
import EVChargerApp from './evcharger/EVChargerApp'

// Maps each EMS sidebar sub-route to the EV Charger app's internal tab id.
const TAB_MAP = {
  'live-session':    'ev-live',
  'analytics':       'ev-stats',
  'energy-hub':      'ev-energy',
  'v2g-exports':     'ev-v2g',
  'ai-decision-log': 'ev-ailog',
  'fleet':           'ev-fleet',
  'profile':         'ev-profile',
  'control-system':  'ems-control',
}

export default function EVChargerPage() {
  const location = useLocation()
  // location.pathname looks like /org/ev-charger/live-session
  const segment = location.pathname.split('/ev-charger/')[1]?.replace(/\/$/, '') || 'live-session'
  const initialTab = TAB_MAP[segment] || 'ev-live'

  // A single, persistently-mounted EVChargerApp instance is used for the whole
  // /org/ev-charger/* subtree (see the wildcard route in App.jsx), so switching
  // between EV Charger pages does not reset the live charging simulation state
  // (timers, toggles, etc.) — matching the original app's behavior.
  return <EVChargerApp initialTab={initialTab} />
}
