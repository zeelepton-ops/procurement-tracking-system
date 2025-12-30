'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, ArrowLeft } from 'lucide-react'

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
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const primaryContact = supplier?.contacts?.find((c: any) => c.isPrimary) || supplier?.contacts?.[0]

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
          .print-container { max-width: 100%; padding: 5px; }
          .print-section { page-break-inside: avoid; margin-bottom: 4px; border: 1px solid #ddd; padding: 5px; }
          .print-header { border-bottom: 2px solid #333; padding-bottom: 4px; margin-bottom: 5px; }
          .print-grid { gap: 2px !important; }
          body { font-size: 7.5pt; line-height: 1.2; }
          h2 { font-size: 9pt; margin-bottom: 3px; font-weight: 600; }
          h3 { font-size: 8pt; margin-bottom: 2px; font-weight: 600; }
          .text-sm, .text-xs { font-size: 7pt !important; }
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
          <div className="flex gap-2 flex-wrap relative">
            <Button onClick={() => router.push('/suppliers')} variant="outline" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {supplier.status === 'PENDING' && <Button onClick={approve}>Approve</Button>}
            <Button onClick={handleEdit} variant="outline">Edit</Button>
            
            {/* Status Actions Dropdown */}
            <div className="relative">
              <Button 
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                variant="outline"
                className="gap-1"
              >
                Actions <ChevronDown className="h-4 w-4" />
              </Button>
              
              {showStatusDropdown && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      updateStatus('SUSPENDED', 'Hold')
                      setShowStatusDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm border-b border-slate-100"
                  >
                    🔒 Hold
                  </button>
                  <button
                    onClick={() => {
                      updateStatus('SUSPENDED', 'Blacklisted')
                      setShowStatusDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm border-b border-slate-100 text-red-600"
                  >
                    🚫 Blacklist
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this supplier?')) removeSupplier()
                      setShowStatusDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
            
            <Button onClick={handlePrint} variant="outline">Print</Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block print-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="https://i.ibb.co/nMjzX2GS/Logo-NBTC-Transparent.png" 
                alt="NBTC Logo"
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-sm font-bold text-slate-800">Supplier Profile</h1>
                <p className="text-xs text-slate-600">{displayValue(supplier.name !== supplier.tradingName ? `${supplier.name} (${supplier.tradingName})` : supplier.name)}</p>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="font-semibold">Status: {displayValue(supplier.status)}</span> | 
              <span>{displayValue(supplier.category)}</span> | 
              <span>{displayValue(supplier.businessType)}</span>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="border rounded-lg p-5 bg-white mb-4 shadow-sm print-section">
          <h2 className="text-lg font-bold mb-3 border-b pb-2 text-slate-800">Company Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm print-grid">
            <div><span className="font-semibold">Company Name:</span> {displayValue(supplier.name)}</div>
            <div><span className="font-semibold">Trading Name:</span> {displayValue(supplier.tradingName)}</div>
            <div><span className="font-semibold">Category:</span> {displayValue(supplier.category)}</div>
            <div><span className="font-semibold">Business Type:</span> {displayValue(supplier.businessType)}</div>
            <div><span className="font-semibold">Year Established:</span> {displayValue(supplier.yearEstablished)}</div>
            <div className="col-span-3"><span className="font-semibold">Website:</span> {displayValue(supplier.website)}</div>
            <div className="col-span-4"><span className="font-semibold">Description:</span> {displayValue(supplier.notes)}</div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="border rounded-lg p-5 bg-white mb-4 shadow-sm print-section">
          <h2 className="text-lg font-bold mb-3 border-b pb-2 text-slate-800">Contact Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm print-grid">
            <div><span className="font-semibold">Email:</span> {displayValue(supplier.email)}</div>
            <div><span className="font-semibold">Phone:</span> {displayValue(supplier.phone)}</div>
            <div className="col-span-2"><span className="font-semibold">Address:</span> {displayValue(supplier.address)}</div>
            <div><span className="font-semibold">City:</span> {displayValue(supplier.city)}</div>
            <div><span className="font-semibold">Country:</span> {displayValue(supplier.country)}</div>
            <div className="col-span-2"><span className="font-semibold">Contact Person:</span> {displayValue(supplier.contactPerson || primaryContact?.name)}</div>
          </div>
          {supplier.contacts?.length > 0 && (
            <div className="col-span-full mt-2 pt-2 border-t">
              <h3 className="font-semibold mb-1 text-sm">Additional Contacts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                {supplier.contacts.map((c: any) => (
                  <div key={c.id} className="p-1 bg-slate-50 rounded border">
                    <div className="font-semibold truncate">{displayValue(c.name)} {c.isPrimary && <span className="text-slate-500">(P)</span>}</div>
                    <div className="text-slate-600 truncate">{displayValue(c.role)}</div>
                    <div className="text-slate-600 truncate">{displayValue(c.email)}</div>
                    <div className="text-slate-600 truncate">{displayValue(c.phone)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Financial & Payment Terms */}
        <div className="border rounded-lg p-5 bg-white mb-4 shadow-sm print-section">
          <h2 className="text-lg font-bold mb-3 border-b pb-2 text-slate-800">Financial & Payment Terms</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm print-grid">
            <div><span className="font-semibold">Payment Terms:</span> {displayValue(supplier.paymentTerms)}</div>
            <div><span className="font-semibold">Lead Time:</span> {displayValue(supplier.leadTimeDays)} days</div>
            <div><span className="font-semibold">Currency:</span> {displayValue(supplier.defaultCurrency)}</div>
          </div>
          {supplier.bankDetails && (
            <div className="col-span-full mt-2 pt-2 border-t">
              <h3 className="font-semibold mb-1 text-sm">Banking Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                <div><span className="font-semibold">Bank Name:</span> {displayValue(supplier.bankDetails.bankName)}</div>
                <div><span className="font-semibold">Account Name:</span> {displayValue(supplier.bankDetails.accountName)}</div>
                <div><span className="font-semibold">IBAN:</span> {displayValue(supplier.bankDetails.iban)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Registration & Legal */}
        <div className="border rounded-lg p-5 bg-white mb-4 shadow-sm print-section">
          <h2 className="text-lg font-bold mb-3 border-b pb-2 text-slate-800">Registration & Legal Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm print-grid">
            <div><span className="font-semibold">CR Number:</span> {displayValue(supplier.crNumber)}</div>
            <div><span className="font-semibold">CR Expiry:</span> {displayValue(supplier.crExpiry ? new Date(supplier.crExpiry).toLocaleDateString() : null)}</div>
            <div><span className="font-semibold">CR Document:</span> {displayValue(supplier.crDocumentUrl)}</div>
            <div><span className="font-semibold">Tax ID:</span> {displayValue(supplier.taxId)}</div>
            <div><span className="font-semibold">Tax ID Expiry:</span> {displayValue(supplier.taxIdExpiry ? new Date(supplier.taxIdExpiry).toLocaleDateString() : null)}</div>
            <div><span className="font-semibold">Tax Card:</span> {displayValue(supplier.taxCardUrl)}</div>
            <div><span className="font-semibold">Trade License:</span> {displayValue(supplier.tradeLicense)}</div>
            <div></div>
            <div><span className="font-semibold">ICV Score:</span> {displayValue(supplier.icvScore ? `${supplier.icvScore}%` : null)}</div>
            <div><span className="font-semibold">ICV Certificate No.:</span> {displayValue(supplier.icvCertificateNumber)}</div>
            <div><span className="font-semibold">ICV Expiry:</span> {displayValue(supplier.icvExpiry ? new Date(supplier.icvExpiry).toLocaleDateString() : null)}</div>
            <div><span className="font-semibold">ICV Certificate:</span> {displayValue(supplier.icvUrl)}</div>
          </div>
        </div>

        {/* Capabilities */}
        {supplier.capabilities?.length > 0 && (
          <div className="border rounded-lg p-5 bg-white mb-4 shadow-sm print-section">
            <h2 className="text-lg font-bold mb-3 border-b pb-2 text-slate-800">Capabilities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-xs">
              {supplier.capabilities.map((c: any) => (
                <div key={c.id} className="p-1 bg-slate-50 rounded border">
                  <div className="font-semibold">{displayValue(c.category)} — {displayValue(c.name)}</div>
                  <div className="text-slate-700">{displayValue(c.details)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {supplier.certifications?.length > 0 && (
          <div className="border rounded-lg p-5 bg-white mb-4 shadow-sm print-section">
            <h2 className="text-lg font-bold mb-3 border-b pb-2 text-slate-800">Certifications</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-xs">
              {supplier.certifications.map((c: any) => (
                <div key={c.id} className="p-1 bg-slate-50 rounded border">
                  <div className="font-semibold">{displayValue(c.name)}</div>
                  <div className="text-slate-600">{displayValue(c.certNumber)} | {displayValue(c.issuedBy)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="border rounded-lg p-5 bg-white mb-4 shadow-sm print-section">
          <h2 className="text-lg font-bold mb-3 border-b pb-2 text-slate-800">Documents</h2>
          {supplier.documents?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-xs">
              {supplier.documents.map((d: any) => (
                <div key={d.id} className="p-1 bg-slate-50 rounded border">
                  <div className="font-semibold">{displayValue(d.type)}</div>
                  <div className="text-slate-600">{displayValue(d.filename)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600">No documents uploaded</p>
          )}
        </div>

        {/* Footer - Record Information */}
        <div className="mt-6 pt-3 border-t border-slate-200 text-xs text-slate-500 text-center no-print">
          <div className="flex justify-center gap-6">
            <div>Created: {supplier.createdAt ? new Date(supplier.createdAt).toLocaleString() : 'Not filled'}{supplier.createdBy && ` by ${supplier.createdBy}`}</div>
            <div>Last Updated: {supplier.updatedAt ? new Date(supplier.updatedAt).toLocaleString() : 'Not filled'}{supplier.updatedBy && ` by ${supplier.updatedBy}`}</div>
          </div>
        </div>
      </div>
    </>
  )
}