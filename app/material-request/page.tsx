'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import dynamic from 'next/dynamic'
import type { Suggestion } from '@/components/ui/autocomplete'
const Autocomplete = dynamic(() => import('@/components/ui/autocomplete').then(m => m.default), { ssr: false, loading: () => null })
import { useSession } from 'next-auth/react'

import { AlertCircle, Package, Clock, AlertTriangle, Plus, X, Trash2 } from 'lucide-react'
import ErrorBoundary from '@/components/ui/error-boundary'

interface JobOrder {
  id: string
  jobNumber: string
  productName: string
  drawingRef: string | null
  clientName?: string | null
}

interface InventoryItem {
  id: string
  itemName: string
  currentStock: number
  unit: string
}

interface Asset {
  id: string
  code: string
  name: string
  category?: string
  location?: string
  status?: string
}

interface Supplier {
  id: string
  name: string
  tradingName?: string | null
}

interface MaterialRequest {
  id: string
  requestNumber: string
  jobOrderId?: string
  jobOrder?: JobOrder
  assetId?: string
  asset?: Asset
  requestContext: string
  materialType: string
  itemName: string
  description: string
  quantity: number
  unit: string
  reasonForRequest: string
  requiredDate: string
  preferredSupplier: string | null
  stockQtyInInventory: number
  urgencyLevel: string
  status: string
  requestedBy: string
  requestedAt: string
  createdAt: string
  items?: Array<{
    id?: string
    itemName: string
    description: string
    quantity: number
    unit: string
    stockQtyInInventory: number
    reasonForRequest?: string | null
    urgencyLevel?: string | null
    requiredDate?: string | null
    preferredSupplier?: string | null
    inventoryItemId?: string | null
  }>
}

export default function MaterialRequestPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [deleteConfirm, setDeleteConfirm] = useState<{ requestId: string; itemId?: string } | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    urgency: 'ALL'
  })
  const { data: session, status } = useSession()
  const [items, setItems] = useState<Array<{ 
    itemName: string; 
    description: string; 
    quantity: string; 
    unit: string; 
    stockQty: string;
    reasonForRequest: string;
    urgencyLevel: string;
    requiredDate: string;
    preferredSupplier: string;
    // New: optional item-level job link
    jobOrderId?: string;
    // Transient UI flag set to true when the user links the item by selecting a Job suggestion in this session
    _linkedByJobSuggestion?: boolean;
    // NEW: per-line item status
    status?: string;
  }>>([{ 
    itemName: '', 
    description: '', 
    quantity: '', 
    unit: 'Nos', 
    stockQty: '0',
    reasonForRequest: '',
    urgencyLevel: 'NORMAL',
    requiredDate: '',
    preferredSupplier: '',
    jobOrderId: '',
    _linkedByJobSuggestion: false,
    status: 'PENDING'
  }])
  
  const [formData, setFormData] = useState({
    requestContext: 'WORKSHOP',
    jobOrderId: '',
    assetId: '',
    materialType: 'RAW_MATERIAL',
    itemName: '',
    description: '',
    quantity: '',
    unit: 'KG',
    reasonForRequest: '',
    requiredDate: '',
    preferredSupplier: '',
    stockQtyInInventory: '0',
    urgencyLevel: 'NORMAL',
    requestedBy: ''
  })
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchJobOrders()
    fetchAssets()
    fetchInventory()
    fetchSuppliers()
    fetchMaterialRequests()
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      const name = session?.user?.name || session?.user?.email || ''
      setFormData(prev => {
        if (!prev.requestedBy || prev.requestedBy === 'Production Team') {
          return { ...prev, requestedBy: name || prev.requestedBy }
        }
        return prev
      })
    }
  }, [status, session])

  const handleImportRequests = async (file: File | null) => {
    if (!file) return
    setImporting(true)
    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })

      const normalize = (row: Record<string, any>) => {
        const pick = (...keys: string[]) => keys
          .map((k) => row[k])
          .find((v) => v !== undefined && v !== null && String(v).trim() !== '')

        const itemName = pick('itemName', 'Item Name', 'Item')
        if (!itemName) return null

        const quantity = Number(pick('quantity', 'Quantity', 'Qty') || 1)
        const unit = String(pick('unit', 'Unit') || 'Nos')
        const requiredDateRaw = pick('requiredDate', 'Required Date')
        const requiredDate = requiredDateRaw ? new Date(requiredDateRaw) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        return {
          requestContext: pick('requestContext', 'Context') || 'WORKSHOP',
          jobOrderId: pick('jobOrderId', 'JobOrderId', 'jobOrderId') || null,
          assetId: pick('assetId', 'AssetId', 'assetId') || null,
          materialType: pick('materialType', 'Material Type') || 'RAW_MATERIAL',
          itemName: String(itemName).trim(),
          description: pick('description', 'Description') || 'Imported item',
          quantity,
          unit,
          reasonForRequest: pick('reasonForRequest', 'Reason', 'Reason For Request') || 'Imported via Excel',
          requiredDate: requiredDate.toISOString(),
          preferredSupplier: pick('preferredSupplier', 'Supplier') || null,
          stockQtyInInventory: Number(pick('stockQtyInInventory', 'StockQty', 'Stock Qty') || 0),
          urgencyLevel: pick('urgencyLevel', 'Urgency') || 'NORMAL',
          requestedBy: pick('requestedBy', 'Requested By') || 'Import',
          items: [
            {
              itemName: String(itemName).trim(),
              description: pick('description', 'Description') || 'Imported item',
              quantity,
              unit,
              stockQtyInInventory: Number(pick('stockQtyInInventory', 'StockQty', 'Stock Qty') || 0),
              reasonForRequest: pick('reasonForRequest', 'Reason', 'Reason For Request') || 'Imported via Excel',
              urgencyLevel: pick('urgencyLevel', 'Urgency') || 'NORMAL',
              requiredDate: requiredDate.toISOString(),
              preferredSupplier: pick('preferredSupplier', 'Supplier') || null,
            },
          ],
        }
      }

      const payloads = rows.map(normalize).filter(Boolean) as Array<Record<string, any>>
      for (const payload of payloads) {
        await fetch('/api/material-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      await fetchMaterialRequests()
    } catch (error) {
      console.error('Failed to import material requests:', error)
      alert('Import failed. Please verify the Excel columns.')
    } finally {
      setImporting(false)
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  const handleExportRequests = async () => {
    if (!materialRequests.length) return
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      const rows = materialRequests.map((mr) => ({
        RequestNumber: mr.requestNumber,
        Context: mr.requestContext,
        JobOrder: mr.jobOrder?.jobNumber || '',
        Asset: mr.asset?.code || '',
        ItemName: mr.itemName,
        Description: mr.description,
        Quantity: mr.quantity,
        Unit: mr.unit,
        Urgency: mr.urgencyLevel,
        Status: mr.status,
        RequiredDate: mr.requiredDate,
        RequestedBy: mr.requestedBy,
      }))
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'MaterialRequests')
      XLSX.writeFile(wb, 'material-requests.xlsx')
    } catch (error) {
      console.error('Failed to export material requests:', error)
      alert('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const fetchJobOrders = async () => {
    try {
      const res = await fetch('/api/job-orders')
      const data = await res.json()
      // API may return { jobs: [], totalCount } or an array directly — handle both
      if (Array.isArray(data)) setJobOrders(data)
      else if (data && Array.isArray((data as any).jobs)) setJobOrders((data as any).jobs)
      else setJobOrders([])
    } catch (error) {
      console.error('Failed to fetch job orders:', error)
    }
  }

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets')
      const data = await res.json()
      // Ensure we always store an array
      if (Array.isArray(data)) setAssets(data)
      else if (data && Array.isArray((data as any).assets)) setAssets((data as any).assets)
      else setAssets([])
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    }
  }

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory')
      const data = await res.json()
      setInventory(data)
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers')
      const data = await res.json()
      if (Array.isArray(data)) {
        setSuppliers(data)
      } else {
        setSuppliers([])
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    }
  }

  const fetchMaterialRequests = async () => {
    try {
      const res = await fetch('/api/material-requests?page=1&pageSize=50')
      const data = await res.json()
      if (Array.isArray(data)) {
        setMaterialRequests(data)
      }
    } catch (error) {
      console.error('Failed to fetch material requests:', error)
    }
  }



  const filteredRequests = materialRequests.filter((req) => {
    const contextLabel = req.requestContext === 'MACHINERY' && req.asset 
      ? req.asset.code 
      : req.jobOrder 
        ? req.jobOrder.jobNumber 
        : req.requestContext || 'Unknown'
    
    const matchesSearch = filters.search
      ? `${req.requestNumber} ${req.itemName} ${req.description} ${contextLabel}`
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      : true

    const matchesStatus = filters.status === 'ALL' ? true : req.status === filters.status
    const matchesUrgency = filters.urgency === 'ALL' ? true : req.urgencyLevel === filters.urgency

    return matchesSearch && matchesStatus && matchesUrgency
  })

  const startEdit = (req: any) => {
    setSelectedRequest(req)
    setIsEditing(true)
    
    // Load items if they exist, otherwise create default item from main fields
    const itemsToEdit = req.items && req.items.length > 0 
      ? req.items.map((item: any) => ({
          itemName: item.itemName,
          description: item.description,
          quantity: String(item.quantity),
          unit: item.unit,
          stockQty: String(item.stockQtyInInventory || 0),
          reasonForRequest: item.reasonForRequest || '',
          urgencyLevel: item.urgencyLevel || 'NORMAL',
          requiredDate: item.requiredDate ? new Date(item.requiredDate).toISOString().slice(0,10) : '',
          preferredSupplier: item.preferredSupplier || '',
          jobOrderId: item.jobOrderId || '',
          _linkedByJobSuggestion: false,
          status: item.status || 'PENDING'
        }))
      : [{
          itemName: req.itemName,
          description: req.description,
          quantity: String(req.quantity),
          unit: req.unit,
          stockQty: String(req.stockQtyInInventory || 0),
          reasonForRequest: req.reasonForRequest || '',
          urgencyLevel: req.urgencyLevel || 'NORMAL',
          requiredDate: new Date(req.requiredDate).toISOString().slice(0,10),
          preferredSupplier: req.preferredSupplier || '',
          jobOrderId: req.jobOrderId || '',
          _linkedByJobSuggestion: false,
          status: req.status || 'PENDING'
        }]
    
    setItems(itemsToEdit)
    
    setEditData({
      id: req.id,
      jobOrderId: req.jobOrderId,
      materialType: req.materialType,
      requestedBy: req.requestedBy,
      status: req.status
    })
  }

  const saveEdit = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/material-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          items
        })
      })
      if (res.ok) {
        setIsEditing(false)
        setSelectedRequest(null)
        await fetchMaterialRequests()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save changes')
      }
    } catch (e) {
      console.error('Failed to save changes:', e)
      alert('Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  const handleItemNameChange = (itemName: string) => {
    const inventoryItem = inventory.find(item => item.itemName === itemName)
    if (inventoryItem) {
      setFormData(prev => ({
        ...prev,
        itemName,
        unit: inventoryItem.unit,
        stockQtyInInventory: inventoryItem.currentStock.toString()
      }))
    } else {
      setFormData(prev => ({ ...prev, itemName }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/material-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, items })
      })
      
      if (res.ok) {
        setSuccess('Material request created successfully!')
        setShowForm(false)
        fetchMaterialRequests()
        // Reset form
        setFormData({
          requestContext: 'WORKSHOP',
          jobOrderId: '',
          assetId: '',
          materialType: 'RAW_MATERIAL',
          itemName: '',
          description: '',
          quantity: '',
          unit: 'KG',
          reasonForRequest: '',
          requiredDate: '',
          preferredSupplier: '',
          stockQtyInInventory: '0',
          urgencyLevel: 'NORMAL',
          requestedBy: session?.user?.name || session?.user?.email || ''
        })
        setItems([{ 
          itemName: '', 
          description: '', 
          quantity: '', 
          unit: 'Nos', 
          stockQty: '0',
          reasonForRequest: '',
          urgencyLevel: 'NORMAL',
          requiredDate: '',
          preferredSupplier: ''
        }])
        
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      console.error('Failed to create material request:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-gray-100 text-gray-700',
      IN_PROCUREMENT: 'bg-primary-100 text-primary-700',
      ORDERED: 'bg-yellow-100 text-yellow-700',
      PARTIALLY_RECEIVED: 'bg-orange-100 text-orange-700',
      RECEIVED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-green-100 text-green-700',
      NORMAL: 'bg-primary-100 text-primary-700',
      HIGH: 'bg-orange-100 text-orange-700',
      CRITICAL: 'bg-red-100 text-red-700'
    }
    return colors[urgency] || 'bg-primary-100 text-primary-700'
  }

  const handleDelete = async (requestId: string, itemId?: string) => {
    try {
      setLoading(true)
      let res: Response
      
      if (itemId) {
        // Delete individual item
        res = await fetch(`/api/material-requests/${requestId}/items?itemId=${itemId}`, {
          method: 'DELETE'
        })
      } else {
        // Delete entire request
        res = await fetch(`/api/material-requests?id=${requestId}`, {
          method: 'DELETE'
        })
      }
    
      if (res.ok) {
        fetchMaterialRequests()
        if (selectedRequest?.id === requestId && !itemId) {
          setSelectedRequest(null)
        }
        setDeleteConfirm(null)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete')
    } finally {
      setLoading(false)
    }
  }

  const addItemRow = () => {
    setItems(prev => [...prev, { 
      itemName: '', 
      description: '', 
      quantity: '', 
      unit: 'Nos', 
      stockQty: '0',
      reasonForRequest: '',
      urgencyLevel: 'NORMAL',
      requiredDate: '',
      preferredSupplier: '',
      jobOrderId: '',
      _linkedByJobSuggestion: false,
      status: 'PENDING'
    }])
  }

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateItemField = (index: number, field: keyof typeof items[0], value: string) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== index) return it
      // If the reason field is changed (typed or a non-job suggestion selected), clear the transient linked flag
      if (field === 'reasonForRequest') return { ...it, [field]: value, _linkedByJobSuggestion: false }
      return { ...it, [field]: value }
    }))
  }

  const setItemJobOrder = (index: number, jobOrderId: string | null, label?: string) => {
    // When the user selects a Job suggestion, set the jobOrderId and mark that it was linked via suggestion
    setItems(prev => prev.map((it, i) => i === index ? { ...it, jobOrderId: jobOrderId || '', reasonForRequest: label ?? it.reasonForRequest, _linkedByJobSuggestion: true } : it))
  }

  const requestItems = materialRequests.flatMap((req) =>
    req.items && req.items.length > 0
      ? req.items.map((item) => ({
          itemName: item.itemName,
          description: item.description,
          unit: item.unit,
          preferredSupplier: item.preferredSupplier || req.preferredSupplier || '',
        }))
      : [{
          itemName: req.itemName,
          description: req.description,
          unit: req.unit,
          preferredSupplier: req.preferredSupplier || '',
        }]
  )

  const itemNameEntries: Array<[string, Suggestion]> = [
    ...inventory.map((item) => [
      item.itemName.toLowerCase(),
      { label: item.itemName, meta: `Inventory • ${item.unit} • Stock ${item.currentStock}`, type: 'inventory' }
    ]),
    ...requestItems.map((item) => [
      item.itemName.toLowerCase(),
      { label: item.itemName, meta: item.description || '', type: 'request' }
    ])
  ]

  const itemNameSuggestions: Suggestion[] = Array.from(new Map(itemNameEntries).values())

  const descriptionEntries: Array<[string, Suggestion]> = requestItems
    .filter((item) => item.description)
    .map((item) => [
      item.description.toLowerCase(),
      { label: item.description, meta: item.itemName, type: 'request' }
    ])

  const descriptionSuggestions: Suggestion[] = Array.from(new Map(descriptionEntries).values())

  const supplierEntries: Array<[string, Suggestion]> = suppliers
    .map((supplier) => [
      (supplier.name || supplier.tradingName || '').toLowerCase(),
      { label: supplier.name || supplier.tradingName || '', meta: supplier.tradingName || '', type: 'supplier' }
    ])
    .filter((entry) => entry[0])

  const supplierSuggestions: Suggestion[] = Array.from(new Map(supplierEntries).values())

  const applyItemNameSuggestion = (index: number, itemName: string) => {
    setItems((prev) => prev.map((it, i) => {
      if (i !== index) return it
      const next = { ...it, itemName }
      const inventoryItem = inventory.find((inv) => inv.itemName.toLowerCase() === itemName.toLowerCase())
      const requestItem = requestItems.find((req) => req.itemName.toLowerCase() === itemName.toLowerCase())

      if (inventoryItem) {
        if (!next.unit || next.unit === 'Nos') next.unit = inventoryItem.unit
        if (!next.stockQty || next.stockQty === '0') next.stockQty = String(inventoryItem.currentStock)
      }

      if (!next.description && requestItem?.description) {
        next.description = requestItem.description
      }

      if (!next.preferredSupplier && requestItem?.preferredSupplier) {
        next.preferredSupplier = requestItem.preferredSupplier
      }

      return next
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-0.5">Material Requests</h1>
            <p className="text-slate-600 text-sm">Request and track materials for job orders</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleImportRequests(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? 'Importing…' : 'Import Excel'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportRequests}
              disabled={exporting || materialRequests.length === 0}
            >
              {exporting ? 'Exporting…' : 'Export Excel'}
            </Button>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              {showForm ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </>
              )}
            </Button>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <p className="text-green-800 text-sm font-medium">Material request submitted successfully!</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <Label className="text-xs text-slate-600">Search</Label>
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Request #, item, job #"
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-600">Status</Label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="mt-1 h-9 w-full px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROCUREMENT">In Procurement</option>
              <option value="ORDERED">Ordered</option>
              <option value="PARTIALLY_RECEIVED">Partially Received</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <Label className="text-xs text-slate-600">Urgency</Label>
            <select
              value={filters.urgency}
              onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
              className="mt-1 h-9 w-full px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Urgency</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
        <Card className="shadow-lg mb-4 border-primary-200">
          <CardHeader className="bg-primary-50 py-3">
            <CardTitle className="flex items-center gap-2 text-lg text-primary-900">
              <Package className="h-5 w-5" />
              New Material Request
            </CardTitle>
            <CardDescription>
              Fill out the form to request materials for production
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Request For and Material Type moved to per-item inputs; removed from top-level form per UX change */}

              {/* Context-specific selection removed — individual line items capture reasons and context now */}

              {/* Multiple Items */}
              <div>
                <Label className="text-sm font-semibold mb-2">Items *</Label>
                {/* Suggestions will be provided via Autocomplete component built from jobOrders, assets and inventory */}
                <div className="space-y-2 overflow-x-auto">
                  <div className="grid grid-cols-[1.125fr_3fr_minmax(72px,0.5fr)_0.4fr_1.5fr_minmax(84px,0.6fr)_1.2fr_1.25fr_0.6fr_0.5fr] gap-0.5 text-[11px] font-semibold text-slate-600 px-0.5 w-full">
                    <div>Item Name</div>
                    <div>Description</div>
                    <div>Qty</div>
                    <div>Unit</div>
                    <div>Reason</div>
                    <div>Urgency</div>
                    <div>Req. Date</div>
                    <div>Supplier</div>
                    <div>Stock</div>
                    <div></div>
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1.125fr_3fr_minmax(72px,0.5fr)_0.4fr_1.5fr_minmax(84px,0.6fr)_1.2fr_1.25fr_0.6fr_0.5fr] gap-0.5 w-full">
                      <ErrorBoundary>
                        <Autocomplete
                          value={item.itemName}
                          onChange={(val) => updateItemField(idx, 'itemName', val)}
                          onSelect={(s) => applyItemNameSuggestion(idx, s.label)}
                          suggestions={itemNameSuggestions}
                          placeholder="Item"
                          inputClassName="h-7 text-[11px]"
                          className="w-full"
                        />
                      </ErrorBoundary>
                      <ErrorBoundary>
                        <Autocomplete
                          value={item.description}
                          onChange={(val) => updateItemField(idx, 'description', val)}
                          onSelect={(s) => updateItemField(idx, 'description', s.label)}
                          suggestions={descriptionSuggestions}
                          placeholder="Description/Specs"
                          inputClassName="h-7 text-[11px]"
                          className="w-full"
                        />
                      </ErrorBoundary>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="h-7 text-[11px] min-w-[72px] text-right px-1"
                        step="0.01"
                        required
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => updateItemField(idx, 'unit', e.target.value)}
                        className="h-7 px-1 rounded-md border border-slate-300 text-[11px] w-full focus:z-10 focus:ring-2 focus:ring-primary-400 focus:outline-none"
                      >
                        <option value="Nos">Nos</option>
                        <option value="KG">KG</option>
                        <option value="L">L</option>
                        <option value="M">M</option>
                        <option value="BOX">BOX</option>
                      </select>
                      <div className="flex flex-col">
                        <ErrorBoundary>
                          <Autocomplete
                            value={item.reasonForRequest}
                            onChange={(val) => updateItemField(idx, 'reasonForRequest', val)}
                            // When a suggestion with a job id is selected, set the item.jobOrderId and the label
                            onSelect={(s) => {
                              if (s?.type === 'job') {
                                setItemJobOrder(idx, s.id || null, s.label)
                              } else {
                                // for non-job suggestions, set label only
                                updateItemField(idx, 'reasonForRequest', s.label)
                              }
                            }}
                            suggestions={[
                              { label: 'Workshop', type: 'other' },
                              { label: 'Maintenance', type: 'other' },
                              { label: 'General', type: 'other' },
                              { label: 'Machinery Repair', type: 'other' },
                              ...jobOrders.map(j => ({ id: j.id, label: `${j.jobNumber} - ${j.clientName || j.productName}`, meta: j.productName, type: 'job' })),
                              ...assets.map(a => ({ id: a.id, label: `${a.code} - ${a.name}`, meta: a.category || a.location || '', type: 'asset' })),
                            ]}
                            placeholder="Reason (type to search or enter text)"
                            inputClassName="h-7 px-1 rounded-md border border-slate-300 text-[11px] focus:z-10 focus:ring-2 focus:ring-primary-400 focus:outline-none"
                            className="w-full"
                            dropdownMode
                          />
                        </ErrorBoundary>
                        {item.jobOrderId && item._linkedByJobSuggestion ? (
                          <div className="text-[11px] text-slate-600 mt-1">Linked to <span className="font-medium">{(jobOrders.find(j => j.id === item.jobOrderId)?.jobNumber) ? `JO-${jobOrders.find(j => j.id === item.jobOrderId)?.jobNumber}` : 'Job'}</span></div>
                        ) : null}
                      </div>

                      <select
                        value={item.urgencyLevel}
                        onChange={(e) => updateItemField(idx, 'urgencyLevel', e.target.value)}
                        className="h-7 px-1 rounded-md border border-slate-300 text-[11px] w-full focus:z-10 focus:ring-2 focus:ring-primary-400 focus:outline-none"
                      >
                        <option value="LOW">Low</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                      <Input
                        type="date"
                        value={item.requiredDate}
                        onChange={(e) => updateItemField(idx, 'requiredDate', e.target.value)}
                        className="h-7 text-[11px]"
                      />
                      <ErrorBoundary>
                        <Autocomplete
                          value={item.preferredSupplier}
                          onChange={(val) => updateItemField(idx, 'preferredSupplier', val)}
                          onSelect={(s) => updateItemField(idx, 'preferredSupplier', s.label)}
                          suggestions={supplierSuggestions}
                          placeholder="Supplier"
                          inputClassName="h-7 text-[11px]"
                          className="w-full"
                        />
                      </ErrorBoundary>
                      <Input
                        type="number"
                        value={item.stockQty}
                        onChange={(e) => updateItemField(idx, 'stockQty', e.target.value)}
                        placeholder="0"
                        className="h-7 text-[11px] text-right px-1"
                        step="0.01"
                      />
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length === 1}
                        className="px-1 py-0.5 text-[11px] bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-2 py-1 text-[11px] bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              {/* Requested By */}
              <div>
                <Label className="text-sm font-semibold">Requested By *</Label>
                <Input
                  value={formData.requestedBy}
                  onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                  placeholder="Your name"
                  required
                  className="mt-1 h-9 focus:z-10 focus:ring-2 focus:ring-primary-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-600 hover:bg-primary-700"
                  size="sm"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        )}
        {/* Material Requests List */}
        <div className="space-y-2">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-slate-500">
                <Package className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                <p>No material requests found</p>
                <p className="text-xs mt-1">Adjust filters or create a new request</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <CardHeader className="py-2 px-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 min-w-[1200px]">
                    <div className="w-[180px] flex-shrink-0">Request # / Job #</div>
                    <div className="w-[280px] flex-shrink-0">Item / Description</div>
                    <div className="w-[150px] flex-shrink-0">Qty / Unit</div>
                    <div className="w-[120px] flex-shrink-0">Required Date</div>
                    <div className="w-[80px] flex-shrink-0">Urgency</div>
                    <div className="w-[150px] flex-shrink-0">Status</div>
                    <div className="w-[80px] flex-shrink-0">Action</div>
                    <div className="w-[80px] flex-shrink-0">Edit</div>
                  </div>
                </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200">
                  {filteredRequests.map((req) => {
                    // Show one row per item in the request
                    const itemsToShow = req.items && req.items.length > 0 ? req.items : [{
                      itemName: req.itemName,
                      description: req.description,
                      quantity: req.quantity,
                      unit: req.unit,
                      stockQtyInInventory: req.stockQtyInInventory,
                      urgencyLevel: req.urgencyLevel,
                      requiredDate: req.requiredDate
                    }]
                    
                    return itemsToShow.map((item, idx) => (
                      <div
                        key={`${req.id}-${idx}`}
                        className={`flex items-center gap-2 px-3 py-2 text-[12px] min-w-[1200px] ${selectedRequest?.id === req.id ? 'bg-blue-50' : ''}`}
                      >
                        <div className="w-[180px] flex-shrink-0 cursor-pointer hover:bg-blue-100" onClick={() => setSelectedRequest(req)}>
                          <div className="font-semibold text-slate-900">{req.requestNumber}</div>
                          {req.requestContext === 'MACHINERY' && req.asset ? (
                            <div className="text-slate-500 text-[11px]">{req.asset.code}</div>
                          ) : req.jobOrder ? (
                            <div className="text-slate-500 text-[11px]">JO-{req.jobOrder.jobNumber}</div>
                          ) : (
                            <div className="text-slate-500 text-[11px]">{req.requestContext}</div>
                          )}
                        </div>
                        <div className="w-[280px] flex-shrink-0 cursor-pointer hover:bg-blue-100" onClick={() => setSelectedRequest(req)}>
                          <div className="font-medium text-slate-800 truncate">{item.itemName}</div>
                          <div className="text-slate-500 text-[11px] truncate">{item.description}</div>
                        </div>
                        <div className="w-[150px] flex-shrink-0 cursor-pointer hover:bg-blue-100" onClick={() => setSelectedRequest(req)}>
                          <span className="font-semibold">{item.quantity}</span> {item.unit}
                          <div className="text-slate-500 text-[11px]">Stock: {item.stockQtyInInventory}</div>
                        </div>
                        <div className="w-[120px] flex-shrink-0 text-slate-600 cursor-pointer hover:bg-blue-100" onClick={() => setSelectedRequest(req)}>
                          {item.requiredDate ? new Date(item.requiredDate).toLocaleDateString() : '-'}
                        </div>
                        <div className="w-[80px] flex-shrink-0 cursor-pointer hover:bg-blue-100" onClick={() => setSelectedRequest(req)}>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getUrgencyColor(item.urgencyLevel || 'NORMAL')}`}>
                            {item.urgencyLevel || 'NORMAL'}
                          </span>
                        </div>
                        <div className="w-[150px] flex-shrink-0 cursor-pointer hover:bg-blue-100" onClick={() => setSelectedRequest(req)}>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getStatusColor(req.status)}`}>
                            {req.status?.replace(/_/g, ' ') || 'PENDING'}
                          </span>
                        </div>
                        <div className="w-[80px] flex-shrink-0">
                          {deleteConfirm?.requestId === req.id && deleteConfirm?.itemId === (req.items?.[idx]?.id || req.id) ? (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleDelete(req.id, req.items?.[idx]?.id)}
                                className="px-2 py-0.5 bg-red-600 text-white text-[11px] rounded hover:bg-red-700"
                                disabled={loading}
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-0.5 bg-gray-300 text-gray-700 text-[11px] rounded hover:bg-gray-400"
                                disabled={loading}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirm({ 
                                  requestId: req.id,
                                  itemId: req.items?.[idx]?.id 
                                })
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Delete this line item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="w-[80px] flex-shrink-0">
                          <button
                            onClick={() => startEdit(req)}
                            className="px-2 py-0.5 bg-blue-600 text-white text-[11px] rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))
                  })}
                </div>
              </CardContent>
              </div>
            </Card>
          )}
        </div>

        {/* Selected request details */}
        {selectedRequest && !isEditing && (
          <Card className="mt-3 border-blue-100">
            <CardHeader className="py-3 bg-blue-50">
              <CardTitle className="text-lg text-blue-900">Material Request Details</CardTitle>
              <CardDescription>{selectedRequest.requestNumber} - {selectedRequest.itemName}</CardDescription>
            </CardHeader>
            <CardContent className="pt-3 text-sm text-slate-800 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-slate-500 text-xs">Request For</div>
                  {selectedRequest.requestContext === 'MACHINERY' && selectedRequest.asset ? (
                    <>
                      <div>{selectedRequest.asset.code} - {selectedRequest.asset.name}</div>
                      <div className="text-xs text-slate-600">{selectedRequest.asset.location || 'N/A'}</div>
                    </>
                  ) : selectedRequest.jobOrder ? (
                    <>
                      <div>JO-{selectedRequest.jobOrder.jobNumber}</div>
                      <div className="text-xs text-slate-600">{selectedRequest.jobOrder.productName}</div>
                    </>
                  ) : (
                    <div className="text-xs">{selectedRequest.requestContext || 'N/A'}</div>
                  )}
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Material Type</div>
                  <div>{selectedRequest.materialType?.replace(/_/g, ' ') || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Requested By</div>
                  <div>{selectedRequest.requestedBy}</div>
                  <div className="text-xs text-slate-600">{new Date(selectedRequest.requestedAt).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <div className="text-slate-500 text-xs">Description</div>
                <div>{selectedRequest.description}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <div className="text-slate-500 text-xs">Quantity</div>
                  <div className="font-semibold">{selectedRequest.quantity} {selectedRequest.unit}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Current Stock</div>
                  <div>{selectedRequest.stockQtyInInventory} {selectedRequest.unit}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Required Date</div>
                  <div>{new Date(selectedRequest.requiredDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Urgency</div>
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getUrgencyColor(selectedRequest.urgencyLevel)}`}>
                      {selectedRequest.urgencyLevel}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-slate-500 text-xs">Reason for Request</div>
                <div>{selectedRequest.reasonForRequest}</div>
              </div>

              {selectedRequest.preferredSupplier && (
                <div>
                  <div className="text-slate-500 text-xs">Preferred Supplier</div>
                  <div>{selectedRequest.preferredSupplier}</div>
                </div>
              )}

              <div>
                <div className="text-slate-500 text-xs">Current Status</div>
                <div>
                  <span className={`text-sm px-3 py-1 rounded-full font-semibold ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status?.replace(/_/g, ' ') || 'PENDING'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit form */}
        {selectedRequest && isEditing && (
          <Card className="mt-3 border-blue-100">
            <CardHeader className="py-3 bg-blue-50">
              <CardTitle className="text-lg text-blue-900">Edit Material Request</CardTitle>
              <CardDescription>{selectedRequest.requestNumber}</CardDescription>
            </CardHeader>
            <CardContent className="pt-3 text-sm text-slate-800 space-y-3">

              {/* Items Section */}
              <div>
                <Label className="text-sm font-semibold mb-2">Items</Label>
                <div className="space-y-2 overflow-x-auto">
                  <div className="grid grid-cols-[1.125fr_3fr_minmax(72px,0.5fr)_0.4fr_1.5fr_minmax(84px,0.6fr)_minmax(75px,0.65fr)_1.2fr_1.25fr_0.6fr_0.5fr] gap-0.5 text-[11px] font-semibold text-slate-600 px-0.5 w-full">
                    <div>Item Name</div>
                    <div>Description</div>
                    <div>Qty</div>
                    <div>Unit</div>
                    <div>Reason</div>
                    <div>Urgency</div>
                    <div>Status</div>
                    <div>Req. Date</div>
                    <div>Supplier</div>
                    <div>Stock</div>
                    <div></div>
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1.125fr_3fr_minmax(72px,0.5fr)_0.4fr_1.5fr_minmax(84px,0.6fr)_minmax(75px,0.65fr)_1.2fr_1.25fr_0.6fr_0.5fr] gap-0.5 w-full">
                      <ErrorBoundary>
                        <Autocomplete
                          value={item.itemName}
                          onChange={(val) => updateItemField(idx, 'itemName', val)}
                          onSelect={(s) => applyItemNameSuggestion(idx, s.label)}
                          suggestions={itemNameSuggestions}
                          placeholder="Item"
                          inputClassName="h-7 text-[11px]"
                          className="w-full"
                        />
                      </ErrorBoundary>
                      <ErrorBoundary>
                        <Autocomplete
                          value={item.description}
                          onChange={(val) => updateItemField(idx, 'description', val)}
                          onSelect={(s) => updateItemField(idx, 'description', s.label)}
                          suggestions={descriptionSuggestions}
                          placeholder="Description/Specs"
                          inputClassName="h-7 text-[11px]"
                          className="w-full"
                        />
                      </ErrorBoundary>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="h-7 text-[11px] min-w-[72px] text-right px-1"
                        step="0.01"
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => updateItemField(idx, 'unit', e.target.value)}
                        className="h-7 px-1 rounded-md border border-slate-300 text-[11px]"
                      >
                        <option value="Nos">Nos</option>
                        <option value="KG">KG</option>
                        <option value="L">L</option>
                        <option value="M">M</option>
                        <option value="BOX">BOX</option>
                      </select>
                      <Input
                        value={item.reasonForRequest}
                        onChange={(e) => updateItemField(idx, 'reasonForRequest', e.target.value)}
                        placeholder="Reason"
                        className="h-7 text-[11px]"
                      />
                      <select
                        value={item.urgencyLevel}
                        onChange={(e) => updateItemField(idx, 'urgencyLevel', e.target.value)}
                        className="h-7 px-1 rounded-md border border-slate-300 text-[11px]"
                      >
                        <option value="LOW">Low</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                      <select
                        value={item.status || 'PENDING'}
                        onChange={(e) => updateItemField(idx, 'status', e.target.value)}
                        className="h-7 px-1 rounded-md border border-slate-300 text-[11px]"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROCUREMENT">IN_PROCUREMENT</option>
                        <option value="ORDERED">ORDERED</option>
                        <option value="PARTIALLY_RECEIVED">PARTIAL</option>
                        <option value="RECEIVED">RECEIVED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                      <Input
                        type="date"
                        value={item.requiredDate}
                        onChange={(e) => updateItemField(idx, 'requiredDate', e.target.value)}
                        className="h-7 text-[11px]"
                      />
                      <ErrorBoundary>
                        <Autocomplete
                          value={item.preferredSupplier}
                          onChange={(val) => updateItemField(idx, 'preferredSupplier', val)}
                          onSelect={(s) => updateItemField(idx, 'preferredSupplier', s.label)}
                          suggestions={supplierSuggestions}
                          placeholder="Supplier"
                          inputClassName="h-7 text-[11px]"
                          className="w-full"
                        />
                      </ErrorBoundary>
                      <Input
                        type="number"
                        value={item.stockQty}
                        onChange={(e) => updateItemField(idx, 'stockQty', e.target.value)}
                        placeholder="0"
                        className="h-7 text-[11px] text-right px-1"
                        step="0.01"
                      />
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length === 1}
                        className="px-1 py-0.5 text-[11px] bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-2 py-1 text-[11px] bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveEdit} disabled={loading}>Save</Button>
                <Button variant="secondary" onClick={() => { setIsEditing(false); setSelectedRequest(null) }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
