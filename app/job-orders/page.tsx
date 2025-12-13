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

  const fetchJobOrders = async () => {
    try {
      const res = await fetch('/api/job-orders')
      const data = await res.json()
      setJobOrders(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch job orders:', error)
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Job Orders</h1>
            <p className="text-slate-600">Manage workshop job orders</p>
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
        <div className="grid grid-cols-1 gap-3">
          {jobOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No job orders found</p>
                <p className="text-sm mt-2">Click "New Job Order" to create one</p>
              </CardContent>
            </Card>
          ) : (
            jobOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2 py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">JO-{order.jobNumber}</CardTitle>
                          {order.priority && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              order.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                              order.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {order.priority}
                            </span>
                          )}
                        </div>
                        <CardDescription className="text-sm mt-0.5">
                          {order.productName}
                        </CardDescription>
                        {order.clientName && (
                          <p className="text-xs text-slate-500 mt-1">Client: {order.clientName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {order._count && (
                        <div className="text-right mr-3">
                          <div className="text-xs text-slate-500">Materials</div>
                          <div className="text-xl font-bold text-blue-600">
                            {order._count.materialRequests}
                          </div>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(order.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {order.foreman && (
                      <div>
                        <span className="text-slate-500">Foreman:</span>
                        <span className="ml-1 font-medium">{order.foreman}</span>
                      </div>
                    )}
                    {order.contactPerson && (
                      <div>
                        <span className="text-slate-500">Contact:</span>
                        <span className="ml-1 font-medium">{order.contactPerson}</span>
                      </div>
                    )}
                    {order.lpoContractNo && (
                      <div>
                        <span className="text-slate-500">LPO:</span>
                        <span className="ml-1 font-medium">{order.lpoContractNo}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">Created:</span>
                      <span className="ml-1 font-medium">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>

                {/* Delete Confirmation */}
                {deleteConfirm === order.id && (
                  <div className="bg-red-50 border-t border-red-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-red-800">Are you sure you want to delete this job order?</p>
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
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
