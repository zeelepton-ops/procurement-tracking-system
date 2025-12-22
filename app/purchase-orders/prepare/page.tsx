'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function PreparePO() {
  const [preps, setPreps] = useState<any[]>([])
  const [itemsJson, setItemsJson] = useState('')

  useEffect(() => { fetchPreps() }, [])

  async function fetchPreps() {
    const res = await fetch('/api/po-prep')
    const data = await res.json()
    setPreps(data)
  }

  async function createPrep() {
    try {
      const items = JSON.parse(itemsJson || '[]')
      const res = await fetch('/api/po-prep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ createdBy: 'system', items }) })
      if (!res.ok) return alert('Failed')
      setItemsJson('')
      fetchPreps()
    } catch (e) { alert('Invalid JSON') }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Prepare Purchase Order</h1>
      <div className="mb-4">
        <label className="block text-sm text-slate-600 mb-1">Items JSON (format: <code>{`[{"itemKey":"MR-1","qty":10}, ...]`}</code>)</label>
        <textarea value={itemsJson} onChange={(e) => setItemsJson(e.target.value)} className="w-full h-36 border p-2" />
        <div className="mt-2">
          <Button onClick={createPrep} className="bg-blue-600">Create Prep</Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Existing Preps</h2>
        <ul>
          {preps.map(p => (
            <li key={p.id} className="border p-3 mb-2">
              <div className="text-sm text-slate-700">{p.id} • {new Date(p.createdAt).toLocaleString()}</div>
              <div className="mt-2"><pre className="text-xs">{JSON.stringify(p.items, null, 2)}</pre></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}