'use client'

import { useState, useEffect } from 'react'

export default function AdminPrintTemplates() {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [entity, setEntity] = useState('JOB_ORDER')
  const [templates, setTemplates] = useState<any[]>([])

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    const res = await fetch('/api/admin/print-templates')
    const data = await res.json()
    setTemplates(data)
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', name)
    fd.append('entityType', entity)

    const res = await fetch('/api/admin/print-templates', { method: 'POST', body: fd })
    if (!res.ok) return alert('Upload failed')
    setName('')
    setFile(null)
    fetchTemplates()
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Print Templates (Admin)</h1>
      <form onSubmit={upload} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input type="text" placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} className="border p-2" />
          <select value={entity} onChange={(e) => setEntity(e.target.value)} className="border p-2">
            <option value="JOB_ORDER">Job Order</option>
            <option value="MATERIAL_REQUEST">Material Request</option>
            <option value="PURCHASE_ORDER">Purchase Order</option>
          </select>
          <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border p-2" />
        </div>
        <div className="mt-3">
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Upload Template</button>
        </div>
      </form>

      <div>
        <h2 className="text-lg font-semibold mb-2">Existing templates</h2>
        <ul>
          {templates.map(t => (
            <li key={t.id} className="border p-3 mb-2">
              <div className="font-semibold">{t.name} <span className="text-xs text-slate-500 ml-2">({t.entityType})</span></div>
              <div className="text-sm text-slate-700 mt-1">Preview:</div>
              <div className="mt-2 border p-2 bg-white max-h-40 overflow-auto" dangerouslySetInnerHTML={{ __html: t.htmlTemplate }} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}