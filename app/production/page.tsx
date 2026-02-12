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
  const [releaseLines, setReleaseLines] = useState<Array<{ drawingNumber: string; releaseQty: number }>>([
    { drawingNumber: '', releaseQty: 0 }
  ])

  const [formData, setFormData] = useState({
    jobOrderItemId: '',
    drawingNumber: '',
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

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.jobOrderItemId) {
      setError('Please fill in all required fields')
      return
    }

    const remainingQty = calculateRemainingQty(formData.jobOrderItemId)
    const lines = useMultipleDrawings
      ? releaseLines.filter(l => l.releaseQty > 0)
      : [{ drawingNumber: formData.drawingNumber, releaseQty: formData.releaseQty }]

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
          releaseQty: parseFloat(formData.releaseQty.toString()),
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
      setReleaseLines([{ drawingNumber: '', releaseQty: 0 }])
      setFormData({
        jobOrderItemId: '',
        drawingNumber: '',
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
          releaseQty: parseFloat(editFormData.releaseQty.toString())
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

  const selectedJob = jobOrders.find(jo => jo.id === selectedJobOrder)

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
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
              <Factory className="w-5 h-5 text-primary-600" />
              Department Workflow
            </CardTitle>
            <CardDescription className="text-slate-600 text-sm">
              Keep production, quality, and store aligned
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="bg-slate-50 border border-slate-200 px-3 py-2">
                <div className="text-slate-500 text-xs">Total Releases</div>
                <div className="text-slate-900 font-semibold">{totalReleases}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-3 py-2">
                <div className="text-slate-500 text-xs">Pending Inspection</div>
                <div className="text-slate-900 font-semibold">{pendingInspectionCount}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-3 py-2">
                <div className="text-slate-500 text-xs">Rework</div>
                <div className="text-slate-900 font-semibold">{reworkCount}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/quality-inspection')}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Go to Quality Inspection
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/store/delivery-notes')}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Go to Delivery Notes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Job Order Selection */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Select Job Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedJobOrder}
              onChange={(e) => setSelectedJobOrder(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
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
          <div className="space-y-4">
            {selectedJob.items?.map(item => {
              const remainingQty = calculateRemainingQty(item.id)
              const itemReleases = releases.filter(r => r.jobOrderItemId === item.id)
              const totalQty = item.quantity || 0
              const sortedReleases = [...itemReleases].sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              )
              let runningReleased = 0
              const balanceByReleaseId = new Map<string, number>()
              sortedReleases.forEach((release) => {
                runningReleased += release.releaseQty
                balanceByReleaseId.set(release.id, totalQty - runningReleased)
              })

              return (
                <Card key={item.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3 bg-gradient-to-r from-primary-50 to-transparent border-b border-slate-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-slate-900 text-lg">{item.workDescription}</CardTitle>
                        <CardDescription className="text-slate-600 text-sm mt-1">
                          Order Qty: <span className="font-semibold">{item.quantity} {item.unit}</span>
                          {item.unitWeight && ` • Unit Wt: ${item.unitWeight} kg`}
                        </CardDescription>
                      </div>
                      <div className="text-right bg-primary-100 rounded-lg px-3 py-2">
                        <div className="text-2xl font-bold text-primary-700">{remainingQty}</div>
                        <div className="text-primary-600 text-xs font-medium">Remaining</div>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Releases for this item */}
                  {sortedReleases.length > 0 ? (
                    <CardContent className="space-y-3 pt-4">
                      {sortedReleases.map(release => {
                        const balanceQty = balanceByReleaseId.get(release.id) ?? remainingQty
                        return (
                        <div key={release.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-primary-300 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(release.status)}
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(release.status)}`}>
                                {release.status.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-slate-500">Released {formatDateTime(release.createdAt)}</span>
                              <span className="text-xs text-slate-500">By {release.createdBy || 'System'}</span>
                            </div>
                            <div className="text-sm font-medium text-slate-700">
                              Release: <span className="text-primary-700">{release.releaseQty} {item.unit}</span>
                              {release.releaseWeight && ` • Wt: ${release.releaseWeight.toFixed(2)} kg`}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-slate-700 mb-3">
                            <div>
                              <span className="font-semibold">Drawing:</span> {release.drawingNumber || 'N/A'}
                            </div>
                            <div>
                              <span className="font-semibold">Transmittal:</span> N/A
                            </div>
                            <div>
                              <span className="font-semibold">Qty:</span> {release.releaseQty} {item.unit}
                              {release.releaseWeight && ` • ${release.releaseWeight.toFixed(2)} kg`}
                            </div>
                            <div>
                              <span className="font-semibold">Balance:</span> {balanceQty} {item.unit}
                              {item.unitWeight && ` • ${(balanceQty * item.unitWeight).toFixed(2)} kg`}
                            </div>
                          </div>

                          {/* Latest Inspection Info */}
                          {release.inspections && release.inspections.length > 0 && (
                            <div className="bg-primary-50 rounded p-3 text-xs text-slate-700 border border-primary-200 mb-3">
                              <div className="font-semibold mb-2 text-slate-900">Latest Inspection:</div>
                              <div>Result: <span className="font-medium">{release.inspections[0].result || 'Pending'}</span></div>
                              {release.inspections[0].remarks && (
                                <div className="text-slate-700 mt-2">Remarks: {release.inspections[0].remarks}</div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2">
                            {release.status === 'IN_PRODUCTION' || release.status === 'PLANNING' ? (
                              <Button
                                onClick={() => handlePushForInspection(release.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
                              >
                                Push for Inspection
                              </Button>
                            ) : release.status === 'REWORK' ? (
                              <Button
                                onClick={() => handlePushForInspection(release.id)}
                                className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium"
                              >
                                Re-inspect ({release.inspectionCount} attempts)
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              className="border-slate-300 text-slate-700 hover:bg-slate-50"
                              onClick={() => handleEditRelease(release)}
                              disabled={!!release.inspections && release.inspections.length > 0}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteRelease(release.id)}
                              disabled={!!release.inspections && release.inspections.length > 0}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )})}
                    </CardContent>
                  ) : (
                    <CardContent>
                      <p className="text-slate-500 text-sm italic">No releases yet</p>
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
            <Card className="w-full max-w-xs bg-white border-slate-200 max-h-[85vh] overflow-y-auto">
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
                        <div key={idx} className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <Label className="text-slate-900 text-xs font-semibold">Drawing Number</Label>
                            <Input
                              value={line.drawingNumber}
                              onChange={(e) => {
                                const next = [...releaseLines]
                                next[idx] = { ...next[idx], drawingNumber: e.target.value }
                                setReleaseLines(next)
                              }}
                              placeholder="DRW-001"
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
                                next[idx] = { ...next[idx], releaseQty: parseFloat(e.target.value) || 0 }
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
                          onClick={() => setReleaseLines([...releaseLines, { drawingNumber: '', releaseQty: 0 }])}
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

                      {/* Release Quantity */}
                      <div>
                        <Label className="text-slate-900 text-xs font-semibold">Release Quantity *</Label>
                        <Input
                          type="number"
                          value={formData.releaseQty}
                          onChange={(e) => setFormData({ ...formData, releaseQty: parseFloat(e.target.value) || 0 })}
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
            <Card className="w-full max-w-xs bg-white border-slate-200 max-h-[85vh] overflow-y-auto">
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
                    <Label className="text-slate-900 text-xs font-semibold">Release Quantity *</Label>
                    <Input
                      type="number"
                      value={editFormData.releaseQty}
                      onChange={(e) => setEditFormData({ ...editFormData, releaseQty: parseFloat(e.target.value) || 0 })}
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
