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
import { ProductionInspection, ProductionRelease } from '@/types/production'

interface QualityInspection {
  id: string
  jobOrderItemId: string
  itpTemplateId: string
  isCritical: boolean
  status: string
  drawingNumber?: string | null
  transmittalNo?: string | null
  inspectedQty?: number | null
  approvedQty?: number | null
  rejectedQty?: number | null
  holdQty?: number | null
  inspectedWeight?: number | null
  inspectionDate?: string | null
  remarks?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  jobOrderItem: {
    workDescription: string
    quantity: number | null
    unit: string
    unitWeight?: number | null
    jobOrder: {
      id: string
      jobNumber: string
      clientName: string
      drawingRef?: string | null
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
  const [completedInspections, setCompletedInspections] = useState<any[]>([])
  const [templates, setTemplates] = useState<ITPTemplate[]>([])
  const [jobOrderItems, setJobOrderItems] = useState<JobOrderItemOption[]>([])
  const [jobOrders, setJobOrders] = useState<JobOrderOption[]>([])
  const [pendingDnRequests, setPendingDnRequests] = useState<any[]>([])
  const [deliveryNotesCount, setDeliveryNotesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [pageSuccess, setPageSuccess] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [selectedInspectionIds, setSelectedInspectionIds] = useState<string[]>([])
  const [showEditProductionDialog, setShowEditProductionDialog] = useState(false)
  const [selectedProductionInspection, setSelectedProductionInspection] = useState<any>(null)
  const [productionEditSaving, setProductionEditSaving] = useState(false)
  const [productionEditError, setProductionEditError] = useState<string | null>(null)
  const [productionEditForm, setProductionEditForm] = useState({
    result: '' as 'APPROVED' | 'REJECTED' | 'HOLD' | '',
    remarks: '',
    inspectedBy: '',
    inspectionTimestamp: '',
    inspectedQty: '',
    approvedQty: '',
    rejectedQty: '',
    holdQty: '',
  })

  const isAdmin = session?.user?.role === 'ADMIN'

  // Create inspection form
  const [createForm, setCreateForm] = useState({
    jobOrderId: '',
    itpTemplateId: '',
    inspectedQty: '',
    isCritical: false,
  })

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    steps: '',
    isDefault: false,
  })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const selectedJobOrder = jobOrders.find(j => j.id === createForm.jobOrderId) || null

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchInspections()
      fetchPendingInspections()
      fetchCompletedInspections()
      fetchPendingDeliveryNoteRequests()
      fetchDeliveryNotes()
      fetchTemplates()
      fetchJobOrderItems()
    }
  }, [status, router])

  useEffect(() => {
    if (!selectedProductionInspection) return
    setProductionEditForm(buildProductionEditForm(selectedProductionInspection))
    setProductionEditError(null)
  }, [selectedProductionInspection])

  const toDateTimeLocal = (value?: string | null) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const pad = (n: number) => n.toString().padStart(2, '0')
    const yyyy = date.getFullYear()
    const mm = pad(date.getMonth() + 1)
    const dd = pad(date.getDate())
    const hh = pad(date.getHours())
    const mi = pad(date.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  }

  const toNumberString = (value?: number | null) =>
    value === null || value === undefined ? '' : value.toString()

  const buildProductionEditForm = (inspection: any) => ({
    result: inspection.result || '',
    remarks: inspection.remarks || '',
    inspectedBy: inspection.inspectedBy || '',
    inspectionTimestamp: toDateTimeLocal(inspection.inspectionTimestamp),
    inspectedQty: toNumberString(inspection.inspectedQty),
    approvedQty: toNumberString(inspection.approvedQty),
    rejectedQty: toNumberString(inspection.rejectedQty),
    holdQty: toNumberString(inspection.holdQty),
  })

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

  const fetchCompletedInspections = async () => {
    try {
      const res = await fetch('/api/production-releases/completed-inspections')
      if (res.ok) {
        const data = await res.json()
        setCompletedInspections(data)
      }
    } catch (error) {
      console.error('Error fetching completed inspections:', error)
    }
  }

  const fetchPendingDeliveryNoteRequests = async () => {
    try {
      const res = await fetch('/api/delivery-notes/requests?status=PENDING')
      if (res.ok) {
        const data = await res.json()
        setPendingDnRequests(data)
      }
    } catch (error) {
      console.error('Error fetching delivery note requests:', error)
    }
  }

  const fetchDeliveryNotes = async () => {
    try {
      const res = await fetch('/api/delivery-notes')
      if (res.ok) {
        const data = await res.json()
        setDeliveryNotesCount(Array.isArray(data) ? data.length : 0)
      }
    } catch (error) {
      console.error('Error fetching delivery notes:', error)
    }
  }

  const requestDeliveryNotes = async () => {
    if (selectedInspectionIds.length === 0) return

    try {
      const res = await fetch('/api/delivery-notes/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionIds: selectedInspectionIds })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request delivery notes')
      }

      setSelectedInspectionIds([])
      setPageSuccess(data.message || 'Delivery note requests created')
      setTimeout(() => setPageSuccess(null), 4000)
      fetchPendingDeliveryNoteRequests()
    } catch (error: any) {
      setPageError(error.message || 'Failed to request delivery notes')
    }
  }

  const prepareDeliveryNoteFromSelection = () => {
    if (selectedInspectionIds.length === 0) return

    const selected = inspections.filter(inspection => selectedInspectionIds.includes(inspection.id))
    const jobOrderIds = Array.from(new Set(selected.map(i => i.jobOrderItem?.jobOrder?.id).filter(Boolean)))

    if (jobOrderIds.length === 0) {
      setPageError('Job order not found for selected inspections.')
      return
    }

    if (jobOrderIds.length > 1) {
      setPageError('Select inspections from the same job order to prepare a delivery note.')
      return
    }

    router.push(`/store/delivery-notes?jobOrderId=${jobOrderIds[0]}&openForm=1`)
  }

  const openInspectionDetails = (inspectionId: string) => {
    const url = `/quality-inspection/${inspectionId}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const deletePendingInspection = async (inspectionId: string) => {
    try {
      const res = await fetch(`/api/production-releases/pending-inspections?id=${inspectionId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        await fetchPendingInspections()
      }
    } catch (error) {
      console.error('Error deleting pending inspection:', error)
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
        setCreateForm({ jobOrderId: '', itpTemplateId: '', inspectedQty: '', isCritical: false })
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


  const saveProductionInspection = async () => {
    if (!selectedProductionInspection) return
    try {
      setProductionEditSaving(true)
      setProductionEditError(null)

      const res = await fetch(`/api/production-inspections/${selectedProductionInspection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: productionEditForm.result,
          remarks: productionEditForm.remarks.trim(),
          inspectedBy: productionEditForm.inspectedBy.trim(),
          inspectionTimestamp: productionEditForm.inspectionTimestamp || null,
          inspectedQty: productionEditForm.inspectedQty,
          approvedQty: productionEditForm.approvedQty,
          rejectedQty: productionEditForm.rejectedQty,
          holdQty: productionEditForm.holdQty,
        }),
      })

      if (res.ok) {
        await fetchCompletedInspections()
        setShowEditProductionDialog(false)
        setSelectedProductionInspection(null)
      } else {
        const data = await res.json().catch(() => null)
        setProductionEditError(data?.error || 'Failed to update production inspection.')
      }
    } catch (error) {
      setProductionEditError('Failed to update production inspection.')
    } finally {
      setProductionEditSaving(false)
    }
  }

  const deleteProductionInspection = async (inspectionId: string) => {
    try {
      if (!isAdmin) {
        setPageError('Only admins can delete production inspections.')
        return
      }
      const res = await fetch(`/api/production-inspections/${inspectionId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchCompletedInspections()
      } else {
        const data = await res.json().catch(() => null)
        setPageError(data?.error || 'Failed to delete production inspection.')
      }
    } catch (error) {
      setPageError('Failed to delete production inspection.')
    }
  }

  const deleteInspection = async (inspectionId: string) => {
    try {
      if (!isAdmin) {
        setPageError('Only admins can delete inspections.')
        return
      }
      const res = await fetch(`/api/quality-inspection/${inspectionId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteConfirm(null)
        fetchInspections()
      }
    } catch (error) {
      console.error('Error deleting inspection:', error)
    }
  }

  const getInspectionStatus = (inspection: QualityInspection) => {
    const steps = inspection.steps || []
    const statuses = steps.map(s => s.status || 'PENDING')

    if (statuses.some(s => s === 'FAILED')) return 'REJECTED'
    if (statuses.some(s => s === 'HOLD')) return 'HOLD'
    if (statuses.length > 0 && statuses.every(s => s === 'APPROVED')) return 'APPROVED'
    if (statuses.some(s => s !== 'PENDING')) return 'IN_PROGRESS'
    return inspection.status || 'PENDING'
  }

  const getApprovedQty = (inspection: QualityInspection) =>
    inspection.steps.reduce((sum, step) => sum + (step.approvedQty || 0), 0)

  const getStatusBadge = (status: string, approvedPercent?: number) => {
    const variants: Record<string, { color: string; icon: any }> = {
      PENDING: { color: 'bg-gray-100 text-gray-700', icon: Clock },
      IN_PROGRESS: { color: 'bg-primary-100 text-primary-700', icon: AlertCircle },
      APPROVED: { color: 'bg-slate-900 text-white', icon: CheckCircle2 },
      REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle },
      FAILED: { color: 'bg-red-100 text-red-700', icon: XCircle },
      HOLD: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
    }
    const { color, icon: Icon } = variants[status] || variants.PENDING
    const label = status === 'APPROVED' && typeof approvedPercent === 'number'
      ? `APPROVED ${approvedPercent.toFixed(1)}%`
      : status
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    )
  }

  const filteredInspections = inspections.filter(inspection => {
    const derivedStatus = getInspectionStatus(inspection)
    const matchesSearch = 
      inspection.jobOrderItem.jobOrder.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.jobOrderItem.workDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.jobOrderItem.jobOrder.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || derivedStatus === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const filteredCompletedInspections = completedInspections.filter((inspection) => {
    const jobNumber = inspection.productionRelease?.jobOrderItem?.jobOrder?.jobNumber || ''
    const workDescription = inspection.productionRelease?.jobOrderItem?.workDescription || ''
    const clientName = inspection.productionRelease?.jobOrderItem?.jobOrder?.clientName || ''
    const matchesSearch =
      jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const resultStatus = inspection.result || 'PENDING'
    const matchesStatus = statusFilter === 'ALL' || resultStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const filteredPendingInspections = pendingInspections.filter((inspection) => {
    const jobNumber = inspection.productionRelease?.jobOrderItem?.jobOrder?.jobNumber || ''
    const workDescription = inspection.productionRelease?.jobOrderItem?.workDescription || ''
    const clientName = inspection.productionRelease?.jobOrderItem?.jobOrder?.clientName || ''
    const matchesSearch =
      jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || statusFilter === 'PENDING'

    return matchesSearch && matchesStatus
  })

  const mergedInspections = [
    ...filteredInspections.map((inspection) => ({ kind: 'quality' as const, inspection })),
    ...filteredPendingInspections.map((inspection) => ({ kind: 'pending' as const, inspection })),
    ...filteredCompletedInspections.map((inspection) => ({ kind: 'production' as const, inspection })),
  ]

  const approvedInspections = inspections.filter(
    (inspection) => getInspectionStatus(inspection) === 'APPROVED'
  )

  const groupedInspections = Object.values(
    mergedInspections.reduce((acc, entry) => {
      const isQuality = entry.kind === 'quality'
      const inspection = entry.inspection as any
      const jobOrder = isQuality
        ? inspection.jobOrderItem?.jobOrder
        : inspection.productionRelease?.jobOrderItem?.jobOrder
      const jobOrderId = jobOrder?.id || jobOrder?.jobNumber || 'unknown'

      if (!acc[jobOrderId]) {
        acc[jobOrderId] = {
          jobOrderId: jobOrder?.id || null,
          jobNumber: jobOrder?.jobNumber || 'N/A',
          clientName: jobOrder?.clientName || 'N/A',
          items: [] as typeof mergedInspections,
        }
      }

      acc[jobOrderId].items.push(entry)
      return acc
    }, {} as Record<string, { jobOrderId: string | null; jobNumber: string; clientName: string; items: typeof mergedInspections }>)
  ).sort((a, b) => a.jobNumber.localeCompare(b.jobNumber))

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Workflow Handoff */}
        <div className="mb-6 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Department Workflow</h3>
              <p className="text-xs text-slate-600">Coordinate with Production and Store</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 ml-auto">
              <div className="bg-amber-50 border border-amber-200 px-2 py-1 rounded-md text-xs w-28 h-16 flex flex-col justify-center">
                <div className="text-[10px] text-amber-700">Pending</div>
                <div className="font-semibold text-amber-900">{pendingInspections.length}</div>
              </div>
              <div className="flex flex-col gap-0 items-stretch">
                <Button
                  variant="outline"
                  onClick={() => router.push('/production')}
                  className="border-primary-200 text-primary-700 hover:bg-primary-50 h-8 text-xs rounded-b-none"
                >
                  Go to Production
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/store/delivery-notes')}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8 text-xs rounded-t-none"
                >
                  Go to Delivery Notes
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Timeline */}
        <div className="mb-6 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Production → QC → Store</h3>
              <p className="text-xs text-slate-600">Auto DN requests on approval</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/store/delivery-notes')}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Open Delivery Notes
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border border-blue-200 p-3 bg-blue-50">
              <p className="text-xs text-blue-700">Production Pending</p>
              <p className="text-lg font-semibold text-blue-900">{pendingInspections.length}</p>
              <p className="text-xs text-blue-700">Awaiting QC</p>
            </div>
            <div className="rounded-lg border border-emerald-200 p-3 bg-emerald-50">
              <p className="text-xs text-emerald-700">QC Approved</p>
              <p className="text-lg font-semibold text-emerald-900">{approvedInspections.length}</p>
              <p className="text-xs text-emerald-700">Ready for DN</p>
            </div>
            <div className="rounded-lg border border-amber-200 p-3 bg-amber-50">
              <p className="text-xs text-amber-700">DN Requests</p>
              <p className="text-lg font-semibold text-amber-900">{pendingDnRequests.length}</p>
              <p className="text-xs text-amber-700">Waiting on Store</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
              <p className="text-xs text-slate-500">Delivery Notes Issued</p>
              <p className="text-lg font-semibold text-slate-900">{deliveryNotesCount}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </div>
          </div>
        </div>

        {approvedInspections.length > 0 && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-emerald-900 mb-2">Approved Inspections Ready for Delivery Notes</h3>
                  <div className="space-y-2">
                    {approvedInspections.map((inspection) => {
                        const jobOrder = inspection.jobOrderItem.jobOrder
                        const approvedQty = getApprovedQty(inspection)
                        const totalQty = inspection.jobOrderItem.quantity ?? 0
                        const unit = inspection.jobOrderItem.unit || ''

                        return (
                          <div key={inspection.id} className="flex items-center justify-between bg-white rounded p-2 text-sm">
                            <div className="text-gray-700">
                              <div className="font-semibold text-gray-900">
                                {jobOrder.jobNumber} • {jobOrder.clientName || 'No Client'}
                              </div>
                              <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                <span>{inspection.jobOrderItem.workDescription}</span>
                                <span>Approved: {approvedQty} / {totalQty} {unit}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => router.push(`/store/delivery-notes?jobOrderId=${jobOrder.id}&openForm=1`)}
                              >
                                Prepare DN
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {pageSuccess && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            {pageSuccess}
          </div>
        )}
        {pageError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {pageError}
          </div>
        )}

        {selectedInspectionIds.length > 0 && (
          <div className="mb-4 flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 text-sm">
            <div className="text-primary-900 font-semibold">
              {selectedInspectionIds.length} inspection(s) selected for Delivery Note
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-7 px-2 text-[11px] border-slate-300 text-slate-700 hover:bg-slate-50"
                onClick={() => setSelectedInspectionIds([])}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                className="h-7 px-2 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={prepareDeliveryNoteFromSelection}
              >
                Prepare DN
              </Button>
              <Button
                className="h-7 px-2 text-[11px] bg-primary-600 hover:bg-primary-700 text-white"
                onClick={requestDeliveryNotes}
              >
                Request DN
              </Button>
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

                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-900">Inspection Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        value={createForm.inspectedQty}
                        onChange={(e) => setCreateForm({ ...createForm, inspectedQty: e.target.value })}
                        placeholder="Leave blank to use full quantity"
                        className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                      />
                      <p className="text-xs text-slate-500">Applied to all items for this job order.</p>
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

        {/* Inspections List */}
        <div className="space-y-4">
          {groupedInspections.map((group) => (
            <div key={group.jobNumber} className="bg-white rounded-lg shadow border">
              <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{group.jobNumber}</p>
                  <p className="text-xs text-slate-600">{group.clientName}</p>
                </div>
                <div className="text-xs text-slate-600">{group.items.length} inspections</div>
              </div>
              <div className="divide-y">
                {group.items.map((entry) => {
                  if (entry.kind === 'quality') {
                    const inspection = entry.inspection
                    const derivedStatus = getInspectionStatus(inspection)
                    const baseQty = inspection.inspectedQty ?? inspection.jobOrderItem.quantity ?? 0
                    const approvedQty = inspection.approvedQty ?? 0
                    const rejectedQty = inspection.rejectedQty ?? 0
                    const holdQty = inspection.holdQty ?? 0
                    const approvedPercent = baseQty > 0 ? (approvedQty / baseQty) * 100 : 0
                    const isSelectable = derivedStatus === 'APPROVED'
                    const isSelected = selectedInspectionIds.includes(inspection.id)

                    return (
                      <div key={inspection.id} className="px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{inspection.jobOrderItem.workDescription}</p>
                          <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            <span>Type: QC</span>
                            <span>Release Qty: {baseQty} {inspection.jobOrderItem.unit}</span>
                            <span>ITP: {inspection.itpTemplate.name}</span>
                          </div>
                          <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            <span>Approved: {approvedQty}</span>
                            <span>Rejected: {rejectedQty}</span>
                            <span>Hold: {holdQty}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelectable && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                setSelectedInspectionIds((prev) =>
                                  prev.includes(inspection.id)
                                    ? prev.filter((id) => id !== inspection.id)
                                    : [...prev, inspection.id]
                                )
                              }
                            />
                          )}
                          {getStatusBadge(derivedStatus, approvedPercent)}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => openInspectionDetails(inspection.id)}
                          >
                            View
                          </Button>
                          {derivedStatus === 'APPROVED' && group.jobOrderId && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => router.push(`/store/delivery-notes?jobOrderId=${group.jobOrderId}&openForm=1`)}
                            >
                              Prepare DN
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteConfirm(inspection.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  }

                  if (entry.kind === 'pending') {
                    const inspection = entry.inspection as any
                    const workDescription = inspection.productionRelease?.jobOrderItem?.workDescription || 'N/A'
                    const unit = inspection.productionRelease?.jobOrderItem?.unit || ''
                    const releaseQty = inspection.productionRelease?.releaseQty || 0
                    const drawingNumber = inspection.productionRelease?.drawingNumber || 'N/A'
                    const transmittalNo = inspection.productionRelease?.transmittalNo || 'N/A'

                    return (
                      <div
                        key={`pending-${inspection.id}`}
                        className="px-4 py-3 flex items-center justify-between gap-4 bg-amber-50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-amber-900 truncate">{workDescription}</p>
                            <Badge className="bg-amber-200 text-amber-900">New</Badge>
                          </div>
                          <div className="text-xs text-amber-700 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            <span>Type: Production</span>
                            <span>Qty: {releaseQty} {unit}</span>
                            <span>Drawing: {drawingNumber}</span>
                            <span>Transmittal: {transmittalNo}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => {
                              if (inspection.qualityInspectionId) {
                                openInspectionDetails(inspection.qualityInspectionId)
                              } else {
                                setPageError('No quality inspection record found for this production release.')
                              }
                            }}
                          >
                            Complete
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => deletePendingInspection(inspection.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  }

                  const inspection = entry.inspection as any
                  const workDescription = inspection.productionRelease?.jobOrderItem?.workDescription || 'N/A'
                  const unit = inspection.productionRelease?.jobOrderItem?.unit || ''
                  const releaseQty = inspection.productionRelease?.releaseQty || 0
                  const inspectedAt = inspection.inspectionTimestampFormatted || 'N/A'

                  return (
                    <div key={`production-${inspection.id}`} className="px-4 py-3 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{workDescription}</p>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          <span>Type: Production</span>
                          <span>Qty: {releaseQty} {unit}</span>
                          <span>Inspected: {inspectedAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(inspection.result || 'PENDING')}
                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProductionInspection(inspection)
                                setShowEditProductionDialog(true)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => deleteProductionInspection(inspection.id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {groupedInspections.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No inspections found</p>
            <p className="text-gray-400 text-sm">Create your first inspection or complete production inspections to get started</p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {isAdmin && (
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
        )}

        {/* Edit Production Inspection Dialog */}
        {isAdmin && (
          <Dialog
            open={showEditProductionDialog}
            onOpenChange={(open) => {
              setShowEditProductionDialog(open)
              if (!open) {
                setSelectedProductionInspection(null)
                setProductionEditError(null)
              }
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader className="bg-gradient-to-r from-slate-50 to-slate-100 -mx-6 -mt-6 px-6 pt-6 pb-4 border-b border-slate-200 rounded-t-lg">
                <DialogTitle className="text-xl font-bold text-slate-900">Edit Production Inspection</DialogTitle>
              </DialogHeader>

              {selectedProductionInspection && (
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="font-semibold text-slate-900">Result</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {['APPROVED', 'REJECTED', 'HOLD'].map((result) => (
                        <button
                          key={result}
                          onClick={() => setProductionEditForm({ ...productionEditForm, result: result as any })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            productionEditForm.result === result
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="font-semibold text-slate-900">Inspection Date</Label>
                      <Input
                        type="datetime-local"
                        value={productionEditForm.inspectionTimestamp}
                        onChange={(e) => setProductionEditForm({ ...productionEditForm, inspectionTimestamp: e.target.value })}
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-slate-900">Inspected By</Label>
                      <Input
                        value={productionEditForm.inspectedBy}
                        onChange={(e) => setProductionEditForm({ ...productionEditForm, inspectedBy: e.target.value })}
                        placeholder="Inspector name"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="font-semibold text-slate-900">Inspected Qty</Label>
                      <Input
                        type="number"
                        value={productionEditForm.inspectedQty}
                        onChange={(e) => setProductionEditForm({ ...productionEditForm, inspectedQty: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-slate-900">Approved Qty</Label>
                      <Input
                        type="number"
                        value={productionEditForm.approvedQty}
                        onChange={(e) => setProductionEditForm({ ...productionEditForm, approvedQty: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-slate-900">Rejected Qty</Label>
                      <Input
                        type="number"
                        value={productionEditForm.rejectedQty}
                        onChange={(e) => setProductionEditForm({ ...productionEditForm, rejectedQty: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-slate-900">Hold Qty</Label>
                      <Input
                        type="number"
                        value={productionEditForm.holdQty}
                        onChange={(e) => setProductionEditForm({ ...productionEditForm, holdQty: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold text-slate-900">Remarks</Label>
                    <Textarea
                      value={productionEditForm.remarks}
                      onChange={(e) => setProductionEditForm({ ...productionEditForm, remarks: e.target.value })}
                      placeholder="Remarks"
                      rows={3}
                      className="border-slate-300"
                    />
                  </div>

                  {productionEditError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {productionEditError}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowEditProductionDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveProductionInspection}
                      disabled={productionEditSaving || !productionEditForm.result}
                      className="bg-slate-900 hover:bg-slate-800"
                    >
                      {productionEditSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
