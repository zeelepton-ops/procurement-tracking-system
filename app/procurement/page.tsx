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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Procurement Tracking</h1>
          <p className="text-slate-600">Manage and track material request progress</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Requests</p>
                  <p className="text-2xl font-bold text-slate-900">{requests.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {requests.filter(r => r.status === 'PENDING').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {requests.filter(r => ['IN_PROCUREMENT', 'ORDERED', 'PARTIALLY_RECEIVED'].includes(r.status)).length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Critical/Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    {requests.filter(r => 
                      r.urgencyLevel === 'CRITICAL' || isOverdue(r.requiredDate)
                    ).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by request #, item, or job..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROCUREMENT">In Procurement</option>
                <option value="ORDERED">Ordered</option>
                <option value="PARTIALLY_RECEIVED">Partially Received</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
              
              <Select value={filterUrgency} onChange={(e) => setFilterUrgency(e.target.value)}>
                <option value="ALL">All Urgencies</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </Select>
              
              <Button onClick={fetchRequests} variant="outline">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Material Requests ({filteredRequests.length})
            </h2>
            
            <div className="space-y-3 max-h-[700px] overflow-y-auto">
              {filteredRequests.map((request) => {
                const daysLeft = calculateDaysUntilRequired(request.requiredDate)
                const overdue = isOverdue(request.requiredDate)
                
                return (
                  <Card
                    key={request.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedRequest?.id === request.id ? 'ring-2 ring-blue-600' : ''
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <div>
                            <p className="font-semibold text-slate-900">{request.requestNumber}</p>
                            <p className="text-sm text-slate-600">{request.jobOrder.jobNumber}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getUrgencyColor(request.urgencyLevel)}`}>
                            {request.urgencyLevel}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(request.status)}`}>
                            {request.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <p className="font-medium text-slate-800 mb-1">{request.itemName}</p>
                      <p className="text-sm text-slate-600 mb-2">
                        Qty: {request.quantity} {request.unit}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className={overdue ? 'text-red-600 font-medium' : 'text-slate-600'}>
                          {overdue ? `Overdue by ${Math.abs(daysLeft)} days` : `${daysLeft} days left`}
                        </span>
                        <span className="text-slate-500">
                          Required: {formatDate(request.requiredDate)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Request Details & Actions */}
          <div>
            {selectedRequest ? (
              <Card className="sticky top-6">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardTitle>Request Details</CardTitle>
                  <CardDescription className="text-blue-100">
                    {selectedRequest.requestNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Request Info */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600">Item Name</p>
                      <p className="font-medium text-slate-900">{selectedRequest.itemName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-600">Description</p>
                      <p className="text-slate-900">{selectedRequest.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Quantity</p>
                        <p className="font-medium text-slate-900">
                          {selectedRequest.quantity} {selectedRequest.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Job Order</p>
                        <p className="font-medium text-slate-900">{selectedRequest.jobOrder.jobNumber}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-600">Preferred Supplier</p>
                      <p className="text-slate-900">{selectedRequest.preferredSupplier || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-600">Requested By</p>
                      <p className="text-slate-900">{selectedRequest.requestedBy} on {formatDate(selectedRequest.requestedAt)}</p>
                    </div>
                  </div>

                  <hr />

                  {/* Action History */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Action History
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedRequest.procurementActions.map((action) => (
                        <div key={action.id} className="text-sm p-2 bg-slate-50 rounded border border-slate-200">
                          <p className="font-medium text-slate-900">{action.actionType.replace(/_/g, ' ')}</p>
                          <p className="text-slate-600">{action.notes}</p>
                          {action.quotationAmount && (
                            <p className="text-slate-700">Amount: ${action.quotationAmount}</p>
                          )}
                          {action.supplierName && (
                            <p className="text-slate-700">Supplier: {action.supplierName}</p>
                          )}
                          <p className="text-xs text-slate-500">
                            By {action.actionBy} on {formatDate(action.actionDate)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr />

                  {/* Add Action */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Add Action</h3>
                    <form onSubmit={handleActionSubmit} className="space-y-4">
                      <Select
                        value={actionForm.actionType}
                        onChange={(e) => setActionForm({ ...actionForm, actionType: e.target.value })}
                      >
                        <option value="NOTE">Add Note</option>
                        <option value="ASSIGNED">Assign to Procurement</option>
                        <option value="QUOTATION_REQUESTED">Request Quotation</option>
                        <option value="QUOTATION_RECEIVED">Quotation Received</option>
                        <option value="PO_CREATED">Purchase Order Created</option>
                      </Select>

                      <Textarea
                        value={actionForm.notes}
                        onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                        placeholder="Notes..."
                        rows={2}
                        required
                      />

                      {actionForm.actionType === 'QUOTATION_RECEIVED' && (
                        <>
                          <Input
                            type="number"
                            value={actionForm.quotationAmount}
                            onChange={(e) => setActionForm({ ...actionForm, quotationAmount: e.target.value })}
                            placeholder="Quotation Amount"
                            step="0.01"
                          />
                          <Input
                            value={actionForm.supplierName}
                            onChange={(e) => setActionForm({ ...actionForm, supplierName: e.target.value })}
                            placeholder="Supplier Name"
                          />
                        </>
                      )}

                      <Select
                        value={actionForm.newStatus}
                        onChange={(e) => setActionForm({ ...actionForm, newStatus: e.target.value })}
                      >
                        <option value="">Don't change status</option>
                        <option value="IN_PROCUREMENT">Move to In Procurement</option>
                        <option value="ORDERED">Mark as Ordered</option>
                        <option value="PARTIALLY_RECEIVED">Partially Received</option>
                        <option value="RECEIVED">Mark as Received</option>
                        <option value="CANCELLED">Cancel Request</option>
                      </Select>

                      <Button type="submit" className="w-full">
                        Record Action
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <CardContent>
                  <p className="text-slate-500 text-center">
                    Select a request to view details and add actions
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
