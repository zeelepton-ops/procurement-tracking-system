"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading'

interface InventoryItem {
  id: string
  itemName: string
  currentStock: number
  unit: string
  minimumStock: number | null
  location: string | null
  description: string | null
  updatedAt?: string
}

const emptyItem: InventoryItem = {
  id: '',
  itemName: '',
  currentStock: 0,
  unit: '',
  minimumStock: null,
  location: null,
  description: null,
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<InventoryItem>(emptyItem)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isEditing = useMemo(() => Boolean(draft.id), [draft.id])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/inventory')
      if (!res.ok) throw new Error('Failed to load inventory')
      const data = await res.json()
      setItems(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleExport = async () => {
    if (!items.length) return
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      const rows = items.map((item) => ({
        Name: item.itemName,
        Quantity: item.currentStock,
        Unit: item.unit,
        Minimum: item.minimumStock ?? '',
        Location: item.location || '',
        Description: item.description || '',
        UpdatedAt: item.updatedAt || '',
      }))
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
      XLSX.writeFile(wb, 'inventory.xlsx')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (file: File | null) => {
    if (!file) return
    setImporting(true)
    setError(null)
    try {
      const XLSX = await import('xlsx')
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })

      const pick = (row: Record<string, any>, keys: string[]) =>
        keys.map((k) => row[k]).find((v) => v !== undefined && v !== null && String(v).trim() !== '')

      const payloads = rows
        .map((row) => {
          const itemName = pick(row, ['itemName', 'Item Name', 'Name'])
          if (!itemName) return null
          return {
            itemName: String(itemName).trim(),
            currentStock: Number(pick(row, ['currentStock', 'Current Stock', 'Quantity', 'Qty']) || 0),
            unit: String(pick(row, ['unit', 'Unit']) || 'PCS'),
            minimumStock: Number(pick(row, ['minimumStock', 'Min', 'Minimum']) || 0),
            location: pick(row, ['location', 'Location']) || null,
            description: pick(row, ['description', 'Description']) || null,
          }
        })
        .filter(Boolean) as Array<{
          itemName: string
          currentStock: number
          unit: string
          minimumStock: number
          location: string | null
          description: string | null
        }>

      for (const payload of payloads) {
        await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        itemName: draft.itemName,
        description: draft.description || null,
        currentStock: Number.isFinite(draft.currentStock) ? draft.currentStock : 0,
        unit: draft.unit,
        minimumStock: draft.minimumStock !== null ? Number(draft.minimumStock) : null,
        location: draft.location || null,
      }

      const res = await fetch('/api/inventory', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: draft.id || undefined }),
      })
      if (!res.ok) throw new Error('Save failed')
      await load()
      setDraft(emptyItem)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setDraft({ ...item })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/inventory?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      await load()
      if (draft.id === id) setDraft(emptyItem)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
            <p className="text-slate-600 text-sm">Create, edit, and remove stock items.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleImport(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing || loading}
            >
              {importing ? 'Importing…' : 'Import Excel'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting || loading || items.length === 0}
            >
              {exporting ? 'Exporting…' : 'Export Excel'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-6 text-center text-slate-500"><LoadingSpinner className="h-5 w-5 inline" /> Loading…</div>
              ) : error ? (
                <div className="text-red-600 text-sm">{error}</div>
              ) : items.length === 0 ? (
                <div className="text-sm text-slate-600">No inventory yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600">
                        <th className="py-1 pr-3">Name</th>
                        <th className="py-1 pr-3">Description</th>
                        <th className="py-1 pr-3">Qty</th>
                        <th className="py-1 pr-3">Unit</th>
                        <th className="py-1 pr-3">Min</th>
                        <th className="py-1 pr-3">Location</th>
                        <th className="py-1 pr-3">Updated</th>
                        <th className="py-1 pr-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <tr key={item.id} className="align-top">
                          <td className="py-1 pr-3 font-medium text-slate-900">{item.itemName}</td>
                          <td className="py-1 pr-3 text-xs text-slate-600 max-w-xs truncate">{item.description || '—'}</td>
                          <td className="py-1 pr-3">{item.currentStock}</td>
                          <td className="py-1 pr-3">{item.unit}</td>
                          <td className="py-1 pr-3">{item.minimumStock ?? '—'}</td>
                          <td className="py-1 pr-3">{item.location || '—'}</td>
                          <td className="py-1 pr-3 text-slate-500">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}</td>
                          <td className="py-1 pr-3 space-x-1">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Item' : 'Add Item'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    required
                    value={draft.itemName}
                    onChange={(e) => setDraft({ ...draft, itemName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={draft.currentStock}
                      onChange={(e) => setDraft({ ...draft, currentStock: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      required
                      value={draft.unit}
                      onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="minimumQuantity">Minimum</Label>
                    <Input
                      id="minimumQuantity"
                      type="number"
                      value={draft.minimumStock ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setDraft({ ...draft, minimumStock: val === '' ? null : Number(val) })
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={draft.location ?? ''}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={draft.description ?? ''}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isEditing ? 'Update' : 'Create'}</Button>
                  {isEditing && (
                    <Button type="button" variant="ghost" onClick={() => setDraft(emptyItem)} disabled={saving}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
