'use client'

import { useEffect, useState } from 'react'

const FIELDS = [
  { key: 'foreman', label: 'Foreman' },
  { key: 'priority', label: 'Priority' },
  { key: 'contactPerson', label: "NBTC's Contact Person" },
  { key: 'phone', label: "NBTC's Contact Phone" },
  { key: 'qaQc', label: 'QA/QC In Charge' },
  { key: 'drawing', label: 'Drawing' },
  { key: 'jobNumber', label: 'Job Number' },
  { key: 'client', label: 'Client' },
  { key: 'lpo', label: 'LPO / Contract' },
  { key: 'clientContact', label: "Client's Contact Person" },
  { key: 'clientPhone', label: "Client's Phone No." }
]

export default function LayoutEditor() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<Record<string, number>>({})
  const [exportText, setExportText] = useState('')

  const scan = () => {
    const init: Record<string, number> = {}
    FIELDS.forEach((f) => {
      const el = document.querySelector(`[data-edit-key="${f.key}"]`)
      if (el) {
        const cls = (el as HTMLElement).className || ''
        const m = cls.match(/md:col-span-(\d+)/)
        init[f.key] = m ? parseInt(m[1], 10) : 1
      }
    })
    setSettings(init)
    return init
  }

  useEffect(() => {
    scan()
  }, [])

  // auto-scan when DOM changes (useful for toggled forms)
  useEffect(() => {
    if (typeof window === 'undefined') return
    let timeout: number | undefined
    const mo = new MutationObserver(() => {
      if (timeout) window.clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        scan()
      }, 150)
    })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      mo.disconnect()
      if (timeout) window.clearTimeout(timeout)
    }
  }, [])

  const apply = (key: string, value: number) => {
    const el = document.querySelector(`[data-edit-key="${key}"]`)
    if (!el) return
    const eln = el as HTMLElement
    // remove previous md:col-span-* classes
    eln.className = eln.className
      .split(/\s+/)
      .filter((c) => !/^md:col-span-\d+$/.test(c))
      .join(' ')
    eln.classList.add(`md:col-span-${value}`)
    setSettings((s) => ({ ...s, [key]: value }))

    // Ensure the editor knows the current DOM state after applying changes
    scan()
  }

  const increment = (key: string) => {
    const cur = settings[key] || 1
    const next = Math.min(12, cur + 1)
    apply(key, next)
  }
  const decrement = (key: string) => {
    const cur = settings[key] || 1
    const next = Math.max(1, cur - 1)
    apply(key, next)
  }

  const exportChanges = () => {
    const json = JSON.stringify(settings, null, 2)
    setExportText(json)
  }

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      alert('Copied JSON to clipboard')
    } catch (e) {
      alert('Copy failed')
    }
  }

  // Only show when query param layoutEdit=1 is present
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    if (params.get('layoutEdit') !== '1') return null
  } else {
    return null
  }

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <div className="bg-white border rounded shadow-lg w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-semibold">Layout Editor</div>
          <div className="flex items-center gap-2">
            <button
              className="text-xs text-slate-600 hover:text-slate-800"
              onClick={() => { exportChanges() }}
            >Export</button>
            <button
              className="text-xs text-slate-600 hover:text-slate-800"
              onClick={() => scan()}
            >Refresh</button>
            <button
              className="text-xs text-red-600 hover:text-red-800"
              onClick={() => setOpen(!open)}
            >{open ? 'Close' : 'Open'}</button>
          </div>
        </div>
        {open ? (
          <div className="p-3 text-xs">
            <div className="space-y-2 max-h-64 overflow-auto">
              {FIELDS.map((f) => (
                <div key={f.key} className="flex items-center justify-between">
                  <div className="pr-2 w-36">{f.label}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrement(f.key)}
                      className="px-2 py-1 bg-slate-100 rounded text-slate-700"
                    >-</button>
                    <div className="w-8 text-center">{settings[f.key] || 1}</div>
                    <button
                      onClick={() => increment(f.key)}
                      className="px-2 py-1 bg-slate-100 rounded text-slate-700"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="text-xs text-slate-500 mb-1">Exported JSON</div>
              <textarea className="w-full h-28 border rounded p-2 text-xs" value={exportText} readOnly />
              <div className="flex gap-2 mt-2">
                <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded" onClick={copyExport}>Copy</button>
                <button className="text-xs bg-slate-100 px-3 py-1 rounded" onClick={() => setExportText('')}>Clear</button>
              </div>
              <div className="text-xs text-slate-500 mt-2">Tip: Adjust fields then click Export — copy the JSON and send it to me and I can apply the changes for you.</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
