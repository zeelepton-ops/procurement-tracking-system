"use client"

import React, { useEffect, useState, useRef } from 'react'

type Supplier = { id: string; name: string }
type POPrep = { id: string; createdAt: string }

type Enquiry = { id: string; prepId?: string; status?: string; _notificationCount?: number }
type EnquiryResponse = { id: string; supplierId: string; total: number; quoteJson: unknown; attachments?: { filename: string; url: string }[] }
type NotificationItem = { id: string; to: string; channel: string; status: string; createdAt: string }

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [preps, setPreps] = useState<POPrep[]>([])
  const [loading, setLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)

  // new enquiry form
  const [prepId, setPrepId] = useState<string | null>(null)
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [sendNow, setSendNow] = useState(false)

  useEffect(() => {
    fetchList()
    fetchSuppliers()
    fetchPreps()
  }, [])

  async function fetchList() {
    setLoading(true)
    const res = await fetch('/api/enquiries')
    const data = await res.json()
    setEnquiries(data.data ?? [])
    setLoading(false)
  }

  async function fetchSuppliers() {
    const res = await fetch('/api/suppliers')
    const data = await res.json()
    setSuppliers(data ?? [])
  }

  async function fetchPreps() {
    const res = await fetch('/api/po-prep')
    const data = await res.json()
    setPreps(data ?? [])
  }

  async function createEnquiry(e: React.FormEvent) {
    e.preventDefault()
    if (!prepId) return alert('Select a preparation')
    if (selectedSuppliers.length === 0) return alert('Select at least one supplier')

    const res = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prepId, supplierIds: selectedSuppliers, message, sendNow }),
    })
    if (!res.ok) {
      const err = await res.json()
      alert(err?.error || 'Failed')
      return
    }
    setShowNew(false)
    setPrepId(null)
    setSelectedSuppliers([])
    setMessage('')
    setSendNow(false)
    fetchList()
  }

  const selectedEnquiryRef = useRef<{ id: string } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [responses, setResponses] = useState<EnquiryResponse[]>([])
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([])

  async function viewResponses(enquiryId: string) {
    selectedEnquiryRef.current = { id: enquiryId }
    setModalOpen(true)

    const res = await fetch(`/api/enquiries/${enquiryId}`)
    const data = await res.json() as { responses?: EnquiryResponse[] }
    setResponses(data.responses ?? [])

    const nres = await fetch(`/api/notifications?enquiryId=${enquiryId}`)
    const ndata = await nres.json() as NotificationItem[]
    setNotificationsList(ndata || [])
  }

  async function closeModal() {
    selectedEnquiryRef.current = null
    setResponses([])
    setNotificationsList([])
    setModalOpen(false)
  }

  async function submitResponse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!modalOpen || !selectedEnquiryRef.current) return

    const fd = new FormData(e.currentTarget)
    const r = await fetch(`/api/enquiries/${selectedEnquiryRef.current.id}/responses`, { method: 'POST', body: fd })
    if (!r.ok) {
      alert('Failed to submit response')
      return
    }
    const resp = await r.json() as EnquiryResponse;
    setResponses([resp, ...responses]);
    (e.currentTarget as HTMLFormElement).reset();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Enquiries</h1>
        <button className="btn" onClick={() => setShowNew(true)}>New Enquiry</button>
      </div>

      {showNew && (
        <form className="p-4 border rounded mb-6" onSubmit={createEnquiry}>
          <div className="mb-2">
            <label className="block font-medium">PO Preparation</label>
            <select value={prepId ?? ''} onChange={(e) => setPrepId(e.target.value || null)} className="mt-1 block w-full border rounded p-2">
              <option value="">Select preparation</option>
              {preps.map((p: any) => (
                <option key={p.id} value={p.id}>{p.id} - {new Date(p.createdAt).toLocaleString()}</option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <label className="block font-medium">Suppliers</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {suppliers.map(s => (
                <label key={s.id} className="inline-flex items-center">
                  <input type="checkbox" checked={selectedSuppliers.includes(s.id)} onChange={(e) => {
                    if (e.target.checked) setSelectedSuppliers(prev => [...prev, s.id])
                    else setSelectedSuppliers(prev => prev.filter(id => id !== s.id))
                  }} />
                  <span className="ml-2">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <label className="block font-medium">Message (optional)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full border rounded p-2 mt-1" rows={4} />
          </div>

          <div className="flex items-center gap-4 mb-2">
            <label className="inline-flex items-center"><input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} className="mr-2" /> Send now</label>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">Create</button>
            <button type="button" className="btn" onClick={() => setShowNew(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="space-y-2">
          {enquiries.map(enq => (
            <div key={enq.id} className="p-3 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{enq.id}</div>
                <div className="text-sm text-muted">Prep: {enq.prepId} • Status: {enq.status}</div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-xs text-slate-500 mr-2">Notifications: <strong>{enq._notificationCount ?? '–'}</strong></div>
                <button className="btn" onClick={() => viewResponses(enq.id)}>View</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50">
          <div className="bg-white w-full max-w-3xl rounded shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl">Enquiry {selectedEnquiryRef.current?.id}</h2>
              <button className="btn" onClick={closeModal}>Close</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Responses</h3>
                {responses.length === 0 ? <div className="text-sm text-slate-500">No responses yet</div> : (
                  <div className="space-y-2">
                    {responses.map(r => (
                      <div key={r.id} className="p-2 border rounded">
                        <div className="text-sm font-medium">Supplier: {r.supplierId}</div>
                        <div className="text-xs text-slate-600">Total: {r.total}</div>
                        <div className="text-xs mt-1">Quote: <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(r.quoteJson, null, 2)}</pre></div>
                        {r.attachments && r.attachments.length > 0 && (
                          <div className="mt-2">
                            <div className="text-sm font-medium">Attachments</div>
                            <ul className="text-sm">
                              {r.attachments.map((a: any) => (
                                <li key={a.url}><a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600">{a.filename}</a></li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <h3 className="font-medium mt-4 mb-2">Notifications</h3>
                {notificationsList.length === 0 ? <div className="text-sm text-slate-500">No notifications</div> : (
                  <div className="space-y-2">
                    {notificationsList.map(n => (
                      <div key={n.id} className="p-2 border rounded flex justify-between items-center">
                        <div>
                          <div className="text-sm">To: {n.to}</div>
                          <div className="text-xs text-slate-600">Channel: {n.channel} • Status: {n.status}</div>
                        </div>
                        <div className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">Submit Response</h3>
                <form onSubmit={submitResponse} className="space-y-2">
                  <div>
                    <label className="block text-sm">Supplier ID</label>
                    <input name="supplierId" className="mt-1 block w-full border rounded p-2" required />
                  </div>

                  <div>
                    <label className="block text-sm">Quote (JSON)</label>
                    <textarea name="quoteJson" className="mt-1 block w-full border rounded p-2" rows={6} placeholder='[{"item": "A", "price": 100}]' />
                  </div>

                  <div>
                    <label className="block text-sm">Total</label>
                    <input name="total" type="number" step="0.01" className="mt-1 block w-full border rounded p-2" required />
                  </div>

                  <div>
                    <label className="block text-sm">Attachment (optional)</label>
                    <input name="file" type="file" className="mt-1" />
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary">Submit Response</button>
                    <button type="button" className="btn" onClick={async () => {
                      // Quick parse: if there are responses, try to parse the latest quote into a CSV/preview (example feature)
                      if ((responses || []).length === 0) return alert('No responses to parse')
                      const latest = (responses || [])[0]
                      try {
                        const q = latest.quoteJson
                        alert('Parsed quote items: ' + JSON.stringify(q, null, 2))
                      } catch (err) {
                        alert('Failed to parse quote')
                      }
                    }}>Quick Parse</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
