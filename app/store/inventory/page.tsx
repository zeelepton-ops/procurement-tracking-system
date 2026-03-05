"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading'
import { Edit2, Trash2 } from 'lucide-react'

const LOCATION_OPTIONS = ['Fabrication', 'Manufacturing'] as const

interface InventoryItem {
  id: string
  itemName: string
  currentStock: number
  unit: string
  minimumStock: number | null
  location: string | null
  description: string | null
  createdAt?: string
  updatedAt?: string
}

const emptyItem: InventoryItem = {
  id: '',
  itemName: '',
  currentStock: 0,
  unit: '',
  minimumStock: null,
  location: LOCATION_OPTIONS[0],
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
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isEditing = useMemo(() => Boolean(draft.id), [draft.id])

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchesSearch = searchTerm === '' || 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      const matchesLocation = filterLocation === '' || item.location === filterLocation
      return matchesSearch && matchesLocation
    })

    if (sortBy === 'qty') {
      result = result.sort((a, b) => a.currentStock - b.currentStock)
    } else if (sortBy === 'reorder') {
      result = result.sort((a, b) => {
        const ratioA = a.minimumStock ? a.currentStock / a.minimumStock : Infinity
        const ratioB = b.minimumStock ? b.currentStock / b.minimumStock : Infinity
        return ratioA - ratioB
      })
    } else {
      result = result.sort((a, b) => a.itemName.localeCompare(b.itemName))
    }

    return result
  }, [items, searchTerm, filterLocation, sortBy])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) || null,
    [items, selectedItemId]
  )

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/inventory')
      console.log('Inventory API response status:', res.status)
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Inventory API error:', errorData)
        throw new Error(errorData.error || 'Failed to load inventory')
      }
      const data = await res.json()
      console.log('Inventory data received:', data)
      console.log('Items count:', data?.length || 0)
      setItems(data ?? [])
      if (!selectedItemId && data?.length) {
        setSelectedItemId(data[0].id)
      }
    } catch (err) {
      console.error('Load inventory error:', err)
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
          const rawLocation = pick(row, ['location', 'Location'])
          const locationValue = String(rawLocation || '').trim().toLowerCase()
          const normalizedLocation = locationValue === 'manufacturing' ? 'Manufacturing' : 'Fabrication'
          return {
            itemName: String(itemName).trim(),
            currentStock: Number(pick(row, ['currentStock', 'Current Stock', 'Quantity', 'Qty']) || 0),
            unit: String(pick(row, ['unit', 'Unit']) || 'Nos'),
            minimumStock: Number(pick(row, ['minimumStock', 'Min', 'Minimum']) || 0),
            location: normalizedLocation,
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
    setSelectedItemId(item.id)
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="text"
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-sm"
                  />
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded text-sm"
                  >
                    <option value="">All Locations</option>
                    {LOCATION_OPTIONS.map((location) => <option key={location} value={location}>{location}</option>)}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded text-sm"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="qty">Sort by Qty (Low to High)</option>
                    <option value="reorder">Sort by Reorder Level (Near to Far)</option>
                  </select>
                </div>
                {(searchTerm || filterLocation) && (
                  <div className="text-sm text-slate-600">
                    Showing {filteredItems.length} of {items.length} items
                  </div>
                )}
              </div>
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
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-600 text-xs">
                        <th className="py-1 pr-3">Name</th>
                        <th className="py-1 pr-3">Description</th>
                        <th className="py-1 pr-3">Qty</th>
                        <th className="py-1 pr-3">Unit</th>
                        <th className="py-1 pr-3">Reorder Level</th>
                        <th className="py-1 pr-3">Location</th>
                        <th className="py-1 pr-3">Updated Timestamp</th>
                        <th className="py-1 pr-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className={`align-top cursor-pointer ${selectedItemId === item.id ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
                          onClick={() => setSelectedItemId(item.id)}
                        >
                          <td className="py-1 pr-3 font-medium text-slate-900">{item.itemName}</td>
                          <td className="py-1 pr-3 text-xs text-slate-600 max-w-xs truncate">{item.description || '—'}</td>
                          <td className="py-1 pr-3">{item.currentStock}</td>
                          <td className="py-1 pr-3">{item.unit}</td>
                          <td className="py-1 pr-3">{item.minimumStock ?? '—'}</td>
                          <td className="py-1 pr-3">{item.location || '—'}</td>
                          <td className="py-1 pr-3 text-slate-500">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}</td>
                          <td className="py-1 pr-3 space-x-2 flex items-center">
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(item) }} className="p-1 hover:bg-blue-100 rounded text-blue-600 hover:text-blue-700" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }} className="p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700" title="Delete"><Trash2 size={16} /></button>
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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">{isEditing ? 'Edit Item' : 'Add Item'}</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <form className="space-y-2" onSubmit={handleSubmit}>
                <div className="space-y-0.5">
                  <Label htmlFor="name" className="text-xs">Name</Label>
                  <Input
                    id="name"
                    required
                    value={draft.itemName}
                    onChange={(e) => setDraft({ ...draft, itemName: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="quantity" className="text-xs">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={draft.currentStock}
                      onChange={(e) => setDraft({ ...draft, currentStock: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="unit" className="text-xs">Unit</Label>
                    <Input
                      id="unit"
                      required
                      value={draft.unit}
                      onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="minimumQuantity" className="text-xs">Reorder Level</Label>
                    <Input
                      id="minimumQuantity"
                      type="number"
                      value={draft.minimumStock ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setDraft({ ...draft, minimumStock: val === '' ? null : Number(val) })
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Label htmlFor="location" className="text-xs">Location</Label>
                  <select
                    id="location"
                    value={draft.location ?? ''}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    className="h-8 text-xs w-full border border-slate-200 rounded px-2"
                  >
                    {LOCATION_OPTIONS.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-0.5">
                  <Label htmlFor="description" className="text-xs">Description</Label>
                  <Textarea
                    id="description"
                    rows={2}
                    value={draft.description ?? ''}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    className="text-xs p-2"
                  />
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <div className="flex items-center gap-2 pt-1">
                  <Button type="submit" disabled={saving} size="sm" className="text-xs h-8">{saving ? 'Saving…' : isEditing ? 'Update' : 'Create'}</Button>
                  {isEditing && (
                    <Button type="button" variant="ghost" onClick={() => setDraft(emptyItem)} disabled={saving} size="sm" className="text-xs h-8">
                      Cancel
                    </Button>
                  )}
                </div>
              </form>

              {selectedItem && (
                <div className="mt-4 border-t pt-3 space-y-1 text-xs">
                  <div className="font-semibold text-slate-800">Selected Item Details</div>
                  <div><span className="text-slate-500">Name:</span> {selectedItem.itemName}</div>
                  <div><span className="text-slate-500">Description:</span> {selectedItem.description || '—'}</div>
                  <div><span className="text-slate-500">Stock:</span> {selectedItem.currentStock} {selectedItem.unit}</div>
                  <div><span className="text-slate-500">Reorder Level:</span> {selectedItem.minimumStock ?? '—'}</div>
                  <div><span className="text-slate-500">Location:</span> {selectedItem.location || '—'}</div>
                  <div><span className="text-slate-500">Created:</span> {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : '—'}</div>
                  <div><span className="text-slate-500">Updated:</span> {selectedItem.updatedAt ? new Date(selectedItem.updatedAt).toLocaleString() : '—'}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
