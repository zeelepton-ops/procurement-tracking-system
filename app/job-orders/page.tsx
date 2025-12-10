'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Package, X } from 'lucide-react'

interface JobOrder {
  id: string
  jobNumber: string
  productName: string
  drawingRef: string | null
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
    drawingRef: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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
      setFormData({ jobNumber: '', productName: '', drawingRef: '' })
      setShowForm(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Job Orders</h1>
            <p className="text-slate-600">Manage production job orders</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {showForm ? (
              <>
                <X className="h-5 w-5 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                New Job Order
              </>
            )}
          </Button>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="mb-8 border-blue-200 shadow-lg">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-900">Create New Job Order</CardTitle>
              <CardDescription>Enter the details for the new job order</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jobNumber">Job Number *</Label>
                    <Input
                      id="jobNumber"
                      value={formData.jobNumber}
                      onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                      placeholder="e.g., JO-2024-001"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      placeholder="e.g., Steel Beam Assembly"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="drawingRef">Drawing Reference (Optional)</Label>
                  <Input
                    id="drawingRef"
                    value={formData.drawingRef}
                    onChange={(e) => setFormData({ ...formData, drawingRef: e.target.value })}
                    placeholder="e.g., DWG-2024-A-001"
                    className="mt-1"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? 'Creating...' : 'Create Job Order'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false)
                      setError('')
                      setFormData({ jobNumber: '', productName: '', drawingRef: '' })
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
        <div className="grid grid-cols-1 gap-4">
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
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{order.jobNumber}</CardTitle>
                        <CardDescription className="text-base mt-1">
                          {order.productName}
                        </CardDescription>
                      </div>
                    </div>
                    {order._count && (
                      <div className="text-right">
                        <div className="text-sm text-slate-500">Material Requests</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {order._count.materialRequests}
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {order.drawingRef && (
                      <div>
                        <span className="text-slate-500">Drawing Ref:</span>
                        <span className="ml-2 font-medium">{order.drawingRef}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">Created:</span>
                      <span className="ml-2 font-medium">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
