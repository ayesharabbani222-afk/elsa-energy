import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, SlidersHorizontal, Download, Inbox } from 'lucide-react'

const highlightMatch = (text, search) => {
  if (!search || !text) return text
  const parts = String(text).split(new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'))
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={i} className="bg-amber-200 dark:bg-amber-900/40 text-amber-950 dark:text-amber-100 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  )
}

export default function DataTable({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = 'Search...',
  pageSize: pageSizeProp = 10,
  actions,
  emptyMessage = 'No records found',
  loading = false,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  getRowId = row => row.id,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 25, 50, 100],
  toolbar = true,
}) {
  const [query, setQuery]     = useState('')
  const [page, setPage]       = useState(1)
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [pageSize, setPageSize] = useState(pageSizeProp)
  const location = useLocation()

  // Sync search query with URL highlight parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const hl = params.get('highlight')
    if (hl) {
      setQuery(hl)
      setPage(1)
    } else {
      setQuery('')
    }
  }, [location.search])

  // Reset page to 1 whenever parent data changes
  useEffect(() => {
    setPage(1)
  }, [data])

  const filtered = data.filter(row =>
    !query || columns.some(col =>
      String(row[col.key] ?? '').toLowerCase().includes(query.toLowerCase())
    )
  )

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av))
      })
    : filtered

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize)

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const handleSearch = (e) => { setQuery(e.target.value); setPage(1) }

  const startIdx = Math.min((page - 1) * pageSize + 1, sorted.length)
  const endIdx = Math.min(page * pageSize, sorted.length)

  const pageIds = paginated.map(getRowId)
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id))
  const toggleSelectAll = () => {
    if (!onSelectionChange) return
    if (allPageSelected) onSelectionChange(selectedIds.filter(id => !pageIds.includes(id)))
    else onSelectionChange([...new Set([...selectedIds, ...pageIds])])
  }
  const toggleSelectOne = (id) => {
    if (!onSelectionChange) return
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id])
  }

  return (
    <div className="table-container">
      {/* Toolbar: Show N entries + Search */}
      {toolbar && (
        <div className="p-3 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 flex items-center justify-between gap-4 flex-wrap">
          {showPageSizeSelector ? (
            <div className="flex items-center gap-2 text-xs text-surface-500">
              <span>Show</span>
              <select
                className="select py-1 px-2 text-xs w-auto"
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
              >
                {pageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          ) : <span />}
          {searchable && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-500">Search:</span>
              <div className="relative w-56">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  className="input pl-8 py-1.5 text-xs bg-surface-50 dark:bg-surface-950 border-surface-200 dark:border-surface-800 focus:bg-white focus:dark:bg-surface-900 w-full"
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={handleSearch}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded text-primary-500 border-surface-300 dark:border-surface-800"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              <th className="w-10">#</th>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={col.sortable !== false ? 'cursor-pointer select-none' : ''}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && sortKey === col.key && (
                      sortDir === 'asc'
                        ? <ChevronUp size={12} className="text-primary-600" />
                        : <ChevronDown size={12} className="text-primary-600" />
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="!text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Shimmer Skeleton State
              Array.from({ length: Math.min(5, pageSize) }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {selectable && <td className="w-10 py-4"><div className="h-3 bg-surface-200 rounded w-3" /></td>}
                  <td className="w-10 py-4"><div className="h-3 bg-surface-200 rounded w-4" /></td>
                  {columns.map(col => (
                    <td key={col.key} className="py-4">
                      <div className="h-3 bg-surface-200 rounded w-5/6" />
                    </td>
                  ))}
                  {actions && <td className="py-4"><div className="h-3 bg-surface-200 rounded w-12 mx-auto" /></td>}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              // Enhanced Empty State with SVG Illustration
              <tr>
                <td
                  colSpan={columns.length + (actions ? 2 : 1) + (selectable ? 1 : 0)}
                  className="text-center py-16 text-surface-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-surface-100 dark:bg-surface-950 rounded-full flex items-center justify-center mb-4 text-surface-400 dark:text-surface-600">
                      <Inbox size={28} />
                    </div>
                    <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-1">{emptyMessage}</h4>
                    <p className="text-xs text-surface-400 dark:text-surface-500">Try adjusting your search or filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr key={row.id ?? idx} className="group">
                  {selectable && (
                    <td className="w-10">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded text-primary-500 border-surface-300 dark:border-surface-800"
                        checked={selectedIds.includes(getRowId(row))}
                        onChange={() => toggleSelectOne(getRowId(row))}
                      />
                    </td>
                  )}
                  <td className="text-surface-400 font-mono text-xs">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] !== null && row[col.key] !== undefined ? highlightMatch(row[col.key], query) : '—')}
                    </td>
                  ))}
                  {actions && (
                    <td className="!text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
          <span className="text-xs text-surface-500">
            Showing {startIdx}–{endIdx} of {sorted.length} results
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="btn-ghost p-1.5 text-surface-500 disabled:opacity-40"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1]
                const showEllipsis = prev && p - prev > 1
                return (
                  <div key={p} className="flex items-center">
                    {showEllipsis && <span className="px-2 text-xs text-surface-400">...</span>}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        p === page
                          ? 'bg-primary-500 text-surface-950 font-bold'
                          : 'text-surface-500 hover:bg-surface-100'
                      }`}
                    >
                      {p}
                    </button>
                  </div>
                )
              })}
            <button
              type="button"
              className="btn-ghost p-1.5 text-surface-500 disabled:opacity-40"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
