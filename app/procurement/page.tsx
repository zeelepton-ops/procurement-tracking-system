'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Package, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  FileText,
  DollarSign
} from 'lucide-react'
import { formatDate, getUrgencyColor, getStatusColor, calculateDaysUntilRequired, isOverdue } from '@/lib/utils'

interface MaterialRequest {
  id: string
  requestNumber: string
  itemName: string
  description: string
  quantity: number
  unit: string
  status: string
  urgencyLevel: string
  requiredDate: string
  preferredSupplier: string | null
  requestedBy: string
  requestedAt: string
  jobOrder: {
    jobNumber: string
    productName: string
  }
  items?: Array<{
    id: string
    itemName: string
    description: string
    quantity: number
    unit: string
    stockQtyInInventory?: number
    urgencyLevel?: string | null
    requiredDate?: string | null
  }>
  procurementActions: Array<{
    id: string
    actionType: string
    actionBy: string
    actionDate: string
    notes: string | null
    quotationAmount: number | null
    supplierName: string | null
  }>
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROCUREMENT', label: 'In Procurement' },
  { value: 'ORDERED', label: 'Ordered' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partial' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CANCELLED', label: 'Cancelled' }
]

export default function ProcurementTrackingPage() {
  const [requests, setRequests] = useState<MaterialRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaterialRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterUrgency, setFilterUrgency] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [actionForm, setActionForm] = useState({
    actionType: 'NOTE',
    notes: '',
    quotationAmount: '',
    supplierName: '',
    expectedDelivery: '',
    newStatus: '',
    actionBy: 'Procurement Team'
  })

  useEffect(() => {
    fetchRequests()
    const interval = setInterval(fetchRequests, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterRequests()
  }, [requests, filterStatus, filterUrgency, searchTerm])

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/material-requests')
      const data = await res.json()
      setRequests(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch requests:', error)
      setLoading(false)
    }
  }

  const handleStatusChange = async (req: MaterialRequest, newStatus: string) => {
    if (!newStatus) return
    try {
      const res = await fetch('/api/procurement-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialRequestId: req.id,
          actionType: 'STATUS_UPDATE',
          actionBy: 'Procurement Team',
          notes: `Status set to ${newStatus.replace(/_/g, ' ')}`,
          oldStatus: req.status,
          newStatus
        })
      })
      if (res.ok) {
        await fetchRequests()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const filterRequests = () => {
    let filtered = [...requests]
    
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(r => r.status === filterStatus)
    }
    
    if (filterUrgency !== 'ALL') {
      filtered = filtered.filter(r => r.urgencyLevel === filterUrgency)
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r =>
        r.requestNumber.toLowerCase().includes(term) ||
        r.itemName.toLowerCase().includes(term) ||
        r.jobOrder.jobNumber.toLowerCase().includes(term)
      )
    }
    
    setFilteredRequests(filtered)
  }

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest) return
    
    try {
      const res = await fetch('/api/procurement-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...actionForm,
          materialRequestId: selectedRequest.id,
          oldStatus: selectedRequest.status
        })
      })
      
      if (res.ok) {
        await fetchRequests()
        setActionForm({
          actionType: 'NOTE',
          notes: '',
          quotationAmount: '',
          supplierName: '',
          expectedDelivery: '',
          newStatus: '',
          actionBy: 'Procurement Team'
        })
        alert('Action recorded successfully!')
      }
    } catch (error) {
      console.error('Failed to record action:', error)
      alert('Failed to record action')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'IN_PROCUREMENT':
        return <TrendingUp className="h-5 w-5 text-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-0.5">Procurement Tracking</h1>
            <p className="text-slate-600 text-sm">Manage and track material request progress</p>
          </div>
          <Button onClick={fetchRequests} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Total</p>
                  <p className="text-xl font-bold text-slate-900">{requests.length}</p>
                </div>
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Pending</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {requests.filter(r => r.status === 'PENDING').length}
                  </p>
                </div>
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">In Progress</p>
                  <p className="text-xl font-bold text-blue-600">
                    {requests.filter(r => ['IN_PROCUREMENT', 'ORDERED', 'PARTIALLY_RECEIVED'].includes(r.status)).length}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Critical</p>
                  <p className="text-xl font-bold text-red-600">
                    {requests.filter(r => r.urgencyLevel === 'CRITICAL' || isOverdue(r.requiredDate)).length}
                  </p>
                </div>
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input
            placeholder="Search request #, item, job"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 text-sm"
          />
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROCUREMENT">In Procurement</option>
            <option value="ORDERED">Ordered</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          
          <select 
            value={filterUrgency} 
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Urgencies</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Requests List */}
          <div className="lg:col-span-2 space-y-2">
            <Card className="border border-slate-200">
              <CardHeader className="py-2">
                <div className="grid grid-cols-14 gap-1 text-[11px] font-semibold text-slate-600">
                  <div className="col-span-3">Request # / Job #</div>
                  <div className="col-span-3">Item / Qty</div>
                  <div className="col-span-2">Required</div>
                  <div className="col-span-2">Urgency</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Update Status</div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
                  {filteredRequests.flatMap((request) => {
                    const itemsToShow = request.items && request.items.length > 0 ? request.items : [{
                      id: `${request.id}-main`,
                      itemName: request.itemName,
                      description: request.description,
                      quantity: request.quantity,
                      unit: request.unit,
                      urgencyLevel: request.urgencyLevel,
                      requiredDate: request.requiredDate,
                      stockQtyInInventory: undefined
                    }]

                    return itemsToShow.map((item, idx) => {
                      const requiredDate = item.requiredDate || request.requiredDate
                      const daysLeft = calculateDaysUntilRequired(requiredDate)
                      const overdue = isOverdue(requiredDate)
                      const urgency = item.urgencyLevel || request.urgencyLevel

                      return (
                        <div
                          key={`${request.id}-${item.id || idx}`}
                          className={`grid grid-cols-14 items-center gap-1 px-3 py-2 text-[12px] cursor-pointer hover:bg-blue-50 ${
                            selectedRequest?.id === request.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedRequest(request)}
                        >
                          <div className="col-span-3">
                            <div className="font-semibold text-slate-900">{request.requestNumber}</div>
                            <div className="text-[11px] text-slate-500">JO-{request.jobOrder.jobNumber}</div>
                          </div>
                          <div className="col-span-3 truncate">
                            <div className="font-medium text-slate-800 truncate">{item.itemName}</div>
                            <div className="text-[11px] text-slate-500">{item.quantity} {item.unit}</div>
                          </div>
                          <div className="col-span-2">
                            <div className={overdue ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                              {requiredDate ? new Date(requiredDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}
                            </div>
                            <div className={`text-[11px] ${overdue ? 'text-red-500' : 'text-slate-500'}`}>
                              {requiredDate ? (overdue ? `${Math.abs(daysLeft)}d late` : `${daysLeft}d left`) : 'No date'}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getUrgencyColor(urgency)}`}>
                              {urgency}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getStatusColor(request.status)}`}>
                              {request.status.replace(/_/g, ' ').substring(0, 12)}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center" onClick={(e) => e.stopPropagation()}>
                            <select
                              defaultValue=""
                              className="w-[130px] h-7 px-2 rounded-md border border-slate-300 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={(e) => handleStatusChange(request, e.target.value)}
                            >
                              <option value="">Change status</option>
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )
                    })
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Request Details & Actions */}
          <div className="lg:col-span-1">
            {selectedRequest ? (
              <Card className="sticky top-4 border-blue-100">
                <CardHeader className="bg-blue-50 py-3">
                  <CardTitle className="text-lg text-blue-900">Details & Actions</CardTitle>
                  <CardDescription className="text-sm">
                    {selectedRequest.requestNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 space-y-3 text-sm">
                  {/* Request Info */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-600">Item</p>
                      <p className="font-medium text-slate-900">{selectedRequest.itemName}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-slate-600">Description</p>
                      <p className="text-slate-900 text-xs">{selectedRequest.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-slate-600">Quantity</p>
                        <p className="font-medium text-slate-900">
                          {selectedRequest.quantity} {selectedRequest.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Job Order</p>
                        <p className="font-medium text-slate-900">{selectedRequest.jobOrder.jobNumber}</p>
                      </div>
                    </div>
                    
                    {selectedRequest.preferredSupplier && (
                      <div>
                        <p className="text-xs text-slate-600">Supplier</p>
                        <p className="text-slate-900">{selectedRequest.preferredSupplier}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-xs text-slate-600">Requested By</p>
                      <p className="text-slate-900 text-xs">{selectedRequest.requestedBy}</p>
                    </div>
                  </div>

                  <hr />

                  {/* Add Action */}
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm mb-2">Add Action</h3>
                    <form onSubmit={handleActionSubmit} className="space-y-2">
                      <select
                        value={actionForm.actionType}
                        onChange={(e) => setActionForm({ ...actionForm, actionType: e.target.value })}
                        className="w-full h-8 px-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="NOTE">Add Note</option>
                        <option value="ASSIGNED">Assign</option>
                        <option value="QUOTATION_REQUESTED">Request Quote</option>
                        <option value="QUOTATION_RECEIVED">Quote Received</option>
                        <option value="PO_CREATED">PO Created</option>
                      </select>

                      <Textarea
                        value={actionForm.notes}
                        onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                        placeholder="Notes..."
                        rows={2}
                        required
                        className="text-xs"
                      />

                      {actionForm.actionType === 'QUOTATION_RECEIVED' && (
                        <>
                          <Input
                            type="number"
                            value={actionForm.quotationAmount}
                            onChange={(e) => setActionForm({ ...actionForm, quotationAmount: e.target.value })}
                            placeholder="Amount"
                            step="0.01"
                            className="h-8 text-xs"
                          />
                          <Input
                            value={actionForm.supplierName}
                            onChange={(e) => setActionForm({ ...actionForm, supplierName: e.target.value })}
                            placeholder="Supplier"
                            className="h-8 text-xs"
                          />
                        </>
                      )}

                      <select
                        value={actionForm.newStatus}
                        onChange={(e) => setActionForm({ ...actionForm, newStatus: e.target.value })}
                        className="w-full h-8 px-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Keep status</option>
                        <option value="IN_PROCUREMENT">→ In Procurement</option>
                        <option value="ORDERED">→ Ordered</option>
                        <option value="PARTIALLY_RECEIVED">→ Partial</option>
                        <option value="RECEIVED">→ Received</option>
                        <option value="CANCELLED">→ Cancel</option>
                      </select>

                      <Button type="submit" className="w-full h-8 text-xs" size="sm">
                        Record Action
                      </Button>
                    </form>
                  </div>

                    <hr />

                    {/* Action History */}
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        History
                      </h3>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {selectedRequest.procurementActions.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">No actions yet</p>
                        ) : (
                          selectedRequest.procurementActions.map((action) => (
                            <div key={action.id} className="text-xs p-2 bg-slate-50 rounded border border-slate-200">
                              <p className="font-medium text-slate-900">{action.actionType.replace(/_/g, ' ')}</p>
                              {action.notes && <p className="text-slate-600">{action.notes}</p>}
                              {action.quotationAmount && (
                                <p className="text-slate-700">Amt: ${action.quotationAmount}</p>
                              )}
                              {action.supplierName && (
                                <p className="text-slate-700">Supplier: {action.supplierName}</p>
                              )}
                              <p className="text-[10px] text-slate-500 mt-1">
                                {action.actionBy} • {new Date(action.actionDate).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-64 flex items-center justify-center">
                <CardContent>
                  <p className="text-slate-500 text-center text-sm">
                    Select a request to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
