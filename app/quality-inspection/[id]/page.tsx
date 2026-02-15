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
  const [stepValidationError, setStepValidationError] = useState<string | null>(null)
  const [approvedOverride, setApprovedOverride] = useState(false)
  const [rejectedOverride, setRejectedOverride] = useState(false)
  const [holdOverride, setHoldOverride] = useState(false)
  const [drawingEntries, setDrawingEntries] = useState<Array<{ id: string; drawingNo: string; qty: string; unit: string; rffNo: string }>>([])

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
    setApprovedOverride(false)
    setRejectedOverride(false)
    setHoldOverride(false)
    const parsedEntries = parseDrawingEntries(inspection.drawingNumber || '')
    setDrawingEntries(parsedEntries)
  }, [inspection])
  const normalizeQtyInput = (value: string) => {
    if (!value) return ''
    const parsed = Number(value)
    if (Number.isNaN(parsed)) return ''
    const rounded = Math.round(parsed * 10000) / 10000
    const fixed = rounded.toFixed(4)
    return fixed.replace(/\.?(0+)$/, '')
  }

  const formatQty = (value: number) => normalizeQtyInput(value.toString())

  const parseDrawingEntries = (value: string) => {
    if (!value) return []
    const lines = value.split('\n').map((line) => line.trim()).filter(Boolean)
    const entries = lines.map((line) => {
      const parts = line.split('|').map((part) => part.trim())
      const drawingNo = parts[0] || ''
      const qtyPart = parts.find((part) => part.toLowerCase().startsWith('qty')) || ''
      const unitPart = parts.find((part) => part.toLowerCase().startsWith('unit')) || ''
      const rffPart = parts.find((part) => part.toLowerCase().startsWith('rff')) || ''
      const qty = qtyPart.replace(/qty\s*[:=]?\s*/i, '')
      const unit = unitPart.replace(/unit\s*[:=]?\s*/i, '')
      const rffNo = rffPart.replace(/rff\s*no\.?\s*[:=]?\s*/i, '').replace(/rff\s*[:=]?\s*/i, '').trim()
      return { id: crypto.randomUUID(), drawingNo, qty: normalizeQtyInput(qty), unit, rffNo }
    })
    return entries.filter((entry) => entry.drawingNo || entry.qty || entry.unit || entry.rffNo)
  }

  const parseDrawingSummary = (value: string) => {
    if (!value) return []
    const lines = value.split('\n').map((line) => line.trim()).filter(Boolean)
    return lines.map((line) => {
      const parts = line.split('|').map((part) => part.trim())
      const drawingNo = parts[0] || ''
      const qtyPart = parts.find((part) => part.toLowerCase().startsWith('qty')) || ''
      const unitPart = parts.find((part) => part.toLowerCase().startsWith('unit')) || ''
      const rffPart = parts.find((part) => part.toLowerCase().startsWith('rff')) || ''
      const qty = qtyPart.replace(/qty\s*[:=]?\s*/i, '')
      const unit = unitPart.replace(/unit\s*[:=]?\s*/i, '')
      const rffNo = rffPart.replace(/rff\s*no\.?\s*[:=]?\s*/i, '').replace(/rff\s*[:=]?\s*/i, '').trim()
      return { drawingNo, qty: qty.trim(), unit: unit.trim(), rffNo }
    }).filter((entry) => entry.drawingNo || entry.qty || entry.unit || entry.rffNo)
  }

  const formatDrawingSummary = (value: string, fallback: string) => {
    const entries = parseDrawingSummary(value)
    if (entries.length === 0) return fallback || 'N/A'
    return entries
      .map((entry) => {
        const qtyPart = entry.qty ? normalizeQtyInput(entry.qty) : ''
        const unitPart = entry.unit ? entry.unit : ''
        const rffPart = entry.rffNo ? ` RFF ${entry.rffNo}` : ''
        const suffix = qtyPart ? ` (${qtyPart}${unitPart ? ` ${unitPart}` : ''})` : ''
        return `${entry.drawingNo || 'N/A'}${suffix}${rffPart}`
      })
      .join(', ')
  }

  const applyPastedDrawingRows = (text: string, insertIndex: number) => {
    if (!text) return false
    const rows = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (rows.length <= 1 && !rows[0]?.includes('\t')) return false

    const nextEntries = rows
      .map((row) => row.split('\t').map((cell) => cell.trim()))
      .filter((cols) => cols.length > 0)
      .map((cols) => ({
        id: crypto.randomUUID(),
        drawingNo: cols[0] || '',
        qty: cols[1] ? normalizeQtyInput(cols[1]) : '',
        unit: cols[2] || inspection?.jobOrderItem.unit || '',
        rffNo: cols[3] || ''
      }))
      .filter((entry) => entry.drawingNo || entry.qty || entry.unit || entry.rffNo)

    if (nextEntries.length === 0) return false
    setDrawingEntries((prev) => {
      const clampedIndex = Math.max(0, Math.min(insertIndex, prev.length - 1))
      const target = prev[clampedIndex]
      const targetEmpty = !target?.drawingNo && !target?.qty && !target?.unit
      const replacement = targetEmpty ? [nextEntries[0]] : []
      const remainder = targetEmpty ? nextEntries.slice(1) : nextEntries
      const before = prev.slice(0, clampedIndex)
      const after = prev.slice(clampedIndex + (targetEmpty ? 1 : 0))
      return [...before, ...replacement, ...remainder, ...after]
    })
    return true
  }

  const buildDrawingNumberValue = () => {
    if (drawingEntries.length === 0) return editForm.drawingNumber.trim()
    return drawingEntries
      .filter((entry) => entry.drawingNo || entry.qty || entry.unit || entry.rffNo)
      .map((entry) => {
        const parts = [entry.drawingNo || 'N/A']
        if (entry.qty) parts.push(`Qty ${normalizeQtyInput(entry.qty)}`)
        if (entry.unit) parts.push(`Unit ${entry.unit}`)
        if (entry.rffNo) parts.push(`RFF ${entry.rffNo}`)
        return parts.join(' | ')
      })
      .join('\n')
  }


  const inspectionSummary = useMemo(() => {
    if (!inspection) return null
    const approvedValues = inspection.steps.map((step) =>
      parseStepNumber(stepApprovedQty[step.id] ?? step.approvedQty ?? 0)
    )
    const rejectedValues = inspection.steps.map((step) =>
      parseStepNumber(stepFailedQty[step.id] ?? step.failedQty ?? 0)
    )
    const holdValues = inspection.steps.map((step) =>
      parseStepNumber(stepHoldQty[step.id] ?? step.holdQty ?? 0)
    )

    const minApproved = approvedValues.length > 0 ? Math.min(...approvedValues) : 0
    const totalRejected = rejectedValues.reduce((sum, v) => sum + v, 0)
    const totalHold = holdValues.reduce((sum, v) => sum + v, 0)

    return {
      totalSteps: inspection.steps.length,
      approved: inspection.steps.filter(s => s.status === 'APPROVED').length,
      failed: inspection.steps.filter(s => s.status === 'FAILED').length,
      hold: inspection.steps.filter(s => s.status === 'HOLD').length,
      pending: inspection.steps.filter(s => s.status === 'PENDING').length,
      finalApprovedQty: minApproved,
      totalRejectedQty: totalRejected,
      totalHoldQty: totalHold,
    }
  }, [inspection, stepApprovedQty, stepFailedQty, stepHoldQty])

  const autoApprovedQty = inspectionSummary ? inspectionSummary.finalApprovedQty : 0
  const autoRejectedQty = inspectionSummary ? inspectionSummary.totalRejectedQty : 0
  const autoHoldQty = inspectionSummary ? inspectionSummary.totalHoldQty : 0
  const effectiveApprovedQty = approvedOverride ? parseStepNumber(editForm.approvedQty) : autoApprovedQty
  const effectiveRejectedQty = rejectedOverride ? parseStepNumber(editForm.rejectedQty) : autoRejectedQty
  const effectiveHoldQty = holdOverride ? parseStepNumber(editForm.holdQty) : autoHoldQty
  const effectiveInspectedQty = effectiveApprovedQty + effectiveRejectedQty + effectiveHoldQty

  useEffect(() => {
    if (!inspection || !inspectionSummary) return

    if (!approvedOverride) {
      const nextApproved = formatQty(autoApprovedQty)
      if (editForm.approvedQty !== nextApproved) {
        setEditForm((prev) => ({ ...prev, approvedQty: nextApproved }))
      }
    }

    if (!rejectedOverride) {
      const nextRejected = formatQty(autoRejectedQty)
      if (editForm.rejectedQty !== nextRejected) {
        setEditForm((prev) => ({ ...prev, rejectedQty: nextRejected }))
      }
    }

    if (!holdOverride) {
      const nextHold = formatQty(autoHoldQty)
      if (editForm.holdQty !== nextHold) {
        setEditForm((prev) => ({ ...prev, holdQty: nextHold }))
      }
    }
    const nextInspected = formatQty(effectiveInspectedQty)
    if (editForm.inspectedQty !== nextInspected) {
      setEditForm((prev) => ({ ...prev, inspectedQty: nextInspected }))
    }
  }, [inspection, inspectionSummary, autoApprovedQty, autoRejectedQty, autoHoldQty, approvedOverride, rejectedOverride, holdOverride, editForm.approvedQty, editForm.rejectedQty, editForm.holdQty, editForm.inspectedQty, effectiveInspectedQty])

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
          drawingNumber: buildDrawingNumberValue(),
          transmittalNo: editForm.transmittalNo.trim(),
          inspectionDate: editForm.inspectionDate || null,
          inspectedQty: formatQty(effectiveInspectedQty),
          approvedQty: approvedOverride ? editForm.approvedQty : formatQty(autoApprovedQty),
          rejectedQty: rejectedOverride ? editForm.rejectedQty : formatQty(autoRejectedQty),
          holdQty: holdOverride ? editForm.holdQty : formatQty(autoHoldQty),
          inspectedWeight: normalizeQtyInput(editForm.inspectedWeight),
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
      const inspectedQtyLimit = parseStepNumber(
        inspection.inspectedQty ?? inspection.jobOrderItem.quantity ?? 0
      )

      let validationMessage: string | null = null
      let minApproved: number | null = null
      let totalRejected = 0
      let totalHold = 0

      const updates = inspection.steps.map((step) => {
        const approved = stepApprovedQty[step.id] ?? step.approvedQty?.toString() ?? ''
        const failed = stepFailedQty[step.id] ?? step.failedQty?.toString() ?? ''
        const hold = stepHoldQty[step.id] ?? step.holdQty?.toString() ?? ''
        const remarks = (stepRemarks[step.id] ?? step.remarks ?? '').trim()

        const approvedValue = parseStepNumber(approved)
        const failedValue = parseStepNumber(failed)
        const holdValue = parseStepNumber(hold)

        if (
          approvedValue > inspectedQtyLimit ||
          failedValue > inspectedQtyLimit ||
          holdValue > inspectedQtyLimit
        ) {
          validationMessage = `Step "${step.stepName}" values cannot exceed inspected qty (${inspectedQtyLimit}).`
        }

        minApproved = minApproved === null ? approvedValue : Math.min(minApproved, approvedValue)
        totalRejected += failedValue
        totalHold += holdValue

        const status = getStepStatusFromQty(approvedValue, failedValue, holdValue)
        return updateStepStatus(step.id, status, remarks, approved, failed, hold)
      })

      if (validationMessage) {
        setStepValidationError(validationMessage)
        return
      }

      setStepValidationError(null)

      await Promise.all(updates)

      if (isAdmin) {
        const approvedQty = approvedOverride ? parseStepNumber(editForm.approvedQty) : (minApproved ?? 0)
        const rejectedQty = rejectedOverride ? parseStepNumber(editForm.rejectedQty) : totalRejected
        const holdQty = holdOverride ? parseStepNumber(editForm.holdQty) : totalHold
        const inspectedQty = approvedQty + rejectedQty + holdQty
        const headerRes = await fetch(`/api/quality-inspection/${inspection.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inspectedQty: formatQty(inspectedQty),
            approvedQty: formatQty(approvedQty),
            rejectedQty: formatQty(rejectedQty),
            holdQty: formatQty(holdQty),
          })
        })
        if (!headerRes.ok) {
          const data = await headerRes.json().catch(() => null)
          setStepValidationError(data?.error || 'Failed to update inspection totals.')
          return
        }
      }

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

  const totalQty = inspection.jobOrderItem.quantity ?? 0
  const inspectedQtyValue = inspection.inspectedQty ?? totalQty
  const balanceQty = Math.max(0, totalQty - inspectedQtyValue)
  const drawingSummary = formatDrawingSummary(
    inspection.drawingNumber || '',
    inspection.jobOrderItem.jobOrder.drawingRef || 'N/A'
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/quality-inspection')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold text-slate-900">Quality Inspection Details</h1>
          </div>
          {getStatusBadge(getInspectionStatus(inspection))}
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-lg border p-2">
            <h4 className="font-semibold text-sm mb-1">Inspection Overview</h4>
            <div className="grid grid-cols-5 gap-2 text-xs">
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
                <span className="text-slate-500">Total Qty</span>
                <p className="font-medium text-slate-900">
                  {inspection.jobOrderItem.quantity ?? '-'} {inspection.jobOrderItem.unit || ''}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Inspection Qty Released</span>
                <p className="font-medium text-slate-900">
                  {inspectedQtyValue} {inspection.jobOrderItem.unit || ''}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Balance Inspection Qty</span>
                <p className="font-medium text-slate-900">
                  {balanceQty} {inspection.jobOrderItem.unit || ''}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Transmittal No.</span>
                <p className="font-medium text-slate-900">{inspection.transmittalNo || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Drawing No.</span>
                <p className="font-medium text-slate-900 leading-5">{drawingSummary}</p>
              </div>
              <div>
                <span className="text-slate-500">Inspection Date</span>
                <p className="font-medium text-slate-900">{inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          </div>

          {inspectionSummary && (
            <div className="grid grid-cols-4 gap-2 p-2 bg-slate-50 rounded-lg border">
              <div className="text-center">
                <p className="text-xs text-slate-500">Steps</p>
                <p className="text-xl font-bold text-slate-900">{inspectionSummary.totalSteps}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-green-600 font-semibold">Approved</p>
                <p className="text-xl font-bold text-green-700">{inspectionSummary.approved}</p>
                <p className="text-xs text-green-600">Qty: {inspectionSummary.finalApprovedQty}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-red-600 font-semibold">Failed</p>
                <p className="text-xl font-bold text-red-700">{inspectionSummary.failed}</p>
                <p className="text-xs text-red-600">Qty: {inspectionSummary.totalRejectedQty}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-yellow-600 font-semibold">Hold</p>
                <p className="text-xl font-bold text-yellow-700">{inspectionSummary.hold}</p>
                <p className="text-xs text-yellow-600">Qty: {inspectionSummary.totalHoldQty}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg p-2 border">
            <h4 className="font-semibold text-sm mb-2">QC Record</h4>
            {isAdmin ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-slate-500 font-semibold">Drawing No.</Label>
                    {drawingEntries.length === 0 ? (
                      <>
                        <Input
                          value={editForm.drawingNumber}
                          onChange={(e) => {
                            setDrawingEntries([])
                            setEditForm({ ...editForm, drawingNumber: e.target.value })
                          }}
                          placeholder="Drawing number"
                          className="text-xs h-8"
                        />
                        <div className="mt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDrawingEntries((prev) => [
                                ...prev,
                                { id: crypto.randomUUID(), drawingNo: '', qty: '', unit: inspection.jobOrderItem.unit || '' }
                              ])
                            }
                          >
                            Add Drawing Entry
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] text-slate-500">Using multiple drawing entries below.</div>
                    )}
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
                      placeholder="0"
                      className="text-xs h-8"
                      disabled
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Auto = Approved + Rejected + Hold</p>
                  </div>
                </div>
                {drawingEntries.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-slate-500 font-semibold">Drawing Entries</div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDrawingEntries((prev) => [
                              ...prev,
                              { id: crypto.randomUUID(), drawingNo: '', qty: '', unit: inspection.jobOrderItem.unit || '', rffNo: '' }
                            ])
                          }
                        >
                          Add Entry
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDrawingEntries([])}
                        >
                          Use Single Drawing
                        </Button>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500">Same RFF + Qty indicates repeated drawing release.</div>
                    <div className="grid grid-cols-12 gap-1 text-[11px] text-slate-500 font-semibold">
                      <div className="col-span-5">Drawing No.</div>
                      <div className="col-span-2">Qty</div>
                      <div className="col-span-2">Unit</div>
                      <div className="col-span-2">RFF No.</div>
                      <div className="col-span-1"></div>
                    </div>
                    {drawingEntries.map((entry, index) => (
                      <div key={entry.id} className="grid grid-cols-12 gap-1">
                        <Input
                          value={entry.drawingNo}
                          onChange={(e) =>
                            setDrawingEntries((prev) =>
                              prev.map((row) => row.id === entry.id ? { ...row, drawingNo: e.target.value } : row)
                            )
                          }
                          onPaste={(e) => {
                            const text = e.clipboardData.getData('text')
                            if (applyPastedDrawingRows(text, index)) {
                              e.preventDefault()
                            }
                          }}
                          placeholder="Drawing number"
                          className="col-span-5 text-xs h-8"
                        />
                        <Input
                          type="number"
                          value={entry.qty}
                          onChange={(e) =>
                            setDrawingEntries((prev) =>
                              prev.map((row) => row.id === entry.id ? { ...row, qty: normalizeQtyInput(e.target.value) } : row)
                            )
                          }
                          placeholder="0"
                          className="col-span-2 text-xs h-8"
                        />
                        <Input
                          value={entry.unit}
                          onChange={(e) =>
                            setDrawingEntries((prev) =>
                              prev.map((row) => row.id === entry.id ? { ...row, unit: e.target.value } : row)
                            )
                          }
                          placeholder="Unit"
                          className="col-span-2 text-xs h-8"
                        />
                        <Input
                          value={entry.rffNo}
                          onChange={(e) =>
                            setDrawingEntries((prev) =>
                              prev.map((row) => row.id === entry.id ? { ...row, rffNo: e.target.value } : row)
                            )
                          }
                          placeholder="RFF"
                          className="col-span-2 text-xs h-8"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="col-span-1 text-red-600 h-8"
                          onClick={() =>
                            setDrawingEntries((prev) => prev.filter((row) => row.id !== entry.id))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs text-green-600 font-semibold">Approved Qty</Label>
                    <Input
                      type="number"
                      value={editForm.approvedQty}
                      onChange={(e) => {
                        setApprovedOverride(true)
                        setEditForm({ ...editForm, approvedQty: normalizeQtyInput(e.target.value) })
                      }}
                      placeholder="0"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-red-600 font-semibold">Rejected Qty</Label>
                    <Input
                      type="number"
                      value={editForm.rejectedQty}
                      onChange={(e) => {
                        setRejectedOverride(true)
                        setEditForm({ ...editForm, rejectedQty: normalizeQtyInput(e.target.value) })
                      }}
                      placeholder="0"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-yellow-600 font-semibold">Hold Qty</Label>
                    <Input
                      type="number"
                      value={editForm.holdQty}
                      onChange={(e) => {
                        setHoldOverride(true)
                        setEditForm({ ...editForm, holdQty: normalizeQtyInput(e.target.value) })
                      }}
                      placeholder="0"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 font-semibold">Weight</Label>
                    <Input
                      type="number"
                      value={editForm.inspectedWeight}
                      onChange={(e) => setEditForm({ ...editForm, inspectedWeight: normalizeQtyInput(e.target.value) })}
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
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <div>
                  <span className="text-slate-500">Drawing No.:</span>
                  <p className="font-medium">{drawingSummary}</p>
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
            <h4 className="font-semibold text-sm mb-2">Inspection Steps</h4>
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
                        onChange={(e) => setStepApprovedQty(prev => ({ ...prev, [step.id]: normalizeQtyInput(e.target.value) }))}
                        min="0"
                        className="text-xs h-7"
                      />
                    </div>
                    <div className="px-2 py-1">
                      <Input
                        type="number"
                        placeholder="0"
                        value={stepFailedQty[step.id] ?? step.failedQty ?? ''}
                        onChange={(e) => setStepFailedQty(prev => ({ ...prev, [step.id]: normalizeQtyInput(e.target.value) }))}
                        min="0"
                        className="text-xs h-7"
                      />
                    </div>
                    <div className="px-2 py-1">
                      <Input
                        type="number"
                        placeholder="0"
                        value={stepHoldQty[step.id] ?? step.holdQty ?? ''}
                        onChange={(e) => setStepHoldQty(prev => ({ ...prev, [step.id]: normalizeQtyInput(e.target.value) }))}
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
                    {inspectionSummary?.finalApprovedQty ?? 0}
                  </div>
                  <div className="px-2 py-2">
                    {inspectionSummary?.totalRejectedQty ?? 0}
                  </div>
                  <div className="px-2 py-2">
                    {inspectionSummary?.totalHoldQty ?? 0}
                  </div>
                  <div className="px-2 py-2 text-slate-500">Totals</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <Button size="sm" onClick={saveStepTable}>
                Save Step Updates
              </Button>
            </div>
            {stepValidationError && (
              <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                {stepValidationError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
