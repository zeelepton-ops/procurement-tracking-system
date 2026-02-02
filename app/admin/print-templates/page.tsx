'use client'

import { useState, useEffect } from 'react'

export default function AdminPrintTemplates() {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [entity, setEntity] = useState('JOB_ORDER')
  const [templates, setTemplates] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    try {
      setError(null)
      const res = await fetch('/api/admin/print-templates')
      if (!res.ok) throw new Error('Failed to load templates')
      const data = await res.json()
      setTemplates(data)
    } catch (err: any) {
      console.error('Failed to fetch templates:', err)
      setError('Failed to load templates')
    }
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    try {
      setError(null)
      setLoading(true)
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', name)
      fd.append('entityType', entity)

      const res = await fetch('/api/admin/print-templates', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }
      
      setSuccess('Template uploaded successfully')
      setTimeout(() => setSuccess(null), 5000)
      setName('')
      setFile(null)
      fetchTemplates()
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Print Templates (Admin)</h1>
      
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          {success}
        </div>
      )}
      
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