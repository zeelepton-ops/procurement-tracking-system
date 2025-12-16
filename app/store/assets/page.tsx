"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading'
import { Edit2, Trash2 } from 'lucide-react'

interface Asset {
  id: string
  code: string
  name: string
  category: string | null
  status: string | null
  location: string | null
  dateOfPurchase: string | null
  manufacturer: string | null
  updatedAt?: string
}

const emptyAsset: Asset = {
  id: '',
  code: '',
  name: '',
  category: null,
  status: null,
  location: null,
  dateOfPurchase: null,
  manufacturer: null,
}

const CATEGORY_PREFIX: Record<string, string> = {
  'BUILDING & FACILITY': '10',
  'FURNITURES & FIXTURES': '20',
  'IT & COMM': '30',
  'VEHICLES': '40',
  'TOOLS': '50',
  'HEAVY MACHINERY': '60',
  'HEAVY EQUIPMENT': '70',
}
const getNextCodeForCategory = (category: string | null, assets: Asset[], excludeId?: string) => {
  if (!category) return ''
  const prefix = CATEGORY_PREFIX[category]
  if (!prefix) return ''
  const max = assets.reduce((acc, asset) => {
    if (!asset.code || !asset.code.startsWith(prefix)) return acc
    if (excludeId && asset.id === excludeId) return acc
    const suffix = asset.code.slice(prefix.length)
    const num = parseInt(suffix, 10)
    return Number.isFinite(num) ? Math.max(acc, num) : acc
  }, 0)
  const next = max + 1
  return `${prefix}${String(next).padStart(3, '0')}`
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Asset>(emptyAsset)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [sortBy, setSortBy] = useState('code')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isEditing = useMemo(() => Boolean(draft.id), [draft.id])

  const filteredAssets = useMemo(() => {
    let result = assets.filter((asset) => {
      const matchesSearch = searchTerm === '' || 
        asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      const matchesCategory = filterCategory === '' || asset.category === filterCategory
      const matchesLocation = filterLocation === '' || asset.location === filterLocation
      return matchesSearch && matchesCategory && matchesLocation
    })

    if (sortBy === 'name') {
      result = result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'category') {
      result = result.sort((a, b) => (a.category || '').localeCompare(b.category || ''))
    } else {
      result = result.sort((a, b) => a.code.localeCompare(b.code))
    }

    return result
  }, [assets, searchTerm, filterCategory, filterLocation, sortBy])

  const uniqueCategories = useMemo(() => [...new Set(assets.map((a) => a.category).filter((v): v is string => Boolean(v)))].sort(), [assets])
  const uniqueLocations = useMemo(() => [...new Set(assets.map((a) => a.location).filter((v): v is string => Boolean(v)))].sort(), [assets])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/assets')
      if (!res.ok) throw new Error('Failed to load assets')
      const data = await res.json()
      setAssets(data ?? [])
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
    if (!assets.length) return
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      const rows = assets.map((a) => ({
        Code: a.code,
        Name: a.name,
        Category: a.category || '',
        'Category Prefix': a.category ? CATEGORY_PREFIX[a.category] : (a.code ? a.code.slice(0,2) : ''),
        'Date of Purchase': a.dateOfPurchase ? new Date(a.dateOfPurchase).toLocaleDateString() : '',
        Manufacturer: a.manufacturer || '',
        Status: a.status || '',
        Location: a.location || '',
      }))
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'Assets')
      XLSX.writeFile(wb, 'assets.xlsx')
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

      const normalize = (row: Record<string, any>) => {
        const pick = (...keys: string[]) => keys.map((k) => row[k])
          .find((v) => v !== undefined && v !== null && String(v).trim() !== '')
        const code = pick('code', 'Code', 'CODE')
        const name = pick('name', 'Name', 'NAME')
        if (!code || !name) return null
        return {
          code: String(code).trim(),
          name: String(name).trim(),
          category: pick('category', 'Category'),
          status: pick('status', 'Status') || 'ACTIVE',
          location: pick('location', 'Location'),
          dateOfPurchase: pick('dateOfPurchase', 'Date of Purchase', 'Purchase Date', 'DateOfPurchase'),
          manufacturer: pick('manufacturer', 'Manufacturer', 'Mfg'),
        }
      }

      const payloads = rows.map(normalize).filter(Boolean) as Array<{
        code: string
        name: string
        category?: string | null
        status?: string | null
        location?: string | null
        dateOfPurchase?: string | null
        manufacturer?: string | null
      }>

      for (const payload of payloads) {
        await fetch('/api/assets', {
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
        code: draft.code,
        name: draft.name,
        status: draft.status || null,
        location: draft.location || null,
        category: draft.category || null,
        dateOfPurchase: draft.dateOfPurchase || null,
        manufacturer: draft.manufacturer || null,
      }

      const res = await fetch('/api/assets', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: draft.id || undefined }),
      })
      if (!res.ok) throw new Error('Save failed')
      await load()
      setDraft(emptyAsset)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (asset: Asset) => {
    setDraft({ ...asset })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/assets?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      await load()
      if (draft.id === id) setDraft(emptyAsset)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assets</h1>
            <p className="text-slate-600 text-sm">Create, edit, and remove assets.</p>
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
              disabled={exporting || loading || assets.length === 0}
            >
              {exporting ? 'Exporting…' : 'Export Excel'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Asset List</CardTitle>
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    type="text"
                    placeholder="Search by code, name or manufacturer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-sm"
                  />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded text-sm"
                  >
                    <option value="">All Categories</option>
                    {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded text-sm"
                  >
                    <option value="">All Locations</option>
                    {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded text-sm"
                  >
                    <option value="code">Sort by Code</option>
                    <option value="name">Sort by Name</option>
                    <option value="category">Sort by Category</option>
                  </select>
                </div>
                {(searchTerm || filterCategory || filterLocation) && (
                  <div className="text-sm text-slate-600">
                    Showing {filteredAssets.length} of {assets.length} assets
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-6 text-center text-slate-500"><LoadingSpinner className="h-5 w-5 inline" /> Loading…</div>
              ) : error ? (
                <div className="text-red-600 text-sm">{error}</div>
              ) : assets.length === 0 ? (
                <div className="text-sm text-slate-600">No assets yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600">
                        <th className="py-2 pr-3">Code</th>
                        <th className="py-2 pr-3">Name</th>
                        <th className="py-2 pr-3">Category</th>
                        <th className="py-2 pr-3">Category Prefix</th>
                        <th className="py-2 pr-3">Purchase Date</th>
                        <th className="py-2 pr-3">Manufacturer</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Location</th>
                        <th className="py-2 pr-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAssets.map((asset) => (
                        <tr key={asset.id} className="align-top">
                          <td className="py-2 pr-3 font-medium text-slate-900">{asset.code}</td>
                          <td className="py-2 pr-3">{asset.name}</td>
                          <td className="py-2 pr-3">{asset.category || '—'}</td>
                          <td className="py-2 pr-3">{asset.category ? CATEGORY_PREFIX[asset.category] : (asset.code ? asset.code.slice(0,2) : '—')}</td>
                          <td className="py-2 pr-3">{asset.dateOfPurchase ? new Date(asset.dateOfPurchase).toLocaleDateString() : '—'}</td>
                          <td className="py-2 pr-3">{asset.manufacturer || '—'}</td>
                          <td className="py-2 pr-3">{asset.status || '—'}</td>
                          <td className="py-2 pr-3">{asset.location || '—'}</td>
                          <td className="py-2 pr-3 space-x-2 flex items-center">
                            <button onClick={() => handleEdit(asset)} className="p-1 hover:bg-blue-100 rounded text-blue-600 hover:text-blue-700" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(asset.id)} className="p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700" title="Delete"><Trash2 size={16} /></button>
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
              <CardTitle>{isEditing ? 'Edit Asset' : 'Add Asset'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="code">Code</Label>
                    <Input
                      id="code"
                      required
                      value={draft.code}
                      onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                      placeholder="10xxxx / 20xxxx / 30xxxx..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                      value={draft.category ?? ''}
                      onChange={(e) => {
                        const category = e.target.value || null
                        setDraft((prev) => {
                          let code = prev.code
                          if (category) {
                            const nextCode = getNextCodeForCategory(category, assets, prev.id)
                            const prefix = CATEGORY_PREFIX[category]
                            if (!code || (prefix && !code.startsWith(prefix))) {
                              code = nextCode || `${prefix}000`
                            }
                          }
                          return { ...prev, category, code }
                        })
                      }}
                    >
                      <option value="">Select category</option>
                      <option value="BUILDING & FACILITY">BUILDING & FACILITY (10xxx)</option>
                      <option value="FURNITURES & FIXTURES">FURNITURES & FIXTURES (20xxx)</option>
                      <option value="IT & COMM">IT & COMM (30xxx)</option>
                      <option value="VEHICLES">VEHICLES (40xxx)</option>
                      <option value="TOOLS">TOOLS (50xxx)</option>
                      <option value="HEAVY MACHINERY">HEAVY MACHINERY (60xxx)</option>
                      <option value="HEAVY EQUIPMENT">HEAVY EQUIPMENT (70xxx)</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Category codes start with: 10/20/30/40/50/60/70 for the categories above.</p>

                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    required
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="status">Status</Label>
                    <Input
                      id="status"
                      value={draft.status ?? ''}
                      onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={draft.location ?? ''}
                      onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="categoryPrefix">Category Prefix</Label>
                    <Input
                      id="categoryPrefix"
                      readOnly
                      value={draft.category ? CATEGORY_PREFIX[draft.category] : (draft.code ? draft.code.slice(0,2) : '')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dateOfPurchase">Date of Purchase</Label>
                    <Input
                      id="dateOfPurchase"
                      type="date"
                      value={draft.dateOfPurchase ? draft.dateOfPurchase.split('T')[0] : ''}
                      onChange={(e) => setDraft({ ...draft, dateOfPurchase: e.target.value || null })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={draft.manufacturer ?? ''}
                      onChange={(e) => setDraft({ ...draft, manufacturer: e.target.value })}
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isEditing ? 'Update' : 'Create'}</Button>
                  {isEditing && (
                    <Button type="button" variant="ghost" onClick={() => setDraft(emptyAsset)} disabled={saving}>
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
