'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Package, Clock, AlertTriangle, Plus, X, Trash2 } from 'lucide-react'

interface JobOrder {
  id: string
  jobNumber: string
  productName: string
  drawingRef: string | null
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
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    urgency: 'ALL'
  })
  const [success, setSuccess] = useState(false)
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
  }>>([{ 
    itemName: '', 
    description: '', 
    quantity: '', 
    unit: 'PCS', 
    stockQty: '0',
    reasonForRequest: '',
    urgencyLevel: 'NORMAL',
    requiredDate: '',
    preferredSupplier: ''
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
    requestedBy: 'Production Team'
  })
  const importInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    fetchJobOrders()
    fetchAssets()
    fetchInventory()
    fetchMaterialRequests()
  }, [])

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
        const unit = String(pick('unit', 'Unit') || 'PCS')
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
      setJobOrders(data)
    } catch (error) {
      console.error('Failed to fetch job orders:', error)
    }
  }

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets')
      const data = await res.json()
      setAssets(data)
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
          preferredSupplier: item.preferredSupplier || ''
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
          preferredSupplier: req.preferredSupplier || ''
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
        setSuccess(true)
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
          requestedBy: 'Production Team'
        })
        setItems([{ 
          itemName: '', 
          description: '', 
          quantity: '', 
          unit: 'PCS', 
          stockQty: '0',
          reasonForRequest: '',
          urgencyLevel: 'NORMAL',
          requiredDate: '',
          preferredSupplier: ''
        }])
        
        setTimeout(() => setSuccess(false), 3000)
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
      IN_PROCUREMENT: 'bg-blue-100 text-blue-700',
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
      NORMAL: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-orange-100 text-orange-700',
      CRITICAL: 'bg-red-100 text-red-700'
    }
    return colors[urgency] || 'bg-blue-100 text-blue-700'
  }

  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/material-requests?id=${id}`, {
        method: 'DELETE'
      })
    
      if (res.ok) {
        fetchMaterialRequests()
        if (selectedRequest?.id === id) {
          setSelectedRequest(null)
        }
        setDeleteConfirm(null)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete material request')
      }
    } catch (error) {
      console.error('Failed to delete material request:', error)
      alert('Failed to delete material request')
    } finally {
      setLoading(false)
    }
  }

  const addItemRow = () => {
    setItems(prev => [...prev, { 
      itemName: '', 
      description: '', 
      quantity: '', 
      unit: 'PCS', 
      stockQty: '0',
      reasonForRequest: '',
      urgencyLevel: 'NORMAL',
      requiredDate: '',
      preferredSupplier: ''
    }])
  }

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateItemField = (index: number, field: keyof typeof items[0], value: string) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it))
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
              className="mt-1 h-9 w-full px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="mt-1 h-9 w-full px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <Card className="shadow-lg mb-4 border-blue-200">
          <CardHeader className="bg-blue-50 py-3">
            <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
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
                <datalist id="reason-options">
                  <option value="Job orders" />
                  <option value="Workshop" />
                  <option value="Maintenance" />
                  <option value="Asset Names" />
                  <option value="Machinery" />
                  <option value="from inventory" />
                  <option value="general" />
                </datalist>
                <div className="space-y-2 overflow-x-auto">
                  <div className="grid grid-cols-[2fr_3fr_1fr_0.8fr_0.8fr_2fr_1fr_1.2fr_1.5fr_0.5fr] gap-2 text-[11px] font-semibold text-slate-600 px-2 min-w-[1400px]">
                    <div>Item Name</div>
                    <div>Description</div>
                    <div>Qty</div>
                    <div>Unit</div>
                    <div>Stock</div>
                    <div>Reason</div>
                    <div>Urgency</div>
                    <div>Req. Date</div>
                    <div>Supplier</div>
                    <div></div>
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[2fr_3fr_1fr_0.8fr_0.8fr_2fr_1fr_1.2fr_1.5fr_0.5fr] gap-2 min-w-[1400px]">
                      <Input
                        value={item.itemName}
                        onChange={(e) => updateItemField(idx, 'itemName', e.target.value)}
                        placeholder="Item"
                        className="h-8 text-xs"
                        required
                      />
                      <Input
                        value={item.description}
                        onChange={(e) => updateItemField(idx, 'description', e.target.value)}
                        placeholder="Description/Specs"
                        className="h-8 text-xs"
                        required
                      />
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="h-8 text-xs"
                        step="0.01"
                        required
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => updateItemField(idx, 'unit', e.target.value)}
                        className="h-8 px-1 rounded-md border border-slate-300 text-xs"
                      >
                        <option value="PCS">PCS</option>
                        <option value="KG">KG</option>
                        <option value="L">L</option>
                        <option value="M">M</option>
                        <option value="BOX">BOX</option>
                      </select>
                      <Input
                        type="number"
                        value={item.stockQty}
                        onChange={(e) => updateItemField(idx, 'stockQty', e.target.value)}
                        placeholder="0"
                        className="h-8 text-xs"
                        step="0.01"
                      />
                      <Input
                        list="reason-options"
                        value={item.reasonForRequest}
                        onChange={(e) => updateItemField(idx, 'reasonForRequest', e.target.value)}
                        placeholder="Reason"
                        className="h-8 text-xs"
                      />
                      <select
                        value={item.urgencyLevel}
                        onChange={(e) => updateItemField(idx, 'urgencyLevel', e.target.value)}
                        className="h-8 px-1 rounded-md border border-slate-300 text-xs"
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
                        className="h-8 text-xs"
                      />
                      <Input
                        value={item.preferredSupplier}
                        onChange={(e) => updateItemField(idx, 'preferredSupplier', e.target.value)}
                        placeholder="Supplier"
                        className="h-8 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length === 1}
                        className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
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
                  className="mt-1 h-9"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
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
                          {deleteConfirm === req.id ? (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleDelete(req.id)}
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
                                setDeleteConfirm(req.id)
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Delete material request"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Material Type *</Label>
                  <Select 
                    value={editData.materialType || 'RAW_MATERIAL'} 
                    onChange={(e) => setEditData({ ...editData, materialType: e.target.value })}
                  >
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="CONSUMABLE">Consumable</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="ASSET">Asset</option>
                    <option value="STATIONARY">Stationary</option>
                    <option value="GENERAL_REQUEST">General Request</option>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editData.status || 'PENDING'} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROCUREMENT">IN_PROCUREMENT</option>
                    <option value="ORDERED">ORDERED</option>
                    <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </Select>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <Label className="text-sm font-semibold mb-2">Items</Label>
                <div className="space-y-2 overflow-x-auto">
                  <div className="grid grid-cols-[2fr_3fr_1fr_0.8fr_0.8fr_2fr_1fr_1.2fr_1.5fr_0.5fr] gap-2 text-[11px] font-semibold text-slate-600 px-2 min-w-[1400px]">
                    <div>Item Name</div>
                    <div>Description</div>
                    <div>Qty</div>
                    <div>Unit</div>
                    <div>Stock</div>
                    <div>Reason</div>
                    <div>Urgency</div>
                    <div>Req. Date</div>
                    <div>Supplier</div>
                    <div></div>
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[2fr_3fr_1fr_0.8fr_0.8fr_2fr_1fr_1.2fr_1.5fr_0.5fr] gap-2 min-w-[1400px]">
                      <Input
                        value={item.itemName}
                        onChange={(e) => updateItemField(idx, 'itemName', e.target.value)}
                        placeholder="Item"
                        className="h-8 text-xs"
                      />
                      <Input
                        value={item.description}
                        onChange={(e) => updateItemField(idx, 'description', e.target.value)}
                        placeholder="Description/Specs"
                        className="h-8 text-xs"
                      />
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="h-8 text-xs"
                        step="0.01"
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => updateItemField(idx, 'unit', e.target.value)}
                        className="h-8 px-1 rounded-md border border-slate-300 text-xs"
                      >
                        <option value="PCS">PCS</option>
                        <option value="KG">KG</option>
                        <option value="L">L</option>
                        <option value="M">M</option>
                        <option value="BOX">BOX</option>
                      </select>
                      <Input
                        type="number"
                        value={item.stockQty}
                        onChange={(e) => updateItemField(idx, 'stockQty', e.target.value)}
                        placeholder="0"
                        className="h-8 text-xs"
                        step="0.01"
                      />
                      <Input
                        value={item.reasonForRequest}
                        onChange={(e) => updateItemField(idx, 'reasonForRequest', e.target.value)}
                        placeholder="Reason"
                        className="h-8 text-xs"
                      />
                      <select
                        value={item.urgencyLevel}
                        onChange={(e) => updateItemField(idx, 'urgencyLevel', e.target.value)}
                        className="h-8 px-1 rounded-md border border-slate-300 text-xs"
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
                        className="h-8 text-xs"
                      />
                      <Input
                        value={item.preferredSupplier}
                        onChange={(e) => updateItemField(idx, 'preferredSupplier', e.target.value)}
                        placeholder="Supplier"
                        className="h-8 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length === 1}
                        className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
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
