'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Package, X, Trash2, Edit } from 'lucide-react'


interface JobOrder {
  id: string
  jobNumber: string
  productName: string
  drawingRef: string | null
  clientId?: string | null
  clientName: string | null
  contactPerson: string | null
  phone: string | null
  clientContactPerson: string | null
  clientContactPhone: string | null
  lpoContractNo: string | null
  lpoIssueDate: string | null
  priority: string | null
  foreman: string | null
  workScope: string | null
  scopeOfWorks?: string | string[] | null
  qaQcInCharge: string | null
  createdAt: string
  lastEditedBy: string | null
  lastEditedAt: string | null
  isDeleted?: boolean
  deletedAt?: string | null
  deletedBy?: string | null
  items?: JobOrderItem[]
  discount?: number
  roundOff?: number
  _count?: {
    materialRequests: number
  }
}

interface JobOrderItem {
  id?: string
  workDescription: string
  quantity: number | null
  unit: string
  unitPrice: number | null
  totalPrice: number | null
}

const SCOPE_OF_WORKS_OPTIONS = [
  'Profiling/Cutting',
  'Plate Rolling & Bending',
  'Section Bending',
  'Drilling & Machining',
  'Storage Tanks & Silos',
  'Pressure Vessels',
  'Pipe Spools',
  'Material Handling Eqpt.',
  'Primary Structure',
  'Secondary Steel',
  'Pipe Supports',
  'Abrasive Blasting',
  'Industrial Coating',
  'Lining Services',
  'Galvanizing',
  'Erection & Installation',
  'Maintenance',
  'NDT Testing'
]

export default function JobOrdersPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [deletedJobOrders, setDeletedJobOrders] = useState<JobOrder[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    priority: 'ALL'
  })
  // pagination
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [totalCount, setTotalCount] = useState(0)

  const [selectedJob, setSelectedJob] = useState<JobOrder | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [draft, setDraft] = useState<any>(null)
  const [formData, setFormData] = useState({
    jobNumber: '',
    productName: '',
    drawingRef: '',
    clientId: '',
    clientName: '',
    contactPerson: '',
    phone: '+974 ',
    clientContactPerson: '',
    clientContactPhone: '+974 ',
    lpoContractNo: '',
    lpoIssueDate: '',
    priority: 'MEDIUM',
    foreman: '',
    workScope: '',
    scopeOfWorks: [] as string[],
    qaQcInCharge: '',
    discount: 0,
    roundOff: 0
  })
  const [workItems, setWorkItems] = useState<JobOrderItem[]>([
    { workDescription: '', quantity: 0, unit: 'Nos', unitPrice: 0, totalPrice: 0 }
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showNewClientInput, setShowNewClientInput] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [creatingClient, setCreatingClient] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)
  const [editClientSearchQuery, setEditClientSearchQuery] = useState('')
  const [showEditClientSuggestions, setShowEditClientSuggestions] = useState(false)
  const [finalTotalOverride, setFinalTotalOverride] = useState<number | null>(null)
  const [editFinalTotalOverride, setEditFinalTotalOverride] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingJob, setEditingJob] = useState<JobOrder | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    jobNumber: '',
    productName: '',
    drawingRef: '',
    clientId: '',
    clientName: '',
    contactPerson: '',
    phone: '+974 ',
    clientContactPerson: '',
    clientContactPhone: '+974 ',
    lpoContractNo: '',
    lpoIssueDate: '',
    priority: 'MEDIUM',
    foreman: '',
    workScope: '',
    scopeOfWorks: [] as string[],
    qaQcInCharge: '',
    discount: 0,
    roundOff: 0
  })
  const [editWorkItems, setEditWorkItems] = useState<JobOrderItem[]>([
    { workDescription: '', quantity: 0, unit: 'Nos', unitPrice: 0, totalPrice: 0 }
  ])

  useEffect(() => {
    fetchJobOrders()
    fetchDeletedJobOrders()
    fetchClients()
    // restore draft if exists
    try {
      const raw = localStorage.getItem('jobOrderDraft')
      if (raw) setDraft(JSON.parse(raw))
    } catch (e) {
      // ignore
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !((e.target as HTMLElement).isContentEditable)) {
          setShowForm(true)
          setTimeout(() => {
            const el = document.getElementById('jobNumber') as HTMLInputElement | null
            if (el) el.focus()
          }, 120)
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    // refetch when filters or pagination change
    fetchJobOrders()
  }, [filters, page, perPage])

  // Debounce search input to avoid blocking typing
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm }))
    }, 500)
    return () => window.clearTimeout(timer)
  }, [searchTerm])

  // Autosave draft locally
  useEffect(() => {
    try {
      const t = window.setTimeout(() => {
        localStorage.setItem('jobOrderDraft', JSON.stringify(formData))
      }, 700)
      return () => window.clearTimeout(t)
    } catch (e) {
      // ignore
    }
  }, [formData, workItems])

  // server-side filtered/paginated orders
  const filteredOrders = jobOrders

  const recentJobOrders = [...jobOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const recentForemen = Array.from(
    new Set(recentJobOrders.map((o) => o.foreman).filter(Boolean) as string[])
  )

  const recentQaQc = Array.from(
    new Set(recentJobOrders.map((o) => o.qaQcInCharge).filter(Boolean) as string[])
  )

  const recentContacts = (() => {
    const map = new Map<string, string>()
    recentJobOrders.forEach((o) => {
      if (o.contactPerson) {
        if (!map.has(o.contactPerson)) {
          map.set(o.contactPerson, o.phone || '')
        }
      }
    })
    return Array.from(map.entries()).map(([name, phone]) => ({ name, phone }))
  })()

  const foremanOptions = Array.from(
    new Set([formData.foreman, ...recentForemen].filter(Boolean) as string[])
  )

  const qaQcOptions = Array.from(
    new Set([formData.qaQcInCharge, ...recentQaQc].filter(Boolean) as string[])
  )

  const contactOptions = (() => {
    const map = new Map<string, string>()
    if (formData.contactPerson) {
      map.set(formData.contactPerson, formData.phone || '')
    }
    recentContacts.forEach((c) => {
      if (!map.has(c.name)) {
        map.set(c.name, c.phone)
      }
    })
    return Array.from(map.entries()).map(([name, phone]) => ({ name, phone }))
  })()

  const editForemanOptions = Array.from(
    new Set([editFormData.foreman, ...recentForemen].filter(Boolean) as string[])
  )

  const editQaQcOptions = Array.from(
    new Set([editFormData.qaQcInCharge, ...recentQaQc].filter(Boolean) as string[])
  )

  const editContactOptions = (() => {
    const map = new Map<string, string>()
    if (editFormData.contactPerson) {
      map.set(editFormData.contactPerson, editFormData.phone || '')
    }
    recentContacts.forEach((c) => {
      if (!map.has(c.name)) {
        map.set(c.name, c.phone)
      }
    })
    return Array.from(map.entries()).map(([name, phone]) => ({ name, phone }))
  })()

  useEffect(() => {
    if (!showForm) return
    setFormData((prev) => {
      let changed = false
      const next = { ...prev }

      if (!prev.foreman && recentForemen.length > 0) {
        next.foreman = recentForemen[0]
        changed = true
      }

      if (!prev.qaQcInCharge && recentQaQc.length > 0) {
        next.qaQcInCharge = recentQaQc[0]
        changed = true
      }

      if (!prev.contactPerson && recentContacts.length > 0) {
        next.contactPerson = recentContacts[0].name
        if (!prev.phone || prev.phone === '+974 ') {
          next.phone = recentContacts[0].phone || prev.phone
        }
        changed = true
      }

      return changed ? next : prev
    })
  }, [showForm, recentForemen, recentQaQc, recentContacts])

  const addWorkItem = () => {
    setWorkItems([...workItems, { workDescription: '', quantity: null, unit: 'Nos', unitPrice: null, totalPrice: null }])
  }

  const removeWorkItem = (index: number) => {
    setWorkItems(workItems.filter((_, i) => i !== index))
  }

  const updateWorkItem = (index: number, field: keyof JobOrderItem, value: any) => {
    const updated = [...workItems]
    updated[index] = { ...updated[index], [field]: value }

    const cur = updated[index]

    // Normalize nulls and numbers
    if (field === 'totalPrice') {
      cur.totalPrice = value == null ? null : Number(value)
      if (cur.unitPrice != null && cur.unitPrice > 0) {
        cur.quantity = cur.totalPrice != null ? cur.totalPrice / cur.unitPrice : cur.quantity
      } else if (cur.quantity != null && cur.quantity > 0) {
        cur.unitPrice = cur.totalPrice != null ? cur.totalPrice / cur.quantity : cur.unitPrice
      }
    } else if (field === 'unitPrice') {
      cur.unitPrice = value == null ? null : Number(value)
      if (cur.quantity != null && cur.quantity > 0 && cur.unitPrice != null) {
        cur.totalPrice = cur.quantity * cur.unitPrice
      } else if (cur.totalPrice != null && cur.unitPrice != null && cur.unitPrice > 0) {
        cur.quantity = cur.totalPrice / cur.unitPrice
      }
    } else if (field === 'quantity') {
      cur.quantity = value == null ? null : Number(value)
      if (cur.unitPrice != null && cur.unitPrice > 0 && cur.quantity != null) {
        cur.totalPrice = cur.quantity * cur.unitPrice
      } else if (cur.totalPrice != null && cur.quantity != null && cur.quantity > 0) {
        cur.unitPrice = cur.totalPrice / cur.quantity
      }
    }

    updated[index] = cur
    setWorkItems(updated)
  }

  const addEditWorkItem = () => {
    setEditWorkItems([...editWorkItems, { workDescription: '', quantity: null, unit: 'Nos', unitPrice: null, totalPrice: null }])
  }

  const removeEditWorkItem = (index: number) => {
    setEditWorkItems(editWorkItems.filter((_, i) => i !== index))
  }

  const updateEditWorkItem = (index: number, field: keyof JobOrderItem, value: any) => {
    const updated = [...editWorkItems]
    updated[index] = { ...updated[index], [field]: value }

    const cur = updated[index]

    if (field === 'totalPrice') {
      cur.totalPrice = value == null ? null : Number(value)
      if (cur.unitPrice != null && cur.unitPrice > 0) {
        cur.quantity = cur.totalPrice != null ? cur.totalPrice / cur.unitPrice : cur.quantity
      } else if (cur.quantity != null && cur.quantity > 0) {
        cur.unitPrice = cur.totalPrice != null ? cur.totalPrice / cur.quantity : cur.unitPrice
      }
    } else if (field === 'unitPrice') {
      cur.unitPrice = value == null ? null : Number(value)
      if (cur.quantity != null && cur.quantity > 0 && cur.unitPrice != null) {
        cur.totalPrice = cur.quantity * cur.unitPrice
      } else if (cur.totalPrice != null && cur.unitPrice != null && cur.unitPrice > 0) {
        cur.quantity = cur.totalPrice / cur.unitPrice
      }
    } else if (field === 'quantity') {
      cur.quantity = value == null ? null : Number(value)
      if (cur.unitPrice != null && cur.unitPrice > 0 && cur.quantity != null) {
        cur.totalPrice = cur.quantity * cur.unitPrice
      } else if (cur.totalPrice != null && cur.quantity != null && cur.quantity > 0) {
        cur.unitPrice = cur.totalPrice / cur.quantity
      }
    }

    updated[index] = cur
    setEditWorkItems(updated)
  }

  const fetchJobOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('perPage', String(perPage))
      if (filters.search) params.set('search', filters.search)
      if (filters.priority && filters.priority !== 'ALL') params.set('priority', filters.priority)

      const res = await fetch(`/api/job-orders?${params.toString()}`)
      if (!res.ok) {
        throw new Error(`Failed to fetch job orders: ${res.status}`)
      }
      const data = await res.json()

      if (data && Array.isArray(data.jobs)) {
        setJobOrders(data.jobs)
        setTotalCount(data.totalCount || 0)
      } else {
        console.error('Invalid response format:', data)
        setJobOrders([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Failed to fetch job orders:', error)
      setJobOrders([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeletedJobOrders = async () => {
    try {
      const res = await fetch('/api/job-orders?includeDeleted=true')
      if (!res.ok) {
        throw new Error(`Failed to fetch deleted job orders: ${res.status}`)
      }
      const data = await res.json()
      
      // Handle both array and object formats from API
      let allJobs: JobOrder[] = []
      if (Array.isArray(data)) {
        allJobs = data
      } else if (data && data.jobs && Array.isArray(data.jobs)) {
        allJobs = data.jobs
      }
      
      // Filter only deleted jobs
      const deleted = allJobs.filter((job: JobOrder) => job.isDeleted)
      setDeletedJobOrders(deleted)
    } catch (error) {
      console.error('Failed to fetch deleted job orders:', error)
      setDeletedJobOrders([])
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const createNewClient = async () => {
    const clientNameToCreate = newClientName || clientSearchQuery
    if (!clientNameToCreate.trim()) {
      alert('Please enter a client name')
      return
    }

    setCreatingClient(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientNameToCreate.trim(),
          email: '', // Draft client - to be filled later
          phone: '',
          address: '',
          isDraft: true // Mark as draft so user knows to complete it later
        })
      })

      if (!res.ok) {
        throw new Error('Failed to create client')
      }

      const newClient = await res.json()
      
      // Add to clients list and select it
      setClients([...clients, newClient])
      setFormData({
        ...formData,
        clientId: newClient.id,
        clientName: newClient.name
      })
      
      // Reset inputs
      setNewClientName('')
      setClientSearchQuery(newClient.name)
      
      alert(`Client "${newClient.name}" created successfully! You can complete the details in the Clients panel.`)
    } catch (error: any) {
      alert(error.message || 'Failed to create client')
    } finally {
      setCreatingClient(false)
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
        body: JSON.stringify({
          ...formData,
          items: workItems.filter(item => item.workDescription),
          finalTotal: finalTotalOverride !== null ? finalTotalOverride : undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create job order')
      }

      // Reset form and refresh list
      setFormData({ 
        jobNumber: '', 
        productName: '', 
        drawingRef: '',
        clientId: '',
        clientName: '',
        contactPerson: '',
        phone: '+974 ',
        clientContactPerson: '',
        clientContactPhone: '+974 ',
        lpoContractNo: '',
        lpoIssueDate: '',
        priority: 'MEDIUM',
        foreman: '',
        workScope: '',
        scopeOfWorks: [],
        qaQcInCharge: '',
        discount: 0,
        roundOff: 0
      })
      setWorkItems([{ workDescription: '', quantity: 0, unit: 'Nos', unitPrice: 0, totalPrice: 0 }])
      setShowForm(false)
      setShowNewClientInput(false)
      setNewClientName('')
      localStorage.removeItem('jobOrderDraft')
      fetchJobOrders()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/job-orders?id=${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete job order')
      }

      setDeleteConfirm(null)
      fetchJobOrders()
      fetchDeletedJobOrders()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      setRestoring(id)
      const res = await fetch('/api/job-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'restore' })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to restore job order')
      }

      setRestoring(null)
      fetchJobOrders()
      fetchDeletedJobOrders()
    } catch (err: any) {
      alert(err.message)
      setRestoring(null)
    }
  }

  const handleEditClick = (job: JobOrder) => {
    setEditingJob(job)
    const scopeOfWorks = job.scopeOfWorks ? 
      (typeof job.scopeOfWorks === 'string' ? JSON.parse(job.scopeOfWorks) : job.scopeOfWorks) 
      : []
    setEditFormData({
      jobNumber: job.jobNumber,
      productName: job.productName,
      drawingRef: job.drawingRef || '',
      clientId: (job as any).clientId || '',
      clientName: job.clientName || '',
      contactPerson: job.contactPerson || '',
      phone: job.phone || '+974 ',
      clientContactPerson: job.clientContactPerson || '',
      clientContactPhone: job.clientContactPhone || '+974 ',
      lpoContractNo: job.lpoContractNo || '',
      lpoIssueDate: job.lpoIssueDate || '',
      priority: job.priority || 'MEDIUM',
      foreman: job.foreman || '',
      workScope: job.workScope || '',
      scopeOfWorks: scopeOfWorks,
      qaQcInCharge: job.qaQcInCharge || '',
      discount: (job as any).discount || 0,
      roundOff: (job as any).roundOff || 0
    })
    setEditClientSearchQuery(job.clientName || '')
    setShowEditClientSuggestions(false)
    setEditFinalTotalOverride((job as any).finalTotal !== undefined ? (job as any).finalTotal : null)
    setEditWorkItems(job.items && job.items.length > 0 
      ? job.items 
      : [{ workDescription: '', quantity: 0, unit: 'Nos', unitPrice: 0, totalPrice: 0 }]
    )

    // focus job number in modal after small delay
    setTimeout(() => {
      const el = document.getElementById('edit-jobNumber') as HTMLInputElement | null
      if (el) el.focus()
    }, 100)
  }

  const handleSelectJob = async (jobNumber: string, fallback?: any) => {
    try {
      const res = await fetch(`/api/job-orders?jobNumber=${encodeURIComponent(jobNumber)}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.found && data?.data) {
          setSelectedJob(data.data)
          return
        }
      }
    } catch (err) {
      console.error('Failed to fetch job details for', jobNumber, err)
    }

    // Fallback to provided object or clear selection
    if (fallback) setSelectedJob(fallback)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingJob) return

    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/job-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingJob.id,
          ...editFormData,
          items: editWorkItems.filter(item => item.workDescription),
          finalTotal: editFinalTotalOverride !== null ? editFinalTotalOverride : undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update job order')
      }

      setEditingJob(null)
      setSelectedJob(data)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-0.5">Job Orders</h1>
            <p className="text-slate-600 text-sm">Manage workshop job orders</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                New Job Order
              </>
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-slate-600">Search</Label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Job #, description, client, foreman"
              className="h-9 text-sm"
            />
          </div>
          <div className="max-w-xs">
            <Label className="text-xs text-slate-600">Priority</Label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="mt-1 h-9 w-full px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* quick actions */}
          <div className="flex items-end justify-end gap-2">
            <div className="text-xs text-slate-500">Shortcuts: Press <span className="font-mono">n</span> to open New Job</div>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="mb-6 border-blue-200 shadow-lg">
            <CardHeader className="bg-blue-50 py-3">
              <CardTitle className="text-blue-900 text-lg">Create New Job Order</CardTitle>
              <CardDescription>Enter the details for the new job order (as per NBTC template)</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {draft && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm flex items-center justify-between">
                    <div>Draft job saved locally. You can restore it or continue a new form.</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded"
                        onClick={() => {
                          setFormData(draft)
                          setDraft(null)
                          localStorage.removeItem('jobOrderDraft')
                        }}
                      >Restore</button>
                      <button
                        type="button"
                        className="text-xs bg-slate-100 px-3 py-1 rounded"
                        onClick={() => {
                          setDraft(null)
                          localStorage.removeItem('jobOrderDraft')
                        }}
                      >Discard</button>
                    </div>
                  </div>
                )}

                <h3 className="text-sm font-bold text-slate-700 mb-3">Client & NBTC Contact Information</h3>
                {/* Contact block - line 1 (Priority, NBTC contact + phone, QA/QC, Drawing, Foreman) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-2 relative" data-edit-key="priority">
                    <Label htmlFor="priority" className="text-sm font-semibold">Priority *</Label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      required
                      className="mt-1 h-9 px-2 pr-8 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm z-20"
                    >
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                  <div className="md:col-span-3" data-edit-key="contactPerson">
                    <Label htmlFor="contactPerson" className="text-sm font-semibold">NBTC's Contact Person</Label>
                    <select
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => {
                        const value = e.target.value
                        const match = contactOptions.find((c) => c.name === value)
                        setFormData((prev) => ({
                          ...prev,
                          contactPerson: value,
                          phone: match?.phone || prev.phone
                        }))
                      }}
                      className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                    >
                      <option value="">Select</option>
                      {contactOptions.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2" data-edit-key="phone">
                    <Label htmlFor="phone" className="text-sm font-semibold">NBTC's Contact Phone No.</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+974 5508 7272"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-2" data-edit-key="qaQc">
                    <Label htmlFor="qaQcInCharge" className="text-sm font-semibold">QA/QC In Charge</Label>
                    <select
                      id="qaQcInCharge"
                      value={formData.qaQcInCharge}
                      onChange={(e) => setFormData({ ...formData, qaQcInCharge: e.target.value })}
                      className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                    >
                      <option value="">Select</option>
                      {qaQcOptions.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2" data-edit-key="drawing">
                    <Label htmlFor="drawingRef" className="text-sm font-semibold">Drawing / Enquiry Ref</Label>
                    <Input
                      id="drawingRef"
                      value={formData.drawingRef}
                      onChange={(e) => setFormData({ ...formData, drawingRef: e.target.value })}
                      placeholder="e.g., E-11899"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-1" data-edit-key="foreman">
                    <Label htmlFor="foreman" className="text-sm font-semibold">Foreman</Label>
                    <select
                      id="foreman"
                      value={formData.foreman}
                      onChange={(e) => setFormData({ ...formData, foreman: e.target.value })}
                      className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                    >
                      <option value="">Select</option>
                      {foremanOptions.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div> 

                {/* Job & Client quick row (line 2) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-2" data-edit-key="jobNumber">
                    <Label htmlFor="jobNumber" className="text-sm font-semibold">Job Number *</Label>
                    <Input
                      id="jobNumber"
                      value={formData.jobNumber}
                      onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                      placeholder="e.g., 07439"
                      required
                      className="mt-1 h-9 w-full text-sm"
                    />
                  </div>
                  <div className="md:col-span-2" data-edit-key="client">
                    <Label htmlFor="clientSearch" className="text-sm font-semibold">Client *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="clientSearch"
                        value={clientSearchQuery}
                        onChange={(e) => {
                          setClientSearchQuery(e.target.value)
                          setShowClientSuggestions(true)
                          // Clear selection if user is typing
                          if (formData.clientId && e.target.value !== formData.clientName) {
                            setFormData({ ...formData, clientId: '', clientName: '' })
                          }
                        }}
                        onFocus={() => setShowClientSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
                        placeholder="Type to search or create new client..."
                        required={!formData.clientId}
                        className="h-9 w-full"
                      />
                      
                      {/* Dropdown suggestions */}
                      {showClientSuggestions && (
                        <div 
                          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                          onMouseLeave={() => setShowClientSuggestions(false)}
                        >
                          {clients
                            .filter(client => 
                              client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
                            )
                            .map(client => (
                              <div
                                key={client.id}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    clientId: client.id,
                                    clientName: client.name,
                                    clientContactPerson: client.contactPerson || '',
                                    clientContactPhone: client.phone || '+974 '
                                  })
                                  setClientSearchQuery(client.name)
                                  setShowClientSuggestions(false)
                                }}
                              >
                                {client.name}
                              </div>
                            ))}
                          
                          {/* Create new client option */}
                          {clientSearchQuery.trim() && (
                            <div
                              className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm font-semibold text-green-700 border-t"
                              onClick={() => {
                                setNewClientName(clientSearchQuery)
                                setShowClientSuggestions(false)
                                createNewClient()
                              }}
                            >
                              ➕ Create "{clientSearchQuery}" as new client
                            </div>
                          )}
                        </div>
                      )}
                      
                      {formData.clientId && (
                        <p className="text-xs text-green-600 mt-1">✓ Selected: {formData.clientName}</p>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2" data-edit-key="lpo">
                    <Label htmlFor="lpoContractNo" className="text-sm font-semibold">LPO / Contract No</Label>
                    <Input
                      id="lpoContractNo"
                      value={formData.lpoContractNo}
                      onChange={(e) => setFormData({ ...formData, lpoContractNo: e.target.value })}
                      placeholder="LPO-2025-13135"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="lpoIssueDate" className="text-sm font-semibold">LPO Issue Date</Label>
                    <Input
                      type="date"
                      id="lpoIssueDate"
                      value={formData.lpoIssueDate}
                      onChange={(e) => setFormData({ ...formData, lpoIssueDate: e.target.value })}
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="clientContactPerson" className="text-sm font-semibold">Client's Contact Person</Label>
                    <Input
                      id="clientContactPerson"
                      value={formData.clientContactPerson}
                      onChange={(e) => setFormData({ ...formData, clientContactPerson: e.target.value })}
                      placeholder="e.g., LENIN.M"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="clientContactPhone" className="text-sm font-semibold">Client's Phone No.</Label>
                    <Input
                      id="clientContactPhone"
                      value={formData.clientContactPhone}
                      onChange={(e) => setFormData({ ...formData, clientContactPhone: e.target.value })}
                      placeholder="+974 55xx xxxx"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                </div>



                {/* Work Scope only */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Work Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label htmlFor="productName" className="text-sm font-semibold">Main Description *</Label>
                      <Input
                        id="productName"
                        value={formData.productName}
                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                        placeholder="Main description of the job order"
                        required
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="workScope" className="text-sm font-semibold">Additional Notes</Label>
                      <Input
                        id="workScope"
                        value={formData.workScope}
                        onChange={(e) => setFormData({ ...formData, workScope: e.target.value })}
                        placeholder="Any additional notes or specifications"
                        className="mt-1 h-9"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label className="text-sm font-semibold block mb-3">Scope of Works</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                      {SCOPE_OF_WORKS_OPTIONS.map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`scope-${option}`}
                            checked={formData.scopeOfWorks.includes(option)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  scopeOfWorks: [...formData.scopeOfWorks, option]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  scopeOfWorks: formData.scopeOfWorks.filter(s => s !== option)
                                })
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor={`scope-${option}`} className="text-sm cursor-pointer text-slate-700">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div> 



                {/* Work Items */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-700">Work Items</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addWorkItem}
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  
                  {/* Header row - shown once */}
                  <div className="grid grid-cols-12 gap-2 mb-2 px-3">
                    <div className="col-span-5">
                      <Label className="text-xs font-semibold text-slate-600">Work Description *</Label>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold text-slate-600">Quantity</Label>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold text-slate-600">Unit *</Label>
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs font-semibold text-slate-600">Unit Price</Label>
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs font-semibold text-slate-600">Total</Label>
                    </div>
                    <div className="col-span-1"></div>
                  </div>

                  <div className="space-y-2">
                    {workItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded">
                        <div className="col-span-5">
                          <Input
                            value={item.workDescription}
                            onChange={(e) => updateWorkItem(index, 'workDescription', e.target.value)}
                            placeholder="e.g., Fabrication of MS Bollard"
                            required
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={item.quantity == null ? '' : String(item.quantity)}
                            onChange={(e) => updateWorkItem(index, 'quantity', e.target.value === '' ? null : parseFloat(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={item.unit}
                            onChange={(e) => updateWorkItem(index, 'unit', e.target.value)}
                            placeholder="Nos"
                            required
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice == null ? '' : String(item.unitPrice)}
                            onChange={(e) => updateWorkItem(index, 'unitPrice', e.target.value === '' ? null : parseFloat(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.totalPrice == null ? '' : String(item.totalPrice)}
                            onChange={(e) => updateWorkItem(index, 'totalPrice', e.target.value === '' ? null : parseFloat(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          {workItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeWorkItem(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals & Adjustment */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-2 mt-3">
                  <div className="md:col-span-1 text-sm text-slate-600">
                    Subtotal
                    <div className="font-semibold text-slate-800">
                      {workItems.reduce((s, it) => s + (it.totalPrice || 0), 0).toFixed(2)} QAR
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-xs">Discount (amount)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={(formData as any).discount || ''}
                      onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-xs">Round Off (adjustment)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={(formData as any).roundOff || ''}
                      onChange={(e) => setFormData({ ...formData, roundOff: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="md:col-span-1 text-sm text-slate-600">
                    Final Total
                    {workItems.some(it => !it.quantity || it.quantity <= 0) ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={finalTotalOverride !== null ? String(finalTotalOverride) : (workItems.reduce((s, it) => s + (it.totalPrice || 0), 0) - ((formData as any).discount || 0) + ((formData as any).roundOff || 0)).toFixed(2)}
                        onChange={(e) => setFinalTotalOverride(e.target.value === '' ? null : parseFloat(e.target.value))}
                        className="mt-1 h-8 text-sm"
                      />
                    ) : (
                      <div className="font-bold text-blue-600">
                        {(workItems.reduce((s, it) => s + (it.totalPrice || 0), 0) - ((formData as any).discount || 0) + ((formData as any).roundOff || 0)).toFixed(2)} QAR
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    {submitting ? 'Creating...' : 'Create Job Order'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowForm(false)
                      setError('')
                      setFormData({ 
                        jobNumber: '', 
                        productName: '', 
                        drawingRef: '',
                        clientId: '',
                        clientName: '',
                        contactPerson: '',
                        phone: '+974 ',
                        clientContactPerson: '',
                        clientContactPhone: '+974 ',
                        lpoContractNo: '',
                        lpoIssueDate: '',
                        priority: 'MEDIUM',
                        foreman: '',
                        workScope: '',
                        scopeOfWorks: [],
                        qaQcInCharge: '',
                        discount: 0,
                        roundOff: 0
                      })
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
        <div className="space-y-2">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-slate-500">
                <Package className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                <p>No job orders found</p>
                <p className="text-xs mt-1">Adjust filters or create a new job order</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-slate-200">
              <CardHeader className="py-2">
                {selectedIds.length > 0 ? (
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{selectedIds.length} selected</div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded"
                        onClick={async () => {
                          // Export selected
                          const ids = selectedIds.join(',')
                          const res = await fetch(`/api/job-orders?export=csv&ids=${ids}`)
                          const blob = await res.blob()
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'job-orders-selected.csv'
                          document.body.appendChild(a)
                          a.click()
                          a.remove()
                          URL.revokeObjectURL(url)
                        }}
                      >Export CSV</button>
                      <button
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded"
                        onClick={async () => {
                          if (!confirm(`Delete ${selectedIds.length} selected job(s)?`)) return
                          const res = await fetch(`/api/job-orders?ids=${selectedIds.join(',')}`, { method: 'DELETE' })
                          const data = await res.json()
                          alert(data.message || data.error || 'Done')
                          setSelectedIds([])
                          fetchJobOrders()
                          fetchDeletedJobOrders()
                        }}
                      >Delete</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-600">
                    <div className="col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === jobOrders.length && jobOrders.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(jobOrders.map(j => j.id))
                          else setSelectedIds([])
                        }}
                      />
                      <span>Job #</span>
                    </div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2">Client / Foreman</div>
                    <div className="col-span-1">Created</div>
                    <div className="col-span-1">Priority</div>
                    <div className="col-span-1 text-right">Materials</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`grid grid-cols-12 items-center gap-2 px-3 py-2 text-[12px] cursor-pointer hover:bg-blue-50 ${selectedJob?.id === order.id ? 'bg-blue-50' : ''}`}
                      onClick={() => handleSelectJob(order.jobNumber, order)}
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            if (e.target.checked) setSelectedIds((s) => [...s, order.id])
                            else setSelectedIds((s) => s.filter(id => id !== order.id))
                          }}
                          className="mr-2"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="font-semibold text-slate-900">JO-{order.jobNumber}</div>
                      </div>
                      <div className="col-span-4 leading-tight">
                        <div className="truncate" title={order.productName}>{order.productName}</div>
                        {order.items?.[0]?.workDescription && (
                          <div className="truncate text-slate-500" title={order.items[0].workDescription}>
                            {order.items[0].workDescription}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 truncate">
                        {order.clientName && <span className="block text-slate-800 truncate">{order.clientName}</span>}
                        {order.foreman && <span className="block text-slate-500 truncate">Foreman: {order.foreman}</span>}
                      </div>
                      <div className="col-span-1 text-slate-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="col-span-1">
                        <div className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          order.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          order.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {order.priority || 'MEDIUM'}
                        </div>
                      </div>
                      <div className="col-span-1 text-right font-semibold text-blue-700">
                        {order._count?.materialRequests ?? 0}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm(order.id)
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {deleteConfirm === order.id && (
                        <div className="col-span-12 bg-red-50 border border-red-200 rounded px-3 py-2 mt-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between text-[12px] text-red-800">
                            <p>Delete this job order?</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(order.id)}
                                className="h-7 text-xs"
                              >
                                Delete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteConfirm(null)}
                                className="h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Selected job details */}
        {selectedJob && (
          <Card className="mt-3 border-blue-100">
            <CardHeader className="py-3 bg-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-blue-900">Job Order Details</CardTitle>
                  <CardDescription>JO-{selectedJob.jobNumber}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(selectedJob)}
                  className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-3 text-sm text-slate-800 space-y-3">
              {/* Contact block - line 1 (Details view) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-2" data-edit-key="foreman">
                  <div className="text-slate-500 text-xs">Foreman</div>
                  <div className="whitespace-normal">{selectedJob.foreman || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="priority">
                  <div className="text-slate-500 text-xs">Priority</div>
                  <div className="text-sm font-medium">{selectedJob.priority || 'MEDIUM'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="contactPerson">
                  <div className="text-slate-500 text-xs">NBTC's Contact Person</div>
                  <div className="whitespace-normal">{selectedJob.contactPerson || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="phone">
                  <div className="text-slate-500 text-xs">NBTC's Contact Phone No.</div>
                  <div className="whitespace-normal">{selectedJob.phone || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="qaQc">
                  <div className="text-slate-500 text-xs">QA/QC In Charge</div>
                  <div className="whitespace-normal">{selectedJob.qaQcInCharge || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="drawing">
                  <div className="text-slate-500 text-xs">Drawing</div>
                  <div className="truncate">{selectedJob.drawingRef || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-2" data-edit-key="jobNumber">
                  <div className="text-slate-500 text-xs">Job Number</div>
                  <div className="font-semibold whitespace-nowrap">JO-{selectedJob.jobNumber}</div>
                </div>
                <div className="md:col-span-4" data-edit-key="client">
                  <div className="text-slate-500 text-xs">Client</div>
                  <div className="whitespace-normal">{selectedJob.clientName || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="lpo">
                  <div className="text-slate-500 text-xs">LPO / Contract</div>
                  <div className="whitespace-normal">{selectedJob.lpoContractNo || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="clientContact">
                  <div className="text-slate-500 text-xs">Client's Contact Person</div>
                  <div className="whitespace-normal">{selectedJob.clientContactPerson || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="clientPhone">
                  <div className="text-slate-500 text-xs">Client's Phone No.</div>
                  <div className="whitespace-normal">{selectedJob.clientContactPhone || '—'}</div>
                </div>
              </div>  


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-500 text-xs">Description</div>
                  <div className="truncate">{selectedJob.productName}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Additional Notes</div>
                  <div className="truncate">{selectedJob.workScope}</div>
                </div>
              </div> 

              {/* Work Items Table */}
              {Array.isArray(selectedJob.items) && selectedJob.items.length > 0 ? (
                <div className="border-t pt-3">
                  <div className="text-sm font-semibold text-slate-700 mb-2">Work Items</div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left p-2 font-semibold w-[60%]">Description</th>
                          <th className="text-right p-2 font-semibold">Qty</th>
                          <th className="text-left p-2 font-semibold">Unit</th>
                          <th className="text-right p-2 font-semibold">Unit Price</th>
                          <th className="text-right p-2 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(Array.isArray(selectedJob.items) ? selectedJob.items : []).map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50">
                            <td className="p-2 max-w-[80ch] two-line align-middle">
                              <div>{item.workDescription}</div>
                              {((item.quantity == null) || (item.totalPrice == null) || (!item.quantity || item.quantity <= 0)) && (
                                <div className="text-xs text-amber-700 mt-1 italic">Qty/Total Variable - Qty & Invoice based on Drawing Release/Actual Qty while delivery.</div>
                              )}
                            </td>
                            <td className="p-2 text-right whitespace-nowrap">{item.quantity && item.quantity > 0 ? item.quantity : '—'}</td>
                            <td className="p-2 whitespace-nowrap">{item.unit}</td>
                            <td className="p-2 text-right whitespace-nowrap">{item.unitPrice != null ? item.unitPrice.toFixed(2) + ' QAR' : '—'}</td>
                            <td className="p-2 text-right whitespace-nowrap font-semibold">{item.totalPrice != null ? item.totalPrice.toFixed(2) + ' QAR' : (item.unitPrice != null ? '0.00 QAR' : '—')}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2">
                        <tr>
                          <td colSpan={4} className="p-2 text-right">Subtotal:</td>
                          <td className="p-2 text-right font-semibold">{(Array.isArray(selectedJob.items) ? selectedJob.items.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0) : 0).toFixed(2)} QAR</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="p-2 text-right">Discount:</td>
                          <td className="p-2 text-right text-red-600">-{(selectedJob as any).discount?.toFixed ? (selectedJob as any).discount.toFixed(2) : ((selectedJob as any).discount || 0).toFixed(2)} QAR</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="p-2 text-right">Round Off:</td>
                          <td className="p-2 text-right">{(selectedJob as any).roundOff?.toFixed ? (selectedJob as any).roundOff.toFixed(2) : ((selectedJob as any).roundOff || 0).toFixed(2)} QAR</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="p-2 text-right font-bold">Final Total:</td>
                          <td className="p-2 text-right font-bold text-blue-600">{((selectedJob as any).finalTotal !== undefined && (selectedJob as any).finalTotal !== null ? (selectedJob as any).finalTotal : ((Array.isArray(selectedJob.items) ? selectedJob.items.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0) : 0) - ((selectedJob as any).discount || 0) + ((selectedJob as any).roundOff || 0))).toFixed(2)} QAR</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-3">
                  <div className="bg-amber-50 border border-amber-100 text-amber-900 px-3 py-2 rounded text-sm">
                    No work items recorded.
                  </div>
                </div>
              )}

              <div className="border-t pt-3 space-y-1">
                <div className="text-xs text-slate-500">Created: {new Date(selectedJob.createdAt).toLocaleString()}</div>
                {selectedJob.lastEditedBy && selectedJob.lastEditedAt && (
                  <div className="text-xs text-blue-600">
                    Last edited: {new Date(selectedJob.lastEditedAt).toLocaleString()} by {selectedJob.lastEditedBy}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deleted Job Orders Section */}
        {deletedJobOrders.length > 0 && (
          <Card className="mt-6 border-amber-200 bg-amber-50">
            <CardHeader className="py-3 bg-amber-100">
              <CardTitle className="text-amber-900 text-lg">Deleted Job Orders ({deletedJobOrders.length})</CardTitle>
              <CardDescription className="text-amber-700">Soft-deleted records that can be restored</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-amber-200">
                {deletedJobOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`grid grid-cols-12 items-center gap-2 px-3 py-2 text-[12px] hover:bg-amber-100 cursor-pointer ${selectedJob?.id === order.id ? 'bg-amber-100' : ''}` }
                    onClick={() => handleSelectJob(order.jobNumber, order)}
                  >
                    <div className="col-span-2">
                      <div className="font-semibold text-amber-900">JO-{order.jobNumber}</div>
                      <div className="text-[10px] text-amber-700">Deleted</div>
                    </div>
                    <div className="col-span-4 truncate text-amber-800">{order.productName}</div>
                    <div className="col-span-3 truncate text-amber-700">
                      {order.clientName && <span className="block truncate">{order.clientName}</span>}
                      {order.foreman && <span className="block text-[11px]">Foreman: {order.foreman}</span>}
                    </div>
                    <div className="col-span-2 text-amber-700">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRestore(order.id)
                        }}
                        disabled={restoring === order.id}
                        className="h-7 text-[11px] text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                      >
                        {restoring === order.id ? 'Restoring...' : 'Restore'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        {editingJob && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto" onClick={() => setEditingJob(null)}>
            <div className="w-full max-w-5xl my-8" onClick={(e) => e.stopPropagation()}>
              <Card className="w-full bg-white shadow-2xl max-h-[95vh] flex flex-col">
                <CardHeader className="bg-blue-50 py-3 flex-shrink-0 border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-blue-900 text-lg">Edit Job Order</CardTitle>
                      <CardDescription>JO-{editingJob.jobNumber}</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingJob(null)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 overflow-y-auto bg-white flex-1">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Client & NBTC Contact Information</h3>
                  {/* Contact block - line 1 (edit modal) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-priority" className="text-sm font-semibold">Priority *</Label>
                      <select
                        id="edit-priority"
                        value={editFormData.priority}
                        onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                        required
                        className="mt-1 h-9 px-2 pr-8 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm z-20"
                      >
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <Label htmlFor="edit-contactPerson" className="text-sm font-semibold">NBTC's Contact Person</Label>
                      <select
                        id="edit-contactPerson"
                        value={editFormData.contactPerson}
                        onChange={(e) => {
                          const value = e.target.value
                          const match = editContactOptions.find((c) => c.name === value)
                          setEditFormData((prev) => ({
                            ...prev,
                            contactPerson: value,
                            phone: match?.phone || prev.phone
                          }))
                        }}
                        className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                      >
                        <option value="">Select</option>
                        {editContactOptions.map((c) => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-phone" className="text-sm font-semibold">NBTC's Contact Phone No.</Label>
                      <Input
                        id="edit-phone"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="mt-1 h-9 w-full"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-qaQcInCharge" className="text-sm font-semibold">QA/QC In Charge</Label>
                      <select
                        id="edit-qaQcInCharge"
                        value={editFormData.qaQcInCharge}
                        onChange={(e) => setEditFormData({ ...editFormData, qaQcInCharge: e.target.value })}
                        className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                      >
                        <option value="">Select</option>
                        {editQaQcOptions.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-drawingRef" className="text-sm font-semibold">Drawing / Enquiry Ref</Label>
                      <Input
                        id="edit-drawingRef"
                        value={editFormData.drawingRef}
                        onChange={(e) => setEditFormData({ ...editFormData, drawingRef: e.target.value })}
                        className="mt-1 h-9 w-full"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label htmlFor="edit-foreman" className="text-sm font-semibold">Foreman</Label>
                      <select
                        id="edit-foreman"
                        value={editFormData.foreman}
                        onChange={(e) => setEditFormData({ ...editFormData, foreman: e.target.value })}
                        className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                      >
                        <option value="">Select</option>
                        {editForemanOptions.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Job & Client quick row (edit modal) */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-jobNumber" className="text-sm font-semibold">Job Number *</Label>
                        <Input
                          id="edit-jobNumber"
                          value={editFormData.jobNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, jobNumber: e.target.value })}
                          required
                          className="mt-1 h-9 w-full text-sm"
                        />
                      </div>
                      <div className="md:col-span-3 relative">
                        <Label htmlFor="edit-clientName" className="text-sm font-semibold">Client Name *</Label>
                        <Input
                          id="edit-clientName"
                          value={editClientSearchQuery}
                          onChange={(e) => {
                            setEditClientSearchQuery(e.target.value)
                            setShowEditClientSuggestions(true)
                          }}
                          onFocus={() => setShowEditClientSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowEditClientSuggestions(false), 200)}
                          placeholder="Type to search clients..."
                          required
                          className="mt-1 h-9 w-full text-sm"
                        />
                        
                        {/* Client Suggestions Dropdown */}
                        {showEditClientSuggestions && editClientSearchQuery && (
                          <div 
                            className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
                            onMouseLeave={() => setShowEditClientSuggestions(false)}
                          >
                            {clients
                              .filter(client => 
                                client.name.toLowerCase().includes(editClientSearchQuery.toLowerCase())
                              )
                              .map(client => (
                                <div
                                  key={client.id}
                                  onClick={() => {
                                    setEditFormData({
                                      ...editFormData,
                                      clientId: client.id,
                                      clientName: client.name
                                    })
                                    setEditClientSearchQuery(client.name)
                                    setShowEditClientSuggestions(false)
                                  }}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                >
                                  <div className="font-medium">{client.name}</div>
                                  {client.email && <div className="text-xs text-gray-500">{client.email}</div>}
                                </div>
                              ))}
                            
                            {/* Create New Client Option */}
                            <div
                              onClick={() => {
                                const clientNameToCreate = editClientSearchQuery.trim()
                                if (clientNameToCreate) {
                                  // Create new client inline
                                  fetch('/api/clients', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      name: clientNameToCreate,
                                      email: '',
                                      phone: '',
                                      address: '',
                                      isDraft: true
                                    })
                                  })
                                  .then(res => res.json())
                                  .then(newClient => {
                                    setClients([...clients, newClient])
                                    setEditFormData({
                                      ...editFormData,
                                      clientId: newClient.id,
                                      clientName: newClient.name
                                    })
                                    setEditClientSearchQuery(newClient.name)
                                    setShowEditClientSuggestions(false)
                                    alert(`Client "${newClient.name}" created successfully!`)
                                  })
                                  .catch(err => {
                                    alert('Failed to create client')
                                  })
                                }
                              }}
                              className="px-3 py-2 bg-green-50 hover:bg-green-100 cursor-pointer text-green-700 font-medium border-t-2 border-green-200"
                            >
                              + Create new client "{editClientSearchQuery}"
                            </div>
                          </div>
                        )}
                        
                        {editFormData.clientId && !showEditClientSuggestions && (
                          <div className="text-xs text-green-600 mt-1">
                            ✓ Selected: {editFormData.clientName}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-lpoContractNo" className="text-sm font-semibold">LPO / Contract No</Label>
                        <Input
                          id="edit-lpoContractNo"
                          value={editFormData.lpoContractNo}
                          onChange={(e) => setEditFormData({ ...editFormData, lpoContractNo: e.target.value })}
                          className="mt-1 h-9 w-full text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-lpoIssueDate" className="text-sm font-semibold">LPO Issue Date</Label>
                        <Input
                          type="date"
                          id="edit-lpoIssueDate"
                          value={editFormData.lpoIssueDate}
                          onChange={(e) => setEditFormData({ ...editFormData, lpoIssueDate: e.target.value })}
                          className="mt-1 h-9 w-full text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-clientContactPerson" className="text-sm font-semibold">Client's Contact Person</Label>
                        <Input
                          id="edit-clientContactPerson"
                          value={editFormData.clientContactPerson}
                          onChange={(e) => setEditFormData({ ...editFormData, clientContactPerson: e.target.value })}
                          className="mt-1 h-9 w-full text-sm"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Label htmlFor="edit-clientContactPhone" className="text-sm font-semibold">Client's Phone No.</Label>
                        <Input
                          id="edit-clientContactPhone"
                          value={editFormData.clientContactPhone}
                          onChange={(e) => setEditFormData({ ...editFormData, clientContactPhone: e.target.value })}
                          className="mt-1 h-9 w-full text-sm"
                        />
                      </div>
                    </div>
                  </div> 

                  {/* Work Scope only */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Work Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div>
                        <Label htmlFor="edit-productName" className="text-sm font-semibold">Main Description *</Label>
                        <Input
                          id="edit-productName"
                          value={editFormData.productName}
                          onChange={(e) => setEditFormData({ ...editFormData, productName: e.target.value })}
                          required
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-workScope" className="text-sm font-semibold">Additional Notes</Label>
                        <Input
                          id="edit-workScope"
                          value={editFormData.workScope}
                          onChange={(e) => setEditFormData({ ...editFormData, workScope: e.target.value })}
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label className="text-sm font-semibold block mb-3">Scope of Works</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-4 rounded border border-slate-200">
                        {SCOPE_OF_WORKS_OPTIONS.map((option) => (
                          <div key={option} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`edit-scope-${option}`}
                              checked={editFormData.scopeOfWorks.includes(option)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditFormData({
                                    ...editFormData,
                                    scopeOfWorks: [...editFormData.scopeOfWorks, option]
                                  })
                                } else {
                                  setEditFormData({
                                    ...editFormData,
                                    scopeOfWorks: editFormData.scopeOfWorks.filter(s => s !== option)
                                  })
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`edit-scope-${option}`} className="text-sm cursor-pointer text-slate-700">
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>



                  {/* Work Items */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-700">Work Items</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEditWorkItem}
                        className="h-7 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    
                    {/* Header row - shown once */}
                    <div className="grid grid-cols-12 gap-2 mb-2 px-3">
                      <div className="col-span-5">
                        <Label className="text-xs font-semibold text-slate-600">Work Description *</Label>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-semibold text-slate-600">Quantity</Label>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-semibold text-slate-600">Unit *</Label>
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs font-semibold text-slate-600">Unit Price</Label>
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs font-semibold text-slate-600">Total</Label>
                      </div>
                      <div className="col-span-1"></div>
                    </div>

                    <div className="space-y-2">
                      {editWorkItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded">
                          <div className="col-span-5">
                            <Input
                              value={item.workDescription}
                              onChange={(e) => updateEditWorkItem(index, 'workDescription', e.target.value)}
                              placeholder="e.g., Fabrication of MS Bollard"
                              required
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={item.quantity || ''}
                              onChange={(e) => updateEditWorkItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={item.unit}
                              onChange={(e) => updateEditWorkItem(index, 'unit', e.target.value)}
                              placeholder="Nos"
                              required
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice || ''}
                              onChange={(e) => updateEditWorkItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.totalPrice || ''}
                              onChange={(e) => updateEditWorkItem(index, 'totalPrice', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                            {editWorkItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEditWorkItem(index)}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {item.totalPrice != null ? (
                            <div className="col-span-12 text-xs text-slate-600">
                              Total: {item.totalPrice.toFixed(2)} QAR
                            </div>
                          ) : (item.unitPrice != null && (
                            <div className="col-span-12 text-xs text-slate-600">
                              Total: 0.00 QAR
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals & Adjustment (edit modal) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-2 mt-3">
                    <div className="md:col-span-1 text-sm text-slate-600">
                      Subtotal
                      <div className="font-semibold text-slate-800">
                        {editWorkItems.reduce((s, it) => s + (it.totalPrice ?? 0), 0).toFixed(2)} QAR
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <Label className="text-xs">Discount (amount)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={(editFormData as any).discount || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, discount: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label className="text-xs">Round Off (adjustment)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={(editFormData as any).roundOff || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, roundOff: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-1 text-sm text-slate-600">
                      Final Total
                      {editWorkItems.some(it => !it.quantity || it.quantity <= 0) ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editFinalTotalOverride !== null ? String(editFinalTotalOverride) : (editWorkItems.reduce((s, it) => s + (it.totalPrice || 0), 0) - ((editFormData as any).discount || 0) + ((editFormData as any).roundOff || 0)).toFixed(2)}
                          onChange={(e) => setEditFinalTotalOverride(e.target.value === '' ? null : parseFloat(e.target.value))}
                          className="mt-1 h-8 text-sm"
                        />
                      ) : (
                        <div className="font-bold text-blue-600">
                          {(editWorkItems.reduce((s, it) => s + (it.totalPrice || 0), 0) - ((editFormData as any).discount || 0) + ((editFormData as any).roundOff || 0)).toFixed(2)} QAR
                        </div>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 sticky bottom-0 bg-white py-3 border-t">
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingJob(null)
                        setError('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            </div>
          </div>
        )}

      </div>
    </div>
    </div>
  )
}



