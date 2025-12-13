'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Package, Clock, AlertTriangle, Plus, X } from 'lucide-react'

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

interface MaterialRequest {
  id: string
  requestNumber: string
  jobOrderId: string
  jobOrder: JobOrder
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
}

export default function MaterialRequestPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    urgency: 'ALL'
  })
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    jobOrderId: '',
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

  useEffect(() => {
    fetchJobOrders()
    fetchInventory()
    fetchMaterialRequests()
  }, [])

  const fetchJobOrders = async () => {
    try {
      const res = await fetch('/api/job-orders')
      const data = await res.json()
      setJobOrders(data)
    } catch (error) {
      console.error('Failed to fetch job orders:', error)
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
      const res = await fetch('/api/material-requests')
      const data = await res.json()
      if (Array.isArray(data)) {
        setMaterialRequests(data)
      }
    } catch (error) {
      console.error('Failed to fetch material requests:', error)
    }
  }

  const filteredRequests = materialRequests.filter((req) => {
    const matchesSearch = filters.search
      ? `${req.requestNumber} ${req.itemName} ${req.description} ${req.jobOrder.jobNumber}`
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      : true

    const matchesStatus = filters.status === 'ALL' ? true : req.status === filters.status
    const matchesUrgency = filters.urgency === 'ALL' ? true : req.urgencyLevel === filters.urgency

    return matchesSearch && matchesStatus && matchesUrgency
  })

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
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setSuccess(true)
        setShowForm(false)
        fetchMaterialRequests()
        // Reset form
        setFormData({
          jobOrderId: '',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-0.5">Material Requests</h1>
            <p className="text-slate-600 text-sm">Request and track materials for job orders</p>
          </div>
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
              {/* Job Order Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold">Job Order *</Label>
                  <Select
                    value={formData.jobOrderId}
                    onChange={(e) => setFormData({ ...formData, jobOrderId: e.target.value })}
                    required
                    className="mt-1"
                  >
                    <option value="">Select Job Order</option>
                    {jobOrders.map(jo => (
                      <option key={jo.id} value={jo.id}>
                        {jo.jobNumber} - {jo.productName}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Material Type *</Label>
                  <Select
                    value={formData.materialType}
                    onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                    required
                    className="mt-1"
                  >
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="CONSUMABLE">Consumable</option>
                  </Select>
                </div>
              </div>

              {/* Item Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold">Item Name *</Label>
                  <Input
                    value={formData.itemName}
                    onChange={(e) => handleItemNameChange(e.target.value)}
                    placeholder="e.g., Steel Plate, Welding Rod"
                    required
                    className="mt-1 h-9"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold">Current Stock</Label>
                  <Input
                    type="number"
                    value={formData.stockQtyInInventory}
                    onChange={(e) => setFormData({ ...formData, stockQtyInInventory: e.target.value })}
                    placeholder="0"
                    step="0.01"
                    className="mt-1 h-9"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description, specifications, grade, etc."
                  rows={2}
                  required
                  className="mt-1"
                />
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold">Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                    step="0.01"
                    required
                    className="mt-1 h-9"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold">Unit *</Label>
                  <Select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                    className="mt-1"
                  >
                    <option value="KG">Kilograms (KG)</option>
                    <option value="TON">Tons</option>
                    <option value="PCS">Pieces (PCS)</option>
                    <option value="METER">Meters</option>
                    <option value="LITER">Liters</option>
                    <option value="BOX">Box</option>
                    <option value="SET">Set</option>
                  </Select>
                </div>
              </div>

              {/* Reason and Dates */}
              <div>
                <Label className="text-sm font-semibold">Reason for Request *</Label>
                <Textarea
                  value={formData.reasonForRequest}
                  onChange={(e) => setFormData({ ...formData, reasonForRequest: e.target.value })}
                  placeholder="Explain why this material is needed"
                  rows={2}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Required Date *
                  </Label>
                  <Input
                    type="date"
                    value={formData.requiredDate}
                    onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                    required
                    className="mt-1 h-9"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Urgency *
                  </Label>
                  <Select
                    value={formData.urgencyLevel}
                    onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value })}
                    required
                    className="mt-1"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                </div>

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
              </div>

              <div>
                <Label className="text-sm font-semibold">Preferred Supplier</Label>
                <Input
                  value={formData.preferredSupplier}
                  onChange={(e) => setFormData({ ...formData, preferredSupplier: e.target.value })}
                  placeholder="Optional"
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
            <Card className="border border-slate-200">
              <CardHeader className="py-2">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-600">
                  <div className="col-span-2">Request # / Job #</div>
                  <div className="col-span-3">Item / Description</div>
                  <div className="col-span-2">Qty / Unit</div>
                  <div className="col-span-2">Required Date</div>
                  <div className="col-span-1">Urgency</div>
                  <div className="col-span-2">Status</div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200">
                  {filteredRequests.map((req) => (
                    <div
                      key={req.id}
                      className={`grid grid-cols-12 items-center gap-2 px-3 py-2 text-[12px] cursor-pointer hover:bg-blue-50 ${selectedRequest?.id === req.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedRequest(req)}
                    >
                      <div className="col-span-2">
                        <div className="font-semibold text-slate-900">{req.requestNumber}</div>
                        <div className="text-slate-500 text-[11px]">JO-{req.jobOrder.jobNumber}</div>
                      </div>
                      <div className="col-span-3">
                        <div className="font-medium text-slate-800 truncate">{req.itemName}</div>
                        <div className="text-slate-500 text-[11px] truncate">{req.description}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold">{req.quantity}</span> {req.unit}
                        <div className="text-slate-500 text-[11px]">Stock: {req.stockQtyInInventory}</div>
                      </div>
                      <div className="col-span-2 text-slate-600">
                        {new Date(req.requiredDate).toLocaleDateString()}
                      </div>
                      <div className="col-span-1">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getUrgencyColor(req.urgencyLevel)}`}>
                          {req.urgencyLevel}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getStatusColor(req.status)}`}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Selected request details */}
        {selectedRequest && (
          <Card className="mt-3 border-blue-100">
            <CardHeader className="py-3 bg-blue-50">
              <CardTitle className="text-lg text-blue-900">Material Request Details</CardTitle>
              <CardDescription>{selectedRequest.requestNumber} - {selectedRequest.itemName}</CardDescription>
            </CardHeader>
            <CardContent className="pt-3 text-sm text-slate-800 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-slate-500 text-xs">Job Order</div>
                  <div>JO-{selectedRequest.jobOrder.jobNumber}</div>
                  <div className="text-xs text-slate-600">{selectedRequest.jobOrder.productName}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Material Type</div>
                  <div>{selectedRequest.materialType.replace(/_/g, ' ')}</div>
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
                    {selectedRequest.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
