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

export default function QualityInspectionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [templates, setTemplates] = useState<ITPTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)

  // Create inspection form
  const [createForm, setCreateForm] = useState({
    jobOrderItemId: '',
    itpTemplateId: '',
    isCritical: false,
  })

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    steps: '',
    isDefault: false,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchInspections()
      fetchTemplates()
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

  const createInspection = async () => {
    try {
      const res = await fetch('/api/quality-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        setCreateForm({ jobOrderItemId: '', itpTemplateId: '', isCritical: false })
        fetchInspections()
      }
    } catch (error) {
      console.error('Error creating inspection:', error)
    }
  }

  const createTemplate = async () => {
    try {
      const steps = templateForm.steps.split('\n').filter(s => s.trim())
      const res = await fetch('/api/quality-inspection/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...templateForm, steps }),
      })
      if (res.ok) {
        setShowTemplateDialog(false)
        setTemplateForm({ name: '', steps: '', isDefault: false })
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  const updateStepStatus = async (stepId: string, status: string, remarks?: string) => {
    try {
      const res = await fetch(`/api/quality-inspection/steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks }),
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
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
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
                  <Button onClick={createTemplate} className="w-full">Create Template</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Inspection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Quality Inspection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Job Order Item ID</Label>
                    <Input
                      value={createForm.jobOrderItemId}
                      onChange={(e) => setCreateForm({ ...createForm, jobOrderItemId: e.target.value })}
                      placeholder="Enter job order item ID"
                    />
                  </div>
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
                  <Button onClick={createInspection} className="w-full">Create Inspection</Button>
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
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedInspection(inspection)}
            >
              <div className="p-6">
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedInspection && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Quality Inspection Details</span>
                    {getStatusBadge(selectedInspection.status)}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Job Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Job Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Job Number:</span>
                        <p className="font-medium">{selectedInspection.jobOrderItem.jobOrder.jobNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Client:</span>
                        <p className="font-medium">{selectedInspection.jobOrderItem.jobOrder.clientName}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Work Description:</span>
                        <p className="font-medium">{selectedInspection.jobOrderItem.workDescription}</p>
                      </div>
                    </div>
                  </div>

                  {/* Inspection Steps */}
                  <div>
                    <h4 className="font-semibold mb-4">Inspection Steps</h4>
                    <div className="space-y-3">
                      {selectedInspection.steps.map((step, index) => (
                        <div key={step.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Step {index + 1}: {step.stepName}</span>
                              {getStatusBadge(step.status)}
                            </div>
                          </div>
                          
                          {step.remarks && (
                            <p className="text-sm text-gray-600 mb-2">{step.remarks}</p>
                          )}
                          
                          {step.inspectedBy && (
                            <p className="text-xs text-gray-500">
                              Inspected by {step.inspectedBy} on {new Date(step.inspectedAt!).toLocaleString()}
                            </p>
                          )}

                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => updateStepStatus(step.id, 'APPROVED')}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => updateStepStatus(step.id, 'FAILED')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Fail
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-yellow-600"
                              onClick={() => updateStepStatus(step.id, 'HOLD')}
                            >
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Hold
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
