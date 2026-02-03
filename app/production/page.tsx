'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [releases, setReleases] = useState<ProductionRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobOrder, setSelectedJobOrder] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [itpTemplates, setItpTemplates] = useState<ITPTemplate[]>([])
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    jobOrderItemId: '',
    drawingNumber: '',
    releaseQty: 0,
    itpTemplateId: '',
    productionStartDate: ''
  })

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
    
    if (!formData.jobOrderItemId || formData.releaseQty <= 0) {
      setError('Please fill in all required fields')
      return
    }

    const remainingQty = calculateRemainingQty(formData.jobOrderItemId)
    if (formData.releaseQty > remainingQty) {
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
          createdBy: 'Current User' // TODO: Get from session
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create release')
      }

      setSuccess('Production release created successfully!')
      setShowCreateModal(false)
      setFormData({
        jobOrderItemId: '',
        drawingNumber: '',
        releaseQty: 0,
        itpTemplateId: '',
        productionStartDate: ''
      })
      fetchReleases()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create release')
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

  const selectedJob = jobOrders.find(jo => jo.id === selectedJobOrder)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Factory className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Production Management</h1>
              <p className="text-slate-400 text-sm mt-1">L3: Work Packages & Production Releases</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Release
          </Button>
        </div>

        {/* Job Order Selection */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Select Job Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedJobOrder}
              onChange={(e) => setSelectedJobOrder(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              return (
                <Card key={item.id} className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">{item.workDescription}</CardTitle>
                        <CardDescription className="text-slate-400 text-sm mt-1">
                          Order Qty: {item.quantity} {item.unit} 
                          {item.unitWeight && ` • Unit Wt: ${item.unitWeight} kg`}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-400">{remainingQty}</div>
                        <div className="text-slate-400 text-xs">Remaining</div>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Releases for this item */}
                  {itemReleases.length > 0 ? (
                    <CardContent className="space-y-2">
                      {itemReleases.map(release => (
                        <div key={release.id} className="bg-slate-700 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(release.status)}
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(release.status)}`}>
                                {release.status}
                              </span>
                            </div>
                            <div className="text-sm text-slate-300">
                              Release: {release.releaseQty} {item.unit}
                              {release.releaseWeight && ` • Wt: ${release.releaseWeight.toFixed(2)} kg`}
                            </div>
                          </div>

                          {/* Latest Inspection Info */}
                          {release.inspections && release.inspections.length > 0 && (
                            <div className="bg-slate-600 rounded p-2 text-xs text-slate-200">
                              <div className="font-semibold mb-1">Latest Inspection:</div>
                              <div>Result: {release.inspections[0].result || 'Pending'}</div>
                              {release.inspections[0].remarks && (
                                <div className="text-yellow-300 mt-1">Remarks: {release.inspections[0].remarks}</div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          {release.status === 'IN_PRODUCTION' || release.status === 'PLANNING' ? (
                            <Button
                              onClick={() => handlePushForInspection(release.id)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
                            >
                              Push for Inspection
                            </Button>
                          ) : release.status === 'REWORK' ? (
                            <Button
                              onClick={() => handlePushForInspection(release.id)}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm"
                            >
                              Re-inspect ({release.inspectionCount} attempts)
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </CardContent>
                  ) : (
                    <CardContent>
                      <p className="text-slate-400 text-sm italic">No releases yet</p>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Create Release Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Create Production Release</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRelease} className="space-y-4">
                  {/* Job Order Item Selection */}
                  <div>
                    <Label className="text-slate-200 text-sm">Item *</Label>
                    <select
                      value={formData.jobOrderItemId}
                      onChange={(e) => setFormData({ ...formData, jobOrderItemId: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Item --</option>
                      {selectedJob?.items?.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.workDescription} (Remaining: {calculateRemainingQty(item.id)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Drawing Number */}
                  <div>
                    <Label className="text-slate-200 text-sm">Drawing Number</Label>
                    <Input
                      value={formData.drawingNumber}
                      onChange={(e) => setFormData({ ...formData, drawingNumber: e.target.value })}
                      placeholder="DRW-001"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  {/* Release Quantity */}
                  <div>
                    <Label className="text-slate-200 text-sm">Release Quantity *</Label>
                    <Input
                      type="number"
                      value={formData.releaseQty}
                      onChange={(e) => setFormData({ ...formData, releaseQty: parseFloat(e.target.value) })}
                      placeholder="0"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  {/* ITP Template */}
                  <div>
                    <Label className="text-slate-200 text-sm">ITP Template</Label>
                    <select
                      value={formData.itpTemplateId}
                      onChange={(e) => setFormData({ ...formData, itpTemplateId: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <Label className="text-slate-200 text-sm">Production Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={formData.productionStartDate}
                      onChange={(e) => setFormData({ ...formData, productionStartDate: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Create
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      variant="outline"
                      className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
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
