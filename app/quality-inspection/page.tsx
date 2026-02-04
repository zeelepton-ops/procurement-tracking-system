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
import { ClipboardCheck, Plus, Search, Camera, CheckCircle2, XCircle, Clock, AlertCircle, Bell, X } from 'lucide-react'
import { ProductionInspection, ProductionRelease } from '@/types/production'

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
  const [pendingInspections, setPendingInspections] = useState<any[]>([])
  const [templates, setTemplates] = useState<ITPTemplate[]>([])
  const [jobOrderItems, setJobOrderItems] = useState<JobOrderItemOption[]>([])
  const [jobOrders, setJobOrders] = useState<JobOrderOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null)
  const [selectedPendingInspection, setSelectedPendingInspection] = useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showCompleteInspectionDialog, setShowCompleteInspectionDialog] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [completeSaving, setCompleteSaving] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  // Create inspection form
  const [createForm, setCreateForm] = useState({
    jobOrderId: '',
    itpTemplateId: '',
    isCritical: false,
  })

  // Complete inspection form
  const [completeForm, setCompleteForm] = useState({
    result: '' as 'APPROVED' | 'REJECTED' | 'HOLD',
    remarks: '',
    inspectedBy: '',
    inspectedQty: '',
    approvedQty: '',
    rejectedQty: '',
    holdQty: '',
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
      fetchPendingInspections()
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

  const fetchPendingInspections = async () => {
    try {
      const res = await fetch('/api/production-releases/pending-inspections')
      if (res.ok) {
        const data = await res.json()
        setPendingInspections(data)
      }
    } catch (error) {
      console.error('Error fetching pending inspections:', error)
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

  const completeProductionInspection = async () => {
    try {
      setCompleteError(null)
      if (!selectedPendingInspection || !completeForm.result) {
        setCompleteError('Please select a result (APPROVED, REJECTED, or HOLD).')
        return
      }

      setCompleteSaving(true)
      const res = await fetch('/api/production-releases/complete-inspection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionReleaseId: selectedPendingInspection.productionReleaseId,
          result: completeForm.result,
          remarks: completeForm.remarks,
          inspectedBy: completeForm.inspectedBy || (session?.user?.name || 'System'),
          inspectedQty: completeForm.inspectedQty ? parseFloat(completeForm.inspectedQty) : undefined,
          approvedQty: completeForm.approvedQty ? parseFloat(completeForm.approvedQty) : undefined,
          rejectedQty: completeForm.rejectedQty ? parseFloat(completeForm.rejectedQty) : undefined,
          holdQty: completeForm.holdQty ? parseFloat(completeForm.holdQty) : undefined,
        }),
      })

      if (res.ok) {
        // Reset form and close dialog
        setShowCompleteInspectionDialog(false)
        setSelectedPendingInspection(null)
        setCompleteForm({ result: '' as 'APPROVED' | 'REJECTED' | 'HOLD', remarks: '', inspectedBy: '', inspectedQty: '', approvedQty: '', rejectedQty: '', holdQty: '' })
        
        // Refresh both lists
        await fetchPendingInspections()
        await fetchInspections()
      } else {
        const data = await res.json().catch(() => null)
        setCompleteError(data?.error || 'Failed to complete inspection. Please try again.')
      }
    } catch (error) {
      console.error('Error completing inspection:', error)
      setCompleteError('Failed to complete inspection. Please try again.')
    } finally {
      setCompleteSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      PENDING: { color: 'bg-gray-100 text-gray-700', icon: Clock },
      IN_PROGRESS: { color: 'bg-primary-100 text-primary-700', icon: AlertCircle },
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
        {/* Pending Inspections Banner */}
        {pendingInspections.length > 0 && (
          <div className="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-primary-900 mb-2">
                    {pendingInspections.length} Pending Production {pendingInspections.length === 1 ? 'Inspection' : 'Inspections'}
                  </h3>
                  <div className="space-y-2">
                    {pendingInspections.map((inspection, idx) => (
                      <div key={inspection.id} className="flex items-center justify-between bg-white rounded p-2 text-sm">
                        <span className="text-gray-700">
                          <strong>{inspection.productionRelease?.jobOrderItem?.jobOrder?.jobNumber}</strong>
                          {' - '}
                          {inspection.productionRelease?.jobOrderItem?.workDescription}
                          {' (Qty: '}
                          {inspection.productionRelease?.releaseQty}
                          {')'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2"
                          onClick={() => {
                            setSelectedPendingInspection(inspection)
                            setShowCompleteInspectionDialog(true)
                            setCompleteForm({ result: '' as 'APPROVED' | 'REJECTED' | 'HOLD', remarks: '', inspectedBy: session?.user?.name || '', inspectedQty: '', approvedQty: '', rejectedQty: '', holdQty: '' })
                          }}
                        >
                          Complete
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPendingInspections([])}
                className="text-primary-400 hover:text-primary-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-primary-600" />
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
              <DialogContent className="max-w-2xl">
                <DialogHeader className="bg-gradient-to-r from-primary-50 to-primary-100 -mx-6 -mt-6 px-6 pt-6 pb-4 border-b border-primary-100 rounded-t-lg">
                  <DialogTitle className="text-xl font-bold text-primary-900 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-primary-600" />
                    Create ITP Template
                  </DialogTitle>
                  <p className="text-sm text-primary-700 mt-1">Define inspection steps for quality assurance</p>
                </DialogHeader>
                <div className="space-y-5 mt-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-900">Template Name *</Label>
                    <Input
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      placeholder="e.g., Steel Fabrication ITP"
                      className="border-slate-300 focus:border-primary-500 focus:ring-primary-500 transition-all"
                    />
                    {!templateForm.name && <p className="text-xs text-slate-500">Enter a descriptive name for this template</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-900">Inspection Steps *</Label>
                    <p className="text-xs text-slate-500">Add one step per line (e.g., Material Check, Cutting, Welding, Final Inspection)</p>
                    <Textarea
                      value={templateForm.steps}
                      onChange={(e) => setTemplateForm({ ...templateForm, steps: e.target.value })}
                      placeholder="Material Verification&#10;Cutting&#10;Welding&#10;Final Inspection"
                      rows={8}
                      className="border-slate-300 focus:border-primary-500 focus:ring-primary-500 transition-all font-mono text-sm resize-none"
                    />
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-primary-900 mb-2">Steps Preview:</p>
                      <div className="flex flex-wrap gap-2">
                        {templateForm.steps.split('\n').filter(s => s.trim()).map((step, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 bg-primary-100 text-primary-900 px-3 py-1 rounded-full text-xs font-medium">
                            <span className="font-bold text-primary-600">{idx + 1}.</span> {step.trim().slice(0, 30)}
                            {step.trim().length > 30 ? '...' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={templateForm.isDefault}
                        onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                      <Label htmlFor="isDefault" className="font-semibold text-slate-900 cursor-pointer flex-1">
                        Set as default template
                        <p className="text-xs text-slate-600 font-normal mt-1">Automatically apply this template to new inspections</p>
                      </Label>
                    </div>
                  </div>

                  {templateError && (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{templateError}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    <Button onClick={createTemplate} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white" disabled={templateSaving || !templateForm.name.trim()}>
                      {templateSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Create Template
                        </>
                      )}
                    </Button>
                  </div>
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
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader className="bg-gradient-to-r from-green-50 to-emerald-50 -mx-6 -mt-6 px-6 pt-6 pb-4 border-b border-green-100 rounded-t-lg sticky top-0 z-10">
                  <DialogTitle className="text-xl font-bold text-green-900 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-green-600" />
                    Create Quality Inspections
                  </DialogTitle>
                  <p className="text-sm text-green-700 mt-1">Set up inspections for selected job order items</p>
                </DialogHeader>
                
                <div className="space-y-5 mt-4 pb-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-900">Select Job Order *</Label>
                    <Select
                      value={createForm.jobOrderId}
                      onValueChange={(value) => setCreateForm({ ...createForm, jobOrderId: value })}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Choose a job order..." />
                      </SelectTrigger>
                      <SelectContent>
                        {jobOrders.length === 0 ? (
                          <SelectItem value="__none" disabled className="text-slate-500">
                            No job orders available
                          </SelectItem>
                        ) : (
                          jobOrders.map(jo => (
                            <SelectItem key={jo.id} value={jo.id}>
                              <span className="font-semibold">{jo.jobNumber}</span> • {jo.clientName || 'No Client'}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedJobOrder && (
                    <div className="space-y-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 animate-in fade-in duration-300">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-green-900 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            {selectedJobOrder.jobNumber}
                          </h3>
                          <p className="text-sm text-green-700 mt-1">{selectedJobOrder.clientName || 'No Client'}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 font-semibold">
                          {selectedJobOrder.items.length} items
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-green-900 uppercase tracking-wider">Line Items:</p>
                        <div className="grid gap-2 max-h-40 overflow-y-auto">
                          {selectedJobOrder.items.map((item, idx) => (
                            <div key={item.id} className="bg-white rounded-lg p-3 border-l-4 border-green-400 hover:shadow-sm transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900 text-sm">{idx + 1}. {item.workDescription}</p>
                                  <p className="text-xs text-slate-600 mt-1">
                                    <span className="inline-block bg-slate-100 px-2 py-0.5 rounded mr-2">
                                      Qty: {item.quantity ?? '-'} {item.unit || ''}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-900">Select ITP Template *</Label>
                    <Select
                      value={createForm.itpTemplateId}
                      onValueChange={(value) => setCreateForm({ ...createForm, itpTemplateId: value })}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Choose inspection template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            <span className="font-medium">{template.name}</span>
                            {template.isDefault && <Badge className="ml-2 bg-primary-100 text-primary-800">Default</Badge>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!createForm.itpTemplateId && templates.length === 0 && (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                        ⚠️ No templates available. Please create an ITP Template first.
                      </p>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isCritical"
                        checked={createForm.isCritical}
                        onChange={(e) => setCreateForm({ ...createForm, isCritical: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <Label htmlFor="isCritical" className="font-semibold text-slate-900 cursor-pointer flex-1">
                        Critical Item
                        <p className="text-xs text-slate-600 font-normal mt-1">Mark if this item requires strict quality checks</p>
                      </Label>
                    </div>
                  </div>

                  {createError && (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{createError}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <Button
                      onClick={() => {
                        setShowCreateDialog(false)
                        setCreateError(null)
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={createInspection} 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                      disabled={createSaving || !createForm.jobOrderId || !createForm.itpTemplateId}
                    >
                      {createSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Create Inspections
                        </>
                      )}
                    </Button>
                  </div>
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
                    <div className="grid grid-cols-3 gap-2">
                      {selectedInspection.steps.map((step, index) => (
                        <div key={step.id} className="border rounded-lg p-2 bg-white shadow-sm">
                          {/* Step Info and Status */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <span className="font-semibold text-xs line-clamp-2">Step {index + 1}: {step.stepName}</span>
                              <p className="text-xs text-slate-500">Response</p>
                            </div>
                            <div className="flex-shrink-0">
                              {getStatusBadge(step.status)}
                            </div>
                          </div>

                          {/* Remarks */}
                          <div className="mb-2">
                            <Label className="text-xs text-slate-500 font-semibold">Comment</Label>
                            <Textarea
                              value={stepRemarks[step.id] ?? step.remarks ?? ''}
                              onChange={(e) => setStepRemarks(prev => ({ ...prev, [step.id]: e.target.value }))}
                              placeholder="Remarks..."
                              rows={2}
                              className="text-xs"
                            />
                          </div>

                          {/* Quantity Fields - Compact */}
                          <div className="space-y-1 mb-2">
                            <div>
                              <Label className="text-xs text-green-600 font-semibold">Approved</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={stepApprovedQty[step.id] ?? step.approvedQty ?? ''}
                                onChange={(e) => setStepApprovedQty(prev => ({ ...prev, [step.id]: e.target.value }))}
                                min="0"
                                className="text-xs h-7"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-red-600 font-semibold">Failed</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={stepFailedQty[step.id] ?? step.failedQty ?? ''}
                                onChange={(e) => setStepFailedQty(prev => ({ ...prev, [step.id]: e.target.value }))}
                                min="0"
                                className="text-xs h-7"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-yellow-600 font-semibold">Hold</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={stepHoldQty[step.id] ?? step.holdQty ?? ''}
                                onChange={(e) => setStepHoldQty(prev => ({ ...prev, [step.id]: e.target.value }))}
                                min="0"
                                className="text-xs h-7"
                              />
                            </div>
                          </div>

                          {/* Action Buttons - Stacked */}
                          <div className="space-y-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 h-7 px-1 text-xs w-full"
                              onClick={() => updateStepStatus(step.id, 'APPROVED', (stepRemarks[step.id] ?? step.remarks ?? '').trim(), stepApprovedQty[step.id] ?? step.approvedQty?.toString() ?? '', stepFailedQty[step.id] ?? step.failedQty?.toString() ?? '', stepHoldQty[step.id] ?? step.holdQty?.toString() ?? '')}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 h-7 px-1 text-xs w-full"
                              onClick={() => updateStepStatus(step.id, 'FAILED', (stepRemarks[step.id] ?? step.remarks ?? '').trim(), stepApprovedQty[step.id] ?? step.approvedQty?.toString() ?? '', stepFailedQty[step.id] ?? step.failedQty?.toString() ?? '', stepHoldQty[step.id] ?? step.holdQty?.toString() ?? '')}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Fail
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-yellow-600 h-7 px-1 text-xs w-full"
                              onClick={() => updateStepStatus(step.id, 'HOLD', (stepRemarks[step.id] ?? step.remarks ?? '').trim(), stepApprovedQty[step.id] ?? step.approvedQty?.toString() ?? '', stepFailedQty[step.id] ?? step.failedQty?.toString() ?? '', stepHoldQty[step.id] ?? step.holdQty?.toString() ?? '')}
                            >
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Hold
                            </Button>
                          </div>

                          {step.inspectedBy && (
                            <p className="text-xs text-gray-500 mt-2 pt-1 border-t line-clamp-2">
                              By {step.inspectedBy}
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

        {/* Complete Production Inspection Dialog */}
        <Dialog
          open={showCompleteInspectionDialog}
          onOpenChange={(open) => {
            setShowCompleteInspectionDialog(open)
            if (!open) {
              setSelectedPendingInspection(null)
              setCompleteForm({ result: '' as 'APPROVED' | 'REJECTED' | 'HOLD', remarks: '', inspectedBy: '', inspectedQty: '', approvedQty: '', rejectedQty: '', holdQty: '' })
              setCompleteError(null)
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader className="bg-gradient-to-r from-green-50 to-emerald-50 -mx-6 -mt-6 px-6 pt-6 pb-4 border-b border-green-100 rounded-t-lg">
              <DialogTitle className="text-xl font-bold text-green-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Complete Production Inspection
              </DialogTitle>
            </DialogHeader>

            {selectedPendingInspection && (
              <div className="space-y-5 mt-4">
                {/* Production Details */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h4 className="font-semibold text-sm text-slate-900 mb-3">Production Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-600">Job Order</p>
                      <p className="font-semibold text-slate-900">
                        {selectedPendingInspection.productionRelease?.jobOrderItem?.jobOrder?.jobNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Item Description</p>
                      <p className="font-semibold text-slate-900">
                        {selectedPendingInspection.productionRelease?.jobOrderItem?.workDescription}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Release Quantity</p>
                      <p className="font-semibold text-slate-900">
                        {selectedPendingInspection.productionRelease?.releaseQty}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Drawing Number</p>
                      <p className="font-semibold text-slate-900">
                        {selectedPendingInspection.productionRelease?.drawingNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inspection Result */}
                <div className="space-y-3">
                  <div>
                    <Label className="font-semibold text-slate-900">Inspection Result *</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {['APPROVED', 'REJECTED', 'HOLD'].map((result) => (
                        <button
                          key={result}
                          onClick={() => setCompleteForm({ ...completeForm, result: result as any })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            completeForm.result === result
                              ? 'border-green-500 bg-green-50'
                              : result === 'APPROVED'
                              ? 'border-green-200 bg-green-50/50 hover:border-green-300'
                              : result === 'REJECTED'
                              ? 'border-red-200 bg-red-50/50 hover:border-red-300'
                              : 'border-yellow-200 bg-yellow-50/50 hover:border-yellow-300'
                          }`}
                        >
                          <span className={`font-semibold text-sm ${
                            result === 'APPROVED'
                              ? 'text-green-700'
                              : result === 'REJECTED'
                              ? 'text-red-700'
                              : 'text-yellow-700'
                          }`}>
                            {result}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="font-semibold text-slate-900">Inspected Quantity</Label>
                      <Input
                        type="number"
                        value={completeForm.inspectedQty}
                        onChange={(e) => setCompleteForm({ ...completeForm, inspectedQty: e.target.value })}
                        placeholder="0"
                        min="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-slate-900">Approved Quantity</Label>
                      <Input
                        type="number"
                        value={completeForm.approvedQty}
                        onChange={(e) => setCompleteForm({ ...completeForm, approvedQty: e.target.value })}
                        placeholder="0"
                        min="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-slate-900">Rejected Quantity</Label>
                      <Input
                        type="number"
                        value={completeForm.rejectedQty}
                        onChange={(e) => setCompleteForm({ ...completeForm, rejectedQty: e.target.value })}
                        placeholder="0"
                        min="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-slate-900">Hold Quantity</Label>
                      <Input
                        type="number"
                        value={completeForm.holdQty}
                        onChange={(e) => setCompleteForm({ ...completeForm, holdQty: e.target.value })}
                        placeholder="0"
                        min="0"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <Label className="font-semibold text-slate-900">Remarks</Label>
                    <Textarea
                      value={completeForm.remarks}
                      onChange={(e) => setCompleteForm({ ...completeForm, remarks: e.target.value })}
                      placeholder="Enter inspection remarks or notes..."
                      rows={3}
                      className="border-slate-300"
                    />
                  </div>

                  {/* Inspected By */}
                  <div>
                    <Label className="font-semibold text-slate-900">Inspected By</Label>
                    <Input
                      value={completeForm.inspectedBy}
                      onChange={(e) => setCompleteForm({ ...completeForm, inspectedBy: e.target.value })}
                      placeholder={session?.user?.name || 'Your Name'}
                      className="border-slate-300"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {completeError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {completeError}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCompleteInspectionDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={completeProductionInspection}
                    disabled={completeSaving || !completeForm.result}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {completeSaving ? 'Submitting...' : 'Submit Inspection'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
