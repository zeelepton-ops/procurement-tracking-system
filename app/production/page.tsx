'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Factory, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap, 
  Trash2, 
  Edit2,
  TrendingUp
} from 'lucide-react'
import type { ProductionRelease } from '@/types/production'

interface JobOrder {
  id: string
  jobNumber: string
  clientName?: string
  items?: Array<{
    id: string
    workDescription: string
    quantity?: number
    unit: string
    unitWeight?: number
  }>
}

interface ITPTemplate {
  id: string
  name: string
  steps: string[]
}

export default function ProductionPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [releases, setReleases] = useState<ProductionRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobOrder, setSelectedJobOrder] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [itpTemplates, setItpTemplates] = useState<ITPTemplate[]>([])
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingRelease, setEditingRelease] = useState<ProductionRelease | null>(null)
  const [useMultipleDrawings, setUseMultipleDrawings] = useState(false)
  const [releaseLines, setReleaseLines] = useState<Array<{ drawingNumber: string; transmittalNo: string; releaseQty: number }>>([
    { drawingNumber: '', transmittalNo: '', releaseQty: 0 }
  ])
  const [reportStatus, setReportStatus] = useState('ALL')
  const [reportTransmittal, setReportTransmittal] = useState('')
  const [reportDateFrom, setReportDateFrom] = useState('')
  const [reportDateTo, setReportDateTo] = useState('')

  const [formData, setFormData] = useState({
    jobOrderItemId: '',
    drawingNumber: '',
    transmittalNo: '',
    releaseQty: 0,
    itpTemplateId: '',
    productionStartDate: '',
    productionEndDate: '',
    actualCompletionDate: ''
  })

  const [editFormData, setEditFormData] = useState({
    id: '',
    jobOrderItemId: '',
    drawingNumber: '',
    transmittalNo: '',
    releaseQty: 0,
    itpTemplateId: '',
    productionStartDate: '',
    productionEndDate: '',
    actualCompletionDate: ''
  })

  const totalReleases = releases.length
  const pendingInspectionCount = releases.filter(r => r.status === 'PENDING_INSPECTION').length
  const reworkCount = releases.filter(r => r.status === 'REWORK').length

  useEffect(() => {
    fetchJobOrders()
    fetchReleases()
    fetchITPTemplates()
  }, [])

  useEffect(() => {
    if (selectedJobOrder) {
      fetchReleases()
    }
  }, [selectedJobOrder])

  const fetchJobOrders = async () => {
    try {
      const res = await fetch('/api/job-orders')
      if (res.ok) {
        const data = await res.json()
        setJobOrders(Array.isArray(data) ? data : data.jobs || [])
      }
    } catch (error) {
      console.error('Error fetching job orders:', error)
      setError('Failed to fetch job orders')
    }
  }

  const fetchReleases = async () => {
    try {
      const url = selectedJobOrder 
        ? `/api/production-releases?jobOrderId=${selectedJobOrder}`
        : '/api/production-releases'
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setReleases(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching releases:', error)
      setError('Failed to fetch releases')
    } finally {
      setLoading(false)
    }
  }

  const fetchITPTemplates = async () => {
    try {
      const res = await fetch('/api/quality-inspection/templates')
      if (res.ok) {
        const data = await res.json()
        setItpTemplates(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching ITP templates:', error)
    }
  }

  const calculateRemainingQty = (itemId: string): number => {
    const item = getSelectedJobOrderItem(itemId)
    if (!item) return 0

    const totalReleased = releases
      .filter(r => r.jobOrderItemId === itemId)
      .reduce((sum, r) => sum + r.releaseQty, 0)

    return (item.quantity || 0) - totalReleased
  }

  const getSelectedJobOrderItem = (itemId: string) => {
    const jobOrder = jobOrders.find(jo => jo.id === selectedJobOrder)
    return jobOrder?.items?.find(item => item.id === itemId)
  }

  const normalizeQtyInput = (value: string) => {
    if (!value) return ''
    const parsed = Number(value)
    if (Number.isNaN(parsed)) return ''
    const rounded = Math.round(parsed * 10000) / 10000
    const fixed = rounded.toFixed(4)
    return fixed.replace(/\.?(0+)$/, '')
  }

  const parseQtyNumber = (value: string) => {
    const normalized = normalizeQtyInput(value)
    return normalized ? Number(normalized) : 0
  }

  const buildReleaseLinesSummary = (lines: typeof releaseLines) => {
    const unit = getSelectedJobOrderItem(formData.jobOrderItemId)?.unit || ''
    const summaryItems = lines
      .filter((line) => line.drawingNumber || line.releaseQty || line.transmittalNo)
      .map((line) => {
        const qtyLabel = line.releaseQty ? normalizeQtyInput(line.releaseQty.toString()) : ''
        const unitLabel = unit ? ` ${unit}` : ''
        const qtyPart = qtyLabel ? ` (${qtyLabel}${unitLabel})` : ''
        return `${line.drawingNumber || 'N/A'}${qtyPart}`
      })
      .filter(Boolean)

    return summaryItems.join(', ')
  }

  const formatPrintDate = (value?: Date) => {
    if (!value) return 'N/A'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleString()
  }

  const getRffFromDrawing = (value?: string) => {
    if (!value) return ''
    const match = value.match(/rff\s*(?:no\.?|#|:)?\s*([A-Za-z0-9-]+)/i)
    return match?.[1] || ''
  }

  const printReleaseReport = (rows: Array<{
    jobNumber: string
    workDescription: string
    drawingNumber: string
    rffNo: string
    transmittalNo: string
    releaseQty: number
    unit: string
    releaseWeight?: number
    status: string
    createdAt?: Date
  }>) => {
    if (!rows.length) {
      setError('No releases found for the selected filters.')
      setTimeout(() => setError(null), 3000)
      return
    }

    const jobNumber = rows[0]?.jobNumber || 'N/A'
    const printWindow = window.open('', '_blank', 'noopener,noreferrer')
    if (!printWindow) return
    const html = `
      <html>
        <head>
          <title>Production Releases - ${jobNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 18px; margin: 0 0 6px; }
            .meta { font-size: 12px; color: #475569; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
            th { background: #f1f5f9; font-weight: 600; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Production Releases - ${jobNumber}</h1>
          <div class="meta">Printed: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Drawing</th>
                <th>RFF</th>
                <th>Transmittal</th>
                <th>Item</th>
                <th class="right">Qty</th>
                <th class="right">Weight</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) => `
                    <tr>
                      <td>${formatPrintDate(row.createdAt)}</td>
                      <td>${row.drawingNumber || 'N/A'}</td>
                      <td>${row.rffNo || '-'}</td>
                      <td>${row.transmittalNo || 'N/A'}</td>
                      <td>${row.workDescription}</td>
                      <td class="right">${row.releaseQty} ${row.unit}</td>
                      <td class="right">${typeof row.releaseWeight === 'number' ? row.releaseWeight.toFixed(2) : '-'}</td>
                      <td>${row.status.replace(/_/g, ' ')}</td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const applyPastedReleaseRows = (text: string, insertIndex: number) => {
    if (!text) return false
    const rows = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (rows.length <= 1 && !rows[0]?.includes('\t')) return false

    const itemUnit = getSelectedJobOrderItem(formData.jobOrderItemId)?.unit || ''
    const nextEntries = rows
      .map((row) => row.split('\t').map((cell) => cell.trim()))
      .filter((cols) => cols.length > 0)
      .map((cols) => {
        const drawingNumber = cols[0] || ''
        const qty = cols[1] || ''
        const third = cols[2] || ''
        const transmittalNo = third && (!itemUnit || third.toLowerCase() !== itemUnit.toLowerCase())
          ? third
          : ''
        return {
          drawingNumber,
          transmittalNo,
          releaseQty: parseQtyNumber(qty)
        }
      })
      .filter((entry) => entry.drawingNumber || entry.transmittalNo || entry.releaseQty)

    if (nextEntries.length === 0) return false
    setReleaseLines((prev) => {
      const clampedIndex = Math.max(0, Math.min(insertIndex, prev.length - 1))
      const target = prev[clampedIndex]
      const targetEmpty = !target?.drawingNumber && !target?.transmittalNo && !target?.releaseQty
      const replacement = targetEmpty ? [nextEntries[0]] : []
      const remainder = targetEmpty ? nextEntries.slice(1) : nextEntries
      const before = prev.slice(0, clampedIndex)
      const after = prev.slice(clampedIndex + (targetEmpty ? 1 : 0))
      return [...before, ...replacement, ...remainder, ...after]
    })
    return true
  }

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.jobOrderItemId) {
      setError('Please fill in all required fields')
      return
    }

    const remainingQty = calculateRemainingQty(formData.jobOrderItemId)
    const lines = useMultipleDrawings
      ? releaseLines.filter(l => l.releaseQty > 0)
      : [{ drawingNumber: formData.drawingNumber, transmittalNo: formData.transmittalNo, releaseQty: formData.releaseQty }]

    if (lines.length === 0) {
      setError('Please add at least one drawing with quantity')
      return
    }

    const totalRequested = lines.reduce((sum, l) => sum + l.releaseQty, 0)
    if (totalRequested <= 0) {
      setError('Release quantity must be greater than zero')
      return
    }

    if (totalRequested > remainingQty) {
      setError(`Release quantity exceeds remaining quantity (${remainingQty})`)
      return
    }

    try {
      const res = await fetch('/api/production-releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          releaseQty: parseQtyNumber(formData.releaseQty.toString()),
          releaseItems: useMultipleDrawings ? lines : undefined,
          createdBy: session?.user?.email || session?.user?.name || 'System'
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create release')
      }

      setSuccess('Production release created successfully!')
      setShowCreateModal(false)
      setUseMultipleDrawings(false)
      setReleaseLines([{ drawingNumber: '', transmittalNo: '', releaseQty: 0 }])
      setFormData({
        jobOrderItemId: '',
        drawingNumber: '',
        transmittalNo: '',
        releaseQty: 0,
        itpTemplateId: '',
        productionStartDate: '',
        productionEndDate: '',
        actualCompletionDate: ''
      })
      fetchReleases()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create release')
    }
  }

  const handleEditRelease = (release: ProductionRelease) => {
    setEditingRelease(release)
    setEditFormData({
      id: release.id,
      jobOrderItemId: release.jobOrderItemId,
      drawingNumber: release.drawingNumber || '',
      transmittalNo: release.transmittalNo || '',
      releaseQty: release.releaseQty,
      itpTemplateId: release.itpTemplateId || '',
      productionStartDate: release.productionStartDate ? new Date(release.productionStartDate).toISOString().slice(0, 16) : '',
      productionEndDate: release.productionEndDate ? new Date(release.productionEndDate).toISOString().slice(0, 16) : '',
      actualCompletionDate: release.actualCompletionDate ? new Date(release.actualCompletionDate).toISOString().slice(0, 16) : ''
    })
    setShowEditModal(true)
  }

  const handleUpdateRelease = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editFormData.id || editFormData.releaseQty <= 0) {
      setError('Please provide a valid release quantity')
      return
    }

    const remainingQty = calculateRemainingQty(editFormData.jobOrderItemId)
    const currentReleaseQty = editingRelease?.releaseQty || 0
    const allowedQty = remainingQty + currentReleaseQty
    if (editFormData.releaseQty > allowedQty) {
      setError(`Release quantity exceeds remaining quantity (${allowedQty})`)
      return
    }

    try {
      const res = await fetch('/api/production-releases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          releaseQty: parseQtyNumber(editFormData.releaseQty.toString())
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update release')
      }

      setSuccess('Production release updated successfully!')
      setShowEditModal(false)
      setEditingRelease(null)
      fetchReleases()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update release')
    }
  }

  const handleDeleteRelease = async (releaseId: string) => {
    if (!confirm('Delete this production release?')) return

    try {
      const res = await fetch(`/api/production-releases?id=${releaseId}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete release')
      }

      setSuccess('Production release deleted successfully!')
      fetchReleases()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete release')
    }
  }

  const handlePushForInspection = async (releaseId: string) => {
    try {
      const res = await fetch('/api/production-releases/push-for-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionReleaseId: releaseId })
      })

      if (!res.ok) throw new Error('Failed to push for inspection')

      setSuccess('Pushed for inspection successfully!')
      fetchReleases()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to push for inspection')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PLANNING': 'bg-slate-100 text-slate-800',
      'IN_PRODUCTION': 'bg-blue-100 text-blue-800',
      'PENDING_INSPECTION': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REWORK': 'bg-red-100 text-red-800',
      'REJECTED': 'bg-red-200 text-red-900'
    }
    return colors[status] || 'bg-slate-100 text-slate-800'
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      'PLANNING': <Clock className="w-4 h-4" />,
      'IN_PRODUCTION': <Factory className="w-4 h-4" />,
      'PENDING_INSPECTION': <AlertCircle className="w-4 h-4" />,
      'APPROVED': <CheckCircle2 className="w-4 h-4" />,
      'REWORK': <Zap className="w-4 h-4" />,
      'REJECTED': <Trash2 className="w-4 h-4" />
    }
    return icons[status]
  }

  const formatDateTime = (value?: Date) => {
    if (!value) return 'N/A'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleString()
  }

  const formatQty = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })

  const selectedJob = jobOrders.find(jo => jo.id === selectedJobOrder)
  const reportRows = selectedJob
    ? releases
        .filter((release) => selectedJob.items?.some((item) => item.id === release.jobOrderItemId))
        .map((release) => {
          const item = selectedJob.items?.find((row) => row.id === release.jobOrderItemId)
          const drawingValue = release.drawingNumber || 'N/A'
          return {
            jobNumber: selectedJob.jobNumber,
            workDescription: item?.workDescription || 'N/A',
            drawingNumber: drawingValue,
            rffNo: getRffFromDrawing(drawingValue),
            transmittalNo: release.transmittalNo || 'N/A',
            releaseQty: release.releaseQty,
            unit: item?.unit || '',
            releaseWeight: release.releaseWeight,
            status: release.status,
            createdAt: release.createdAt
          }
        })
        .filter((row) => (reportStatus === 'ALL' ? true : row.status === reportStatus))
        .filter((row) =>
          reportTransmittal.trim()
            ? row.transmittalNo.toLowerCase().includes(reportTransmittal.trim().toLowerCase())
            : true
        )
        .filter((row) => {
          if (!reportDateFrom && !reportDateTo) return true
          const created = row.createdAt ? new Date(row.createdAt) : null
          if (!created) return false
          const from = reportDateFrom ? new Date(reportDateFrom) : null
          const to = reportDateTo ? new Date(reportDateTo) : null
          if (from && created < from) return false
          if (to) {
            const end = new Date(to)
            end.setHours(23, 59, 59, 999)
            if (created > end) return false
          }
          return true
        })
    : []

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Production Management</h1>
              <p className="text-slate-600 text-sm mt-1">L3: Work Packages & Production Releases</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 h-11"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Release
          </Button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Workflow Handoff */}
        <Card className="shadow-md bg-gradient-to-r from-slate-50 to-white">
          <CardHeader className="pb-2">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
                  <Factory className="w-5 h-5 text-primary-600" />
                  Department Workflow
                </CardTitle>
                <CardDescription className="text-slate-600 text-sm">
                  Keep Production, Quality & Store Aligned
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="bg-blue-50 border border-blue-200 px-2 py-1 rounded-md text-xs h-16 w-28 flex flex-col justify-center">
                  <div className="text-blue-700 text-[10px]">Total Releases</div>
                  <div className="text-blue-900 font-semibold">{totalReleases}</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 px-2 py-1 rounded-md text-xs h-16 w-28 flex flex-col justify-center">
                  <div className="text-amber-700 text-[10px]">Pending Inspection</div>
                  <div className="text-amber-900 font-semibold">{pendingInspectionCount}</div>
                </div>
                <div className="bg-rose-50 border border-rose-200 px-2 py-1 rounded-md text-xs h-16 w-28 flex flex-col justify-center">
                  <div className="text-rose-700 text-[10px]">Rework</div>
                  <div className="text-rose-900 font-semibold">{reworkCount}</div>
                </div>
                <div className="flex flex-col gap-0 items-stretch">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/quality-inspection')}
                    className="border-primary-200 text-primary-700 hover:bg-primary-50 h-8 text-xs rounded-b-none"
                  >
                    Go to Quality Inspection
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
          </CardHeader>
        </Card>

        {/* Release Report */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Release Report
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs">
              View, filter, and print released drawings for the selected job order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!selectedJob && (
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
                Select a job order to view release details.
              </div>
            )}
            {selectedJob && (
              <>
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-900">Status</Label>
                    <select
                      value={reportStatus}
                      onChange={(e) => setReportStatus(e.target.value)}
                      className="w-full mt-1 h-8 px-2 border border-slate-300 rounded-md text-xs"
                    >
                      <option value="ALL">All</option>
                      <option value="PLANNING">Planning</option>
                      <option value="IN_PRODUCTION">In Production</option>
                      <option value="PENDING_INSPECTION">Pending Inspection</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REWORK">Rework</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-900">Transmittal</Label>
                    <Input
                      value={reportTransmittal}
                      onChange={(e) => setReportTransmittal(e.target.value)}
                      placeholder="TR-001"
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-900">Date From</Label>
                    <Input
                      type="date"
                      value={reportDateFrom}
                      onChange={(e) => setReportDateFrom(e.target.value)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-900">Date To</Label>
                    <Input
                      type="date"
                      value={reportDateTo}
                      onChange={(e) => setReportDateTo(e.target.value)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>{reportRows.length} releases</span>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 h-7 px-2 text-[11px]"
                    onClick={() => printReleaseReport(reportRows)}
                  >
                    Print Report
                  </Button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-8 gap-1 bg-slate-50 text-[11px] font-semibold text-slate-600 px-2 py-0.5">
                    <div>Timestamp</div>
                    <div>Drawing</div>
                    <div>RFF</div>
                    <div>Transmittal</div>
                    <div className="col-span-2">Item</div>
                    <div className="text-right">Qty</div>
                    <div className="text-right">Weight</div>
                    <div>Status</div>
                  </div>
                  <div className="divide-y">
                    {reportRows.map((row, idx) => (
                      <div key={`${row.drawingNumber}-${idx}`} className="grid grid-cols-8 gap-1 px-2 py-0.5 text-[11px] text-slate-700">
                        <div>{formatDateTime(row.createdAt)}</div>
                        <div className="truncate" title={row.drawingNumber}>{row.drawingNumber}</div>
                        <div className="truncate" title={row.rffNo}>{row.rffNo || '-'}</div>
                        <div className="truncate" title={row.transmittalNo}>{row.transmittalNo}</div>
                        <div className="col-span-2 truncate" title={row.workDescription}>{row.workDescription}</div>
                        <div className="text-right">{row.releaseQty} {row.unit}</div>
                        <div className="text-right">{typeof row.releaseWeight === 'number' ? row.releaseWeight.toFixed(2) : '-'}</div>
                        <div>{row.status.replace(/_/g, ' ')}</div>
                      </div>
                    ))}
                    {reportRows.length === 0 && (
                      <div className="px-2 py-2 text-[11px] text-slate-500">No releases match the selected filters.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Job Order Selection */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Select Job Order
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <select
              value={selectedJobOrder}
              onChange={(e) => setSelectedJobOrder(e.target.value)}
              className="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">-- Select a Job Order --</option>
              {jobOrders.map(jo => (
                <option key={jo.id} value={jo.id}>
                  {jo.jobNumber} - {jo.clientName || 'N/A'}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Notifications */}
        {success && (
          <div className="bg-green-900 border border-green-700 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <p className="text-green-100">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-100">{error}</p>
          </div>
        )}

        {/* Job Order Items & Releases */}
        {selectedJob && (
          <div className="space-y-2">
            {selectedJob.items?.map(item => {
              const remainingQty = calculateRemainingQty(item.id)
              const itemReleases = releases.filter(r => r.jobOrderItemId === item.id)
              const totalQty = item.quantity || 0
              const sortedReleases = [...itemReleases].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
              let runningReleased = 0
              const balanceByReleaseId = new Map<string, number>()
              sortedReleases.forEach((release) => {
                runningReleased += release.releaseQty
                balanceByReleaseId.set(release.id, totalQty - runningReleased)
              })

              return (
                <Card key={item.id} className="shadow-sm border border-slate-200">
                  <CardHeader className="px-3 py-2 bg-white border-b border-slate-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-slate-900 text-sm truncate">{item.workDescription}</CardTitle>
                        <CardDescription className="text-slate-500 text-[11px] mt-0.5">
                          Order Qty: <span className="font-semibold">{formatQty(item.quantity || 0)} {item.unit}</span>
                          {item.unitWeight && ` • Unit Wt: ${formatQty(item.unitWeight)} kg`}
                        </CardDescription>
                      </div>
                      <div className="text-right bg-slate-50 rounded-md px-2 py-1 border border-slate-200">
                        <div className="text-sm font-semibold text-slate-900">{formatQty(remainingQty)} {item.unit}</div>
                        <div className="text-[10px] text-slate-500 font-medium">Remaining</div>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Releases for this item */}
                  {sortedReleases.length > 0 ? (
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {sortedReleases.map(release => {
                          const balanceQty = balanceByReleaseId.get(release.id) ?? remainingQty
                          return (
                            <div key={release.id} className="px-3 py-2 flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(release.status)}
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusColor(release.status)}`}>
                                    {release.status.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-[11px] text-slate-500">{formatDateTime(release.createdAt)}</span>
                                  <span className="text-[11px] text-slate-500">{release.createdBy || 'System'}</span>
                                </div>
                                <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                  <span>Drawing: {release.drawingNumber || 'N/A'}</span>
                                  {release.transmittalNo && <span>Transmittal: {release.transmittalNo}</span>}
                                  <span>Qty: {formatQty(release.releaseQty)} {item.unit}</span>
                                  <span>Balance: {formatQty(balanceQty)} {item.unit}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {release.status === 'IN_PRODUCTION' || release.status === 'PLANNING' ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handlePushForInspection(release.id)}
                                    className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    Push
                                  </Button>
                                ) : release.status === 'REWORK' ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handlePushForInspection(release.id)}
                                    className="h-7 px-2 text-[11px] bg-orange-600 hover:bg-orange-700 text-white"
                                  >
                                    Re-inspect
                                  </Button>
                                ) : null}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[11px]"
                                  onClick={() => handleEditRelease(release)}
                                  disabled={!!release.inspections && release.inspections.length > 0}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteRelease(release.id)}
                                  disabled={!!release.inspections && release.inspections.length > 0}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="px-3 py-2">
                      <p className="text-[11px] text-slate-500 italic">No releases yet</p>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Create Release Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
            <Card className="w-full max-w-lg bg-white border-slate-200 max-h-[85vh] overflow-y-auto">
              <CardHeader className="pb-2 border-b border-slate-200">
                <CardTitle className="text-base font-semibold text-slate-900">Create Production Release</CardTitle>
                <CardDescription className="text-slate-600 mt-0.5 text-xs">Add a new release for the selected item</CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <form onSubmit={handleCreateRelease} className="space-y-3">
                  {/* Job Order Item Selection */}
                  <div>
                    <Label className="text-slate-900 text-xs font-semibold">Item *</Label>
                    <select
                      value={formData.jobOrderItemId}
                      onChange={(e) => setFormData({ ...formData, jobOrderItemId: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">-- Select Item --</option>
                      {selectedJob?.items?.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.workDescription} (Remaining: {calculateRemainingQty(item.id)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useMultipleDrawings}
                      onChange={(e) => setUseMultipleDrawings(e.target.checked)}
                    />
                    <span className="text-xs text-slate-700">Multiple drawings in one release</span>
                  </div>

                  {useMultipleDrawings ? (
                    <div className="space-y-2">
                      {releaseLines.map((line, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-2">
                          <div className="col-span-2">
                            <Label className="text-slate-900 text-xs font-semibold">Drawing Number</Label>
                            <Input
                              value={line.drawingNumber}
                              onChange={(e) => {
                                const next = [...releaseLines]
                                next[idx] = { ...next[idx], drawingNumber: e.target.value }
                                setReleaseLines(next)
                              }}
                              onPaste={(e) => {
                                const text = e.clipboardData.getData('text')
                                if (applyPastedReleaseRows(text, idx)) {
                                  e.preventDefault()
                                }
                              }}
                              placeholder="DRW-001"
                              className="bg-white border-slate-300 text-slate-900 focus:ring-primary-500 focus:border-transparent"
                            />
                            {idx === 0 && (
                              <p className="text-[11px] text-slate-500 mt-1">
                                Paste rows here (Drawing, Qty, optional Transmittal).
                              </p>
                            )}
                          </div>
                          <div>
                            <Label className="text-slate-900 text-xs font-semibold">Transmittal</Label>
                            <Input
                              value={line.transmittalNo}
                              onChange={(e) => {
                                const next = [...releaseLines]
                                next[idx] = { ...next[idx], transmittalNo: e.target.value }
                                setReleaseLines(next)
                              }}
                              placeholder="TR-001"
                              className="bg-white border-slate-300 text-slate-900 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-900 text-xs font-semibold">Qty *</Label>
                            <Input
                              type="number"
                              value={line.releaseQty}
                              onChange={(e) => {
                                const next = [...releaseLines]
                                next[idx] = { ...next[idx], releaseQty: parseQtyNumber(e.target.value) }
                                setReleaseLines(next)
                              }}
                              placeholder="0"
                              className="bg-white border-slate-300 text-slate-900 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-slate-300 text-slate-700 hover:bg-slate-50"
                          onClick={() => setReleaseLines([...releaseLines, { drawingNumber: '', transmittalNo: '', releaseQty: 0 }])}
                        >
                          Add Drawing
                        </Button>
                        {releaseLines.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => setReleaseLines(releaseLines.slice(0, -1))}
                          >
                            Remove Last
                          </Button>
                        )}
                      </div>
                      {buildReleaseLinesSummary(releaseLines) && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-2">
                          <span className="font-semibold text-slate-700">Summary:</span>{' '}
                          {buildReleaseLinesSummary(releaseLines)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Drawing Number */}
                      <div>
                        <Label className="text-slate-900 text-xs font-semibold">Drawing Number</Label>
                        <Input
                          value={formData.drawingNumber}
                          onChange={(e) => setFormData({ ...formData, drawingNumber: e.target.value })}
                          placeholder="DRW-001"
                          className="bg-white border-slate-300 text-slate-900 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-900 text-xs font-semibold">Transmittal No.</Label>
                        <Input
                          value={formData.transmittalNo}
                          onChange={(e) => setFormData({ ...formData, transmittalNo: e.target.value })}
                          placeholder="TR-001"
                          className="bg-white border-slate-300 text-slate-900 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      {/* Release Quantity */}
                      <div>
                        <Label className="text-slate-900 text-xs font-semibold">Release Quantity *</Label>
                        <Input
                          type="number"
                          value={formData.releaseQty}
                          onChange={(e) => setFormData({ ...formData, releaseQty: parseQtyNumber(e.target.value) })}
                          placeholder="0"
                          className="bg-white border-slate-300 text-slate-900 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}

                  {/* ITP Template */}
                  <div>
                    <Label className="text-slate-900 text-xs font-semibold">ITP Template</Label>
                    <select
                      value={formData.itpTemplateId}
                      onChange={(e) => setFormData({ ...formData, itpTemplateId: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">-- Select Template --</option>
                      {itpTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Production Start Date */}
                  <div>
                    <Label className="text-slate-900 text-xs font-semibold">Production Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={formData.productionStartDate}
                      onChange={(e) => setFormData({ ...formData, productionStartDate: e.target.value })}
                      className="bg-white border-slate-300 text-slate-900 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Production End Date (Expected) */}
                  <div>
                    <Label className="text-slate-900 text-xs font-semibold">Expected End Date</Label>
                    <Input
                      type="datetime-local"
                      value={formData.productionEndDate}
                      onChange={(e) => setFormData({ ...formData, productionEndDate: e.target.value })}
                      className="bg-white border-slate-300 text-slate-900 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Actual Completion Date */}
                  <div>
                    <Label className="text-slate-900 text-xs font-semibold">Actual Completion Date</Label>
                    <Input
                      type="datetime-local"
                      value={formData.actualCompletionDate}
                      onChange={(e) => setFormData({ ...formData, actualCompletionDate: e.target.value })}
                      className="bg-white border-slate-300 text-slate-900 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium"
                    >
                      Create Release
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      variant="outline"
                      className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Release Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
            <Card className="w-full max-w-lg bg-white border-slate-200 max-h-[85vh] overflow-y-auto">
              <CardHeader className="pb-2 border-b border-slate-200">
                <CardTitle className="text-base font-semibold text-slate-900">Edit Production Release</CardTitle>
                <CardDescription className="text-slate-600 mt-0.5 text-xs">Update drawing and quantity</CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <form onSubmit={handleUpdateRelease} className="space-y-3">
                  <div>
                    <Label className="text-slate-900 text-xs font-semibold">Drawing Number</Label>
                    <Input
                      value={editFormData.drawingNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, drawingNumber: e.target.value })}
                      placeholder="DRW-001"
                      className="bg-white border-slate-300 text-slate-900 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-900 text-xs font-semibold">Transmittal No.</Label>
                    <Input
                      value={editFormData.transmittalNo}
                      onChange={(e) => setEditFormData({ ...editFormData, transmittalNo: e.target.value })}
                      placeholder="TR-001"
                      className="bg-white border-slate-300 text-slate-900 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-900 text-xs font-semibold">Release Quantity *</Label>
                    <Input
                      type="number"
                      value={editFormData.releaseQty}
                      onChange={(e) => setEditFormData({ ...editFormData, releaseQty: parseQtyNumber(e.target.value) })}
                      placeholder="0"
                      className="bg-white border-slate-300 text-slate-900 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-900 text-xs font-semibold">ITP Template</Label>
                    <select
                      value={editFormData.itpTemplateId}
                      onChange={(e) => setEditFormData({ ...editFormData, itpTemplateId: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">-- Select Template --</option>
                      {itpTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium"
                    >
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false)
                        setEditingRelease(null)
                      }}
                      variant="outline"
                      className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
