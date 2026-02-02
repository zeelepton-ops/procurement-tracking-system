'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ClipboardCheck, Plus, Search, Camera, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

interface QualityInspection {
  id: string
  jobOrderItemId: string
  itpTemplateId: string
  isCritical: boolean
  status: string
  createdBy: string
  createdAt: string
  updatedAt: string
  jobOrderItem: {
    workDescription: string
    quantity: number | null
    unit: string
    jobOrder: {
      jobNumber: string
      clientName: string
    }
  }
  itpTemplate: {
    name: string
    steps: string[]
  }
  steps: QualityStep[]
}

interface QualityStep {
  id: string
  stepName: string
  status: string
  remarks: string | null
  inspectedBy: string | null
  inspectedAt: string | null
  approvedQty: number | null
  failedQty: number | null
  holdQty: number | null
  photos: QualityPhoto[]
}

interface QualityPhoto {
  id: string
  url: string
  uploadedBy: string
  uploadedAt: string
}

interface ITPTemplate {
  id: string
  name: string
  steps: string[]
  isDefault: boolean
}

interface JobOrderItemOption {
  id: string
  label: string
  workDescription: string
  quantity: number | null
  unit: string
  jobNumber: string
  clientName: string | null
}

interface JobOrderOption {
  id: string
  jobNumber: string
  clientName: string | null
  items: JobOrderItemOption[]
}

export default function QualityInspectionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [templates, setTemplates] = useState<ITPTemplate[]>([])
  const [jobOrderItems, setJobOrderItems] = useState<JobOrderItemOption[]>([])
  const [jobOrders, setJobOrders] = useState<JobOrderOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)

  // Create inspection form
  const [createForm, setCreateForm] = useState({
    jobOrderId: '',
    itpTemplateId: '',
    isCritical: false,
  })

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    steps: '',
    isDefault: false,
  })
  const [stepRemarks, setStepRemarks] = useState<Record<string, string>>({})
  const [stepApprovedQty, setStepApprovedQty] = useState<Record<string, string>>({})
  const [stepFailedQty, setStepFailedQty] = useState<Record<string, string>>({})
  const [stepHoldQty, setStepHoldQty] = useState<Record<string, string>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const selectedJobOrder = jobOrders.find(j => j.id === createForm.jobOrderId) || null

  // Calculate summary stats for selected inspection
  const inspectionSummary = selectedInspection ? {
    totalSteps: selectedInspection.steps.length,
    approved: selectedInspection.steps.filter(s => s.status === 'APPROVED').length,
    failed: selectedInspection.steps.filter(s => s.status === 'FAILED').length,
    hold: selectedInspection.steps.filter(s => s.status === 'HOLD').length,
    pending: selectedInspection.steps.filter(s => s.status === 'PENDING').length,
    totalApprovedQty: selectedInspection.steps.reduce((sum, s) => sum + (s.approvedQty || 0), 0),
    totalFailedQty: selectedInspection.steps.reduce((sum, s) => sum + (s.failedQty || 0), 0),
    totalHoldQty: selectedInspection.steps.reduce((sum, s) => sum + (s.holdQty || 0), 0),
  } : null

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchInspections()
      fetchTemplates()
      fetchJobOrderItems()
    }
  }, [status, router])

  const fetchInspections = async () => {
    try {
      const res = await fetch('/api/quality-inspection')
      if (res.ok) {
        const data = await res.json()
        setInspections(data)
      }
    } catch (error) {
      console.error('Error fetching inspections:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/quality-inspection/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const fetchJobOrderItems = async () => {
    try {
      const res = await fetch('/api/job-orders?perPage=200')
      if (res.ok) {
        const data = await res.json()
        const orders: JobOrderOption[] = (data?.jobs || []).map((job: any) => ({
          id: job.id,
          jobNumber: job.jobNumber,
          clientName: job.clientName || null,
          items: (job.items || []).map((item: any) => ({
            id: item.id,
            label: `${item.workDescription}`,
            workDescription: item.workDescription,
            quantity: item.quantity ?? null,
            unit: item.unit,
            jobNumber: job.jobNumber,
            clientName: job.clientName || null,
          }))
        }))
        setJobOrders(orders)
        const items: JobOrderItemOption[] = orders.flatMap(job => job.items)
        setJobOrderItems(items)
      }
    } catch (error) {
      console.error('Error fetching job order items:', error)
    }
  }

  const createInspection = async () => {
    try {
      setCreateError(null)
      if (!createForm.jobOrderId || !createForm.itpTemplateId) {
        setCreateError('Job Order and ITP Template are required.')
        return
      }
      setCreateSaving(true)
      const res = await fetch('/api/quality-inspection/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        setCreateForm({ jobOrderId: '', itpTemplateId: '', isCritical: false })
        fetchInspections()
      } else {
        const data = await res.json().catch(() => null)
        setCreateError(data?.error || 'Failed to create inspections. Please try again.')
      }
    } catch (error) {
      setCreateError('Failed to create inspections. Please try again.')
    }
    finally {
      setCreateSaving(false)
    }
  }

  const createTemplate = async () => {
    try {
      setTemplateError(null)
      const steps = templateForm.steps.split('\n').map(s => s.trim()).filter(Boolean)
      const name = templateForm.name.trim()
      if (!name || steps.length === 0) {
        setTemplateError('Template name and at least one step are required.')
        return
      }
      setTemplateSaving(true)
      const res = await fetch('/api/quality-inspection/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...templateForm, name, steps }),
      })
      if (res.ok) {
        setShowTemplateDialog(false)
        setTemplateForm({ name: '', steps: '', isDefault: false })
        fetchTemplates()
      } else {
        const data = await res.json().catch(() => null)
        setTemplateError(data?.error || 'Failed to create template. Please try again.')
      }
    } catch (error) {
      setTemplateError('Failed to create template. Please try again.')
    }
    finally {
      setTemplateSaving(false)
    }
  }

  const updateStepStatus = async (stepId: string, status: string, remarks?: string, approvedQty?: string, failedQty?: string, holdQty?: string) => {
    try {
      const payload: any = { status, remarks }
      if (approvedQty && !isNaN(parseFloat(approvedQty))) {
        payload.approvedQty = parseFloat(approvedQty)
      }
      if (failedQty && !isNaN(parseFloat(failedQty))) {
        payload.failedQty = parseFloat(failedQty)
      }
      if (holdQty && !isNaN(parseFloat(holdQty))) {
        payload.holdQty = parseFloat(holdQty)
      }
      const res = await fetch(`/api/quality-inspection/steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        fetchInspections()
        if (selectedInspection) {
          const updated = await fetch(`/api/quality-inspection/${selectedInspection.id}`).then(r => r.json())
          setSelectedInspection(updated)
        }
      }
    } catch (error) {
      console.error('Error updating step:', error)
    }
  }

  const deleteInspection = async (inspectionId: string) => {
    try {
      const res = await fetch(`/api/quality-inspection/${inspectionId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSelectedInspection(null)
        setDeleteConfirm(null)
        fetchInspections()
      }
    } catch (error) {
      console.error('Error deleting inspection:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      PENDING: { color: 'bg-gray-100 text-gray-700', icon: Clock },
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
      APPROVED: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle },
      FAILED: { color: 'bg-red-100 text-red-700', icon: XCircle },
      HOLD: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
    }
    const { color, icon: Icon } = variants[status] || variants.PENDING
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    )
  }

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = 
      inspection.jobOrderItem.jobOrder.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.jobOrderItem.workDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.jobOrderItem.jobOrder.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || inspection.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Quality Inspection Management</h1>
          </div>
          <div className="flex gap-2">
            <Dialog
              open={showTemplateDialog}
              onOpenChange={(open) => {
                setShowTemplateDialog(open)
                if (!open) {
                  setTemplateError(null)
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  ITP Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create ITP Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Template Name</Label>
                    <Input
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      placeholder="e.g., Steel Fabrication ITP"
                    />
                  </div>
                  <div>
                    <Label>Steps (one per line)</Label>
                    <Textarea
                      value={templateForm.steps}
                      onChange={(e) => setTemplateForm({ ...templateForm, steps: e.target.value })}
                      placeholder="Material Verification&#10;Cutting&#10;Welding&#10;Final Inspection"
                      rows={8}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={templateForm.isDefault}
                      onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                    />
                    <Label htmlFor="isDefault">Set as default template</Label>
                  </div>
                  {templateError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                      {templateError}
                    </div>
                  )}
                  <Button onClick={createTemplate} className="w-full" disabled={templateSaving}>
                    {templateSaving ? 'Saving...' : 'Create Template'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={showCreateDialog}
              onOpenChange={(open) => {
                setShowCreateDialog(open)
                if (!open) {
                  setCreateError(null)
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Inspection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Quality Inspections</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Job Order</Label>
                    <Select
                      value={createForm.jobOrderId}
                      onValueChange={(value) => setCreateForm({ ...createForm, jobOrderId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select job order" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobOrders.length === 0 && (
                          <SelectItem value="__none" disabled>
                            No job orders found
                          </SelectItem>
                        )}
                        {jobOrders.map(jo => (
                          <SelectItem key={jo.id} value={jo.id}>
                            {jo.jobNumber} - {jo.clientName || 'No Client'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedJobOrder && (
                    <div className="rounded-lg border bg-slate-50 p-3 text-sm space-y-3">
                      <div>
                        <span className="text-slate-500 font-semibold">Job Order: {selectedJobOrder.jobNumber}</span>
                        <p className="text-slate-600">{selectedJobOrder.clientName || 'No Client'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block mb-2">Line Items ({selectedJobOrder.items.length}):</span>
                        <div className="space-y-2">
                          {selectedJobOrder.items.map(item => (
                            <div key={item.id} className="bg-white rounded p-2 border border-slate-200">
                              <p className="font-medium text-slate-900 text-xs">{item.workDescription}</p>
                              <p className="text-xs text-slate-500">
                                Qty: {item.quantity ?? '-'} {item.unit || ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>ITP Template</Label>
                    <Select
                      value={createForm.itpTemplateId}
                      onValueChange={(value) => setCreateForm({ ...createForm, itpTemplateId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} {template.isDefault && '(Default)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isCritical"
                      checked={createForm.isCritical}
                      onChange={(e) => setCreateForm({ ...createForm, isCritical: e.target.checked })}
                    />
                    <Label htmlFor="isCritical">Mark as Critical Item</Label>
                  </div>
                  {createError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                      {createError}
                    </div>
                  )}
                  <Button onClick={createInspection} className="w-full" disabled={createSaving}>
                    {createSaving ? 'Saving...' : 'Create Inspection'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by job number, description, or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="HOLD">Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Inspections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInspections.map(inspection => (
            <div
              key={inspection.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div 
                className="p-6 cursor-pointer"
                onClick={() => setSelectedInspection(inspection)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {inspection.jobOrderItem.jobOrder.jobNumber}
                    </h3>
                    <p className="text-sm text-gray-600">{inspection.jobOrderItem.jobOrder.clientName}</p>
                  </div>
                  {getStatusBadge(inspection.status)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Work:</span>
                    <p className="text-gray-900 line-clamp-2">{inspection.jobOrderItem.workDescription}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">ITP Template:</span>
                    <p className="text-gray-900">{inspection.itpTemplate.name}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-gray-500">Steps: {inspection.steps.length}</span>
                    {inspection.isCritical && (
                      <Badge className="bg-red-100 text-red-700">Critical</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="px-6 pb-4 pt-2 border-t bg-gray-50 rounded-b-lg">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(inspection.id);
                  }}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Delete Inspection
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredInspections.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No quality inspections found</p>
            <p className="text-gray-400 text-sm">Create your first inspection to get started</p>
          </div>
        )}

        {/* Inspection Details Dialog */}
        <Dialog open={!!selectedInspection} onOpenChange={() => setSelectedInspection(null)}>
          <DialogContent className="w-[98vw] max-w-[98vw] h-[95vh] max-h-[95vh] overflow-y-auto p-4">
            {selectedInspection && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between text-base">
                    <span>Quality Inspection Details</span>
                    {getStatusBadge(selectedInspection.status)}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Summary Stats */}
                  {inspectionSummary && (
                    <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-lg border">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Steps</p>
                        <p className="text-xl font-bold text-slate-900">{inspectionSummary.totalSteps}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-green-600 font-semibold">Approved</p>
                        <p className="text-xl font-bold text-green-700">{inspectionSummary.approved}</p>
                        <p className="text-xs text-green-600">Qty: {inspectionSummary.totalApprovedQty}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-red-600 font-semibold">Failed</p>
                        <p className="text-xl font-bold text-red-700">{inspectionSummary.failed}</p>
                        <p className="text-xs text-red-600">Qty: {inspectionSummary.totalFailedQty}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-yellow-600 font-semibold">Hold</p>
                        <p className="text-xl font-bold text-yellow-700">{inspectionSummary.hold}</p>
                        <p className="text-xs text-yellow-600">Qty: {inspectionSummary.totalHoldQty}</p>
                      </div>
                    </div>
                  )}

                  {/* Job Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2">Job Information</h4>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Job Number:</span>
                        <p className="font-medium text-sm">{selectedInspection.jobOrderItem.jobOrder.jobNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Client:</span>
                        <p className="font-medium text-sm">{selectedInspection.jobOrderItem.jobOrder.clientName}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Work Description:</span>
                        <p className="font-medium text-sm">{selectedInspection.jobOrderItem.workDescription}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Inspection Qty:</span>
                        <p className="font-medium text-sm">
                          {selectedInspection.jobOrderItem.quantity ?? '-'} {selectedInspection.jobOrderItem.unit || ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Inspection Steps */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Inspection Steps</h4>
                    <div className="space-y-3">
                      {selectedInspection.steps.map((step, index) => (
                        <div key={step.id} className="border rounded-lg p-3 bg-white shadow-sm">
                          {/* Step Info and Status */}
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="font-semibold text-sm">Step {index + 1}: {step.stepName}</span>
                              <p className="text-xs text-slate-500">Response</p>
                            </div>
                            {getStatusBadge(step.status)}
                          </div>

                          {/* Remarks */}
                          <div className="mb-2">
                            <Label className="text-xs text-slate-500 font-semibold">Comment / Remarks</Label>
                            <Textarea
                              value={stepRemarks[step.id] ?? step.remarks ?? ''}
                              onChange={(e) => setStepRemarks(prev => ({ ...prev, [step.id]: e.target.value }))}
                              placeholder="Add inspection comment or remark..."
                              rows={2}
                              className="text-xs"
                            />
                          </div>

                          {/* Quantity & Actions - Single Inline Row */}
                          <div className="flex items-end gap-2 flex-wrap">
                            <div className="flex-1 min-w-[120px]">
                              <Label className="text-xs text-green-600 font-semibold">Approved Qty</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={stepApprovedQty[step.id] ?? step.approvedQty ?? ''}
                                onChange={(e) => setStepApprovedQty(prev => ({ ...prev, [step.id]: e.target.value }))}
                                min="0"
                                className="text-xs h-8"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 h-8 px-2 text-xs"
                              onClick={() => updateStepStatus(step.id, 'APPROVED', (stepRemarks[step.id] ?? step.remarks ?? '').trim(), stepApprovedQty[step.id] ?? step.approvedQty?.toString() ?? '', stepFailedQty[step.id] ?? step.failedQty?.toString() ?? '', stepHoldQty[step.id] ?? step.holdQty?.toString() ?? '')}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            
                            <div className="flex-1 min-w-[120px]">
                              <Label className="text-xs text-red-600 font-semibold">Failed Qty</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={stepFailedQty[step.id] ?? step.failedQty ?? ''}
                                onChange={(e) => setStepFailedQty(prev => ({ ...prev, [step.id]: e.target.value }))}
                                min="0"
                                className="text-xs h-8"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 h-8 px-2 text-xs"
                              onClick={() => updateStepStatus(step.id, 'FAILED', (stepRemarks[step.id] ?? step.remarks ?? '').trim(), stepApprovedQty[step.id] ?? step.approvedQty?.toString() ?? '', stepFailedQty[step.id] ?? step.failedQty?.toString() ?? '', stepHoldQty[step.id] ?? step.holdQty?.toString() ?? '')}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Fail
                            </Button>
                            
                            <div className="flex-1 min-w-[120px]">
                              <Label className="text-xs text-yellow-600 font-semibold">Hold Qty</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={stepHoldQty[step.id] ?? step.holdQty ?? ''}
                                onChange={(e) => setStepHoldQty(prev => ({ ...prev, [step.id]: e.target.value }))}
                                min="0"
                                className="text-xs h-8"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-yellow-600 h-8 px-2 text-xs"
                              onClick={() => updateStepStatus(step.id, 'HOLD', (stepRemarks[step.id] ?? step.remarks ?? '').trim(), stepApprovedQty[step.id] ?? step.approvedQty?.toString() ?? '', stepFailedQty[step.id] ?? step.failedQty?.toString() ?? '', stepHoldQty[step.id] ?? step.holdQty?.toString() ?? '')}
                            >
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Hold
                            </Button>
                          </div>

                          {step.inspectedBy && (
                            <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                              Inspected by {step.inspectedBy} on {new Date(step.inspectedAt!).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Quality Inspection?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this quality inspection? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-red-600"
                onClick={() => deleteConfirm && deleteInspection(deleteConfirm)}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
