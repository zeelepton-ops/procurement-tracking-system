'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
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
  productType?: string
  finishType?: string | null
  sizePrimary?: string | null
  sizeSecondary?: string | null
  length?: string | null
  thickness?: string | null
  quantity: number | null
  unit: string
  unitPrice: number | null
  totalPrice: number | null
  unitWeight?: number | null
}

const WORKSHOP_SCOPE_OF_WORKS_OPTIONS = [
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

const MANUFACTURING_SCOPE_OF_WORKS_OPTIONS = [
  'Rectangular Hollow Section (RHS)',
  'Square Hollow Section (SHS)',
  'Circular Hollow Section (CHS)',
  'Chequered Plate (CP)',
  'Mild Steel Plate (MSP)',
  'Hot Rolled Coil (HRC)',
  'Slitted Coil (SC)'
]

const PRODUCT_TYPE_OPTIONS = ['RHS', 'SHS', 'CHS', 'CP', 'MSP', 'HRC', 'SC']
const FINISH_TYPE_OPTIONS = [
  { value: 'MS', label: 'Without Galvanized (MS)' },
  { value: 'HDG', label: 'Galvanized (HDG)' },
  { value: 'PGI', label: 'Pre-galvanized (PGI)' }
]
const UNIT_OPTIONS = ['Nos', 'mm', 'LM', 'Kgs']
const JO_CATEGORY_OPTIONS = ['Workshop - Fabrication', 'Manufacturing - Pipe Mill']
const MANUFACTURING_CATEGORY = 'Manufacturing - Pipe Mill'

export default function JobOrdersPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
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
  const [divisionFilter, setDivisionFilter] = useState<'ALL' | string>('ALL')
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
    workScope: JO_CATEGORY_OPTIONS[0],
    scopeOfWorks: [] as string[],
    qaQcInCharge: '',
    discount: 0,
    roundOff: 0
  })

  const getSizeLabel = (type?: string) => {
    if (type === 'CHS') return 'Diameter (mm)'
    if (type === 'SHS') return 'Side (mm)'
    if (type === 'RHS') return 'Side A (mm)'
    if (type === 'CP' || type === 'MSP' || type === 'HRC' || type === 'SC') return 'Width (mm)'
    return 'Size (mm)'
  }

  const requiresSecondSize = (type?: string) => type === 'RHS'
  const requiresLength = (type?: string) => type !== 'HRC' && type !== 'SC'

  const buildProductDescription = (item: JobOrderItem) => {
    const type = (item.productType || '').trim()
    const finish = (item.finishType || '').trim()
    const sizeA = (item.sizePrimary || '').trim()
    const sizeB = (item.sizeSecondary || '').trim()
    const thickness = (item.thickness || '').trim()
    const length = (item.length || '').trim()
    const segments = [type]
    if (finish) segments.push(`Finish:${finish}`)
    if (sizeA) segments.push(requiresSecondSize(type) && sizeB ? `${sizeA}x${sizeB}` : sizeA)
    if (thickness) segments.push(`T${thickness}`)
    if (requiresLength(type) && length) segments.push(`L${length}`)
    return segments.filter(Boolean).join(' | ')
  }

  const parseProductDescription = (value?: string | null) => {
    const raw = (value || '').trim()
    if (!raw) {
      return { productType: '', finishType: '', sizePrimary: '', sizeSecondary: '', thickness: '', length: '', workDescription: '' }
    }

    const parts = raw.split('|').map((part) => part.trim()).filter(Boolean)
    const type = PRODUCT_TYPE_OPTIONS.includes(parts[0]) ? parts[0] : ''
    const finishPartWithPrefix = parts.find((part) => /^Finish:/i.test(part)) || ''
    const finishPartRaw = parts.find((part) => ['MS', 'HDG', 'PGI'].includes(part.toUpperCase())) || ''
    const finishType = finishPartWithPrefix
      ? finishPartWithPrefix.replace(/^Finish:/i, '').trim().toUpperCase()
      : finishPartRaw.toUpperCase()
    const nonTypeParts = parts.slice(1).filter((part) => !/^Finish:/i.test(part) && !['MS', 'HDG', 'PGI'].includes(part.toUpperCase()))
    const sizePart = nonTypeParts[0] || ''
    const [sizePrimary, sizeSecondary] = sizePart.includes('x') ? sizePart.split('x').map((s) => s.trim()) : [sizePart, '']
    const thicknessPart = parts.find((part) => /^T/i.test(part)) || ''
    const lengthPart = parts.find((part) => /^L/i.test(part)) || ''

    return {
      productType: type,
      finishType: finishType || '',
      sizePrimary: sizePrimary || '',
      sizeSecondary: sizeSecondary || '',
      thickness: thicknessPart.replace(/^T/i, '').trim(),
      length: lengthPart.replace(/^L/i, '').trim(),
      workDescription: raw,
    }
  }
  const [workItems, setWorkItems] = useState<JobOrderItem[]>([
    { workDescription: '', productType: '', finishType: '', sizePrimary: '', sizeSecondary: '', length: '', thickness: '', quantity: 0, unit: 'Nos', unitPrice: 0, totalPrice: 0 }
  ])
  const [currencyDrafts, setCurrencyDrafts] = useState<Record<string, string>>({})
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [showNewClientInput, setShowNewClientInput] = useState(false)
  const [deletingPermanent, setDeletingPermanent] = useState<string | null>(null)

  const isAdmin = session?.user?.role === 'ADMIN'
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
    workScope: JO_CATEGORY_OPTIONS[0],
    scopeOfWorks: [] as string[],
    qaQcInCharge: '',
    discount: 0,
    roundOff: 0
  })
  const [editWorkItems, setEditWorkItems] = useState<JobOrderItem[]>([
    { workDescription: '', productType: '', finishType: '', sizePrimary: '', sizeSecondary: '', length: '', thickness: '', quantity: 0, unit: 'Nos', unitPrice: 0, totalPrice: 0 }
  ])
  const [editCurrencyDrafts, setEditCurrencyDrafts] = useState<Record<string, string>>({})
  const [editQuantityDrafts, setEditQuantityDrafts] = useState<Record<string, string>>({})
  const [roundOffDraft, setRoundOffDraft] = useState('')
  const [editRoundOffDraft, setEditRoundOffDraft] = useState('')

  useEffect(() => {
    const division = (searchParams.get('division') || '').toLowerCase()
    if (division === 'workshop') {
      setDivisionFilter('Workshop - Fabrication')
      return
    }
    if (division === 'manufacturing') {
      setDivisionFilter('Manufacturing - Pipe Mill')
      return
    }
    if (division === 'all' || division === '') {
      setDivisionFilter('ALL')
    }
  }, [searchParams])

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

  // server-side filtered/paginated orders + division filter in UI
  const filteredOrders = divisionFilter === 'ALL'
    ? jobOrders
    : jobOrders.filter((job) => (job.workScope || JO_CATEGORY_OPTIONS[0]) === divisionFilter)

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
    const defaultUnit = formData.workScope === MANUFACTURING_CATEGORY ? 'LM' : 'Nos'
    setWorkItems([...workItems, { workDescription: '', productType: '', finishType: '', sizePrimary: '', sizeSecondary: '', length: '', thickness: '', quantity: null, unit: defaultUnit, unitPrice: null, totalPrice: null }])
  }

  const removeWorkItem = (index: number) => {
    setWorkItems(workItems.filter((_, i) => i !== index))
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null || Number.isNaN(value)) return ''
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  }

  const parseCurrencyInput = (value: string) => {
    const normalized = value.replace(/,/g, '').trim()
    if (!normalized) return null
    const parsed = Number(normalized)
    return Number.isNaN(parsed) ? null : parsed
  }

  const parseDecimalInput = (value: string) => {
    const normalized = value.replace(/,/g, '').trim()
    if (!normalized || normalized === '.' || normalized === '-') return null
    const parsed = Number(normalized)
    return Number.isNaN(parsed) ? null : parsed
  }

  const formatDecimal = (value: number | null | undefined, decimals = 4) => {
    if (value == null || Number.isNaN(value)) return ''
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals })
  }

  const getCurrencyDraft = (
    drafts: Record<string, string>,
    key: string,
    fallback: number | null | undefined
  ) => (drafts[key] !== undefined ? drafts[key] : fallback == null ? '' : formatCurrency(fallback))

  const getQuantityDraft = (
    drafts: Record<string, string>,
    key: string,
    fallback: number | null | undefined
  ) => (drafts[key] !== undefined ? drafts[key] : fallback == null ? '' : formatDecimal(fallback, 4))

  const normalizeNumber = (value: number | null | undefined) =>
    value == null || !Number.isFinite(value) ? null : value

  const normalizeItem = (item: JobOrderItem) => ({
    ...item,
    workDescription: buildProductDescription(item) || item.workDescription,
    quantity: normalizeNumber(item.quantity),
    unitPrice: normalizeNumber(item.unitPrice),
    totalPrice: normalizeNumber(item.totalPrice),
    unitWeight: normalizeNumber(item.unitWeight ?? null)
  })

  const updateWorkItem = (index: number, field: keyof JobOrderItem, value: any) => {
    const updated = [...workItems]
    updated[index] = { ...updated[index], [field]: value }

    const cur = updated[index]

    if (field === 'productType' || field === 'finishType' || field === 'sizePrimary' || field === 'sizeSecondary' || field === 'length' || field === 'thickness') {
      cur.workDescription = buildProductDescription(cur)
    }

    // Normalize nulls and numbers
    if (field === 'totalPrice') {
      cur.totalPrice = normalizeNumber(value == null ? null : Number(value))
      if (cur.unitPrice != null && cur.unitPrice > 0) {
        cur.quantity = cur.totalPrice != null ? normalizeNumber(cur.totalPrice / cur.unitPrice) : cur.quantity
      } else if (cur.quantity != null && cur.quantity > 0) {
        cur.unitPrice = cur.totalPrice != null ? normalizeNumber(cur.totalPrice / cur.quantity) : cur.unitPrice
      }
    } else if (field === 'unitPrice') {
      cur.unitPrice = normalizeNumber(value == null ? null : Number(value))
      if (cur.quantity != null && cur.quantity > 0 && cur.unitPrice != null) {
        cur.totalPrice = normalizeNumber(cur.quantity * cur.unitPrice)
      } else if (cur.totalPrice != null && cur.unitPrice != null && cur.unitPrice > 0) {
        cur.quantity = normalizeNumber(cur.totalPrice / cur.unitPrice)
      }
    } else if (field === 'quantity') {
      cur.quantity = normalizeNumber(value == null ? null : Number(value))
      if (cur.unitPrice != null && cur.unitPrice > 0 && cur.quantity != null) {
        cur.totalPrice = normalizeNumber(cur.quantity * cur.unitPrice)
      } else if (cur.totalPrice != null && cur.quantity != null && cur.quantity > 0) {
        cur.unitPrice = normalizeNumber(cur.totalPrice / cur.quantity)
      }
    }

    updated[index] = cur
    setWorkItems(updated)
  }

  const addEditWorkItem = () => {
    const defaultUnit = editFormData.workScope === MANUFACTURING_CATEGORY ? 'LM' : 'Nos'
    setEditWorkItems([...editWorkItems, { workDescription: '', productType: '', finishType: '', sizePrimary: '', sizeSecondary: '', length: '', thickness: '', quantity: null, unit: defaultUnit, unitPrice: null, totalPrice: null }])
  }

  const removeEditWorkItem = (index: number) => {
    setEditWorkItems(editWorkItems.filter((_, i) => i !== index))
  }

  const updateEditWorkItem = (index: number, field: keyof JobOrderItem, value: any) => {
    const updated = [...editWorkItems]
    updated[index] = { ...updated[index], [field]: value }

    const cur = updated[index]

    if (field === 'productType' || field === 'finishType' || field === 'sizePrimary' || field === 'sizeSecondary' || field === 'length' || field === 'thickness') {
      cur.workDescription = buildProductDescription(cur)
    }

    if (field === 'totalPrice') {
      cur.totalPrice = normalizeNumber(value == null ? null : Number(value))
      if (cur.unitPrice != null && cur.unitPrice > 0) {
        cur.quantity = cur.totalPrice != null ? normalizeNumber(cur.totalPrice / cur.unitPrice) : cur.quantity
      } else if (cur.quantity != null && cur.quantity > 0) {
        cur.unitPrice = cur.totalPrice != null ? normalizeNumber(cur.totalPrice / cur.quantity) : cur.unitPrice
      }
    } else if (field === 'unitPrice') {
      cur.unitPrice = normalizeNumber(value == null ? null : Number(value))
      if (cur.quantity != null && cur.quantity > 0 && cur.unitPrice != null) {
        cur.totalPrice = normalizeNumber(cur.quantity * cur.unitPrice)
      } else if (cur.totalPrice != null && cur.unitPrice != null && cur.unitPrice > 0) {
        cur.quantity = normalizeNumber(cur.totalPrice / cur.unitPrice)
      }
    } else if (field === 'quantity') {
      cur.quantity = normalizeNumber(value == null ? null : Number(value))
      if (cur.unitPrice != null && cur.unitPrice > 0 && cur.quantity != null) {
        cur.totalPrice = normalizeNumber(cur.quantity * cur.unitPrice)
      } else if (cur.totalPrice != null && cur.quantity != null && cur.quantity > 0) {
        cur.unitPrice = normalizeNumber(cur.totalPrice / cur.quantity)
      }
    }

    updated[index] = cur
    setEditWorkItems(updated)
  }

  const fetchJobOrders = async () => {
    try {
      setError('')
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
        setError('Failed to load job orders')
        setJobOrders([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Failed to fetch job orders:', error)
      setError('Failed to load job orders')
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
      setError('Please enter a client name')
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
      
      setSuccess(`Client "${newClient.name}" created successfully! You can complete the details in the Clients panel.`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (error: any) {
      setError(error.message || 'Failed to create client')
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
          lpoIssueDate: formData.lpoIssueDate || null,
          items: workItems.filter(item => item.workDescription).map(normalizeItem),
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
        workScope: JO_CATEGORY_OPTIONS[0],
        scopeOfWorks: [],
        qaQcInCharge: '',
        discount: 0,
        roundOff: 0
      })
      setWorkItems([{ workDescription: '', productType: '', finishType: '', sizePrimary: '', sizeSecondary: '', length: '', thickness: '', quantity: 0, unit: 'Nos', unitPrice: 0, totalPrice: 0 }])
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
      setError(err.message || 'Failed to delete job order')
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
      setError(err.message || 'Failed to restore job order')
      setRestoring(null)
    }
  }

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Permanently delete this job order? This cannot be undone.')) return

    try {
      setDeletingPermanent(id)
      const res = await fetch(`/api/job-orders?id=${id}&hardDelete=true`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to permanently delete job order')
      }

      setSuccess(data.message || 'Job order permanently deleted')
      setTimeout(() => setSuccess(null), 5000)
      fetchJobOrders()
      fetchDeletedJobOrders()
    } catch (err: any) {
      setError(err.message || 'Failed to permanently delete job order')
    } finally {
      setDeletingPermanent(null)
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
      workScope: job.workScope || JO_CATEGORY_OPTIONS[0],
      scopeOfWorks: scopeOfWorks,
      qaQcInCharge: job.qaQcInCharge || '',
      discount: (job as any).discount || 0,
      roundOff: (job as any).roundOff || 0
    })
    setEditClientSearchQuery(job.clientName || '')
    setShowEditClientSuggestions(false)
    setEditFinalTotalOverride((job as any).finalTotal !== undefined ? (job as any).finalTotal : null)
    setEditWorkItems(job.items && job.items.length > 0
      ? job.items.map((item) => ({ ...item, ...parseProductDescription(item.workDescription) }))
      : [{ workDescription: '', productType: '', finishType: '', sizePrimary: '', sizeSecondary: '', length: '', thickness: '', quantity: 0, unit: 'Nos', unitPrice: 0, totalPrice: 0 }]
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
          lpoIssueDate: editFormData.lpoIssueDate || null,
          items: editWorkItems.filter(item => item.workDescription).map(normalizeItem),
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading job orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
            {success}
          </div>
        )}
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-0.5">Job Orders</h1>
            <p className="text-slate-600 text-xs">Manage workshop and manufacturing job orders</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-600 hover:bg-primary-700"
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

        <div className="mb-3 flex items-center gap-2">
          <Label className="text-xs text-slate-600">Division</Label>
          <select
            value={divisionFilter}
            onChange={(e) => {
              setDivisionFilter(e.target.value)
              setSelectedIds([])
              setPage(1)
            }}
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All</option>
            {JO_CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-slate-600">Search</Label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Job #, description, client, foreman"
              className="h-9 text-xs"
            />
          </div>
          <div className="max-w-xs">
            <Label className="text-xs text-slate-600">Priority</Label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="mt-1 h-9 w-full px-3 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
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
          <Card className="mb-6 border-primary-200 shadow-lg">
            <CardHeader className="bg-primary-50 py-3">
              <CardTitle className="text-primary-900 text-lg">Create New Job Order</CardTitle>
              <CardDescription>Enter the details for the new job order (as per NBTC template)</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4 job-orders-form">
                {draft && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs flex items-center justify-between">
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

                <h3 className="text-xs font-bold text-slate-700 mb-3">Client & NBTC Contact Information</h3>
                {/* Contact block - line 1 (LPO Date, Client, LPO Contract, Client Contact, Client Phone, Foreman) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-1">
                    <Label htmlFor="lpoIssueDate" className="text-xs font-semibold">LPO Date</Label>
                    <Input
                      type="date"
                      id="lpoIssueDate"
                      value={formData.lpoIssueDate}
                      onChange={(e) => setFormData({ ...formData, lpoIssueDate: e.target.value })}
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-3" data-edit-key="client">
                    <Label htmlFor="clientSearch" className="text-xs font-semibold">Client *</Label>
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
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs"
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
                              className="px-3 py-2 hover:bg-green-50 cursor-pointer text-xs font-semibold text-green-700 border-t"
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
                    <Label htmlFor="lpoContractNo" className="text-xs font-semibold">LPO / Contract No</Label>
                    <Input
                      id="lpoContractNo"
                      value={formData.lpoContractNo}
                      onChange={(e) => setFormData({ ...formData, lpoContractNo: e.target.value })}
                      placeholder="LPO-2025-13135"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="clientContactPerson" className="text-xs font-semibold">Client's Contact Person</Label>
                    <Input
                      id="clientContactPerson"
                      value={formData.clientContactPerson}
                      onChange={(e) => setFormData({ ...formData, clientContactPerson: e.target.value })}
                      placeholder="e.g., LENIN.M"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="clientContactPhone" className="text-xs font-semibold">Client's Phone No.</Label>
                    <Input
                      id="clientContactPhone"
                      value={formData.clientContactPhone}
                      onChange={(e) => setFormData({ ...formData, clientContactPhone: e.target.value })}
                      placeholder="+974 55xx xxxx"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-2" data-edit-key="foreman">
                    <Label htmlFor="foreman" className="text-xs font-semibold">Foreman</Label>
                    <input
                      id="foreman"
                      list="foremanOptionsList"
                      value={formData.foreman}
                      onChange={(e) => setFormData({ ...formData, foreman: e.target.value })}
                      placeholder="Select or type"
                      className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full text-xs"
                    />
                    <datalist id="foremanOptionsList">
                      {foremanOptions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                </div> 

                {/* Job & Client quick row (line 2) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-2" data-edit-key="jobNumber">
                    <Label htmlFor="jobNumber" className="text-xs font-semibold">Job Number *</Label>
                    <Input
                      id="jobNumber"
                      value={formData.jobNumber}
                      onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                      placeholder="e.g., 07439"
                      required
                      className="mt-1 h-9 w-full text-xs"
                    />
                  </div>
                  <div className="md:col-span-3" data-edit-key="contactPerson">
                    <Label htmlFor="contactPerson" className="text-xs font-semibold">NBTC's Contact Person</Label>
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
                      className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full text-xs"
                    >
                      <option value="">Select</option>
                      {contactOptions.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2" data-edit-key="phone">
                    <Label htmlFor="phone" className="text-xs font-semibold">NBTC's Contact Phone No.</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+974 5508 7272"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                  <div className="md:col-span-1 relative" data-edit-key="priority">
                    <Label htmlFor="priority" className="text-xs font-semibold">Priority *</Label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      required
                      className="mt-1 h-9 px-2 pr-8 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full text-xs z-20"
                    >
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                  <div className="md:col-span-2" data-edit-key="qaQc">
                    <Label htmlFor="qaQcInCharge" className="text-xs font-semibold">QA/QC In Charge</Label>
                    <input
                      id="qaQcInCharge"
                      list="qaQcOptionsList"
                      value={formData.qaQcInCharge}
                      onChange={(e) => setFormData({ ...formData, qaQcInCharge: e.target.value })}
                      placeholder="Select or type"
                      className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full text-xs"
                    />
                    <datalist id="qaQcOptionsList">
                      {qaQcOptions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="md:col-span-2" data-edit-key="drawing">
                    <Label htmlFor="drawingRef" className="text-xs font-semibold">Drawing / Enquiry Ref</Label>
                    <Input
                      id="drawingRef"
                      value={formData.drawingRef}
                      onChange={(e) => setFormData({ ...formData, drawingRef: e.target.value })}
                      placeholder="e.g., E-11899"
                      className="mt-1 h-9 w-full"
                    />
                  </div>
                </div>



                {/* Work Scope only */}
                <div className="border-t pt-4">
                  <h3 className="text-xs font-bold text-slate-700 mb-3">Work Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label htmlFor="productName" className="text-xs font-semibold">Main Description *</Label>
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
                      <Label htmlFor="workScope" className="text-xs font-semibold">Department Category</Label>
                      <select
                        id="workScope"
                        value={formData.workScope}
                        onChange={(e) => {
                          const nextScope = e.target.value
                          setFormData({ ...formData, workScope: nextScope, scopeOfWorks: [] })
                          if (nextScope !== MANUFACTURING_CATEGORY) {
                            setWorkItems((prev) => prev.map((item) => ({
                              ...item,
                              productType: '',
                              finishType: '',
                              sizePrimary: '',
                              sizeSecondary: '',
                              length: '',
                              thickness: '',
                              unit: item.unit || 'Nos'
                            })))
                          }
                        }}
                        className="mt-1 h-9 px-2 pr-8 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full text-xs"
                      >
                        {JO_CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label className="text-xs font-semibold block mb-3">Scope of Works</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                      {(formData.workScope === MANUFACTURING_CATEGORY ? MANUFACTURING_SCOPE_OF_WORKS_OPTIONS : WORKSHOP_SCOPE_OF_WORKS_OPTIONS).map((option) => (
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
                          <label htmlFor={`scope-${option}`} className="text-xs cursor-pointer text-slate-700">
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
                    <h3 className="text-xs font-bold text-slate-700">Work Items</h3>
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
                  {formData.workScope === MANUFACTURING_CATEGORY ? (
                    <div className="grid grid-cols-[repeat(21,minmax(0,1fr))] gap-2 mb-2 px-3">
                      <div className="col-span-2"><Label className="text-xs font-semibold text-slate-600">Type *</Label></div>
                      <div className="col-span-2"><Label className="text-xs font-semibold text-slate-600">Finish</Label></div>
                      <div className="col-span-2"><Label className="text-xs font-semibold text-slate-600">Size (mm)</Label></div>
                      <div className="col-span-2"><Label className="text-xs font-semibold text-slate-600">Size 2 (mm)</Label></div>
                      <div className="col-span-2"><Label className="text-xs font-semibold text-slate-600">Length (mm)</Label></div>
                      <div className="col-span-2"><Label className="text-xs font-semibold text-slate-600">Thickness (mm)</Label></div>
                      <div className="col-span-2"><Label className="text-xs font-semibold text-slate-600">Quantity</Label></div>
                      <div className="col-span-1"><Label className="text-xs font-semibold text-slate-600">Unit *</Label></div>
                      <div className="col-span-2"><Label className="text-xs font-semibold text-slate-600">Unit Price (QAR)</Label></div>
                      <div className="col-span-2"><Label className="text-xs font-semibold text-slate-600">Total (QAR)</Label></div>
                      <div className="col-span-1"><Label className="text-xs font-semibold text-slate-600">Wt (kg)</Label></div>
                      <div className="col-span-1"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-12 gap-2 mb-2 px-3">
                      <div className="col-span-4"><Label className="text-xs font-semibold text-slate-600">Work Description *</Label></div>
                      <div className="col-span-2"><Label className="text-xs font-semibold text-slate-600">Quantity</Label></div>
                      <div className="col-span-1"><Label className="text-xs font-semibold text-slate-600">Unit *</Label></div>
                      <div className="col-span-2"><Label className="text-xs font-semibold text-slate-600">Unit Price (QAR)</Label></div>
                      <div className="col-span-2"><Label className="text-xs font-semibold text-slate-600">Total (QAR)</Label></div>
                      <div className="col-span-1"><Label className="text-xs font-semibold text-slate-600">Wt (kg)</Label></div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {workItems.map((item, index) => (
                      <div key={index} className={formData.workScope === MANUFACTURING_CATEGORY ? 'grid grid-cols-[repeat(21,minmax(0,1fr))] gap-2 items-center bg-slate-50 p-3 rounded' : 'grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded'}>
                        {formData.workScope === MANUFACTURING_CATEGORY ? (
                          <>
                        <div className="col-span-2">
                          <select
                            value={item.productType || ''}
                            onChange={(e) => updateWorkItem(index, 'productType', e.target.value)}
                            className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs"
                            required
                          >
                            <option value="">Type</option>
                            {PRODUCT_TYPE_OPTIONS.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <select
                            value={item.finishType || ''}
                            onChange={(e) => updateWorkItem(index, 'finishType', e.target.value)}
                            className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs"
                          >
                            <option value="">Finish</option>
                            {FINISH_TYPE_OPTIONS.map((finish) => (
                              <option key={finish.value} value={finish.value}>{finish.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={item.sizePrimary || ''}
                            onChange={(e) => updateWorkItem(index, 'sizePrimary', e.target.value)}
                            placeholder={getSizeLabel(item.productType)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={item.sizeSecondary || ''}
                            onChange={(e) => updateWorkItem(index, 'sizeSecondary', e.target.value)}
                            placeholder="Second side (mm)"
                            disabled={!requiresSecondSize(item.productType)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={item.length || ''}
                            onChange={(e) => updateWorkItem(index, 'length', e.target.value)}
                            placeholder="Length"
                            disabled={!requiresLength(item.productType)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={item.thickness || ''}
                            onChange={(e) => updateWorkItem(index, 'thickness', e.target.value)}
                            placeholder="Thickness"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="text"
                            value={getQuantityDraft(quantityDrafts, `quantity-${index}`, item.quantity)}
                            onChange={(e) => {
                              const nextValue = e.target.value
                              setQuantityDrafts((prev) => ({ ...prev, [`quantity-${index}`]: nextValue }))
                              updateWorkItem(index, 'quantity', parseDecimalInput(nextValue))
                            }}
                            onBlur={(e) => {
                              const parsed = parseDecimalInput(e.currentTarget.value)
                              setQuantityDrafts((prev) => ({
                                ...prev,
                                [`quantity-${index}`]: parsed == null ? '' : formatDecimal(parsed, 4)
                              }))
                            }}
                            inputMode="decimal"
                            className="h-8 text-xs text-right tabular-nums"
                          />
                        </div>
                        <div className="col-span-1">
                          <select
                            value={item.unit}
                            onChange={(e) => updateWorkItem(index, 'unit', e.target.value)}
                            className="h-8 w-full rounded-md border border-slate-300 px-1 text-xs"
                            required
                          >
                            {UNIT_OPTIONS.map((unit) => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="text"
                            value={getCurrencyDraft(currencyDrafts, `unitPrice-${index}`, item.unitPrice)}
                            onChange={(e) => {
                              const nextValue = e.target.value
                              setCurrencyDrafts((prev) => ({ ...prev, [`unitPrice-${index}`]: nextValue }))
                              updateWorkItem(index, 'unitPrice', parseCurrencyInput(nextValue))
                            }}
                            onBlur={(e) => {
                              const parsed = parseCurrencyInput(e.currentTarget.value)
                              setCurrencyDrafts((prev) => ({
                                ...prev,
                                [`unitPrice-${index}`]: parsed == null ? '' : formatCurrency(parsed)
                              }))
                            }}
                            className="h-8 text-xs text-right tabular-nums"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="text"
                            value={getCurrencyDraft(currencyDrafts, `totalPrice-${index}`, item.totalPrice)}
                            onChange={(e) => {
                              const nextValue = e.target.value
                              setCurrencyDrafts((prev) => ({ ...prev, [`totalPrice-${index}`]: nextValue }))
                              updateWorkItem(index, 'totalPrice', parseCurrencyInput(nextValue))
                            }}
                            onBlur={(e) => {
                              const parsed = parseCurrencyInput(e.currentTarget.value)
                              setCurrencyDrafts((prev) => ({
                                ...prev,
                                [`totalPrice-${index}`]: parsed == null ? '' : formatCurrency(parsed)
                              }))
                            }}
                            className="h-8 text-xs text-right tabular-nums"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            step="0.0001"
                            value={item.unitWeight == null ? '' : String(item.unitWeight)}
                            onChange={(e) => updateWorkItem(index, 'unitWeight', e.target.value === '' ? null : parseFloat(e.target.value))}
                            placeholder="0.00"
                            inputMode="decimal"
                            className="h-8 text-xs text-right tabular-nums"
                          />
                        </div>
                          </>
                        ) : (
                          <>
                            <div className="col-span-4">
                              <Input
                                value={item.workDescription}
                                onChange={(e) => updateWorkItem(index, 'workDescription', e.target.value)}
                                placeholder="e.g., Fabrication of MS Bollard"
                                required
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="text"
                                value={getQuantityDraft(quantityDrafts, `quantity-${index}`, item.quantity)}
                                onChange={(e) => {
                                  const nextValue = e.target.value
                                  setQuantityDrafts((prev) => ({ ...prev, [`quantity-${index}`]: nextValue }))
                                  updateWorkItem(index, 'quantity', parseDecimalInput(nextValue))
                                }}
                                onBlur={(e) => {
                                  const parsed = parseDecimalInput(e.currentTarget.value)
                                  setQuantityDrafts((prev) => ({
                                    ...prev,
                                    [`quantity-${index}`]: parsed == null ? '' : formatDecimal(parsed, 4)
                                  }))
                                }}
                                inputMode="decimal"
                                className="h-8 text-xs text-right tabular-nums"
                              />
                            </div>
                            <div className="col-span-1">
                              <Input
                                value={item.unit}
                                onChange={(e) => updateWorkItem(index, 'unit', e.target.value)}
                                placeholder="Nos"
                                required
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="text"
                                value={getCurrencyDraft(currencyDrafts, `unitPrice-${index}`, item.unitPrice)}
                                onChange={(e) => {
                                  const nextValue = e.target.value
                                  setCurrencyDrafts((prev) => ({ ...prev, [`unitPrice-${index}`]: nextValue }))
                                  updateWorkItem(index, 'unitPrice', parseCurrencyInput(nextValue))
                                }}
                                onBlur={(e) => {
                                  const parsed = parseCurrencyInput(e.currentTarget.value)
                                  setCurrencyDrafts((prev) => ({
                                    ...prev,
                                    [`unitPrice-${index}`]: parsed == null ? '' : formatCurrency(parsed)
                                  }))
                                }}
                                className="h-8 text-xs text-right tabular-nums"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="text"
                                value={getCurrencyDraft(currencyDrafts, `totalPrice-${index}`, item.totalPrice)}
                                onChange={(e) => {
                                  const nextValue = e.target.value
                                  setCurrencyDrafts((prev) => ({ ...prev, [`totalPrice-${index}`]: nextValue }))
                                  updateWorkItem(index, 'totalPrice', parseCurrencyInput(nextValue))
                                }}
                                onBlur={(e) => {
                                  const parsed = parseCurrencyInput(e.currentTarget.value)
                                  setCurrencyDrafts((prev) => ({
                                    ...prev,
                                    [`totalPrice-${index}`]: parsed == null ? '' : formatCurrency(parsed)
                                  }))
                                }}
                                className="h-8 text-xs text-right tabular-nums"
                              />
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                step="0.0001"
                                value={item.unitWeight == null ? '' : String(item.unitWeight)}
                                onChange={(e) => updateWorkItem(index, 'unitWeight', e.target.value === '' ? null : parseFloat(e.target.value))}
                                placeholder="0.00"
                                inputMode="decimal"
                                className="h-8 text-xs text-right tabular-nums"
                              />
                            </div>
                          </>
                        )}
                        <div className="col-span-1 flex items-center justify-end">
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
                  <div className="md:col-span-1 text-xs text-slate-600">
                    Subtotal
                    <div className="font-semibold text-slate-800">
                      {formatCurrency(workItems.reduce((s, it) => s + (it.totalPrice || 0), 0))} QAR
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-xs">Discount (amount)</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={(formData as any).discount || ''}
                      onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                      inputMode="decimal"
                      className="h-8 text-xs text-right tabular-nums"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-xs">Round Off (adjustment)</Label>
                    <Input
                      type="text"
                      value={
                        roundOffDraft !== ''
                          ? roundOffDraft
                          : (formData as any).roundOff == null
                          ? ''
                          : formatCurrency((formData as any).roundOff)
                      }
                      onChange={(e) => {
                        const nextValue = e.target.value
                        setRoundOffDraft(nextValue)
                        setFormData({ ...formData, roundOff: parseCurrencyInput(nextValue) ?? 0 })
                      }}
                      onBlur={(e) => {
                        const parsed = parseCurrencyInput(e.currentTarget.value)
                        setRoundOffDraft(parsed == null ? '' : formatCurrency(parsed))
                      }}
                      className="h-8 text-xs text-right tabular-nums"
                    />
                  </div>
                  <div className="md:col-span-1 text-xs text-slate-600">
                    Final Total
                    {workItems.some(it => !it.quantity || it.quantity <= 0) ? (
                      <Input
                        type="number"
                        step="0.0001"
                        value={finalTotalOverride !== null ? String(finalTotalOverride) : (workItems.reduce((s, it) => s + (it.totalPrice || 0), 0) - ((formData as any).discount || 0) + ((formData as any).roundOff || 0)).toFixed(4)}
                        onChange={(e) => setFinalTotalOverride(e.target.value === '' ? null : parseFloat(e.target.value))}
                        inputMode="decimal"
                        className="mt-1 h-8 text-xs text-right tabular-nums"
                      />
                    ) : (
                      <div className="font-bold text-blue-600">
                        {formatCurrency(workItems.reduce((s, it) => s + (it.totalPrice || 0), 0) - ((formData as any).discount || 0) + ((formData as any).roundOff || 0))} QAR
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="bg-primary-600 hover:bg-primary-700"
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
                        workScope: JO_CATEGORY_OPTIONS[0],
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
                    <div className="text-xs font-medium">{selectedIds.length} selected</div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs bg-primary-600 text-white px-3 py-1 rounded"
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
                          if (data.success) {
                            setSuccess(data.message || 'Job orders deleted successfully')
                            setTimeout(() => setSuccess(null), 5000)
                          } else {
                            setError(data.message || data.error || 'Failed to delete job orders')
                          }
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
                        checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(filteredOrders.map(j => j.id))
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
                      className={`grid grid-cols-12 items-center gap-2 px-3 py-2 text-[12px] cursor-pointer hover:bg-primary-50 ${selectedJob?.id === order.id ? 'bg-primary-50' : ''}`}
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
                      <div className="col-span-1 text-right font-semibold text-primary-700">
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
          <Card className="mt-3 border-primary-100">
            <CardHeader className="py-3 bg-primary-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-primary-900">Job Order Details</CardTitle>
                  <CardDescription>JO-{selectedJob.jobNumber}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(selectedJob)}
                  className="h-8 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-3 text-xs text-slate-800 space-y-3">
              {/* Contact block - line 1 (Details view) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-2" data-edit-key="foreman">
                  <div className="text-slate-500 text-xs">Foreman</div>
                  <div className="whitespace-normal">{selectedJob.foreman || '—'}</div>
                </div>
                <div className="md:col-span-2" data-edit-key="priority">
                  <div className="text-slate-500 text-xs">Priority</div>
                  <div className="text-xs font-medium">{selectedJob.priority || 'MEDIUM'}</div>
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
                  <div className="text-slate-500 text-xs">Department Category</div>
                  <div className="truncate">{selectedJob.workScope}</div>
                </div>
              </div> 

              {/* Work Items Table */}
              {Array.isArray(selectedJob.items) && selectedJob.items.length > 0 ? (
                <div className="border-t pt-3">
                  <div className="text-xs font-semibold text-slate-700 mb-2">Work Items</div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left p-2 font-semibold w-[60%]">Product Description</th>
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
                            <td className="p-2 text-right whitespace-nowrap">{item.unitPrice != null ? `${formatCurrency(item.unitPrice)} QAR` : '—'}</td>
                            <td className="p-2 text-right whitespace-nowrap font-semibold">{item.totalPrice != null ? `${formatCurrency(item.totalPrice)} QAR` : (item.unitPrice != null ? '0.00 QAR' : '—')}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2">
                        <tr>
                          <td colSpan={4} className="p-2 text-right">Subtotal:</td>
                          <td className="p-2 text-right font-semibold">{formatCurrency(Array.isArray(selectedJob.items) ? selectedJob.items.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0) : 0)} QAR</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="p-2 text-right">Discount:</td>
                          <td className="p-2 text-right text-red-600">-{formatCurrency((selectedJob as any).discount || 0)} QAR</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="p-2 text-right">Round Off:</td>
                          <td className="p-2 text-right">{formatCurrency((selectedJob as any).roundOff || 0)} QAR</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="p-2 text-right font-bold">Final Total:</td>
                          <td className="p-2 text-right font-bold text-primary-600">{formatCurrency((selectedJob as any).finalTotal !== undefined && (selectedJob as any).finalTotal !== null ? (selectedJob as any).finalTotal : ((Array.isArray(selectedJob.items) ? selectedJob.items.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0) : 0) - ((selectedJob as any).discount || 0) + ((selectedJob as any).roundOff || 0)))} QAR</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-3">
                  <div className="bg-amber-50 border border-amber-100 text-amber-900 px-3 py-2 rounded text-xs">
                    No work items recorded.
                  </div>
                </div>
              )}

              <div className="border-t pt-3 space-y-1">
                <div className="text-xs text-slate-500">Created: {new Date(selectedJob.createdAt).toLocaleString()}</div>
                {selectedJob.lastEditedBy && selectedJob.lastEditedAt && (
                  <div className="text-xs text-primary-600">
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
                    <div className="col-span-1 flex justify-end gap-2">
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
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePermanentDelete(order.id)
                          }}
                          disabled={deletingPermanent === order.id}
                          className="h-7 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                        >
                          {deletingPermanent === order.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        {editingJob && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto" onClick={() => setEditingJob(null)}>
            <div className="w-full max-w-6xl my-8" onClick={(e) => e.stopPropagation()}>
              <Card className="w-full bg-white shadow-2xl max-h-[95vh] flex flex-col">
                <CardHeader className="bg-primary-50 py-3 flex-shrink-0 border-b border-primary-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-primary-900 text-lg">Edit Job Order</CardTitle>
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
                <form onSubmit={handleEditSubmit} className="space-y-4 job-orders-form">
                  <h3 className="text-xs font-bold text-slate-700 mb-3">Client & NBTC Contact Information</h3>
                  {/* Contact block - line 1 (edit modal) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-1">
                      <Label htmlFor="edit-lpoIssueDate" className="text-xs font-semibold">LPO Date</Label>
                      <Input
                        type="date"
                        id="edit-lpoIssueDate"
                        value={editFormData.lpoIssueDate}
                        onChange={(e) => setEditFormData({ ...editFormData, lpoIssueDate: e.target.value })}
                        className="mt-1 h-9 w-full text-xs"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label htmlFor="edit-clientName" className="text-xs font-semibold">Client Name *</Label>
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
                        className="mt-1 h-9 w-full text-xs"
                      />
                      
                      {/* Client Suggestions Dropdown for Edit */}
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
                                    clientName: client.name,
                                    clientContactPerson: client.contactPerson || '',
                                    clientContactPhone: client.phone || ''
                                  })
                                  setEditClientSearchQuery(client.name)
                                  setShowEditClientSuggestions(false)
                                }}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs"
                              >
                                {client.name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-lpoContractNo" className="text-xs font-semibold">LPO / Contract No</Label>
                      <Input
                        id="edit-lpoContractNo"
                        value={editFormData.lpoContractNo}
                        onChange={(e) => setEditFormData({ ...editFormData, lpoContractNo: e.target.value })}
                        className="mt-1 h-9 w-full text-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-clientContactPerson" className="text-xs font-semibold">Client's Contact Person</Label>
                      <Input
                        id="edit-clientContactPerson"
                        value={editFormData.clientContactPerson}
                        onChange={(e) => setEditFormData({ ...editFormData, clientContactPerson: e.target.value })}
                        className="mt-1 h-9 w-full text-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-clientContactPhone" className="text-xs font-semibold">Client's Phone No.</Label>
                      <Input
                        id="edit-clientContactPhone"
                        value={editFormData.clientContactPhone}
                        onChange={(e) => setEditFormData({ ...editFormData, clientContactPhone: e.target.value })}
                        className="mt-1 h-9 w-full text-xs"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label htmlFor="edit-foreman" className="text-xs font-semibold">Foreman</Label>
                      <input
                        id="edit-foreman"
                        list="editForemanOptionsList"
                        value={editFormData.foreman}
                        onChange={(e) => setEditFormData({ ...editFormData, foreman: e.target.value })}
                        placeholder="Select or type"
                        className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-xs"
                      />
                      <datalist id="editForemanOptionsList">
                        {editForemanOptions.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Job & Client quick row (edit modal) */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-jobNumber" className="text-xs font-semibold">Job Number *</Label>
                        <Input
                          id="edit-jobNumber"
                          value={editFormData.jobNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, jobNumber: e.target.value })}
                          required
                          className="mt-1 h-9 w-full text-xs"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label htmlFor="edit-contactPerson" className="text-xs font-semibold">NBTC's Contact Person</Label>
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
                          className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-xs"
                        >
                          <option value="">Select</option>
                          {editContactOptions.map((c) => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-phone" className="text-xs font-semibold">NBTC's Contact Phone No.</Label>
                        <Input
                          id="edit-phone"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="mt-1 h-9 w-full text-xs"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Label htmlFor="edit-priority" className="text-xs font-semibold">Priority *</Label>
                        <select
                          id="edit-priority"
                          value={editFormData.priority}
                          onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                          required
                          className="mt-1 h-9 px-2 pr-8 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-xs z-20"
                        >
                          <option value="HIGH">HIGH</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="LOW">LOW</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-qaQcInCharge" className="text-xs font-semibold">QA/QC In Charge</Label>
                        <input
                          id="edit-qaQcInCharge"
                          list="editQaQcOptionsList"
                          value={editFormData.qaQcInCharge}
                          onChange={(e) => setEditFormData({ ...editFormData, qaQcInCharge: e.target.value })}
                          placeholder="Select or type"
                          className="mt-1 h-9 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-xs"
                        />
                        <datalist id="editQaQcOptionsList">
                          {editQaQcOptions.map((name) => (
                            <option key={name} value={name} />
                          ))}
                        </datalist>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-drawingRef" className="text-xs font-semibold">Drawing / Enquiry Ref</Label>
                        <Input
                          id="edit-drawingRef"
                          value={editFormData.drawingRef}
                          onChange={(e) => setEditFormData({ ...editFormData, drawingRef: e.target.value })}
                          className="mt-1 h-9 w-full text-xs"
                        />
                      </div>
                    </div>
                  </div> 

                  {/* Work Scope only */}
                  <div className="border-t pt-4">
                    <h3 className="text-xs font-bold text-slate-700 mb-3">Work Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div>
                        <Label htmlFor="edit-productName" className="text-xs font-semibold">Main Description *</Label>
                        <Input
                          id="edit-productName"
                          value={editFormData.productName}
                          onChange={(e) => setEditFormData({ ...editFormData, productName: e.target.value })}
                          required
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-workScope" className="text-xs font-semibold">Department Category</Label>
                        <select
                          id="edit-workScope"
                          value={editFormData.workScope}
                          onChange={(e) => {
                            const nextScope = e.target.value
                            setEditFormData({ ...editFormData, workScope: nextScope, scopeOfWorks: [] })
                            if (nextScope !== MANUFACTURING_CATEGORY) {
                              setEditWorkItems((prev) => prev.map((item) => ({
                                ...item,
                                productType: '',
                                finishType: '',
                                sizePrimary: '',
                                sizeSecondary: '',
                                length: '',
                                thickness: '',
                                unit: item.unit || 'Nos'
                              })))
                            }
                          }}
                          className="mt-1 h-9 px-2 pr-8 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full text-xs"
                        >
                          {JO_CATEGORY_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label className="text-xs font-semibold block mb-3">Scope of Works</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-4 rounded border border-slate-200">
                        {(editFormData.workScope === MANUFACTURING_CATEGORY ? MANUFACTURING_SCOPE_OF_WORKS_OPTIONS : WORKSHOP_SCOPE_OF_WORKS_OPTIONS).map((option) => (
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
                            <label htmlFor={`edit-scope-${option}`} className="text-xs cursor-pointer text-slate-700">
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
                      <h3 className="text-xs font-bold text-slate-700">Work Items</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEditWorkItem}
                        className="h-8 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    
                    {/* Header row - shown once */}
                    {editFormData.workScope === MANUFACTURING_CATEGORY ? (
                      <div className="grid grid-cols-[repeat(21,minmax(0,1fr))] gap-2 bg-slate-100 border border-slate-200 rounded-md px-3 py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Finish</div>
                        <div className="col-span-2">Size (mm)</div>
                        <div className="col-span-2">Size 2 (mm)</div>
                        <div className="col-span-2">Length (mm)</div>
                        <div className="col-span-2">Thickness (mm)</div>
                        <div className="col-span-2 text-right">Quantity</div>
                        <div className="col-span-1">Unit</div>
                        <div className="col-span-2 text-right">Unit Price (QAR)</div>
                        <div className="col-span-2 text-right">Total (QAR)</div>
                        <div className="col-span-1 text-right">Wt (kg)</div>
                        <div className="col-span-1"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-12 gap-3 bg-slate-100 border border-slate-200 rounded-md px-3 py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                        <div className="col-span-4">Work Description</div>
                        <div className="col-span-2 text-right">Quantity</div>
                        <div className="col-span-1">Unit</div>
                        <div className="col-span-2 text-right">Unit Price (QAR)</div>
                        <div className="col-span-2 text-right">Total (QAR)</div>
                        <div className="col-span-1 text-right">Wt (kg)</div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {editWorkItems.map((item, index) => (
                        <div key={index} className={editFormData.workScope === MANUFACTURING_CATEGORY ? 'grid grid-cols-[repeat(21,minmax(0,1fr))] gap-2 items-center bg-white border border-slate-200 rounded-md px-3 py-2' : 'grid grid-cols-12 gap-3 items-center bg-white border border-slate-200 rounded-md px-3 py-2'}>
                          {editFormData.workScope === MANUFACTURING_CATEGORY ? (
                            <>
                          <div className="col-span-2">
                            <select
                              value={item.productType || ''}
                              onChange={(e) => updateEditWorkItem(index, 'productType', e.target.value)}
                              className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs"
                              required
                            >
                              <option value="">Type</option>
                              {PRODUCT_TYPE_OPTIONS.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <select
                              value={item.finishType || ''}
                              onChange={(e) => updateEditWorkItem(index, 'finishType', e.target.value)}
                              className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs"
                            >
                              <option value="">Finish</option>
                              {FINISH_TYPE_OPTIONS.map((finish) => (
                                <option key={finish.value} value={finish.value}>{finish.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={item.sizePrimary || ''}
                              onChange={(e) => updateEditWorkItem(index, 'sizePrimary', e.target.value)}
                              placeholder={getSizeLabel(item.productType)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={item.sizeSecondary || ''}
                              onChange={(e) => updateEditWorkItem(index, 'sizeSecondary', e.target.value)}
                              placeholder="Second side (mm)"
                              disabled={!requiresSecondSize(item.productType)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={item.length || ''}
                              onChange={(e) => updateEditWorkItem(index, 'length', e.target.value)}
                              placeholder="Length"
                              disabled={!requiresLength(item.productType)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={item.thickness || ''}
                              onChange={(e) => updateEditWorkItem(index, 'thickness', e.target.value)}
                              placeholder="Thickness"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="text"
                              value={getQuantityDraft(editQuantityDrafts, `edit-quantity-${index}`, item.quantity)}
                              onChange={(e) => {
                                const nextValue = e.target.value
                                setEditQuantityDrafts((prev) => ({ ...prev, [`edit-quantity-${index}`]: nextValue }))
                                updateEditWorkItem(index, 'quantity', parseDecimalInput(nextValue))
                              }}
                              onBlur={(e) => {
                                const parsed = parseDecimalInput(e.currentTarget.value)
                                setEditQuantityDrafts((prev) => ({
                                  ...prev,
                                  [`edit-quantity-${index}`]: parsed == null ? '' : formatDecimal(parsed, 4)
                                }))
                              }}
                              inputMode="decimal"
                              className="h-8 text-xs text-right tabular-nums"
                            />
                          </div>
                          <div className="col-span-1">
                            <select
                              value={item.unit}
                              onChange={(e) => updateEditWorkItem(index, 'unit', e.target.value)}
                              className="h-8 w-full rounded-md border border-slate-300 px-1 text-xs"
                              required
                            >
                              {UNIT_OPTIONS.map((unit) => (
                                <option key={unit} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="text"
                              value={getCurrencyDraft(editCurrencyDrafts, `edit-unitPrice-${index}`, item.unitPrice)}
                              onChange={(e) => {
                                const nextValue = e.target.value
                                setEditCurrencyDrafts((prev) => ({ ...prev, [`edit-unitPrice-${index}`]: nextValue }))
                                updateEditWorkItem(index, 'unitPrice', parseCurrencyInput(nextValue))
                              }}
                              onBlur={(e) => {
                                const parsed = parseCurrencyInput(e.currentTarget.value)
                                setEditCurrencyDrafts((prev) => ({
                                  ...prev,
                                  [`edit-unitPrice-${index}`]: parsed == null ? '' : formatCurrency(parsed)
                                }))
                              }}
                              className="h-8 text-xs text-right tabular-nums"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="text"
                              value={getCurrencyDraft(editCurrencyDrafts, `edit-totalPrice-${index}`, item.totalPrice)}
                              onChange={(e) => {
                                const nextValue = e.target.value
                                setEditCurrencyDrafts((prev) => ({ ...prev, [`edit-totalPrice-${index}`]: nextValue }))
                                updateEditWorkItem(index, 'totalPrice', parseCurrencyInput(nextValue))
                              }}
                              onBlur={(e) => {
                                const parsed = parseCurrencyInput(e.currentTarget.value)
                                setEditCurrencyDrafts((prev) => ({
                                  ...prev,
                                  [`edit-totalPrice-${index}`]: parsed == null ? '' : formatCurrency(parsed)
                                }))
                              }}
                              className="h-8 text-xs text-right tabular-nums"
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              type="number"
                              step="0.0001"
                              value={item.unitWeight == null ? '' : String(item.unitWeight)}
                              onChange={(e) => updateEditWorkItem(index, 'unitWeight', e.target.value === '' ? null : parseFloat(e.target.value))}
                              placeholder="0.00"
                              inputMode="decimal"
                              className="h-8 text-xs text-right tabular-nums"
                            />
                          </div>
                            </>
                          ) : (
                            <>
                              <div className="col-span-4">
                                <Input
                                  value={item.workDescription}
                                  onChange={(e) => updateEditWorkItem(index, 'workDescription', e.target.value)}
                                  placeholder="e.g., Fabrication of MS Bollard"
                                  required
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="text"
                                  value={getQuantityDraft(editQuantityDrafts, `edit-quantity-${index}`, item.quantity)}
                                  onChange={(e) => {
                                    const nextValue = e.target.value
                                    setEditQuantityDrafts((prev) => ({ ...prev, [`edit-quantity-${index}`]: nextValue }))
                                    updateEditWorkItem(index, 'quantity', parseDecimalInput(nextValue))
                                  }}
                                  onBlur={(e) => {
                                    const parsed = parseDecimalInput(e.currentTarget.value)
                                    setEditQuantityDrafts((prev) => ({
                                      ...prev,
                                      [`edit-quantity-${index}`]: parsed == null ? '' : formatDecimal(parsed, 4)
                                    }))
                                  }}
                                  inputMode="decimal"
                                  className="h-8 text-xs text-right tabular-nums"
                                />
                              </div>
                              <div className="col-span-1">
                                <Input
                                  value={item.unit}
                                  onChange={(e) => updateEditWorkItem(index, 'unit', e.target.value)}
                                  placeholder="Nos"
                                  required
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="text"
                                  value={getCurrencyDraft(editCurrencyDrafts, `edit-unitPrice-${index}`, item.unitPrice)}
                                  onChange={(e) => {
                                    const nextValue = e.target.value
                                    setEditCurrencyDrafts((prev) => ({ ...prev, [`edit-unitPrice-${index}`]: nextValue }))
                                    updateEditWorkItem(index, 'unitPrice', parseCurrencyInput(nextValue))
                                  }}
                                  onBlur={(e) => {
                                    const parsed = parseCurrencyInput(e.currentTarget.value)
                                    setEditCurrencyDrafts((prev) => ({
                                      ...prev,
                                      [`edit-unitPrice-${index}`]: parsed == null ? '' : formatCurrency(parsed)
                                    }))
                                  }}
                                  className="h-8 text-xs text-right tabular-nums"
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="text"
                                  value={getCurrencyDraft(editCurrencyDrafts, `edit-totalPrice-${index}`, item.totalPrice)}
                                  onChange={(e) => {
                                    const nextValue = e.target.value
                                    setEditCurrencyDrafts((prev) => ({ ...prev, [`edit-totalPrice-${index}`]: nextValue }))
                                    updateEditWorkItem(index, 'totalPrice', parseCurrencyInput(nextValue))
                                  }}
                                  onBlur={(e) => {
                                    const parsed = parseCurrencyInput(e.currentTarget.value)
                                    setEditCurrencyDrafts((prev) => ({
                                      ...prev,
                                      [`edit-totalPrice-${index}`]: parsed == null ? '' : formatCurrency(parsed)
                                    }))
                                  }}
                                  className="h-8 text-xs text-right tabular-nums"
                                />
                              </div>
                              <div className="col-span-1">
                                <Input
                                  type="number"
                                  step="0.0001"
                                  value={item.unitWeight == null ? '' : String(item.unitWeight)}
                                  onChange={(e) => updateEditWorkItem(index, 'unitWeight', e.target.value === '' ? null : parseFloat(e.target.value))}
                                  placeholder="0.00"
                                  inputMode="decimal"
                                  className="h-8 text-xs text-right tabular-nums"
                                />
                              </div>
                            </>
                          )}
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
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals & Adjustment (edit modal) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-2 mt-3">
                    <div className="md:col-span-1 text-xs text-slate-600">
                      Subtotal
                      <div className="font-semibold text-slate-800">
                        {formatCurrency(editWorkItems.reduce((s, it) => s + (it.totalPrice ?? 0), 0))} QAR
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <Label className="text-xs">Discount (amount)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={(editFormData as any).discount || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, discount: parseFloat(e.target.value) || 0 })}
                        inputMode="decimal"
                        className="h-8 text-xs text-right tabular-nums"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label className="text-xs">Round Off (adjustment)</Label>
                      <Input
                        type="text"
                        value={
                          editRoundOffDraft !== ''
                            ? editRoundOffDraft
                            : (editFormData as any).roundOff == null
                            ? ''
                            : formatCurrency((editFormData as any).roundOff)
                        }
                        onChange={(e) => {
                          const nextValue = e.target.value
                          setEditRoundOffDraft(nextValue)
                          setEditFormData({ ...editFormData, roundOff: parseCurrencyInput(nextValue) ?? 0 })
                        }}
                        onBlur={(e) => {
                          const parsed = parseCurrencyInput(e.currentTarget.value)
                          setEditRoundOffDraft(parsed == null ? '' : formatCurrency(parsed))
                        }}
                        className="h-8 text-xs text-right tabular-nums"
                      />
                    </div>
                    <div className="md:col-span-1 text-xs text-slate-600">
                      Final Total
                      {editWorkItems.some(it => !it.quantity || it.quantity <= 0) ? (
                        <Input
                          type="number"
                          step="0.0001"
                          value={editFinalTotalOverride !== null ? String(editFinalTotalOverride) : (editWorkItems.reduce((s, it) => s + (it.totalPrice || 0), 0) - ((editFormData as any).discount || 0) + ((editFormData as any).roundOff || 0)).toFixed(4)}
                          onChange={(e) => setEditFinalTotalOverride(e.target.value === '' ? null : parseFloat(e.target.value))}
                          inputMode="decimal"
                          className="mt-1 h-8 text-xs text-right tabular-nums"
                        />
                      ) : (
                        <div className="font-bold text-blue-600">
                          {formatCurrency(editWorkItems.reduce((s, it) => s + (it.totalPrice || 0), 0) - ((editFormData as any).discount || 0) + ((editFormData as any).roundOff || 0))} QAR
                        </div>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
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




