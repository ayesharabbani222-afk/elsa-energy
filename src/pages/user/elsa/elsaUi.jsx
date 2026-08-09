// Small shared helpers/components for the ELSA AI tabs.

export function rs(n) {
  return `Rs ${Number(n).toLocaleString('en-PK')}`
}

export function GradeBadge({ grade }) {
  const map = {
    A: 'badge-success',
    B: 'badge-warning',
    C: 'badge-danger',
  }
  return <span className={map[grade] || 'badge-neutral'}>Grade {grade}</span>
}

export function AlertDot({ level }) {
  const map = {
    red: 'bg-danger-500',
    yellow: 'bg-primary-500',
    blue: 'bg-info-500',
  }
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${map[level] || 'bg-surface-400'}`} />
}

export function ReducibleTag({ flag }) {
  if (flag === 'yes') return <span className="badge-success">ELSA reduces: yes</span>
  if (flag === 'partially') return <span className="badge-warning">ELSA reduces: partially</span>
  if (flag === 'schedule') return <span className="badge-warning">ELSA: schedules loads by time</span>
  if (flag === 'suggest') return <span className="badge-warning">ELSA: suggests capacitor bank</span>
  return <span className="badge-neutral">ELSA reduces: no</span>
}
