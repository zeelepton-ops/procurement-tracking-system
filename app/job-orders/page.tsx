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
  clientContactPerson: string | null
  clientContactPhone: string | null
  lpoContractNo: string | null
  priority: string | null
  foreman: string | null
  workScope: string | null
  scopeOfWorks?: string | string[] | null
  qaQcInCharge: string | null
  createdAt: string
  lastEditedBy: string | null
  lastEditedAt: string | null
  isDeleted?: boolean
  deletedAt?: string | null
  deletedBy?: string | null
  items?: JobOrderItem[]
  _count?: {
    materialRequests: number
  }
}

interface JobOrderItem {
  id?: string
  workDescription: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
}

const SCOPE_OF_WORKS_OPTIONS = [
  'Profiling/Cutting',
  'Plate Rolling & Bending',
  'Section Bending',
  'Drilling & Machining',
  'Storage Tanks & Silos',
  'Pressure Vessels',
  'Pipe Spools',
  'Material Handling Eqpt.',
  'Primary Structure',
  'Secondary Steel',
  'Pipe Supports',
  'Abrasive Blasting',
  'Industrial Coating',
  'Lining Services',
  'Galvanizing',
  'Erection & Installation',
  'Maintenance',
  'NDT Testing'
]

export default function JobOrdersPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [deletedJobOrders, setDeletedJobOrders] = useState<JobOrder[]>([])
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
    phone: '+974 ',
    clientContactPerson: '',
    clientContactPhone: '+974 ',
    lpoContractNo: '',
    priority: 'MEDIUM',
    foreman: '',
    workScope: '',
    scopeOfWorks: [] as string[],
    qaQcInCharge: ''
  })
  const [workItems, setWorkItems] = useState<JobOrderItem[]>([
    { workDescription: '', quantity: 0, unit: 'PCS', unitPrice: 0, totalPrice: 0 }
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingJob, setEditingJob] = useState<JobOrder | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    jobNumber: '',
    productName: '',
    drawingRef: '',
    clientName: '',
    contactPerson: '',
    phone: '+974 ',
    clientContactPerson: '',
    clientContactPhone: '+974 ',
    lpoContractNo: '',
    priority: 'MEDIUM',
    foreman: '',
    workScope: '',
    scopeOfWorks: [] as string[],
    qaQcInCharge: ''
  })
  const [editWorkItems, setEditWorkItems] = useState<JobOrderItem[]>([
    { workDescription: '', quantity: 0, unit: 'PCS', unitPrice: 0, totalPrice: 0 }
  ])

  useEffect(() => {
    fetchJobOrders()
    fetchDeletedJobOrders()
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

  const addWorkItem = () => {
    setWorkItems([...workItems, { workDescription: '', quantity: 0, unit: 'PCS', unitPrice: 0, totalPrice: 0 }])
  }

  const removeWorkItem = (index: number) => {
    setWorkItems(workItems.filter((_, i) => i !== index))
  }

  const updateWorkItem = (index: number, field: keyof JobOrderItem, value: any) => {
    const updated = [...workItems]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice
    }
    setWorkItems(updated)
  }

  const addEditWorkItem = () => {
    setEditWorkItems([...editWorkItems, { workDescription: '', quantity: 0, unit: 'PCS', unitPrice: 0, totalPrice: 0 }])
  }

  const removeEditWorkItem = (index: number) => {
    setEditWorkItems(editWorkItems.filter((_, i) => i !== index))
  }

  const updateEditWorkItem = (index: number, field: keyof JobOrderItem, value: any) => {
    const updated = [...editWorkItems]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice
    }
    setEditWorkItems(updated)
  }

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

  const fetchDeletedJobOrders = async () => {
    try {
      const res = await fetch('/api/job-orders?includeDeleted=true')
      if (!res.ok) {
        throw new Error(`Failed to fetch deleted job orders: ${res.status}`)
      }
      const data = await res.json()
      
      // Filter only deleted jobs
      if (Array.isArray(data)) {
        const deleted = data.filter((job: JobOrder) => (job as any).isDeleted)
        setDeletedJobOrders(deleted)
      } else {
        console.error('Invalid response format:', data)
        setDeletedJobOrders([])
      }
    } catch (error) {
      console.error('Failed to fetch deleted job orders:', error)
      setDeletedJobOrders([])
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
        body: JSON.stringify({
          ...formData,
          items: workItems.filter(item => item.workDescription && item.quantity > 0)
        })
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
        phone: '+974 ',
        clientContactPerson: '',
        clientContactPhone: '+974 ',
        lpoContractNo: '',
        priority: 'MEDIUM',
        foreman: '',
        workScope: '',
        scopeOfWorks: [],
        qaQcInCharge: ''
      })
      setWorkItems([{ workDescription: '', quantity: 0, unit: 'PCS', unitPrice: 0, totalPrice: 0 }])
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
      fetchDeletedJobOrders()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      setRestoring(id)
      const res = await fetch('/api/job-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'restore' })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to restore job order')
      }

      setRestoring(null)
      fetchJobOrders()
      fetchDeletedJobOrders()
    } catch (err: any) {
      alert(err.message)
      setRestoring(null)
    }
  }

  const handleEditClick = (job: JobOrder) => {
    setEditingJob(job)
    const scopeOfWorks = job.scopeOfWorks ? 
      (typeof job.scopeOfWorks === 'string' ? JSON.parse(job.scopeOfWorks) : job.scopeOfWorks) 
      : []
    setEditFormData({
      jobNumber: job.jobNumber,
      productName: job.productName,
      drawingRef: job.drawingRef || '',
      clientName: job.clientName || '',
      contactPerson: job.contactPerson || '',
      phone: job.phone || '+974 ',
      clientContactPerson: job.clientContactPerson || '',
      clientContactPhone: job.clientContactPhone || '+974 ',
      lpoContractNo: job.lpoContractNo || '',
      priority: job.priority || 'MEDIUM',
      foreman: job.foreman || '',
      workScope: job.workScope || '',
      scopeOfWorks: scopeOfWorks,
      qaQcInCharge: job.qaQcInCharge || ''
    })
    setEditWorkItems(job.items && job.items.length > 0 
      ? job.items 
      : [{ workDescription: '', quantity: 0, unit: 'PCS', unitPrice: 0, totalPrice: 0 }]
    )
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingJob) return

    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/job-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingJob.id,
          ...editFormData,
          items: editWorkItems.filter(item => item.workDescription && item.quantity > 0)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update job order')
      }

      setEditingJob(null)
      setSelectedJob(data)
      fetchJobOrders()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
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
                <h3 className="text-sm font-bold text-slate-700 mb-3">Client & NBTC Contact Information</h3>
                {/* Contact block - line 1 (Foreman, Priority, NBTC contact + phone, QA/QC, Drawing) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-2" data-edit-key="foreman">
                    <Label htmlFor="foreman" className="text-sm font-semibold">Foreman</Label>
                    <Input
                      id="foreman"
                      value={formData.foreman}
                      onChange={(e) => setFormData({ ...formData, foreman: e.target.value })}
                      placeholder="e.g., GUNA"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-2 relative" data-edit-key="priority">
                    <Label htmlFor="priority" className="text-sm font-semibold">Priority *</Label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      required
                      className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm z-20"
                    >
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                  <div className="md:col-span-2" data-edit-key="contactPerson">
                    <Label htmlFor="contactPerson" className="text-sm font-semibold">NBTC's Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="e.g., NBTC Rep"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-2" data-edit-key="phone">
                    <Label htmlFor="phone" className="text-sm font-semibold">NBTC's Contact Phone No.</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+974 5508 7272"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-2" data-edit-key="qaQc">
                    <Label htmlFor="qaQcInCharge" className="text-sm font-semibold">QA/QC In Charge</Label>
                    <Input
                      id="qaQcInCharge"
                      value={formData.qaQcInCharge}
                      onChange={(e) => setFormData({ ...formData, qaQcInCharge: e.target.value })}
                      placeholder="e.g., Mr. VILLAVAN"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-2" data-edit-key="drawing">
                    <Label htmlFor="drawingRef" className="text-sm font-semibold">Drawing / Enquiry Ref</Label>
                    <Input
                      id="drawingRef"
                      value={formData.drawingRef}
                      onChange={(e) => setFormData({ ...formData, drawingRef: e.target.value })}
                      placeholder="e.g., E-11899"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                </div> 

                {/* Job & Client quick row (line 2) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-2" data-edit-key="jobNumber">
                    <Label htmlFor="jobNumber" className="text-sm font-semibold">Job Number *</Label>
                    <Input
                      id="jobNumber"
                      value={formData.jobNumber}
                      onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                      placeholder="e.g., 07439"
                      required
                      className="mt-1 h-9 w-full text-sm"
                    />
                  </div>
                  <div className="md:col-span-4" data-edit-key="client">
                    <Label htmlFor="clientName" className="text-sm font-semibold">Client Name *</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="e.g., QATAR ENGINEERING & CONSTRUCTION CO. WLL"
                      required
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-2" data-edit-key="lpo">
                    <Label htmlFor="lpoContractNo" className="text-sm font-semibold">LPO / Contract No</Label>
                    <Input
                      id="lpoContractNo"
                      value={formData.lpoContractNo}
                      onChange={(e) => setFormData({ ...formData, lpoContractNo: e.target.value })}
                      placeholder="LPO-2025-13135"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="clientContactPerson" className="text-sm font-semibold">Client's Contact Person</Label>
                    <Input
                      id="clientContactPerson"
                      value={formData.clientContactPerson}
                      onChange={(e) => setFormData({ ...formData, clientContactPerson: e.target.value })}
                      placeholder="e.g., LENIN.M"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="clientContactPhone" className="text-sm font-semibold">Client's Phone No.</Label>
                    <Input
                      id="clientContactPhone"
                      value={formData.clientContactPhone}
                      onChange={(e) => setFormData({ ...formData, clientContactPhone: e.target.value })}
                      placeholder="+974 55xx xxxx"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                </div>



                {/* Work Scope only */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Work Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label htmlFor="productName" className="text-sm font-semibold">Main Description *</Label>
                      <Input
                        id="productName"
                        value={formData.productName}
                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                        placeholder="Main description of the job order"
                        required
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="workScope" className="text-sm font-semibold">Additional Notes</Label>
                      <Input
                        id="workScope"
                        value={formData.workScope}
                        onChange={(e) => setFormData({ ...formData, workScope: e.target.value })}
                        placeholder="Any additional notes or specifications"
                        className="mt-1 h-9"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label className="text-sm font-semibold block mb-3">Scope of Works</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                      {SCOPE_OF_WORKS_OPTIONS.map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`scope-${option}`}
                            checked={formData.scopeOfWorks.includes(option)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  scopeOfWorks: [...formData.scopeOfWorks, option]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  scopeOfWorks: formData.scopeOfWorks.filter(s => s !== option)
                                })
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor={`scope-${option}`} className="text-sm cursor-pointer text-slate-700">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div> 



                {/* Work Items */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-700">Work Items</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addWorkItem}
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  
                  {/* Header row - shown once */}
                  <div className="grid grid-cols-12 gap-2 mb-2 px-3">
                    <div className="col-span-5">
                      <Label className="text-xs font-semibold text-slate-600">Work Description *</Label>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold text-slate-600">Quantity *</Label>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold text-slate-600">Unit *</Label>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold text-slate-600">Unit Price</Label>
                    </div>
                    <div className="col-span-1"></div>
                  </div>

                  <div className="space-y-2">
                    {workItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded">
                        <div className="col-span-5">
                          <Input
                            value={item.workDescription}
                            onChange={(e) => updateWorkItem(index, 'workDescription', e.target.value)}
                            placeholder="e.g., Fabrication of MS Bollard"
                            required
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => updateWorkItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            required
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={item.unit}
                            onChange={(e) => updateWorkItem(index, 'unit', e.target.value)}
                            placeholder="PCS"
                            required
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice || ''}
                            onChange={(e) => updateWorkItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          {workItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeWorkItem(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {item.quantity > 0 && item.unitPrice > 0 && (
                          <div className="col-span-12 text-xs text-slate-600">
                            Total: {item.totalPrice.toFixed(2)} QAR
                          </div>
                        )}
                      </div>
                    ))}
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
                        phone: '+974 ',
                        clientContactPerson: '',
                        clientContactPhone: '+974 ',
                        lpoContractNo: '',
                        priority: 'MEDIUM',
                        foreman: '',
                        workScope: '',
                        scopeOfWorks: [],
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

        {/* Deleted Job Orders Section */}
        {deletedJobOrders.length > 0 && (
          <Card className="mt-6 border-amber-200 bg-amber-50">
            <CardHeader className="py-3 bg-amber-100">
              <CardTitle className="text-amber-900 text-lg">Deleted Job Orders ({deletedJobOrders.length})</CardTitle>
              <CardDescription className="text-amber-700">Soft-deleted records that can be restored</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-amber-200">
                {deletedJobOrders.map((order) => (
                  <div
                    key={order.id}
                    className="grid grid-cols-12 items-center gap-2 px-3 py-2 text-[12px] hover:bg-amber-100"
                  >
                    <div className="col-span-2">
                      <div className="font-semibold text-amber-900">JO-{order.jobNumber}</div>
                      <div className="text-[10px] text-amber-700">Deleted</div>
                    </div>
                    <div className="col-span-4 truncate text-amber-800">{order.productName}</div>
                    <div className="col-span-3 truncate text-amber-700">
                      {order.clientName && <span className="block truncate">{order.clientName}</span>}
                      {order.foreman && <span className="block text-[11px]">Foreman: {order.foreman}</span>}
                    </div>
                    <div className="col-span-2 text-amber-700">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(order.id)}
                        disabled={restoring === order.id}
                        className="h-7 text-[11px] text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                      >
                        {restoring === order.id ? 'Restoring...' : 'Restore'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected job details */}
        {selectedJob && (
          <Card className="mt-3 border-blue-100">
            <CardHeader className="py-3 bg-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-blue-900">Job Order Details</CardTitle>
                  <CardDescription>JO-{selectedJob.jobNumber}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(selectedJob)}
                  className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-3 text-sm text-slate-800 space-y-3">
              {/* Contact block - line 1 (Details view) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-2" data-edit-key="foreman">
                  <div className="text-slate-500 text-xs">Foreman</div>
                  <div className="whitespace-normal">{selectedJob.foreman || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="priority">
                  <div className="text-slate-500 text-xs">Priority</div>
                  <div className="text-sm font-medium">{selectedJob.priority || 'MEDIUM'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="contactPerson">
                  <div className="text-slate-500 text-xs">NBTC's Contact Person</div>
                  <div className="whitespace-normal">{selectedJob.contactPerson || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="phone">
                  <div className="text-slate-500 text-xs">NBTC's Contact Phone No.</div>
                  <div className="whitespace-normal">{selectedJob.phone || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="qaQc">
                  <div className="text-slate-500 text-xs">QA/QC In Charge</div>
                  <div className="whitespace-normal">{selectedJob.qaQcInCharge || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="drawing">
                  <div className="text-slate-500 text-xs">Drawing</div>
                  <div className="truncate">{selectedJob.drawingRef || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-2" data-edit-key="jobNumber">
                  <div className="text-slate-500 text-xs">Job Number</div>
                  <div className="font-semibold whitespace-nowrap">JO-{selectedJob.jobNumber}</div>
                </div>
                <div className="md:col-span-4" data-edit-key="client">
                  <div className="text-slate-500 text-xs">Client</div>
                  <div className="whitespace-normal">{selectedJob.clientName || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="lpo">
                  <div className="text-slate-500 text-xs">LPO / Contract</div>
                  <div className="whitespace-normal">{selectedJob.lpoContractNo || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="clientContact">
                  <div className="text-slate-500 text-xs">Client's Contact Person</div>
                  <div className="whitespace-normal">{selectedJob.clientContactPerson || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="clientPhone">
                  <div className="text-slate-500 text-xs">Client's Phone No.</div>
                  <div className="whitespace-normal">{selectedJob.clientContactPhone || '—'}</div>
                </div>
              </div>  


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-500 text-xs">Description</div>
                  <div className="truncate">{selectedJob.productName}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Additional Notes</div>
                  <div className="truncate">{selectedJob.workScope}</div>
                </div>
              </div> 

              {/* Work Items Table */}
              {selectedJob.items && selectedJob.items.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-sm font-semibold text-slate-700 mb-2">Work Items</div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left p-2 font-semibold">Description</th>
                          <th className="text-right p-2 font-semibold">Qty</th>
                          <th className="text-left p-2 font-semibold">Unit</th>
                          <th className="text-right p-2 font-semibold">Unit Price</th>
                          <th className="text-right p-2 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedJob.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50">
                            <td className="p-2 max-w-[40ch] two-line">{item.workDescription}</td>
                            <td className="p-2 text-right whitespace-nowrap">{item.quantity}</td>
                            <td className="p-2 whitespace-nowrap">{item.unit}</td>
                            <td className="p-2 text-right whitespace-nowrap">{item.unitPrice.toFixed(2)} QAR</td>
                            <td className="p-2 text-right whitespace-nowrap font-semibold">{item.totalPrice.toFixed(2)} QAR</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2">
                        <tr>
                          <td colSpan={4} className="p-2 text-right font-bold">Grand Total:</td>
                          <td className="p-2 text-right font-bold text-blue-600">
                            {selectedJob.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)} QAR
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              <div className="border-t pt-3 space-y-1">
                <div className="text-xs text-slate-500">Created: {new Date(selectedJob.createdAt).toLocaleString()}</div>
                {selectedJob.lastEditedBy && selectedJob.lastEditedAt && (
                  <div className="text-xs text-blue-600">
                    Last edited: {new Date(selectedJob.lastEditedAt).toLocaleString()} by {selectedJob.lastEditedBy}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Job Order Modal */}
        {editingJob && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto" onClick={() => setEditingJob(null)}>
            <div className="w-full max-w-5xl my-8" onClick={(e) => e.stopPropagation()}>
              <Card className="w-full bg-white shadow-2xl max-h-[95vh] flex flex-col">
                <CardHeader className="bg-blue-50 py-3 flex-shrink-0 border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-blue-900 text-lg">Edit Job Order</CardTitle>
                      <CardDescription>JO-{editingJob.jobNumber}</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingJob(null)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 overflow-y-auto bg-white flex-1">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Client & NBTC Contact Information</h3>
                  {/* Contact block - line 1 (edit modal) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-foreman" className="text-sm font-semibold">Foreman</Label>
                      <Input
                        id="edit-foreman"
                        value={editFormData.foreman}
                        onChange={(e) => setEditFormData({ ...editFormData, foreman: e.target.value })}
                        className="mt-1 h-9 w-full"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label htmlFor="edit-priority" className="text-sm font-semibold">Priority *</Label>
                      <select
                        id="edit-priority"
                        value={editFormData.priority}
                        onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                        required
                        className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm z-20"
                      >
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-contactPerson" className="text-sm font-semibold">NBTC's Contact Person</Label>
                      <Input
                        id="edit-contactPerson"
                        value={editFormData.contactPerson}
                        onChange={(e) => setEditFormData({ ...editFormData, contactPerson: e.target.value })}
                        className="mt-1 h-9 w-full"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-phone" className="text-sm font-semibold">NBTC's Contact Phone No.</Label>
                      <Input
                        id="edit-phone"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="mt-1 h-9 w-full"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-qaQcInCharge" className="text-sm font-semibold">QA/QC In Charge</Label>
                      <Input
                        id="edit-qaQcInCharge"
                        value={editFormData.qaQcInCharge}
                        onChange={(e) => setEditFormData({ ...editFormData, qaQcInCharge: e.target.value })}
                        className="mt-1 h-9 w-full"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-drawingRef" className="text-sm font-semibold">Drawing / Enquiry Ref</Label>
                      <Input
                        id="edit-drawingRef"
                        value={editFormData.drawingRef}
                        onChange={(e) => setEditFormData({ ...editFormData, drawingRef: e.target.value })}
                        className="mt-1 h-9 w-full"
                      />
                    </div>
                  </div>

                  {/* Job & Client quick row (edit modal) */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-jobNumber" className="text-sm font-semibold">Job Number *</Label>
                        <Input
                          id="edit-jobNumber"
                          value={editFormData.jobNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, jobNumber: e.target.value })}
                          required
                          className="mt-1 h-9 w-full text-sm"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <Label htmlFor="edit-clientName" className="text-sm font-semibold">Client Name *</Label>
                        <Input
                          id="edit-clientName"
                          value={editFormData.clientName}
                          onChange={(e) => setEditFormData({ ...editFormData, clientName: e.target.value })}
                          required
                          className="mt-1 h-9 w-full text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-lpoContractNo" className="text-sm font-semibold">LPO / Contract No</Label>
                        <Input
                          id="edit-lpoContractNo"
                          value={editFormData.lpoContractNo}
                          onChange={(e) => setEditFormData({ ...editFormData, lpoContractNo: e.target.value })}
                          className="mt-1 h-9 w-full text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-clientContactPerson" className="text-sm font-semibold">Client's Contact Person</Label>
                        <Input
                          id="edit-clientContactPerson"
                          value={editFormData.clientContactPerson}
                          onChange={(e) => setEditFormData({ ...editFormData, clientContactPerson: e.target.value })}
                          className="mt-1 h-9 w-full text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-clientContactPhone" className="text-sm font-semibold">Client's Phone No.</Label>
                        <Input
                          id="edit-clientContactPhone"
                          value={editFormData.clientContactPhone}
                          onChange={(e) => setEditFormData({ ...editFormData, clientContactPhone: e.target.value })}
                          className="mt-1 h-9 w-full text-sm"
                        />
                      </div>
                    </div>
                  </div> 

                  {/* Work Scope only */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Work Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div>
                        <Label htmlFor="edit-productName" className="text-sm font-semibold">Main Description *</Label>
                        <Input
                          id="edit-productName"
                          value={editFormData.productName}
                          onChange={(e) => setEditFormData({ ...editFormData, productName: e.target.value })}
                          required
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-workScope" className="text-sm font-semibold">Additional Notes</Label>
                        <Input
                          id="edit-workScope"
                          value={editFormData.workScope}
                          onChange={(e) => setEditFormData({ ...editFormData, workScope: e.target.value })}
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label className="text-sm font-semibold block mb-3">Scope of Works</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-4 rounded border border-slate-200">
                        {SCOPE_OF_WORKS_OPTIONS.map((option) => (
                          <div key={option} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`edit-scope-${option}`}
                              checked={editFormData.scopeOfWorks.includes(option)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditFormData({
                                    ...editFormData,
                                    scopeOfWorks: [...editFormData.scopeOfWorks, option]
                                  })
                                } else {
                                  setEditFormData({
                                    ...editFormData,
                                    scopeOfWorks: editFormData.scopeOfWorks.filter(s => s !== option)
                                  })
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`edit-scope-${option}`} className="text-sm cursor-pointer text-slate-700">
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>



                  {/* Work Items */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-700">Work Items</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEditWorkItem}
                        className="h-7 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    
                    {/* Header row - shown once */}
                    <div className="grid grid-cols-12 gap-2 mb-2 px-3">
                      <div className="col-span-5">
                        <Label className="text-xs font-semibold text-slate-600">Work Description *</Label>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-semibold text-slate-600">Quantity *</Label>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-semibold text-slate-600">Unit *</Label>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-semibold text-slate-600">Unit Price</Label>
                      </div>
                      <div className="col-span-1"></div>
                    </div>

                    <div className="space-y-2">
                      {editWorkItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded">
                          <div className="col-span-5">
                            <Input
                              value={item.workDescription}
                              onChange={(e) => updateEditWorkItem(index, 'workDescription', e.target.value)}
                              placeholder="e.g., Fabrication of MS Bollard"
                              required
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={item.quantity || ''}
                              onChange={(e) => updateEditWorkItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              required
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={item.unit}
                              onChange={(e) => updateEditWorkItem(index, 'unit', e.target.value)}
                              placeholder="PCS"
                              required
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice || ''}
                              onChange={(e) => updateEditWorkItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                            {editWorkItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEditWorkItem(index)}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {item.quantity > 0 && item.unitPrice > 0 && (
                            <div className="col-span-12 text-xs text-slate-600">
                              Total: {item.totalPrice.toFixed(2)} QAR
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 sticky bottom-0 bg-white py-3 border-t">
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingJob(null)
                        setError('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
