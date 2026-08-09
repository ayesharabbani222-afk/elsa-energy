import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const pageTitles = {
  // Admin
  '/admin':                    'Dashboard',
  '/admin/organizations':      'Manage Organizations',
  '/admin/users':              'Manage Users',
  '/admin/gateways':           'Manage Gateways',
  '/admin/devices':            'Manage Devices',
  '/admin/device-templates':   'Device Templates',
  '/admin/icons':              'Manage Icons',
  '/admin/products':           'Manage Products',
  '/admin/data-center':        'Data Center',
  '/admin/historical-data':    'Historical Data',
  '/admin/variable-alarms':    'Variable Alarm Records',
  '/admin/linkage-records':    'Linkage Records',
  '/admin/template-triggers':  'Template Triggers',
  '/admin/alarm-settings':     'Alarm Settings',
  '/admin/alarm-contacts':     'Alarm Contacts',
  '/admin/device-timestamps':  'Device Timestamps',
  '/admin/schedule-tasks':     'Schedule Tasks',
  '/admin/theme-settings':     'Theme Settings',
  '/admin/settings':           'Platform Settings',
  '/admin/custom-dashboard':   'Custom Dashboards',
  // Org
  '/org':                      'Dashboard',
  '/org/devices':              'My Devices',
  '/org/gateways':             'My Gateways',
  '/org/device-templates':     'Device Templates',
  '/org/historical-data':      'Historical Data',
  '/org/template-triggers':    'Template Triggers',
  '/org/alarm-settings':       'Alarm Settings',
  '/org/alarm-contacts':       'Alarm Contacts',
  '/org/schedule-tasks':       'Schedule Tasks',
  '/org/settings':             'Settings',
  '/org/custom-dashboard':     'Custom Dashboards',
  '/org/elsa-ai':              'ELSA AI',
  '/org/ev-charger/live-session':    'EV Charger · Live Session',
  '/org/ev-charger/analytics':       'EV Charger · Analytics',
  '/org/ev-charger/energy-hub':      'EV Charger · Energy Hub',
  '/org/ev-charger/v2g-exports':     'EV Charger · V2G / Exports',
  '/org/ev-charger/ai-decision-log': 'EV Charger · AI Decision Log',
  '/org/ev-charger/fleet':           'EV Charger · Fleet',
  '/org/ev-charger/profile':         'EV Charger · Profile',
  '/org/ev-charger/control-system':  'EV Charger · Control System',
  '/org/ai-analytics':         'AI Analytics',
  '/org/ai-analytics/voltage-imbalance':  'Voltage Imbalance',
  '/org/ai-analytics/current-imbalance':  'Current Imbalance',
  '/org/ai-analytics/power-factor':       'Power Factor',
  '/org/ai-analytics/energy-consumption': 'Energy Consumption',
  '/org/ai-analytics/anomalies':          'Anomalies',
  // User
  '/user':                     'My Dashboard',
  '/user/subscription':        'Subscription',
  '/user/products':            'Products',
  '/user/schedule':            'Schedule',
  '/user/slab-rates':          'Slab Rates',
  '/user/interval-history':    'Interval History',
  '/user/alarm-template':      'Alarm Template',
  '/user/notifications':       'Notifications',
  '/user/ai-analytics':        'AI Analytics',
  '/user/voltage-imbalance':   'Voltage Imbalance',
  '/user/current-imbalance':   'Current Imbalance',
  '/user/power-factor':        'Power Factor',
  '/user/energy-consumption':  'Energy Consumption',
  '/user/anomalies':           'Anomalies',
  '/user/custom-dashboard':    'Custom Dashboards',
  '/user/elsa-ai':             'ELSA AI',
}

export default function DashboardLayout({ navItems, role }) {
  const location = useLocation()
  const title    = pageTitles[location.pathname]
    ?? (location.pathname.includes('/custom-dashboard/') ? 'Custom Dashboards' : 'EMS Platform')
  const mainRef  = useRef(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
    setMobileNavOpen(false) // close the mobile drawer whenever the route changes
  }, [location.pathname])

  // Escape closes the mobile nav drawer
  useEffect(() => {
    if (!mobileNavOpen) return
    const onKeyDown = (e) => { if (e.key === 'Escape') setMobileNavOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileNavOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      <Sidebar navItems={navItems} role={role} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={title} onMenuClick={() => setMobileNavOpen(true)} />
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-50 dark:bg-surface-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
