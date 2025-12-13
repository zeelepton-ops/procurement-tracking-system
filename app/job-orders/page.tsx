'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Package, X, Trash2, Edit } from 'lucide-react'

interface JobOrder {
  id: string
  jobNumber: string
  productName: string
  drawingRef: string | null
  clientName: string | null
  contactPerson: string | null
  phone: string | null
  lpoContractNo: string | null
  priority: string | null
  foreman: string | null
  workScope: string | null
  qaQcInCharge: string | null
  createdAt: string
  _count?: {
    materialRequests: number
  }
}

export default function JobOrdersPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    priority: 'ALL'
  })
  const [selectedJob, setSelectedJob] = useState<JobOrder | null>(null)
  const [formData, setFormData] = useState({
    jobNumber: '',
    productName: '',
    drawingRef: '',
    clientName: '',
    contactPerson: '',
    phone: '',
    lpoContractNo: '',
    priority: 'MEDIUM',
    foreman: '',
    workScope: '',
    qaQcInCharge: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchJobOrders()
  }, [])

  const filteredOrders = jobOrders.filter((order) => {
    const matchesSearch = filters.search
      ? `${order.jobNumber} ${order.productName} ${order.clientName || ''} ${order.foreman || ''}`
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      : true

    const matchesPriority = filters.priority === 'ALL'
      ? true
      : (order.priority || 'MEDIUM') === filters.priority

    return matchesSearch && matchesPriority
  })

  const fetchJobOrders = async () => {
    try {
      const res = await fetch('/api/job-orders')
      if (!res.ok) {
        throw new Error(`Failed to fetch job orders: ${res.status}`)
      }
      const data = await res.json()
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setJobOrders(data)
      } else {
        console.error('Invalid response format:', data)
        setJobOrders([])
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch job orders:', error)
      setJobOrders([])
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/job-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create job order')
      }

      // Reset form and refresh list
      setFormData({ 
        jobNumber: '', 
        productName: '', 
        drawingRef: '',
        clientName: '',
        contactPerson: '',
        phone: '',
        lpoContractNo: '',
        priority: 'MEDIUM',
        foreman: '',
        workScope: '',
        qaQcInCharge: ''
      })
      setShowForm(false)
      fetchJobOrders()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/job-orders?id=${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete job order')
      }

      setDeleteConfirm(null)
      fetchJobOrders()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading job orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-0.5">Job Orders</h1>
            <p className="text-slate-600 text-sm">Manage workshop job orders</p>
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
                New Job Order
              </>
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-slate-600">Search</Label>
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Job #, description, client, foreman"
              className="h-9 text-sm"
            />
          </div>
          <div className="max-w-xs">
            <Label className="text-xs text-slate-600">Priority</Label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="mt-1 h-9 w-full px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="mb-6 border-blue-200 shadow-lg">
            <CardHeader className="bg-blue-50 py-3">
              <CardTitle className="text-blue-900 text-lg">Create New Job Order</CardTitle>
              <CardDescription>Enter the details for the new job order (as per NBTC template)</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="jobNumber" className="text-sm font-semibold">Job Number *</Label>
                    <Input
                      id="jobNumber"
                      value={formData.jobNumber}
                      onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                      placeholder="e.g., 7439"
                      required
                      className="mt-1 h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="foreman" className="text-sm font-semibold">Foreman</Label>
                    <Input
                      id="foreman"
                      value={formData.foreman}
                      onChange={(e) => setFormData({ ...formData, foreman: e.target.value })}
                      placeholder="e.g., GUNA"
                      className="mt-1 h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority" className="text-sm font-semibold">Priority *</Label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      required
                      className="mt-1 h-9 w-full px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                </div>

                {/* Client Information */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Client Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="clientName" className="text-sm font-semibold">Client Name *</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                        placeholder="e.g., QATAR ENGINEERING & CONSTRUCTION CO. WLL"
                        required
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPerson" className="text-sm font-semibold">Contact Person</Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="e.g., LENIN.M"
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-semibold">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+974 5508 7272"
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lpoContractNo" className="text-sm font-semibold">LPO / Contract No</Label>
                      <Input
                        id="lpoContractNo"
                        value={formData.lpoContractNo}
                        onChange={(e) => setFormData({ ...formData, lpoContractNo: e.target.value })}
                        placeholder="LPO-2025-13135"
                        className="mt-1 h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Work Scope & QA/QC */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Work Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="productName" className="text-sm font-semibold">Product / Job Description *</Label>
                      <Textarea
                        id="productName"
                        value={formData.productName}
                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                        placeholder="e.g., SUPPLY, FABRICATION, GALVANIZING & PAINTING OF MS BOLLARD"
                        required
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="workScope" className="text-sm font-semibold">Work Scope</Label>
                      <Textarea
                        id="workScope"
                        value={formData.workScope}
                        onChange={(e) => setFormData({ ...formData, workScope: e.target.value })}
                        placeholder="Design, Supply, Fabrication, Machining, Blasting, Painting, etc."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="drawingRef" className="text-sm font-semibold">Drawing / Enquiry Reference</Label>
                    <Input
                      id="drawingRef"
                      value={formData.drawingRef}
                      onChange={(e) => setFormData({ ...formData, drawingRef: e.target.value })}
                      placeholder="e.g., E-11899 (Rev. 00)"
                      className="mt-1 h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="qaQcInCharge" className="text-sm font-semibold">QA/QC In Charge</Label>
                    <Input
                      id="qaQcInCharge"
                      value={formData.qaQcInCharge}
                      onChange={(e) => setFormData({ ...formData, qaQcInCharge: e.target.value })}
                      placeholder="e.g., Mr. VILLAVAN"
                      className="mt-1 h-9"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    {submitting ? 'Creating...' : 'Create Job Order'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowForm(false)
                      setError('')
                      setFormData({ 
                        jobNumber: '', 
                        productName: '', 
                        drawingRef: '',
                        clientName: '',
                        contactPerson: '',
                        phone: '',
                        lpoContractNo: '',
                        priority: 'MEDIUM',
                        foreman: '',
                        workScope: '',
                        qaQcInCharge: ''
                      })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Job Orders List */}
        <div className="space-y-2">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-slate-500">
                <Package className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                <p>No job orders found</p>
                <p className="text-xs mt-1">Adjust filters or create a new job order</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-slate-200">
              <CardHeader className="py-2">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-600">
                  <div className="col-span-2">Job # / Priority</div>
                  <div className="col-span-4">Description</div>
                  <div className="col-span-2">Client / Foreman</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-1 text-right">Materials</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`grid grid-cols-12 items-center gap-2 px-3 py-2 text-[12px] cursor-pointer hover:bg-blue-50 ${selectedJob?.id === order.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedJob(order)}
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        <div className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          order.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          order.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {order.priority || 'MEDIUM'}
                        </div>
                        <div className="font-semibold text-slate-900">JO-{order.jobNumber}</div>
                      </div>
                      <div className="col-span-4 truncate" title={order.productName}>{order.productName}</div>
                      <div className="col-span-2 truncate">
                        {order.clientName && <span className="block text-slate-800 truncate">{order.clientName}</span>}
                        {order.foreman && <span className="block text-slate-500 truncate">Foreman: {order.foreman}</span>}
                      </div>
                      <div className="col-span-2 text-slate-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="col-span-1 text-right font-semibold text-blue-700">
                        {order._count?.materialRequests ?? 0}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm(order.id)
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {deleteConfirm === order.id && (
                        <div className="col-span-12 bg-red-50 border border-red-200 rounded px-3 py-2 mt-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between text-[12px] text-red-800">
                            <p>Delete this job order?</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(order.id)}
                                className="h-7 text-xs"
                              >
                                Delete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteConfirm(null)}
                                className="h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Selected job details */}
        {selectedJob && (
          <Card className="mt-3 border-blue-100">
            <CardHeader className="py-3 bg-blue-50">
              <CardTitle className="text-lg text-blue-900">Job Order Details</CardTitle>
              <CardDescription>JO-{selectedJob.jobNumber}</CardDescription>
            </CardHeader>
            <CardContent className="pt-3 text-sm text-slate-800 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-slate-500 text-xs">Priority</div>
                  <div>{selectedJob.priority || 'MEDIUM'}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Client</div>
                  <div>{selectedJob.clientName || '—'}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Foreman</div>
                  <div>{selectedJob.foreman || '—'}</div>
                </div>
              </div>

              <div>
                <div className="text-slate-500 text-xs">Description</div>
                <div>{selectedJob.productName}</div>
              </div>

              {selectedJob.workScope && (
                <div>
                  <div className="text-slate-500 text-xs">Work Scope</div>
                  <div>{selectedJob.workScope}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {selectedJob.contactPerson && (
                  <div>
                    <div className="text-slate-500 text-xs">Contact Person</div>
                    <div>{selectedJob.contactPerson}</div>
                  </div>
                )}
                {selectedJob.phone && (
                  <div>
                    <div className="text-slate-500 text-xs">Phone</div>
                    <div>{selectedJob.phone}</div>
                  </div>
                )}
                {selectedJob.lpoContractNo && (
                  <div>
                    <div className="text-slate-500 text-xs">LPO / Contract</div>
                    <div>{selectedJob.lpoContractNo}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedJob.drawingRef && (
                  <div>
                    <div className="text-slate-500 text-xs">Drawing / Enquiry Ref</div>
                    <div>{selectedJob.drawingRef}</div>
                  </div>
                )}
                {selectedJob.qaQcInCharge && (
                  <div>
                    <div className="text-slate-500 text-xs">QA/QC In Charge</div>
                    <div>{selectedJob.qaQcInCharge}</div>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-500">Created: {new Date(selectedJob.createdAt).toLocaleString()}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
