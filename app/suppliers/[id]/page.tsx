'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SupplierDetailPage() {
  const params = useParams()
  const id = (params as any).id
  const router = useRouter()
  const [supplier, setSupplier] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview'|'contacts'|'capabilities'|'documents'>('overview')
  const [files, setFiles] = useState<File[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => { fetchSupplier() }, [id])

  async function fetchSupplier() {
    setLoading(true)
    const res = await fetch(`/api/suppliers/${id}`)
    const data = await res.json()
    setSupplier(data)
    setLoading(false)
  }

  async function upload() {
    const form = new FormData()
    for (const f of files) form.append('file', f)
    await fetch(`/api/suppliers/${id}/documents`, { method: 'POST', body: form })
    setFiles([])
    fetchSupplier()
  }

  async function approve() {
    const res = await fetch(`/api/suppliers/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'APPROVED', notes }) })
    if (!res.ok) return alert('Failed')
    alert('Approved')
    fetchSupplier()
  }

  if (loading) return <div className="p-4">Loading...</div>
  if (!supplier) return <div className="p-4">Not found</div>

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{supplier.name}</h1>
          <div className="text-sm text-slate-600">{supplier.tradingName}</div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/suppliers')}>Back</Button>
          {supplier.status === 'PENDING' && <Button onClick={approve}>Approve</Button>}
        </div>
      </div>

      <nav className="flex gap-2 mb-4">
        <button onClick={() => setTab('overview')} className={`px-3 py-1 rounded ${tab === 'overview' ? 'bg-blue-100' : 'hover:bg-slate-100'}`}>Overview</button>
        <button onClick={() => setTab('contacts')} className={`px-3 py-1 rounded ${tab === 'contacts' ? 'bg-blue-100' : 'hover:bg-slate-100'}`}>Contacts</button>
        <button onClick={() => setTab('capabilities')} className={`px-3 py-1 rounded ${tab === 'capabilities' ? 'bg-blue-100' : 'hover:bg-slate-100'}`}>Capabilities</button>
        <button onClick={() => setTab('documents')} className={`px-3 py-1 rounded ${tab === 'documents' ? 'bg-blue-100' : 'hover:bg-slate-100'}`}>Documents</button>
      </nav>

      {tab === 'overview' && (
        <div className="border p-4 rounded">
          <div><strong>Address:</strong> {supplier.address}</div>
          <div><strong>Email:</strong> {supplier.email}</div>
          <div><strong>Phone:</strong> {supplier.phone}</div>
          <div><strong>Payment terms:</strong> {supplier.paymentTerms}</div>
          <div><strong>Notes:</strong> {supplier.notes}</div>
        </div>
      )}

      {tab === 'contacts' && (
        <div>
          <h3 className="font-semibold mb-2">Contacts</h3>
          {supplier.contacts?.map((c: any) => (
            <div key={c.id} className="p-2 border rounded mb-2">
              <div className="font-semibold">{c.name} {c.isPrimary ? <span className="text-sm text-slate-500">(Primary)</span> : null}</div>
              <div className="text-sm">{c.role} • {c.email} • {c.phone}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'capabilities' && (
        <div>
          <h3 className="font-semibold mb-2">Capabilities</h3>
          {supplier.capabilities?.map((c: any) => (
            <div key={c.id} className="p-2 border rounded mb-2">
              <div className="font-semibold">{c.category} — {c.name}</div>
              <div className="text-sm">{c.details}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'documents' && (
        <div>
          <h3 className="font-semibold mb-2">Documents</h3>
          <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="mt-2 flex gap-2">
            <Button onClick={upload}>Upload</Button>
          </div>
          <div className="mt-4">
            {supplier.documents?.map((d: any) => (
              <div key={d.id} className="p-2 border rounded mb-2 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{d.type}</div>
                  <div className="text-sm text-slate-600">{d.filename}</div>
                </div>
                <div>
                  <a href={d.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Download</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}