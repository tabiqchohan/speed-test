import { useState, useEffect } from 'react'
import { PAKISTAN_SERVERS } from '@shared/servers.js'

export default function ServerSelector({ selected, onSelect }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const isps = [...new Set(PAKISTAN_SERVERS.map(s => s.isp))]
  const filtered = search
    ? PAKISTAN_SERVERS.filter(s =>
        s.isp.toLowerCase().includes(search.toLowerCase()) ||
        s.city.toLowerCase().includes(search.toLowerCase())
      )
    : PAKISTAN_SERVERS

  const selectedServer = PAKISTAN_SERVERS.find(s => s.id === selected)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-left transition-colors hover:border-transworld-500"
      >
        <div>
          {selectedServer ? (
            <>
              <div className="text-sm font-medium">{selectedServer.isp}</div>
              <div className="text-xs text-gray-500">{selectedServer.city}</div>
            </>
          ) : (
            <div className="text-sm text-gray-500">Auto (Best Ping)</div>
          )}
        </div>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search ISP or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm focus:outline-none"
            />
          </div>

          <div className="overflow-y-auto max-h-60">
            <button
              onClick={() => { onSelect('auto'); setOpen(false) }}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-transworld-500" />
              <div>
                <div className="font-medium">Auto (Best Ping)</div>
                <div className="text-xs text-gray-500">Automatically select best server</div>
              </div>
            </button>

            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              ISPs
            </div>

            {filtered.map(server => (
              <button
                key={server.id}
                onClick={() => { onSelect(server.id); setOpen(false) }}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 ${
                  selected === server.id ? 'bg-transworld-50 dark:bg-transworld-900/20' : ''
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${selected === server.id ? 'bg-transworld-500' : 'bg-gray-300'}`} />
                <div>
                  <div className="font-medium">{server.isp}</div>
                  <div className="text-xs text-gray-500">{server.city}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
