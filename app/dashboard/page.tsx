'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { 
  Package, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  Bell,
  BarChart3
} from 'lucide-react'
import { formatDate, getUrgencyColor, getStatusColor, calculateDaysUntilRequired, isOverdue, isUrgent } from '@/lib/utils'

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
    supplierName: string | null
  }>
  purchaseOrderItems: Array<{
    orderedQuantity: number
    receivedQuantity: number
    deliveryStatus: string
    purchaseOrder: {
      poNumber: string
      supplierName: string
      expectedDelivery: string | null
    }
  }>
}

export default function StatusDashboardPage() {
  const [requests, setRequests] = useState<MaterialRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  const [userRole, setUserRole] = useState('production')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [showUrgentOnly, setShowUrgentOnly] = useState(false)

  useEffect(() => {
    fetchRequests()
    const interval = setInterval(() => {
      fetchRequests()
    }, 10000) // Refresh every 10 seconds for real-time updates
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterRequests()
  }, [requests, filterStatus, searchTerm, showUrgentOnly])

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/material-requests')
      const data = await res.json()
      setRequests(data)
      setLastUpdate(new Date())
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
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r =>
        r.requestNumber.toLowerCase().includes(term) ||
        r.itemName.toLowerCase().includes(term) ||
        r.jobOrder.jobNumber.toLowerCase().includes(term)
      )
    }
    
    if (showUrgentOnly) {
      filtered = filtered.filter(r => isUrgent(r.requiredDate, r.urgencyLevel))
    }
    
    setFilteredRequests(filtered)
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    inProgress: requests.filter(r => ['IN_PROCUREMENT', 'ORDERED', 'PARTIALLY_RECEIVED'].includes(r.status)).length,
    received: requests.filter(r => r.status === 'RECEIVED').length,
    urgent: requests.filter(r => isUrgent(r.requiredDate, r.urgencyLevel)).length,
    overdue: requests.filter(r => isOverdue(r.requiredDate) && r.status !== 'RECEIVED').length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-slate-900">Live Status Dashboard</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                Live • Updated {lastUpdate.toLocaleTimeString()}
              </div>
              <Button onClick={fetchRequests} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-slate-600">Real-time tracking for all material requests</p>
        </div>

        {/* Role Selector */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700">View as:</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={userRole === 'production' ? 'default' : 'outline'}
                  onClick={() => setUserRole('production')}
                >
                  Production Team
                </Button>
                <Button
                  size="sm"
                  variant={userRole === 'store' ? 'default' : 'outline'}
                  onClick={() => setUserRole('store')}
                >
                  Store Person
                </Button>
                <Button
                  size="sm"
                  variant={userRole === 'project' ? 'default' : 'outline'}
                  onClick={() => setUserRole('project')}
                >
                  Project Team
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Total</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 uppercase">In Progress</p>
                  <p className="text-3xl font-bold text-indigo-600">{stats.inProgress}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Received</p>
                  <p className="text-3xl font-bold text-green-600">{stats.received}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Urgent</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.urgent}</p>
                </div>
                <Bell className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Overdue</p>
                  <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROCUREMENT">In Procurement</option>
                <option value="ORDERED">Ordered</option>
                <option value="PARTIALLY_RECEIVED">Partially Received</option>
                <option value="RECEIVED">Received</option>
              </Select>
              
              <Button
                variant={showUrgentOnly ? 'default' : 'outline'}
                onClick={() => setShowUrgentOnly(!showUrgentOnly)}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Urgent Only
              </Button>
              
              <Button variant="outline" onClick={() => {
                setFilterStatus('ALL')
                setSearchTerm('')
                setShowUrgentOnly(false)
              }}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Material Requests ({filteredRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Request #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Job Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Urgency</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Required Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRequests.map((request) => {
                    const daysLeft = calculateDaysUntilRequired(request.requiredDate)
                    const overdue = isOverdue(request.requiredDate)
                    const urgent = isUrgent(request.requiredDate, request.urgencyLevel)
                    
                    return (
                      <tr 
                        key={request.id} 
                        className={`hover:bg-slate-50 transition-colors ${urgent ? 'bg-orange-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {urgent && <Bell className="h-4 w-4 text-orange-500 animate-pulse" />}
                            <span className="font-medium text-slate-900">{request.requestNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{request.jobOrder.jobNumber}</p>
                            <p className="text-xs text-slate-600">{request.jobOrder.productName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-900">{request.itemName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-900">{request.quantity} {request.unit}</p>
                          {request.purchaseOrderItems.length > 0 && (
                            <p className="text-xs text-green-600">
                              Received: {request.purchaseOrderItems[0].receivedQuantity} {request.unit}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(request.status)}`}>
                            {request.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getUrgencyColor(request.urgencyLevel)}`}>
                            {request.urgencyLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-slate-900'}`}>
                            {formatDate(request.requiredDate)}
                          </p>
                          <p className={`text-xs ${overdue ? 'text-red-600' : 'text-slate-600'}`}>
                            {overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {request.procurementActions.length > 0 && (
                              <p className="text-xs text-slate-600">
                                Last: {request.procurementActions[0].actionType.replace(/_/g, ' ')}
                              </p>
                            )}
                            {request.purchaseOrderItems.length > 0 && (
                              <p className="text-xs text-blue-600">
                                PO: {request.purchaseOrderItems[0].purchaseOrder.poNumber}
                              </p>
                            )}
                            {request.purchaseOrderItems.length === 0 && request.procurementActions.length === 0 && (
                              <p className="text-xs text-slate-400">No updates yet</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              
              {filteredRequests.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No requests found matching your filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
