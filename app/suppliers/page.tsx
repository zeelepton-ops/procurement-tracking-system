'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<any>({ name: '', contactPerson: '', email: '', phone: '', address: '', paymentTerms: '', leadTimeDays: 0 })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => { fetchSuppliers() }, [])

  async function fetchSuppliers() {
    setLoading(true)
    const res = await fetch('/api/suppliers')
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
      <h1 className="text-xl font-bold mb-4">Suppliers</h1>
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
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm text-slate-600">{s.contactPerson} • {s.phone} • {s.email}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(s)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(s.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}