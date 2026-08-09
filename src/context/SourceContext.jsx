import { createContext, useContext, useState } from 'react'
import { organizations } from '../data/dummy'

const SourceContext = createContext(null)

const STORAGE_KEY = 'cf-ems-sources'

// Nominal starting capacity (kW) used only the very first time an
// organization's default sources are seeded — the Organization Dashboard's
// Power Flow mind map overrides this with live telemetry for Grid/Solar/
// Generator until an org admin manually edits (overrides) the value.
const DEFAULT_CAPACITY = { Grid: 50, Solar: 20, Generator: 15 }

function seedDefaultSources() {
  let id = 1
  const seeded = []
  organizations.forEach(org => {
    ;['Grid', 'Solar', 'Generator'].forEach(type => {
      seeded.push({
        id: id++,
        org: org.name,
        name: type,
        type,
        capacity: DEFAULT_CAPACITY[type],
        gateway: '',
        description: '',
        status: 'Active',
        overridden: false,
        createdBy: 'system',
        createdAt: new Date().toISOString().slice(0, 10),
      })
    })
  })
  return seeded
}

export function SourceProvider({ children }) {
  const [sources, setSources] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    const seeded = seedDefaultSources()
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)) } catch { /* ignore */ }
    return seeded
  })

  function persist(next) {
    setSources(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  // type: 'Grid' | 'Solar' | 'Generator' | 'Battery' | 'Other'
  function createSource({ name, org, type, capacity, gateway = '', description = '', status = 'Active', overridden = false, createdBy = 'org' }) {
    const s = {
      id: Date.now(),
      name,
      org,
      type,
      capacity: Number(capacity) || 0,
      gateway,
      description,
      status,
      overridden,
      createdBy,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    persist([...sources, s])
    return s
  }

  function updateSource(id, patch) {
    persist(sources.map(s => (s.id === id ? { ...s, ...patch } : s)))
  }

  function deleteSource(id) {
    persist(sources.filter(s => s.id !== id))
  }

  function getSourcesForOrg(orgName) {
    return sources.filter(s => s.org === orgName)
  }

  function getActiveSourcesForOrg(orgName) {
    return sources.filter(s => s.org === orgName && s.status === 'Active')
  }

  return (
    <SourceContext.Provider
      value={{
        sources,
        createSource,
        updateSource,
        deleteSource,
        getSourcesForOrg,
        getActiveSourcesForOrg,
      }}
    >
      {children}
    </SourceContext.Provider>
  )
}

export const useSources = () => useContext(SourceContext)
