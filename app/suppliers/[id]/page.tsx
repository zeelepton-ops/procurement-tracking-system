'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const displayValue = (value: any, placeholder = 'Not filled') => {
  if (value === null || value === undefined) return placeholder
  const str = String(value).trim()
  return str.length ? str : placeholder
}

export default function SupplierDetailPage() {
  const params = useParams()
  const id = (params as any).id
  const router = useRouter()
  const [supplier, setSupplier] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
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
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{displayValue(supplier.name)}</h1>
          <p className="text-sm text-slate-600">{displayValue(supplier.tradingName)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">{displayValue(supplier.category)}</span>
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">{displayValue(supplier.businessType)}</span>
            <span className={`px-2 py-1 rounded-full font-medium ${
              supplier.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
              supplier.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
              supplier.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {displayValue(supplier.status)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/suppliers')}>Back</Button>
          {supplier.status === 'PENDING' && <Button onClick={approve}>Approve</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="font-semibold mb-3">Overview</h3>
          <div className="space-y-2 text-sm text-slate-700">
            <div><strong>Address:</strong> {displayValue(supplier.address)}</div>
            <div><strong>Email:</strong> {displayValue(supplier.email)}</div>
            <div><strong>Phone:</strong> {displayValue(supplier.phone)}</div>
            <div><strong>City/Country:</strong> {displayValue([supplier.city, supplier.country].filter(Boolean).join(', '))}</div>
            <div><strong>CR Number:</strong> {displayValue(supplier.crNumber)}</div>
            <div><strong>Payment terms:</strong> {displayValue(supplier.paymentTerms)}</div>
            <div><strong>Notes:</strong> {displayValue(supplier.notes)}</div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <h3 className="font-semibold mb-3">Contacts</h3>
          {supplier.contacts?.length ? (
            supplier.contacts.map((c: any) => (
              <div key={c.id} className="p-2 border rounded mb-2">
                <div className="font-semibold">{displayValue(c.name)} {c.isPrimary ? <span className="text-sm text-slate-500">(Primary)</span> : null}</div>
                <div className="text-sm text-slate-700 space-y-1">
                  <div>Role: {displayValue(c.role)}</div>
                  <div>Email: {displayValue(c.email)}</div>
                  <div>Phone: {displayValue(c.phone)}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600">Not filled</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="font-semibold mb-3">Capabilities</h3>
          {supplier.capabilities?.length ? (
            supplier.capabilities.map((c: any) => (
              <div key={c.id} className="p-2 border rounded mb-2">
                <div className="font-semibold">{displayValue(c.category)} — {displayValue(c.name)}</div>
                <div className="text-sm text-slate-700">{displayValue(c.details)}</div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600">Not filled</p>
          )}
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <h3 className="font-semibold mb-3">Documents</h3>
          <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="mt-2 flex gap-2">
            <Button onClick={upload}>Upload</Button>
          </div>
          <div className="mt-4 space-y-2">
            {supplier.documents?.length ? (
              supplier.documents.map((d: any) => (
                <div key={d.id} className="p-2 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{displayValue(d.type)}</div>
                    <div className="text-sm text-slate-600">{displayValue(d.filename)}</div>
                  </div>
                  <div>
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Download</a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">Not filled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}