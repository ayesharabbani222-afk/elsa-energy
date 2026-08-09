// ─────────────────────────────────────────────────────────────────────────
// ELSA AI — mock/dummy data for the Rupee-Based Automation, Bill Intelligence,
// Load Health and Solution Routing modules (spec v1.0, Jul 2026).
// All values are seeded demo data — matches the style of data/dummy.js.
// ─────────────────────────────────────────────────────────────────────────

// Module 1 — Tariff Engine ---------------------------------------------------
export const discoProfiles = [
  { id: 'lesco', name: 'LESCO', connection: 'Domestic B-1 (Protected)' },
  { id: 'kelectric', name: 'K-Electric', connection: 'Commercial B-2' },
  { id: 'mepco', name: 'MEPCO', connection: 'Domestic B-1' },
  { id: 'iesco', name: 'IESCO', connection: 'Industrial B-3' },
  { id: 'gepco', name: 'GEPCO', connection: 'Domestic B-1' },
]

export const activeTariff = {
  disco: 'LESCO',
  connection: 'Domestic B-1',
  slabs: [
    { upto: 100, rate: 12.5 },
    { upto: 200, rate: 21.4 },
    { upto: 300, rate: 25.2 },
    { upto: 400, rate: 33.7 },
    { upto: 700, rate: 41.9 },
    { upto: null, rate: 55.1 },
  ],
  touWindows: { peak: '18:00–22:00', offPeak: '22:00–06:00' },
  fixedCharge: 1200,
  fcaPerUnit: 3.2,
  quarterlyAdj: 640,
  pfPenalty: 0,
  gstPct: 17,
  effectiveFrom: '2026-07-01',
}

// ICP-25 Government Relief — applied automatically per the official DISCO
// billing notification for protected/eligible domestic connections.
export const icp25Relief = {
  applicable: true,
  schemeLabel: 'ICP-25 Government Relief',
  unitsCovered: 100, // relief applies up to this many units, per notification
  reliefPerUnitRs: 15,
  get valueRs() { return this.applicable ? this.unitsCovered * this.reliefPerUnitRs : 0 },
  note: 'Applied automatically for protected domestic connections per the official DISCO ICP-25 notification.',
}

// FPA — Fuel Price Adjustment. This is NOT a fixed number: DISCOs republish it
// every billing month depending on the generation fuel mix, so it is modeled
// here as a configurable, month-varying rate rather than a hardcoded constant.
export const fpaConfig = {
  currentMonth: 'Jul 2026',
  currentRatePerUnit: 3.2, // configurable — editable in the Tariff Engine UI
  history: [
    { month: 'May 2026', ratePerUnit: 2.6 },
    { month: 'Jun 2026', ratePerUnit: 2.9 },
    { month: 'Jul 2026', ratePerUnit: 3.2 },
  ],
}

// MDI — Maximum Demand Indicator. Per spec this is NOT a fixed charge: the
// meter samples demand every 30 minutes, and the single highest reading in
// the billing cycle is what gets billed. Modeled here as a real time-series
// so the "current MDI" is a derived value, not a hardcoded constant.
export const mdiConfig = {
  sanctionedKw: 7,
  demandChargePerKw: 500, // Rs per kW, per DISCO tariff — reconcile against actual notification
  // 30-minute interval demand readings for the current billing cycle-to-date
  // (a full day: 48 readings × 30 min = 24 hours). The billed MDI = the max
  // of this series, not a fixed number.
  intervalReadingsKw: [
    1.6, 1.5, 1.4, 1.3, 1.3, 1.2, 1.2, 1.3, 1.5, 1.8, 2.1, 2.3,
    2.0, 1.8, 1.9, 2.4, 2.8, 3.1, 3.4, 3.6, 3.2, 3.0, 2.9, 3.3,
    3.8, 4.1, 3.9, 3.5, 3.2, 2.7, 2.4, 2.2, 2.0, 1.9, 1.8, 1.7,
    1.7, 1.9, 2.2, 2.6, 3.0, 3.3, 3.1, 2.8, 2.5, 2.1, 1.9, 1.7,
  ],
  // Last 3 billing cycles, showing the MDI actually varies cycle to cycle.
  cycleHistory: [
    { cycle: 'May 2026', mdiKw: 3.8 },
    { cycle: 'Jun 2026', mdiKw: 4.0 },
    { cycle: 'Jul 2026', mdiKw: 4.1 },
  ],
}

// TOU/TOD — Peak and Off-Peak are tracked as separate energy-unit buckets
// (not just a time-window label), and the peak/off-peak clock hours themselves
// shift with the DISCO's seasonal schedule.
export const touSeasons = {
  summer: { label: 'Summer (Apr–Oct)', peak: '18:00–22:00', offPeak: '22:00–06:00' },
  winter: { label: 'Winter (Nov–Mar)', peak: '17:00–21:00', offPeak: '21:00–05:00' },
}
export const activeTouSeason = 'summer' // derived from current calendar month by the DISCO schedule

// Splits the same 516 units-to-date used across the rest of the tariff module.
export const touUsage = {
  peakUnits: 210,
  offPeakUnits: 306,
  peakRate: 55.1,   // peak units billed at the top applicable slab rate
  offPeakRate: 33.2, // off-peak units billed at a discounted off-peak rate
}

// billCycle, billBreakup, moneyBar, and goalPlan are all derived from the SAME
// slab table above so the numbers reconcile: ~815 projected units through these
// slabs (1,250 + 2,140 + 2,520 + 3,370 + 12,570 + 6,336 energy) + fixed charge +
// FCA (Rs 3.2/unit) + quarterly adj + 17% GST + meter rent ≈ Rs 38,400/month.
export const billCycle = {
  unitsToDate: 516,
  daysElapsed: 19,
  daysInCycle: 30,
  currentSlabRate: 41.9,
  nextSlabAt: 700,
  nextSlabRate: 55.1,
}

// Module 4 — Bill Breakup -----------------------------------------------------
// "value" for the 'mdi' row is derived below (see billBreakupWithMdi) from
// mdiConfig's actual interval readings — it is intentionally NOT a hardcoded
// number, since MDI is billed on the highest 30-min demand reading each cycle.
export const billBreakup = [
  { key: 'energy', label: 'Energy Charge', value: 28204, reducible: 'yes', color: '#F5A623' },
  { key: 'fixed', label: 'Fixed Charge', value: 200, reducible: 'no', color: '#4C9F70' },
  { key: 'mdi', label: 'MDI Charge (variable)', value: null, reducible: 'schedule', color: '#3F8F6B' },
  { key: 'fca', label: 'FPA + Quarterly Adj', value: 3248, reducible: 'no', color: '#5B8DEF' },
  { key: 'pf', label: 'PF Penalty', value: 0, reducible: 'suggest', color: '#E15759' },
  { key: 'tax', label: 'Duties, Taxes & GST', value: 5548, reducible: 'no', color: '#9AA09A' },
  { key: 'other', label: 'Meter Rent / TV Fee', value: 200, reducible: 'no', color: '#B98CE0' },
  { key: 'icp25', label: 'ICP-25 Govt Relief', value: null, reducible: 'no', color: '#3AB795' },
]

// Resolves the two dynamic rows above (MDI charge from the interval readings,
// ICP-25 relief as a negative/credit line) so every screen shows numbers that
// reconcile with mdiConfig / icp25Relief instead of duplicating hardcoded values.
export function resolveBillBreakup(list = billBreakup) {
  const mdiKw = Math.max(...mdiConfig.intervalReadingsKw)
  const mdiChargeRs = Math.round(mdiKw * mdiConfig.demandChargePerKw)
  return list.map(b => {
    if (b.key === 'mdi') return { ...b, value: mdiChargeRs }
    if (b.key === 'icp25') return { ...b, value: -icp25Relief.valueRs }
    return b
  })
}

export const billWarnings = [
  {
    id: 'w1',
    type: 'sanctioned-load',
    severity: 'warning',
    text: 'Measured max demand is 4.1 kW vs a sanctioned 7 kW — you\'re paying Rs 480/month extra in fixed charges. Get your sanctioned load reviewed.',
    impactRs: 480,
  },
  {
    id: 'w2',
    type: 'slab-crossing',
    severity: 'info',
    text: "You're about to cross the 700-unit slab — the rate will jump from Rs 41.9 to Rs 55.1 (184 units left).",
    impactRs: 660,
  },
]

// Module 5 — Load Health -------------------------------------------------------
export const loads = [
  {
    id: 'l1', name: 'Bedroom AC', room: 'Master Bedroom', circuit: 'Circuit 2',
    watts: 1450, grade: 'C', pf: 0.91, voltage: 228, current: 6.4, source: 'grid', isOn: true,
    check: 'ac-efficiency',
    verdict: 'Bedroom AC is using 30% more than the lounge AC — likely a service/EER issue.',
    trend: [ { m: 'May', v: 98 }, { m: 'Jun', v: 112 }, { m: 'Jul', v: 129 } ],
    faultClass: 'electrical',
    efficiencyPct: 68,
    predictiveMaintenance: 'Compressor draw trending up 30% over 3 months — consistent with early-stage refrigerant loss or a failing compressor bearing. Service within 2–3 weeks to avoid a breakdown mid-season.',
  },
  {
    id: 'l2', name: 'Water Pump', room: 'Utility', circuit: 'Circuit 4',
    watts: 750, grade: 'C', pf: 0.68, voltage: 224, current: 3.3, source: 'grid',
    check: 'reactive-motor',
    verdict: 'Pump PF is 0.68 — the most reactive load on this circuit. Get a capacitor fitted.',
    trend: [ { m: 'May', v: 0.79 }, { m: 'Jun', v: 0.73 }, { m: 'Jul', v: 0.68 } ],
    faultClass: 'electrical',
    efficiencyPct: 61,
    predictiveMaintenance: 'PF falling steadily for 3 straight months (0.79 → 0.68) — motor winding is drawing increasingly reactive current. Left unaddressed this raises the risk of overheating and shortens motor life.',
  },
  {
    id: 'l3', name: 'Kitchen Circuit', room: 'Kitchen', circuit: 'Circuit 4',
    watts: 2100, grade: 'C', pf: 0.95, voltage: 219, current: 9.6, source: 'grid',
    check: 'loose-wire',
    verdict: 'Kitchen circuit is Grade C — voltage drop rose from 8% to 12% over 3 weeks. Needs an electrician checkup.',
    trend: [ { m: 'Wk1', v: 8 }, { m: 'Wk2', v: 10 }, { m: 'Wk3', v: 12 } ],
    faultClass: 'electrical',
    efficiencyPct: 74,
    predictiveMaintenance: 'Rising voltage drop under load points to a loosening connection or degrading wire joint — this is a fire-risk pattern if left unresolved. Recommend an electrician checkup this week, not next month.',
  },
  {
    id: 'l4', name: 'Living Room AC', room: 'Lounge', circuit: 'Circuit 1',
    watts: 1100, grade: 'B', pf: 0.94, voltage: 230, current: 4.8, source: 'solar',
    check: 'efficiency-drift',
    verdict: 'Using 15% more electricity for the same duty cycle — filter may be dirty, keep an eye on it.',
    trend: [ { m: 'May', v: 100 }, { m: 'Jun', v: 108 }, { m: 'Jul', v: 115 } ],
    faultClass: 'behavioral',
    efficiencyPct: 85,
    predictiveMaintenance: 'Gradual 15% efficiency drift is typical of a dirty filter or low refrigerant, not a hardware fault. A filter clean should restore baseline — re-check the grade after 1 week.',
  },
  {
    id: 'l5', name: 'Geyser', room: 'Bathroom', circuit: 'Circuit 3',
    watts: 2000, grade: 'A', pf: 0.98, voltage: 231, current: 8.6, source: 'grid',
    check: 'overload',
    verdict: 'Circuit is running well within its rated capacity — no action needed.',
    trend: [ { m: 'May', v: 55 }, { m: 'Jun', v: 58 }, { m: 'Jul', v: 57 } ],
    faultClass: 'none',
    efficiencyPct: 96,
    predictiveMaintenance: 'No degradation trend detected across the last 3 months — operating within its normal envelope. No maintenance action needed.',
  },
  {
    id: 'l6', name: 'Lounge Lights + Fans', room: 'Lounge', circuit: 'Circuit 1',
    watts: 320, grade: 'A', pf: 0.99, voltage: 230, current: 1.4, source: 'solar',
    check: 'none',
    verdict: 'Grade A — within the normal envelope.',
    trend: [ { m: 'May', v: 40 }, { m: 'Jun', v: 41 }, { m: 'Jul', v: 39 } ],
    faultClass: 'none',
    efficiencyPct: 98,
    predictiveMaintenance: 'Stable consumption for 3 consecutive months — no early-wear signature detected.',
  },
]

export const roomRanking = [
  { room: 'Master Bedroom', pct: 38 },
  { room: 'Kitchen', pct: 24 },
  { room: 'Lounge', pct: 18 },
  { room: 'Kids Room', pct: 9 },
  { room: 'Other', pct: 11 },
]

// Module 6 — Solution Routing ---------------------------------------------------
export const solutionRouting = {
  electrical: {
    label: 'Electrical / Internal',
    primary: 'Book an Electrician',
    secondary: null,
    note: "This is an expert's job — DIY is disabled.",
  },
  behavioral: {
    label: 'Behavioral / Maintenance',
    primary: 'Do It Yourself — Step Guide',
    secondary: 'Electrician optional',
  },
  settings: {
    label: 'Settings / Automation',
    primary: 'Let ELSA Handle It — One-tap Apply',
    secondary: 'Manual Edit',
  },
}

export const electricianPartners = [
  { id: 'e1', name: 'Rawal Electric Services', area: 'Rawalpindi', rating: 4.7, jobs: 214 },
  { id: 'e2', name: 'BrightSpark Technicians', area: 'Rawalpindi / Islamabad', rating: 4.5, jobs: 168 },
  { id: 'e3', name: 'PowerFix Home Solutions', area: 'Islamabad', rating: 4.8, jobs: 301 },
]

// Module 2 — Rupee Triggers ------------------------------------------------------
export const rupeeTriggers = [
  { id: 't1', sentence: "When today's spend crosses Rs 1,500, set Bedroom AC to 26°", active: true, log: 'Saved Rs 61 today (peak rate Rs 52 vs off-peak Rs 24)' },
  { id: 't2', sentence: 'When the rate falls below Rs 25, turn the Geyser on', active: true, log: 'Last fired: last night at 11:10 PM' },
  { id: 't3', sentence: 'When month projection crosses Rs 40,000, shed the non-essential group + notify', active: false, log: 'Not yet triggered this cycle' },
]

export const triggerTemplates = [
  { id: 'tt1', sentence: "Today's spend crosses Rs 1,500 → AC to 26°" },
  { id: 'tt2', sentence: 'Rate falls below Rs 25 → geyser on' },
  { id: 'tt3', sentence: 'Month projection crosses Rs 40,000 → shed non-essential group + notify' },
]

export const triggerOptions = {
  conditions: ["Today's Spend", 'Month Projection', 'Current Rate', "This Load's Spend"],
  comparators: ['Crosses', 'Falls Below'],
  actions: ['Switch Off', 'Set AC to N°', 'Shift to Off-Peak', 'Notify Only', 'Shed Group'],
}

// Module 3 — Autonomous Schedule + goal_plan -------------------------------------
export const autoModePlan = [
  { time: '06:00–09:00', action: 'Water pump run (off-peak + solar ramp-up)', reasonRs: 'Rs 18 vs Rs 39 at peak' },
  { time: '11:00–16:00', action: 'EV charging window (solar surplus)', reasonRs: 'Rs 0/unit — solar surplus' },
  { time: '18:00–22:00', action: 'Deferrable loads shed / AC set to 26°', reasonRs: 'Peak avoided — Rs 220 saved' },
  { time: '23:00–05:00', action: 'Geyser + washing machine (off-peak grid)', reasonRs: 'Rs 24/unit off-peak vs Rs 41.9 peak' },
]

export const monthlySavingsCard = { billDeltaRs: 6200, fuelSubstitutionRs: 1900, label: 'estimate' }

// currentProjectionRs is kept in sync with moneyBar.monthProjectedRs below — Stage 1
// (zero-cost scheduling) is already applied and is what's holding the projection
// under target; Stages 2–3 are further, optional headroom on top of that.
export const goalPlan = {
  targetRs: 50000,
  currentProjectionRs: 38400,
  stages: [
    { stage: 1, title: 'Zero-cost scheduling', impactRs: 4200, feasibility: 'Already applied automatically — contributing to the current pace', status: 'applied' },
    { stage: 2, title: 'Small one-time fixes (service, capacitor, sanctioned-load review)', impactRs: 2600, feasibility: 'Book an electrician for pump + AC service for further headroom', status: 'ready' },
    { stage: 3, title: 'Investment (solar / BESS)', impactRs: 15000, feasibility: "Beyond this point you'll need solar — talk to us about sizing", status: 'future' },
  ],
}

// Module 8 — Source Orchestration -------------------------------------------------
export const sourceLadder = [
  { id: 'solar', label: 'Solar', costRs: 0, active: true, note: 'Generating — feeding home + battery' },
  { id: 'battery', label: 'Battery', costRs: 9, active: false, soc: 74, note: 'Stored cost Rs 9/unit — reserve floor 30%' },
  { id: 'grid', label: 'WAPDA / Grid', costRs: 25.2, active: false, note: 'Off-peak now — current slab rate' },
  { id: 'generator', label: 'Generator', costRs: 78, active: false, note: 'Standby — auto-starts only on an outage with battery below its floor' },
]

export const evStatus = {
  readyByTime: '8:00 AM',
  targetPct: 80,
  currentPct: 46,
  sourceMix: { solar: 60, offPeak: 40, battery: 0 },
  costSoFarRs: 186,
  petrolEquivalentRs: 1140,
  solarPriority: true,
  offPeakOnly: true,
}

export const solarVsConsumption = Array.from({ length: 24 }, (_, h) => {
  const solar = h >= 6 && h <= 18 ? Math.max(0, Math.round(6.2 * Math.sin(((h - 6) / 12) * Math.PI) * 10) / 10) : 0
  const load = Math.round((1.1 + Math.sin((h / 24) * Math.PI * 2 + 1) * 0.6 + (h >= 18 && h <= 22 ? 1.8 : 0)) * 10) / 10
  return { hour: `${h}:00`, solar, load: Math.max(0.3, load) }
})

// Storyboard: "Battery SoC curve + auto charge/discharge" — battery fills while
// solar is generating, holds through the evening peak, and discharges overnight.
export const batterySoc = [
  { hour: '00:00', soc: 42 }, { hour: '03:00', soc: 36 }, { hour: '06:00', soc: 30 },
  { hour: '09:00', soc: 55 }, { hour: '12:00', soc: 88 }, { hour: '15:00', soc: 100 },
  { hour: '18:00', soc: 92 }, { hour: '21:00', soc: 68 }, { hour: '23:59', soc: 48 },
]

// Storyboard: "Store karo, becho mat" — the export-vs-import gap that makes
// storing solar in the battery a better deal than exporting it to the grid.
export const netMetering = { exportRs: 10, importRs: 50, gapRs: 40 }

// Module 9 — Unified Dashboard -----------------------------------------------------
export const savingsTicker = [
  { label: 'Pump shift', rs: 61 },
  { label: 'Peak defense', rs: 220 },
  { label: 'Solar-to-EV', rs: 179 },
]

export const dashboardAlerts = [
  { id: 'a1', level: 'red', text: 'Bedroom AC — 1,500W active, house is empty.', module: 'load-health', loadId: 'l1', actionable: true },
  { id: 'a2', level: 'yellow', text: 'Circuit 4 (Kitchen) degradation trend — 8% → 12% over 3 weeks.', module: 'load-health' },
  { id: 'a3', level: 'blue', text: '184 units left before the 700-unit slab — rate will jump from Rs 41.9 to Rs 55.1.', module: 'tariff' },
]

export const moneyBar = {
  todayRs: 1240,
  monthProjectedRs: 38400,
  targetRs: 50000,
}

// Module 7 — Voice Interface -------------------------------------------------------
// Per spec: "Languages: Urdu, English, and mixed code-switching (the natural mode)".
// Every intent ships an English example and a Roman Urdu example — voiceReply()
// understands both.
export const voiceIntents = [
  { intent: 'Bill projection', example: "Hey ELSA, what's my bill going to be this time?", exampleUr: 'Hey ELSA, is dafa bill kitna aayega?', module: 'Tariff Engine' },
  { intent: 'Why high / breakup', example: 'Why is my bill so high?', exampleUr: 'Bill itna zyada kyun hai?', module: 'Bill Breakup' },
  { intent: 'Room/load ranking', example: 'Which room is using the most electricity?', exampleUr: 'Sab se zyada bijli kaunsa kamra kha raha hai?', module: 'Load Health' },
  { intent: 'Load health', example: "How's the pump doing?", exampleUr: 'Pump ka kya haal hai?', module: 'Load Health' },
  { intent: 'Control', example: 'Turn off the Bedroom AC', exampleUr: 'Bedroom AC band karo', module: 'Rupee Triggers' },
  { intent: 'Trigger set', example: "When today's spend crosses 1500, set the AC to 26", exampleUr: 'Jab aaj ka kharcha 1500 cross ho to AC 26 par kar dena', module: 'Rupee Triggers' },
  { intent: 'Auto mode', example: 'ELSA, take care of everything', exampleUr: 'ELSA sab sambhal lo', module: 'Auto Schedule' },
  { intent: 'EV', example: 'I need the car ready by 8 in the morning', exampleUr: 'Gari subah 8 tak ready chahiye', module: 'Auto Schedule / EV' },
  { intent: 'Savings recap', example: 'How much did I save this month?', exampleUr: 'Is mahine kitna bachaya?', module: 'Dashboard' },
]

export function voiceReply(query) {
  const q = query.toLowerCase()
  if (q.includes('bill') && (q.includes('kitna') || q.includes('project') || q.includes('how much') || q.includes('going to be'))) {
    const under = moneyBar.monthProjectedRs <= moneyBar.targetRs
    return `This cycle's estimate is Rs ${moneyBar.monthProjectedRs.toLocaleString()} — ${under ? 'under' : 'a bit above'} your Rs ${moneyBar.targetRs.toLocaleString()} target.`
  }
  if (q.includes('kamra') || q.includes('room')) {
    return `Number 1 — ${roomRanking[0].room}, ${roomRanking[0].pct}%. Kids room is only ${roomRanking[3].pct}%.`
  }
  if (q.includes('pump')) {
    const l = loads.find(l => l.name === 'Water Pump')
    return `${l.verdict}`
  }
  if (q.includes('bachaya') || q.includes('saving') || q.includes('save')) {
    return `ELSA saved you Rs ${savingsTicker.reduce((s, x) => s + x.rs, 0)} today.`
  }
  if (q.includes('gari') || q.includes('ev') || q.includes('car') || q.includes('charge')) {
    return `Car will be ${evStatus.targetPct}% ready by ${evStatus.readyByTime} — Rs ${evStatus.costSoFarRs} so far (solar ${evStatus.sourceMix.solar}% + off-peak ${evStatus.sourceMix.offPeak}%).`
  }
  if (q.includes('auto mode') || q.includes('sambhal') || q.includes('take care')) {
    return 'Auto Mode ON — schedule generated, check the plan card.'
  }
  return "I can't do that yet, but here's the relevant screen."
}
