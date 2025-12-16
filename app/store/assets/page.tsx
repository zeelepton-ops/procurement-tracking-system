"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading'

interface Asset {
  id: string
  code: string
  name: string
  category: string | null
  status: string | null
  location: string | null
  updatedAt?: string
}

const emptyAsset: Asset = {
  id: '',
  code: '',
  name: '',
  category: null,
  status: null,
  location: null,
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Asset>(emptyAsset)

  const isEditing = useMemo(() => Boolean(draft.id), [draft.id])

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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Asset List</CardTitle>
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
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Location</th>
                        <th className="py-2 pr-3">Updated</th>
                        <th className="py-2 pr-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {assets.map((asset) => (
                        <tr key={asset.id} className="align-top">
                          <td className="py-2 pr-3 font-medium text-slate-900">{asset.code}</td>
                          <td className="py-2 pr-3">{asset.name}</td>
                          <td className="py-2 pr-3">{asset.category || '—'}</td>
                          <td className="py-2 pr-3">{asset.status || '—'}</td>
                          <td className="py-2 pr-3">{asset.location || '—'}</td>
                          <td className="py-2 pr-3 text-slate-500">{asset.updatedAt ? new Date(asset.updatedAt).toLocaleDateString() : '—'}</td>
                          <td className="py-2 pr-3 space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(asset)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(asset.id)}>Delete</Button>
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
                <div className="space-y-1">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    required
                    value={draft.code}
                    onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    required
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="status">Status</Label>
                    <Input
                      id="status"
                      value={draft.status ?? ''}
                      onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={draft.category ?? ''}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value })}
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
