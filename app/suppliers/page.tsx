'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<any>({ name: '', contactPerson: '', email: '', phone: '', address: '', paymentTerms: '', leadTimeDays: 0 })
  const [editingId, setEditingId] = useState<string | null>(null)
  const { data: session } = useSession()
  const [approval, setApproval] = useState<{ open: boolean; supplier: any | null; notes: string }>({ open: false, supplier: null, notes: '' })
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'>('ALL')

  useEffect(() => { fetchSuppliers() }, [])

  async function fetchSuppliers(query?: string, status?: string) {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (status && status !== 'ALL') params.set('status', status)
    const res = await fetch(`/api/suppliers?${params.toString()}`)
    const data = await res.json()
    setSuppliers(data)
    setLoading(false)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (editingId) {
      const res = await fetch('/api/suppliers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, id: editingId }) })
      if (!res.ok) return alert('Update failed')
      setEditingId(null)
      setForm({ name: '', contactPerson: '', email: '', phone: '', address: '', paymentTerms: '', leadTimeDays: 0 })
      fetchSuppliers()
    } else {
      const res = await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) return alert('Create failed')
      setForm({ name: '', contactPerson: '', email: '', phone: '', address: '', paymentTerms: '', leadTimeDays: 0 })
      fetchSuppliers()
    }
  }

  async function edit(s: any) {
    setEditingId(s.id)
    setForm(s)
  }

  async function remove(id: string) {
    if (!confirm('Delete supplier?')) return
    const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' })
    if (!res.ok) return alert('Delete failed')
    fetchSuppliers()
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">Suppliers</h1>
          <div className="mt-2 flex gap-2 items-center">
            <Input placeholder="Search suppliers" value={q} onChange={(e) => setQ((e.target as HTMLInputElement).value)} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <Button onClick={() => fetchSuppliers(q, statusFilter)}>Search</Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = '/suppliers/register'}>Register Supplier</Button>
          <Button onClick={() => fetchSuppliers(q, statusFilter)} variant="outline">Refresh</Button>
        </div>
      </div>

      <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Contact person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="Payment terms" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} />
        <Input placeholder="Lead time (days)" type="number" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: parseInt(e.target.value || '0') })} />
        <div className="md:col-span-3 flex gap-2">
          <Button type="submit" className="bg-blue-600">{editingId ? 'Save' : 'Create'}</Button>
          {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm({ name: '', contactPerson: '', email: '', phone: '', address: '', paymentTerms: '', leadTimeDays: 0 }) }}>Cancel</Button>}
        </div>
      </form>

      {loading ? <div>Loading...</div> : (
        <div className="space-y-2">
          {suppliers.map(s => (
            <div key={s.id} className="border p-3 rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">{s.name} {s.tradingName ? `(${s.tradingName})` : ''} {s.status ? <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 text-sm">{s.status}</span> : null}</div>
                <div className="text-sm text-slate-600">{s.contactPerson} • {s.phone} • {s.email}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => window.location.href = `/suppliers/${s.id}`}>View</Button>
                {s.status === 'PENDING' && session?.user?.role === 'ADMIN' && <Button size="sm" onClick={() => setApproval({ open: true, supplier: s, notes: '' })}>Approve</Button>}
                <Button size="sm" variant="outline" onClick={() => edit(s)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(s.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {approval.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded max-w-md w-full">
            <h3 className="font-semibold mb-2">Approve supplier</h3>
            <div className="mb-2">Approve <strong>{approval.supplier?.name}</strong>?</div>
            <textarea className="w-full border p-2" placeholder="Notes (optional)" value={approval.notes} onChange={(e) => setApproval({ ...approval, notes: e.target.value })}></textarea>
            <div className="mt-3 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setApproval({ open: false, supplier: null, notes: '' })}>Cancel</Button>
              <Button onClick={async () => {
                try {
                  const res = await fetch(`/api/suppliers/${approval.supplier.id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'APPROVED', notes: approval.notes }) })
                  if (!res.ok) throw new Error('Failed')
                  setApproval({ open: false, supplier: null, notes: '' })
                  fetchSuppliers()
                } catch (err) { alert('Failed to approve') }
              }}>Approve</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}