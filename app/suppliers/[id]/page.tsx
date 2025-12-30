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

  async function updateStatus(status: string, notePrefix: string) {
    const remark = prompt(`${notePrefix} remarks (optional):`, '') || ''
    const body = { id, status, notes: remark ? `${notePrefix}: ${remark}` : undefined }
    const res = await fetch('/api/suppliers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) return alert('Failed to update status')
    alert('Status updated')
    fetchSupplier()
  }

  async function removeSupplier() {
    if (!confirm('Delete this supplier?')) return
    const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' })
    if (!res.ok) return alert('Delete failed')
    alert('Deleted')
    router.push('/suppliers')
  }

  function handlePrint() {
    window.print()
  }

  function handleEdit() {
    router.push(`/suppliers/register?id=${id}`)
  }

  if (loading) return <div className="p-4">Loading...</div>
  if (!supplier) return <div className="p-4">Not found</div>

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-container { max-width: 100%; padding: 20px; }
          .print-section { page-break-inside: avoid; margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; }
          .print-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          body { font-size: 12pt; }
        }
      `}</style>
      <div className="max-w-7xl mx-auto p-6 print-container">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6 no-print">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{displayValue(supplier.name)}</h1>
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
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => router.push('/suppliers')}>Back</Button>
            {supplier.status === 'PENDING' && <Button onClick={approve}>Approve</Button>}
            <Button onClick={handleEdit} variant="outline">Edit</Button>
            <Button onClick={() => updateStatus('SUSPENDED', 'Hold')} variant="outline">Hold</Button>
            <Button onClick={() => updateStatus('SUSPENDED', 'Blacklisted')} variant="destructive">Blacklist</Button>
            <Button onClick={removeSupplier} variant="outline">Delete</Button>
            <Button onClick={handlePrint} variant="outline">Print</Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block print-header">
          <h1 className="text-2xl font-bold">{displayValue(supplier.name)}</h1>
          <p className="text-sm">{displayValue(supplier.tradingName)}</p>
          <p className="text-xs mt-2">Status: {displayValue(supplier.status)} | Category: {displayValue(supplier.category)} | Type: {displayValue(supplier.businessType)}</p>
        </div>

        {/* Company Information */}
        <div className="border rounded-lg p-6 bg-white mb-6 print-section">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><span className="font-semibold">Company Name:</span> {displayValue(supplier.name)}</div>
            <div><span className="font-semibold">Trading Name:</span> {displayValue(supplier.tradingName)}</div>
            <div><span className="font-semibold">Category:</span> {displayValue(supplier.category)}</div>
            <div><span className="font-semibold">Business Type:</span> {displayValue(supplier.businessType)}</div>
            <div><span className="font-semibold">Year Established:</span> {displayValue(supplier.yearEstablished)}</div>
            <div><span className="font-semibold">Website:</span> {displayValue(supplier.website)}</div>
            <div className="col-span-2"><span className="font-semibold">Description:</span> {displayValue(supplier.notes)}</div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="border rounded-lg p-6 bg-white mb-6 print-section">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Contact Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><span className="font-semibold">Email:</span> {displayValue(supplier.email)}</div>
            <div><span className="font-semibold">Phone:</span> {displayValue(supplier.phone)}</div>
            <div><span className="font-semibold">Address:</span> {displayValue(supplier.address)}</div>
            <div><span className="font-semibold">City:</span> {displayValue(supplier.city)}</div>
            <div><span className="font-semibold">Country:</span> {displayValue(supplier.country)}</div>
            <div><span className="font-semibold">Contact Person:</span> {displayValue(supplier.contactPerson)}</div>
          </div>
          {supplier.contacts?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Additional Contacts</h3>
              <div className="space-y-2">
                {supplier.contacts.map((c: any) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded text-sm">
                    <div className="font-semibold">{displayValue(c.name)} {c.isPrimary && <span className="text-xs text-slate-500">(Primary)</span>}</div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>Role: {displayValue(c.role)}</div>
                      <div>Email: {displayValue(c.email)}</div>
                      <div>Phone: {displayValue(c.phone)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Registration & Legal */}
        <div className="border rounded-lg p-6 bg-white mb-6 print-section">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Registration & Legal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><span className="font-semibold">CR Number:</span> {displayValue(supplier.crNumber)}</div>
            <div><span className="font-semibold">CR Document:</span> {displayValue(supplier.crDocumentUrl)}</div>
            <div><span className="font-semibold">Tax ID:</span> {displayValue(supplier.taxId)}</div>
            <div><span className="font-semibold">Tax Card:</span> {displayValue(supplier.taxCardUrl)}</div>
            <div><span className="font-semibold">ICV Certificate:</span> {displayValue(supplier.icvUrl)}</div>
            <div><span className="font-semibold">Trade License:</span> {displayValue(supplier.tradeLicense)}</div>
          </div>
        </div>

        {/* Financial & Terms */}
        <div className="border rounded-lg p-6 bg-white mb-6 print-section">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Financial & Payment Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><span className="font-semibold">Payment Terms:</span> {displayValue(supplier.paymentTerms)}</div>
            <div><span className="font-semibold">Lead Time (Days):</span> {displayValue(supplier.leadTimeDays)}</div>
            <div><span className="font-semibold">Default Currency:</span> {displayValue(supplier.defaultCurrency)}</div>
            <div><span className="font-semibold">Rating:</span> {supplier.rating ? `${supplier.rating}/5` : 'Not filled'}</div>
            <div><span className="font-semibold">Preferred Supplier:</span> {supplier.preferred ? 'Yes' : 'No'}</div>
            <div><span className="font-semibold">Active:</span> {supplier.isActive ? 'Yes' : 'No'}</div>
          </div>
          {supplier.bankDetails && (
            <div className="mt-4 p-3 bg-slate-50 rounded">
              <h3 className="font-semibold mb-2">Banking Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-semibold">Bank Name:</span> {displayValue(supplier.bankDetails.bankName)}</div>
                <div><span className="font-semibold">Account Name:</span> {displayValue(supplier.bankDetails.accountName)}</div>
                <div><span className="font-semibold">IBAN:</span> {displayValue(supplier.bankDetails.iban)}</div>
                <div><span className="font-semibold">SWIFT:</span> {displayValue(supplier.bankDetails.swift)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Capabilities */}
        {supplier.capabilities?.length > 0 && (
          <div className="border rounded-lg p-6 bg-white mb-6 print-section">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supplier.capabilities.map((c: any) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded text-sm">
                  <div className="font-semibold">{displayValue(c.category)} — {displayValue(c.name)}</div>
                  <div className="text-slate-700 mt-1">{displayValue(c.details)}</div>
                  {c.capacity && <div className="text-xs text-slate-600 mt-1">Capacity: {displayValue(c.capacity)}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {supplier.certifications?.length > 0 && (
          <div className="border rounded-lg p-6 bg-white mb-6 print-section">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Certifications</h2>
            <div className="space-y-3">
              {supplier.certifications.map((c: any) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded text-sm">
                  <div className="font-semibold">{displayValue(c.name)}</div>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                    <div>Cert #: {displayValue(c.certNumber)}</div>
                    <div>Issued By: {displayValue(c.issuedBy)}</div>
                    <div>Valid From: {c.validFrom ? new Date(c.validFrom).toLocaleDateString() : 'Not filled'}</div>
                    <div>Valid To: {c.validTo ? new Date(c.validTo).toLocaleDateString() : 'Not filled'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="border rounded-lg p-6 bg-white mb-6 print-section">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Documents</h2>
          <div className="no-print mb-4">
            <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="mb-2" />
            <Button onClick={upload}>Upload</Button>
          </div>
          {supplier.documents?.length > 0 ? (
            <div className="space-y-2">
              {supplier.documents.map((d: any) => (
                <div key={d.id} className="p-3 bg-slate-50 rounded flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold">{displayValue(d.type)}</div>
                    <div className="text-xs text-slate-600">{displayValue(d.filename)}</div>
                    <div className="text-xs text-slate-500">Uploaded: {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <a href={d.url} target="_blank" rel="noreferrer" className="text-blue-600 no-print">Download</a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No documents uploaded</p>
          )}
        </div>

        {/* Timestamps */}
        <div className="border rounded-lg p-6 bg-white print-section">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Record Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><span className="font-semibold">Created:</span> {supplier.createdAt ? new Date(supplier.createdAt).toLocaleString() : 'Not filled'}</div>
            <div><span className="font-semibold">Updated:</span> {supplier.updatedAt ? new Date(supplier.updatedAt).toLocaleString() : 'Not filled'}</div>
          </div>
        </div>
      </div>
    </>
  )
}