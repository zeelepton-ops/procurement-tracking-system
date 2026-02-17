'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading'
import { Plus, Edit2, Trash2, ClipboardList, PackageOpen, TrendingUp, Warehouse } from 'lucide-react'

const ITEM_TYPES = ['Pipes/Tubes', 'Chequered Plate', 'MS Plates']

interface ManufacturingItem {
  id: string
  batchNo: string
  itemType: string
  size: string | null
  thickness: string | null
  length: string | null
  unit: string
  grade: string | null
  storageLocation: string | null
  currentStock: number
  updatedAt?: string
}

interface DeliveryEntry {
  id: string
  itemId: string
  date: string
  quantity: number
  unit: string
  client: string | null
  remarks: string | null
  item: ManufacturingItem
}

interface ProductionEntry {
  id: string
  itemId: string
  date: string
  quantity: number
  unit: string
  remarks: string | null
  item: ManufacturingItem
}

interface StockUpdateEntry {
  id: string
  itemId: string
  date: string
  newStock: number
  adjustmentQty: number
  unit: string
  remarks: string | null
  item: ManufacturingItem
}

const emptyItem: ManufacturingItem = {
  id: '',
  batchNo: '',
  itemType: ITEM_TYPES[0],
  size: null,
  thickness: null,
  length: null,
  unit: 'Pcs',
  grade: null,
  storageLocation: null,
  currentStock: 0,
}

export default function ManufacturingInventoryPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'items' | 'delivery' | 'production' | 'stock' | 'report'>('items')
  const [items, setItems] = useState<ManufacturingItem[]>([])
  const [deliveryEntries, setDeliveryEntries] = useState<DeliveryEntry[]>([])
  const [productionEntries, setProductionEntries] = useState<ProductionEntry[]>([])
  const [stockUpdates, setStockUpdates] = useState<StockUpdateEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [draftItem, setDraftItem] = useState<ManufacturingItem>(emptyItem)

  const [deliveryDraft, setDeliveryDraft] = useState({
    itemId: '',
    date: '',
    quantity: '',
    unit: 'Pcs',
    client: '',
    remarks: ''
  })
  const [productionDraft, setProductionDraft] = useState({
    itemId: '',
    date: '',
    quantity: '',
    unit: 'Pcs',
    remarks: ''
  })
  const [stockDraft, setStockDraft] = useState({
    itemId: '',
    date: '',
    newStock: '',
    unit: 'Pcs',
    remarks: ''
  })

  const isEditing = Boolean(draftItem.id)

  const loadItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (filterType) params.set('itemType', filterType)
      if (filterLocation) params.set('location', filterLocation)
      const res = await fetch(`/api/manufacturing-inventory/items?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load items')
      const data = await res.json()
      setItems(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  const loadEntries = async () => {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const [deliveryRes, productionRes, stockRes] = await Promise.all([
        fetch(`/api/manufacturing-inventory/delivery-entries?${params.toString()}`),
        fetch(`/api/manufacturing-inventory/production-entries?${params.toString()}`),
        fetch(`/api/manufacturing-inventory/stock-updates?${params.toString()}`)
      ])

      if (deliveryRes.ok) setDeliveryEntries(await deliveryRes.json())
      if (productionRes.ok) setProductionEntries(await productionRes.json())
      if (stockRes.ok) setStockUpdates(await stockRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries')
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    loadEntries()
  }, [dateFrom, dateTo])

  const locations = useMemo(
    () => [...new Set(items.map((item) => item.storageLocation).filter(Boolean))].sort() as string[],
    [items]
  )

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = searchTerm === '' ||
        item.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.size || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.thickness || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.grade || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = !filterType || item.itemType === filterType
      const matchesLocation = !filterLocation || item.storageLocation === filterLocation
      return matchesSearch && matchesType && matchesLocation
    })
  }, [items, searchTerm, filterType, filterLocation])

  const totals = useMemo(() => {
    const totalStock = items.reduce((sum, item) => sum + (item.currentStock || 0), 0)
    return {
      itemCount: items.length,
      totalStock
    }
  }, [items])

  const resetDrafts = () => {
    setDraftItem(emptyItem)
    setDeliveryDraft({ itemId: '', date: '', quantity: '', unit: 'Pcs', client: '', remarks: '' })
    setProductionDraft({ itemId: '', date: '', quantity: '', unit: 'Pcs', remarks: '' })
    setStockDraft({ itemId: '', date: '', newStock: '', unit: 'Pcs', remarks: '' })
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...draftItem,
        currentStock: Number(draftItem.currentStock) || 0
      }
      const res = await fetch('/api/manufacturing-inventory/items', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to save item')
      resetDrafts()
      await loadItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return
    try {
      const res = await fetch(`/api/manufacturing-inventory/items?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete item')
      await loadItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item')
    }
  }

  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/manufacturing-inventory/delivery-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...deliveryDraft,
          quantity: Number(deliveryDraft.quantity) || 0,
          createdBy: session?.user?.email || null
        })
      })
      if (!res.ok) throw new Error('Failed to save delivery entry')
      resetDrafts()
      await Promise.all([loadItems(), loadEntries()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save delivery entry')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitProduction = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/manufacturing-inventory/production-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productionDraft,
          quantity: Number(productionDraft.quantity) || 0,
          createdBy: session?.user?.email || null
        })
      })
      if (!res.ok) throw new Error('Failed to save production entry')
      resetDrafts()
      await Promise.all([loadItems(), loadEntries()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save production entry')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitStock = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/manufacturing-inventory/stock-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...stockDraft,
          newStock: Number(stockDraft.newStock) || 0,
          createdBy: session?.user?.email || null
        })
      })
      if (!res.ok) throw new Error('Failed to save stock update')
      resetDrafts()
      await Promise.all([loadItems(), loadEntries()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save stock update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manufacturing Inventory</h1>
            <p className="text-sm text-slate-600">Track manufacturing stock, deliveries, and production updates</p>
          </div>
          <div className="flex gap-2">
            <Button variant={activeTab === 'items' ? 'default' : 'outline'} onClick={() => setActiveTab('items')}>Items</Button>
            <Button variant={activeTab === 'delivery' ? 'default' : 'outline'} onClick={() => setActiveTab('delivery')}>Daily Delivery</Button>
            <Button variant={activeTab === 'production' ? 'default' : 'outline'} onClick={() => setActiveTab('production')}>Daily Production</Button>
            <Button variant={activeTab === 'stock' ? 'default' : 'outline'} onClick={() => setActiveTab('stock')}>Daily Stock Update</Button>
            <Button variant={activeTab === 'report' ? 'default' : 'outline'} onClick={() => setActiveTab('report')}>Delivery Report</Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border border-slate-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Total Items</CardTitle>
              <Warehouse className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent className="text-xl font-semibold text-slate-900">{totals.itemCount}</CardContent>
          </Card>
          <Card className="border border-slate-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Total Stock</CardTitle>
              <PackageOpen className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent className="text-xl font-semibold text-slate-900">{totals.totalStock.toFixed(2)}</CardContent>
          </Card>
          <Card className="border border-slate-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Last Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent className="text-xs text-slate-600">Updated daily logs and stock entries.</CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Search</Label>
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Batch, size, grade" />
            </div>
            <div>
              <Label className="text-xs">Item Type</Label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full mt-1 h-9 border border-slate-300 rounded-md text-sm">
                <option value="">All</option>
                {ITEM_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="w-full mt-1 h-9 border border-slate-300 rounded-md text-sm">
                <option value="">All</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Date Range</Label>
              <div className="flex gap-2">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : (
          <>
            {activeTab === 'items' && (
              <Card className="border border-slate-200">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Items</CardTitle>
                  <Button size="sm" onClick={resetDrafts} variant="outline">
                    <Plus className="h-4 w-4 mr-1" />New
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <form onSubmit={handleSaveItem} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Batch No.</Label>
                      <Input value={draftItem.batchNo} onChange={(e) => setDraftItem({ ...draftItem, batchNo: e.target.value })} required />
                    </div>
                    <div>
                      <Label className="text-xs">Item Type</Label>
                      <select value={draftItem.itemType} onChange={(e) => setDraftItem({ ...draftItem, itemType: e.target.value })} className="w-full mt-1 h-9 border border-slate-300 rounded-md text-sm">
                        {ITEM_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Unit</Label>
                      <Input value={draftItem.unit} onChange={(e) => setDraftItem({ ...draftItem, unit: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Size</Label>
                      <Input value={draftItem.size || ''} onChange={(e) => setDraftItem({ ...draftItem, size: e.target.value || null })} />
                    </div>
                    <div>
                      <Label className="text-xs">Thickness</Label>
                      <Input value={draftItem.thickness || ''} onChange={(e) => setDraftItem({ ...draftItem, thickness: e.target.value || null })} />
                    </div>
                    <div>
                      <Label className="text-xs">Length</Label>
                      <Input value={draftItem.length || ''} onChange={(e) => setDraftItem({ ...draftItem, length: e.target.value || null })} />
                    </div>
                    <div>
                      <Label className="text-xs">Grade</Label>
                      <Input value={draftItem.grade || ''} onChange={(e) => setDraftItem({ ...draftItem, grade: e.target.value || null })} />
                    </div>
                    <div>
                      <Label className="text-xs">Storage Location</Label>
                      <Input value={draftItem.storageLocation || ''} onChange={(e) => setDraftItem({ ...draftItem, storageLocation: e.target.value || null })} />
                    </div>
                    <div>
                      <Label className="text-xs">Current Stock</Label>
                      <Input type="number" value={draftItem.currentStock} onChange={(e) => setDraftItem({ ...draftItem, currentStock: Number(e.target.value) })} />
                    </div>
                    <div className="md:col-span-3 flex gap-2">
                      <Button type="submit" disabled={saving}>{isEditing ? 'Update Item' : 'Add Item'}</Button>
                      {isEditing && (
                        <Button type="button" variant="outline" onClick={resetDrafts}>Cancel</Button>
                      )}
                    </div>
                  </form>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-10 gap-2 bg-slate-50 text-xs font-semibold text-slate-600 px-3 py-2">
                      <div>Batch</div>
                      <div>Type</div>
                      <div>Size</div>
                      <div>Thickness</div>
                      <div>Length</div>
                      <div>Grade</div>
                      <div>Unit</div>
                      <div>Stock</div>
                      <div>Location</div>
                      <div className="text-right">Actions</div>
                    </div>
                    {filteredItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-10 gap-2 px-3 py-2 text-xs text-slate-700 border-t border-slate-100">
                        <div>{item.batchNo}</div>
                        <div>{item.itemType}</div>
                        <div>{item.size || '-'}</div>
                        <div>{item.thickness || '-'}</div>
                        <div>{item.length || '-'}</div>
                        <div>{item.grade || '-'}</div>
                        <div>{item.unit}</div>
                        <div>{item.currentStock.toFixed(2)}</div>
                        <div>{item.storageLocation || '-'}</div>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setDraftItem(item)}><Edit2 className="h-3 w-3" /></Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'delivery' && (
              <Card className="border border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Daily Delivery Entries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <form onSubmit={handleSubmitDelivery} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Item</Label>
                      <select value={deliveryDraft.itemId} onChange={(e) => setDeliveryDraft({ ...deliveryDraft, itemId: e.target.value })} className="w-full mt-1 h-9 border border-slate-300 rounded-md text-sm">
                        <option value="">Select item</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>{item.batchNo} - {item.itemType}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Date</Label>
                      <Input type="date" value={deliveryDraft.date} onChange={(e) => setDeliveryDraft({ ...deliveryDraft, date: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" value={deliveryDraft.quantity} onChange={(e) => setDeliveryDraft({ ...deliveryDraft, quantity: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Unit</Label>
                      <Input value={deliveryDraft.unit} onChange={(e) => setDeliveryDraft({ ...deliveryDraft, unit: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Client</Label>
                      <Input value={deliveryDraft.client} onChange={(e) => setDeliveryDraft({ ...deliveryDraft, client: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">Remarks</Label>
                      <Input value={deliveryDraft.remarks} onChange={(e) => setDeliveryDraft({ ...deliveryDraft, remarks: e.target.value })} />
                    </div>
                    <div className="md:col-span-4">
                      <Button type="submit" disabled={saving} className="w-full">Save Entry</Button>
                    </div>
                  </form>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-8 gap-2 bg-slate-50 text-xs font-semibold text-slate-600 px-3 py-2">
                      <div>Date</div>
                      <div>Item</div>
                      <div>Size</div>
                      <div>Thickness</div>
                      <div>Qty</div>
                      <div>Unit</div>
                      <div>Client</div>
                      <div>Remarks</div>
                    </div>
                    {deliveryEntries.map((entry) => (
                      <div key={entry.id} className="grid grid-cols-8 gap-2 px-3 py-2 text-xs text-slate-700 border-t border-slate-100">
                        <div>{new Date(entry.date).toLocaleDateString()}</div>
                        <div>{entry.item.batchNo}</div>
                        <div>{entry.item.size || '-'}</div>
                        <div>{entry.item.thickness || '-'}</div>
                        <div>{entry.quantity}</div>
                        <div>{entry.unit}</div>
                        <div>{entry.client || '-'}</div>
                        <div>{entry.remarks || '-'}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'production' && (
              <Card className="border border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Daily Production Entries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <form onSubmit={handleSubmitProduction} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Item</Label>
                      <select value={productionDraft.itemId} onChange={(e) => setProductionDraft({ ...productionDraft, itemId: e.target.value })} className="w-full mt-1 h-9 border border-slate-300 rounded-md text-sm">
                        <option value="">Select item</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>{item.batchNo} - {item.itemType}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Date</Label>
                      <Input type="date" value={productionDraft.date} onChange={(e) => setProductionDraft({ ...productionDraft, date: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" value={productionDraft.quantity} onChange={(e) => setProductionDraft({ ...productionDraft, quantity: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Unit</Label>
                      <Input value={productionDraft.unit} onChange={(e) => setProductionDraft({ ...productionDraft, unit: e.target.value })} />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs">Remarks</Label>
                      <Input value={productionDraft.remarks} onChange={(e) => setProductionDraft({ ...productionDraft, remarks: e.target.value })} />
                    </div>
                    <div className="md:col-span-4">
                      <Button type="submit" disabled={saving} className="w-full">Save Entry</Button>
                    </div>
                  </form>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-7 gap-2 bg-slate-50 text-xs font-semibold text-slate-600 px-3 py-2">
                      <div>Date</div>
                      <div>Item</div>
                      <div>Size</div>
                      <div>Thickness</div>
                      <div>Qty</div>
                      <div>Unit</div>
                      <div>Remarks</div>
                    </div>
                    {productionEntries.map((entry) => (
                      <div key={entry.id} className="grid grid-cols-7 gap-2 px-3 py-2 text-xs text-slate-700 border-t border-slate-100">
                        <div>{new Date(entry.date).toLocaleDateString()}</div>
                        <div>{entry.item.batchNo}</div>
                        <div>{entry.item.size || '-'}</div>
                        <div>{entry.item.thickness || '-'}</div>
                        <div>{entry.quantity}</div>
                        <div>{entry.unit}</div>
                        <div>{entry.remarks || '-'}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'stock' && (
              <Card className="border border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Daily Stock Updates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <form onSubmit={handleSubmitStock} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Item</Label>
                      <select value={stockDraft.itemId} onChange={(e) => setStockDraft({ ...stockDraft, itemId: e.target.value })} className="w-full mt-1 h-9 border border-slate-300 rounded-md text-sm">
                        <option value="">Select item</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>{item.batchNo} - {item.itemType}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Date</Label>
                      <Input type="date" value={stockDraft.date} onChange={(e) => setStockDraft({ ...stockDraft, date: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">New Stock</Label>
                      <Input type="number" value={stockDraft.newStock} onChange={(e) => setStockDraft({ ...stockDraft, newStock: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Unit</Label>
                      <Input value={stockDraft.unit} onChange={(e) => setStockDraft({ ...stockDraft, unit: e.target.value })} />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs">Remarks</Label>
                      <Input value={stockDraft.remarks} onChange={(e) => setStockDraft({ ...stockDraft, remarks: e.target.value })} />
                    </div>
                    <div className="md:col-span-4">
                      <Button type="submit" disabled={saving} className="w-full">Save Update</Button>
                    </div>
                  </form>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-7 gap-2 bg-slate-50 text-xs font-semibold text-slate-600 px-3 py-2">
                      <div>Date</div>
                      <div>Item</div>
                      <div>New Stock</div>
                      <div>Adjustment</div>
                      <div>Unit</div>
                      <div>Location</div>
                      <div>Remarks</div>
                    </div>
                    {stockUpdates.map((entry) => (
                      <div key={entry.id} className="grid grid-cols-7 gap-2 px-3 py-2 text-xs text-slate-700 border-t border-slate-100">
                        <div>{new Date(entry.date).toLocaleDateString()}</div>
                        <div>{entry.item.batchNo}</div>
                        <div>{entry.newStock}</div>
                        <div>{entry.adjustmentQty.toFixed(2)}</div>
                        <div>{entry.unit}</div>
                        <div>{entry.item.storageLocation || '-'}</div>
                        <div>{entry.remarks || '-'}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'report' && (
              <Card className="border border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Daily Delivery Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-9 gap-2 bg-slate-50 text-xs font-semibold text-slate-600 px-3 py-2">
                      <div>Date</div>
                      <div>Item</div>
                      <div>Size</div>
                      <div>Thickness</div>
                      <div>Qty</div>
                      <div>Unit</div>
                      <div>Client</div>
                      <div>Current Stock</div>
                      <div>Remarks</div>
                    </div>
                    {deliveryEntries.map((entry) => (
                      <div key={entry.id} className="grid grid-cols-9 gap-2 px-3 py-2 text-xs text-slate-700 border-t border-slate-100">
                        <div>{new Date(entry.date).toLocaleDateString()}</div>
                        <div>{entry.item.batchNo}</div>
                        <div>{entry.item.size || '-'}</div>
                        <div>{entry.item.thickness || '-'}</div>
                        <div>{entry.quantity}</div>
                        <div>{entry.unit}</div>
                        <div>{entry.client || '-'}</div>
                        <div>{entry.item.currentStock.toFixed(2)}</div>
                        <div>{entry.remarks || '-'}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
