'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterSupplierPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [company, setCompany] = useState({ name: '', tradingName: '', email: '', phone: '', website: '', address: '' })
  const [contact, setContact] = useState({ name: '', role: '', email: '', phone: '' })
  const [capabilities, setCapabilities] = useState<any[]>([])
  const [capForm, setCapForm] = useState({ category: '', name: '', details: '' })
  const [files, setFiles] = useState<File[]>([])

  async function submit() {
    setLoading(true)
    try {
      const res = await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...company, contact }) })
      if (!res.ok) throw new Error('Failed to create supplier')
      const created = await res.json()

      // upload documents
      for (const f of files) {
        const formData = new FormData()
        formData.append('file', f)
        formData.append('type', 'TRADE_LICENSE')
        await fetch(`/api/suppliers/${created.id}/documents`, { method: 'POST', body: formData })
      }

      // add capabilities
      for (const c of capabilities) {
        await fetch(`/api/suppliers/${created.id}/capabilities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) })
      }

      router.push(`/suppliers/${created.id}`)
    } catch (err: any) {
      alert(err.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Register Supplier</h1>

      {step === 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <Label>Company name</Label>
              <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
            </div>
            <div>
              <Label>Trading name</Label>
              <Input value={company.tradingName} onChange={(e) => setCompany({ ...company, tradingName: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setStep(1)} disabled={!company.name}>Next</Button>
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 className="font-semibold mb-2">Primary Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <Label>Name</Label>
              <Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={contact.role} onChange={(e) => setContact({ ...contact, role: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setStep(0)} variant="outline">Back</Button>
            <Button onClick={() => setStep(2)}>Next</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="font-semibold mb-2">Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
            <div>
              <Label>Category</Label>
              <Input value={capForm.category} onChange={(e) => setCapForm({ ...capForm, category: e.target.value })} />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={capForm.name} onChange={(e) => setCapForm({ ...capForm, name: e.target.value })} />
            </div>
            <div>
              <Label className="sr-only">Add</Label>
              <Button onClick={() => { if (capForm.name) { setCapabilities([...capabilities, capForm]); setCapForm({ category: '', name: '', details: '' }) } }}>Add</Button>
            </div>
            <div className="md:col-span-3 mt-2">
              {capabilities.map((c, i) => (
                <div key={i} className="p-2 border rounded mb-2 flex justify-between items-center">
                  <div><strong>{c.category}</strong> — {c.name}</div>
                  <Button variant="destructive" size="sm" onClick={() => setCapabilities(capabilities.filter((_, idx) => idx !== i))}>Remove</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={() => setStep(1)} variant="outline">Back</Button>
            <Button onClick={() => setStep(3)}>Next</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="font-semibold mb-2">Documents</h2>
          <p className="text-sm text-slate-600 mb-2">Upload trade license, insurance, certifications</p>
          <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="mt-4">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-2 border rounded mb-2">
                <div>{f.name}</div>
                <Button variant="destructive" size="sm" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>Remove</Button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={() => setStep(2)} variant="outline">Back</Button>
            <Button onClick={() => setStep(4)}>Review</Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="font-semibold mb-2">Review & Submit</h2>
          <div className="border p-3 rounded mb-3">
            <div className="font-semibold">Company</div>
            <div>{company.name} {company.tradingName ? `(${company.tradingName})` : ''}</div>
            <div className="text-sm text-slate-600">{company.email} • {company.phone}</div>
          </div>

          <div className="border p-3 rounded mb-3">
            <div className="font-semibold">Primary contact</div>
            <div>{contact.name} — {contact.role}</div>
            <div className="text-sm text-slate-600">{contact.email} • {contact.phone}</div>
          </div>

          <div className="mb-4">
            <Button onClick={() => setStep(3)} variant="outline">Back</Button>
            <Button onClick={submit} className="ml-2" disabled={loading}>{loading ? 'Submitting...' : 'Submit Registration'}</Button>
          </div>
        </div>
      )}
    </div>
  )
}