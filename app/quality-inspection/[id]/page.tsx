'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react'

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
}

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

const parseStepNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return 0
  const parsed = typeof value === 'number' ? value : parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

const getStepStatusFromQty = (approved: number, failed: number, hold: number) => {
  if (failed > 0) return 'FAILED'
  if (hold > 0) return 'HOLD'
  if (approved > 0) return 'APPROVED'
  return 'PENDING'
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

const buildDefaultInspectionForm = (inspection: QualityInspection) => {
  const defaultDrawing = inspection.drawingNumber || inspection.jobOrderItem.jobOrder.drawingRef || ''
  const inspectedQty = inspection.inspectedQty ?? inspection.jobOrderItem.quantity ?? null
  const unitWeight = inspection.jobOrderItem.unitWeight ?? null
  const computedWeight = unitWeight !== null && inspectedQty !== null ? unitWeight * inspectedQty : null

  return {
    drawingNumber: defaultDrawing,
    transmittalNo: inspection.transmittalNo || '',
    inspectionDate: toDateTimeLocal(inspection.inspectionDate),
    inspectedQty: toNumberString(inspectedQty),
    approvedQty: toNumberString(inspection.approvedQty),
    rejectedQty: toNumberString(inspection.rejectedQty),
    holdQty: toNumberString(inspection.holdQty),
    inspectedWeight: toNumberString(inspection.inspectedWeight ?? computedWeight),
    remarks: inspection.remarks || '',
  }
}

export default function QualityInspectionDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const inspectionId = params?.id
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [inspection, setInspection] = useState<QualityInspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState<string | null>(null)

  const [editForm, setEditForm] = useState({
    drawingNumber: '',
    transmittalNo: '',
    inspectionDate: '',
    inspectedQty: '',
    approvedQty: '',
    rejectedQty: '',
    holdQty: '',
    inspectedWeight: '',
    remarks: '',
  })

  const [stepRemarks, setStepRemarks] = useState<Record<string, string>>({})
  const [stepApprovedQty, setStepApprovedQty] = useState<Record<string, string>>({})
  const [stepFailedQty, setStepFailedQty] = useState<Record<string, string>>({})
  const [stepHoldQty, setStepHoldQty] = useState<Record<string, string>>({})

  const fetchInspection = async () => {
    if (!inspectionId) return
    try {
      setLoading(true)
      setLoadError(null)
      const res = await fetch(`/api/quality-inspection/${inspectionId}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to load inspection')
      }
      const data = await res.json()
      setInspection(data)
    } catch (error: any) {
      setLoadError(error?.message || 'Failed to load inspection')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInspection()
  }, [inspectionId])

  useEffect(() => {
    if (!inspection) return
    setEditForm(buildDefaultInspectionForm(inspection))
    setEditError(null)
    setEditSuccess(null)
  }, [inspection])

  const inspectionSummary = useMemo(() => {
    if (!inspection) return null
    return {
      totalSteps: inspection.steps.length,
      approved: inspection.steps.filter(s => s.status === 'APPROVED').length,
      failed: inspection.steps.filter(s => s.status === 'FAILED').length,
      hold: inspection.steps.filter(s => s.status === 'HOLD').length,
      pending: inspection.steps.filter(s => s.status === 'PENDING').length,
      totalApprovedQty: inspection.steps.reduce((sum, s) => sum + (s.approvedQty || 0), 0),
      totalFailedQty: inspection.steps.reduce((sum, s) => sum + (s.failedQty || 0), 0),
      totalHoldQty: inspection.steps.reduce((sum, s) => sum + (s.holdQty || 0), 0),
    }
  }, [inspection])

  const requestDeliveryNotesForInspection = async (id: string) => {
    try {
      await fetch('/api/delivery-notes/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionIds: [id] })
      })
    } catch (error) {
      console.error('Failed to auto-request delivery notes:', error)
    }
  }

  const updateStepStatus = async (stepId: string, status: string, remarks?: string, approvedQty?: string, failedQty?: string, holdQty?: string) => {
    if (!inspection) return
    try {
      const previousStatus = getInspectionStatus(inspection)
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
        const updated = await fetch(`/api/quality-inspection/${inspection.id}`).then(r => r.json())
        setInspection(updated)
        const nextStatus = getInspectionStatus(updated)
        if (previousStatus !== 'APPROVED' && nextStatus === 'APPROVED') {
          await requestDeliveryNotesForInspection(updated.id)
        }
      }
    } catch (error) {
      console.error('Error updating step:', error)
    }
  }

  const saveInspectionHeader = async () => {
    if (!inspection) return
    try {
      setEditSaving(true)
      setEditError(null)

      const res = await fetch(`/api/quality-inspection/${inspection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawingNumber: editForm.drawingNumber.trim(),
          transmittalNo: editForm.transmittalNo.trim(),
          inspectionDate: editForm.inspectionDate || null,
          inspectedQty: editForm.inspectedQty,
          approvedQty: editForm.approvedQty,
          rejectedQty: editForm.rejectedQty,
          holdQty: editForm.holdQty,
          inspectedWeight: editForm.inspectedWeight,
          remarks: editForm.remarks.trim(),
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setInspection((prev) => prev ? { ...prev, ...updated } : prev)
        setEditSuccess('Inspection details updated.')
        setTimeout(() => setEditSuccess(null), 4000)
      } else {
        const data = await res.json().catch(() => null)
        setEditError(data?.error || 'Failed to update inspection.')
      }
    } catch (error) {
      setEditError('Failed to update inspection.')
    } finally {
      setEditSaving(false)
    }
  }

  const saveStepTable = async () => {
    if (!inspection) return
    try {
      const updates = inspection.steps.map((step) => {
        const approved = stepApprovedQty[step.id] ?? step.approvedQty?.toString() ?? ''
        const failed = stepFailedQty[step.id] ?? step.failedQty?.toString() ?? ''
        const hold = stepHoldQty[step.id] ?? step.holdQty?.toString() ?? ''
        const remarks = (stepRemarks[step.id] ?? step.remarks ?? '').trim()
        const status = getStepStatusFromQty(
          parseStepNumber(approved),
          parseStepNumber(failed),
          parseStepNumber(hold)
        )
        return updateStepStatus(step.id, status, remarks, approved, failed, hold)
      })

      await Promise.all(updates)
      await fetchInspection()
    } catch (error) {
      console.error('Failed to save step table:', error)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (loadError || !inspection) {
    return (
      <div className="p-8">
        <div className="text-sm text-red-700">{loadError || 'Inspection not found.'}</div>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/quality-inspection')}>
          Back to list
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/quality-inspection')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-slate-900">Quality Inspection Details</h1>
          </div>
          {getStatusBadge(getInspectionStatus(inspection))}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-3">
            <h4 className="font-semibold text-sm mb-2">Inspection Overview</h4>
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Job No.</span>
                <p className="font-medium text-slate-900">{inspection.jobOrderItem.jobOrder.jobNumber}</p>
              </div>
              <div>
                <span className="text-slate-500">Client</span>
                <p className="font-medium text-slate-900">{inspection.jobOrderItem.jobOrder.clientName}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Work Description</span>
                <p className="font-medium text-slate-900">{inspection.jobOrderItem.workDescription}</p>
              </div>
              <div>
                <span className="text-slate-500">Line Item Description</span>
                <p className="font-medium text-slate-900">{inspection.jobOrderItem.workDescription}</p>
              </div>
              <div>
                <span className="text-slate-500">Total Qty</span>
                <p className="font-medium text-slate-900">
                  {inspection.jobOrderItem.quantity ?? '-'} {inspection.jobOrderItem.unit || ''}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Inspection Qty Released</span>
                <p className="font-medium text-slate-900">
                  {inspection.inspectedQty ?? inspection.jobOrderItem.quantity ?? '-'} {inspection.jobOrderItem.unit || ''}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Transmittal No.</span>
                <p className="font-medium text-slate-900">{inspection.transmittalNo || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Drawing No.</span>
                <p className="font-medium text-slate-900">{inspection.drawingNumber || inspection.jobOrderItem.jobOrder.drawingRef || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Inspection Date</span>
                <p className="font-medium text-slate-900">{inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          </div>

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

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-semibold text-sm mb-2">Job Information</h4>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Job Number:</span>
                <p className="font-medium text-sm">{inspection.jobOrderItem.jobOrder.jobNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Client:</span>
                <p className="font-medium text-sm">{inspection.jobOrderItem.jobOrder.clientName}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Work Description:</span>
                <p className="font-medium text-sm">{inspection.jobOrderItem.workDescription}</p>
              </div>
              <div>
                <span className="text-gray-500">Inspection Qty:</span>
                <p className="font-medium text-sm">
                  {inspection.jobOrderItem.quantity ?? '-'} {inspection.jobOrderItem.unit || ''}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border">
            <h4 className="font-semibold text-sm mb-3">QC Record</h4>
            {isAdmin ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500 font-semibold">Drawing No.</Label>
                    <Input
                      value={editForm.drawingNumber}
                      onChange={(e) => setEditForm({ ...editForm, drawingNumber: e.target.value })}
                      placeholder="Drawing number"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 font-semibold">Transmittal No.</Label>
                    <Input
                      value={editForm.transmittalNo}
                      onChange={(e) => setEditForm({ ...editForm, transmittalNo: e.target.value })}
                      placeholder="Transmittal number"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 font-semibold">Inspection Date</Label>
                    <Input
                      type="datetime-local"
                      value={editForm.inspectionDate}
                      onChange={(e) => setEditForm({ ...editForm, inspectionDate: e.target.value })}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 font-semibold">Inspected Qty</Label>
                    <Input
                      type="number"
                      value={editForm.inspectedQty}
                      onChange={(e) => setEditForm({ ...editForm, inspectedQty: e.target.value })}
                      placeholder="0"
                      className="text-xs h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs text-green-600 font-semibold">Approved Qty</Label>
                    <Input
                      type="number"
                      value={editForm.approvedQty}
                      onChange={(e) => setEditForm({ ...editForm, approvedQty: e.target.value })}
                      placeholder="0"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-red-600 font-semibold">Rejected Qty</Label>
                    <Input
                      type="number"
                      value={editForm.rejectedQty}
                      onChange={(e) => setEditForm({ ...editForm, rejectedQty: e.target.value })}
                      placeholder="0"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-yellow-600 font-semibold">Hold Qty</Label>
                    <Input
                      type="number"
                      value={editForm.holdQty}
                      onChange={(e) => setEditForm({ ...editForm, holdQty: e.target.value })}
                      placeholder="0"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 font-semibold">Weight</Label>
                    <Input
                      type="number"
                      value={editForm.inspectedWeight}
                      onChange={(e) => setEditForm({ ...editForm, inspectedWeight: e.target.value })}
                      placeholder="0"
                      className="text-xs h-8"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 font-semibold">Remarks</Label>
                  <Textarea
                    value={editForm.remarks}
                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                    placeholder="Remarks"
                    rows={2}
                    className="text-xs"
                  />
                </div>

                {editError && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                    {editError}
                  </div>
                )}
                {editSuccess && (
                  <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                    {editSuccess}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={saveInspectionHeader}
                    disabled={editSaving}
                  >
                    {editSaving ? 'Saving...' : 'Save QC Details'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
                <div>
                  <span className="text-slate-500">Drawing No.:</span>
                  <p className="font-medium">{inspection.drawingNumber || inspection.jobOrderItem.jobOrder.drawingRef || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Transmittal No.:</span>
                  <p className="font-medium">{inspection.transmittalNo || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Inspection Date:</span>
                  <p className="font-medium">{inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Inspected Qty:</span>
                  <p className="font-medium">{inspection.inspectedQty ?? 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Approved Qty:</span>
                  <p className="font-medium">{inspection.approvedQty ?? 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Rejected Qty:</span>
                  <p className="font-medium">{inspection.rejectedQty ?? 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Hold Qty:</span>
                  <p className="font-medium">{inspection.holdQty ?? 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Weight:</span>
                  <p className="font-medium">{inspection.inspectedWeight ?? 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Remarks:</span>
                  <p className="font-medium">{inspection.remarks || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Inspection Steps</h4>
            <div className="overflow-x-auto border rounded-lg">
              <div className="min-w-[1000px]">
                <div className="grid grid-cols-[2fr_0.8fr_0.8fr_0.8fr_2fr] gap-0 border-b bg-slate-50 text-xs font-semibold text-slate-600">
                  <div className="px-2 py-2">Step</div>
                  <div className="px-2 py-2">Approved Qty</div>
                  <div className="px-2 py-2">Rejected Qty</div>
                  <div className="px-2 py-2">Hold Qty</div>
                  <div className="px-2 py-2">Remarks</div>
                </div>
                {inspection.steps.map((step, index) => (
                  <div key={step.id} className="grid grid-cols-[2fr_0.8fr_0.8fr_0.8fr_2fr] gap-0 border-b text-xs">
                    <div className="px-2 py-2">
                      <div className="font-semibold text-slate-900">{index + 1}. {step.stepName}</div>
                      <div className="text-[11px] text-slate-500">{step.status || 'PENDING'}</div>
                    </div>
                    <div className="px-2 py-1">
                      <Input
                        type="number"
                        placeholder="0"
                        value={stepApprovedQty[step.id] ?? step.approvedQty ?? ''}
                        onChange={(e) => setStepApprovedQty(prev => ({ ...prev, [step.id]: e.target.value }))}
                        min="0"
                        className="text-xs h-7"
                      />
                    </div>
                    <div className="px-2 py-1">
                      <Input
                        type="number"
                        placeholder="0"
                        value={stepFailedQty[step.id] ?? step.failedQty ?? ''}
                        onChange={(e) => setStepFailedQty(prev => ({ ...prev, [step.id]: e.target.value }))}
                        min="0"
                        className="text-xs h-7"
                      />
                    </div>
                    <div className="px-2 py-1">
                      <Input
                        type="number"
                        placeholder="0"
                        value={stepHoldQty[step.id] ?? step.holdQty ?? ''}
                        onChange={(e) => setStepHoldQty(prev => ({ ...prev, [step.id]: e.target.value }))}
                        min="0"
                        className="text-xs h-7"
                      />
                    </div>
                    <div className="px-2 py-1">
                      <Input
                        value={stepRemarks[step.id] ?? step.remarks ?? ''}
                        onChange={(e) => setStepRemarks(prev => ({ ...prev, [step.id]: e.target.value }))}
                        placeholder="Remarks"
                        className="text-xs h-7"
                      />
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-[2fr_0.8fr_0.8fr_0.8fr_2fr] gap-0 bg-slate-50 text-xs font-semibold text-slate-700">
                  <div className="px-2 py-2">Net Summary</div>
                  <div className="px-2 py-2">
                    {inspection.steps.reduce((sum, step) => {
                      const approved = stepApprovedQty[step.id] ?? step.approvedQty ?? 0
                      return sum + parseStepNumber(approved)
                    }, 0)}
                  </div>
                  <div className="px-2 py-2">
                    {inspection.steps.reduce((sum, step) => {
                      const failed = stepFailedQty[step.id] ?? step.failedQty ?? 0
                      return sum + parseStepNumber(failed)
                    }, 0)}
                  </div>
                  <div className="px-2 py-2">
                    {inspection.steps.reduce((sum, step) => {
                      const hold = stepHoldQty[step.id] ?? step.holdQty ?? 0
                      return sum + parseStepNumber(hold)
                    }, 0)}
                  </div>
                  <div className="px-2 py-2 text-slate-500">Totals</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <Button size="sm" onClick={saveStepTable}>
                Save Step Updates
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
