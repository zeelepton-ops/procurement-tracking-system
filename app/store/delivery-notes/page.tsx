'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, FileText, Printer, Trash2, Eye, Settings, Bell, AlertTriangle, CheckCircle2, Save, FolderOpen, X } from 'lucide-react'

interface DeliveryNote {
  id: string
  deliveryNoteNumber: string
  date: string
  jobOrderId: string | null
  jobOrder: {
    jobNumber: string
    productName: string
  } | null
  client: string | null
  country: string | null
  division: string | null
  department: string | null
  refPoNumber: string | null
  shipmentTo: string | null
  shipmentType: string | null
  representativeName: string | null
  representativeNo: string | null
  qidNumber: string | null
  vehicleNumber: string | null
  vehicleType: string | null
  status: string
  totalQuantity: number
  totalWeight: number
  items?: Array<{
    id: string
    itemDescription: string
    unit: string
    quantity: number
    deliveredQuantity: number
    remarks?: string
    jobOrderItemId?: string
  }>
  createdAt: string
}

interface JobOrder {
  id: string
  jobNumber: string
  productName: string
  clientName?: string
  lpoContractNo?: string
  items?: Array<{
    id: string
    workDescription: string
    quantity?: number
    unit?: string
  }>
}

interface DeliveryNoteRequest {
  id: string
  status: string
  requestedBy?: string | null
  createdAt: string
  jobOrder?: {
    jobNumber: string
    clientName?: string | null
  } | null
  jobOrderItem?: {
    workDescription: string
    quantity?: number | null
    unit?: string | null
  } | null
}

interface QualityStep {
  status: string
  approvedQty?: number | null
  failedQty?: number | null
  holdQty?: number | null
}

interface ReadyInspection {
  id: string
  status: string
  createdAt: string
  jobOrderItemId: string
  jobOrderItem: {
    workDescription: string
    quantity?: number | null
    unit?: string | null
    jobOrder: {
      id: string
      jobNumber: string
      clientName?: string | null
    }
  }
  steps: QualityStep[]
}

export default function DeliveryNotesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([])
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({})
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [dnSuggestions, setDnSuggestions] = useState<string[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Array<{type: string, message: string}>>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDraftMenu, setShowDraftMenu] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [savedDrafts, setSavedDrafts] = useState<Array<{name: string, data: any, timestamp: number}>>([])
  const [dnRequests, setDnRequests] = useState<DeliveryNoteRequest[]>([])
  const [readyInspections, setReadyInspections] = useState<ReadyInspection[]>([])
  const [readyLoading, setReadyLoading] = useState(false)

  const [formData, setFormData] = useState({
    deliveryNoteNumber: '',
    jobOrderId: '',
    client: '',
    country: 'Qatar',
    division: '',
    department: '',
    refPoNumber: '',
    jobSalesOrder: '',
    shipmentTo: '',
    comments: '',
    shipmentType: 'Land',
    representativeName: '',
    representativeNo: '',
    qidNumber: '',
    vehicleNumber: '',
    vehicleType: 'NBTC',
    lineItems: [] as Array<{
      id: string
      jobOrderItemId?: string
      description: string
      balanceQty: number
      totalQty: number  // From job order for reference
      subItems: Array<{
        id: string
        subDescription: string
        unit: string
        deliveredQuantity: number
        remarks?: string
      }>
    }>
  })

  useEffect(() => {
    console.log('Component mounted, fetching data...')
    fetchDeliveryNotes()
    fetchJobOrders()
    fetchDeliveryNoteRequests()
    fetchReadyInspections()
    loadDrafts()
  }, [])

  useEffect(() => {
    const jobOrderId = searchParams.get('jobOrderId')
    const openForm = searchParams.get('openForm')

    if (jobOrderId && openForm === '1' && jobOrders.length > 0) {
      setShowForm(true)
      setEditingId(null)
      handleJobOrderChange(jobOrderId)
    }
  }, [jobOrders, searchParams])

  const loadDrafts = () => {
    try {
      const drafts = localStorage.getItem('deliveryNoteDrafts')
      if (drafts) {
        setSavedDrafts(JSON.parse(drafts))
      }
    } catch (error) {
      console.error('Failed to load drafts:', error)
    }
  }

  const saveDraft = () => {
    if (!draftName.trim()) {
      setError('Please enter a name for the draft')
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      const drafts = [...savedDrafts]
      
      // Check if draft name already exists
      const existingIndex = drafts.findIndex(d => d.name === draftName.trim())
      
      const draftData = {
        name: draftName.trim(),
        data: formData,
        timestamp: Date.now()
      }

      if (existingIndex >= 0) {
        // Update existing draft
        drafts[existingIndex] = draftData
      } else {
        // Add new draft
        if (drafts.length >= 5) {
          setError('Maximum 5 drafts allowed. Please delete an old draft first.')
          setTimeout(() => setError(null), 3000)
          return
        }
        drafts.push(draftData)
      }

      localStorage.setItem('deliveryNoteDrafts', JSON.stringify(drafts))
      setSavedDrafts(drafts)
      setDraftName('')
      setSuccess(`Draft "${draftData.name}" saved successfully!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to save draft:', error)
      setError('Failed to save draft')
      setTimeout(() => setError(null), 3000)
    }
  }

  const loadDraft = (draft: any) => {
    setFormData(draft.data)
    setShowDraftMenu(false)
    setSuccess(`Draft "${draft.name}" loaded successfully!`)
    setTimeout(() => setSuccess(null), 3000)
  }

  const deleteDraft = (draftName: string) => {
    try {
      const drafts = savedDrafts.filter(d => d.name !== draftName)
      localStorage.setItem('deliveryNoteDrafts', JSON.stringify(drafts))
      setSavedDrafts(drafts)
      setSuccess(`Draft "${draftName}" deleted successfully!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to delete draft:', error)
      setError('Failed to delete draft')
      setTimeout(() => setError(null), 3000)
    }
  }

  const clearAllDrafts = () => {
    if (confirm('Are you sure you want to delete all drafts? This action cannot be undone.')) {
      try {
        localStorage.removeItem('deliveryNoteDrafts')
        setSavedDrafts([])
        setSuccess('All drafts cleared successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } catch (error) {
        console.error('Failed to clear drafts:', error)
        setError('Failed to clear drafts')
        setTimeout(() => setError(null), 3000)
      }
    }
  }

  const formatDnNumber = (numberPart: string) => {
    const currentYear = new Date().getFullYear().toString().slice(-2)
    return `DN-${numberPart.padStart(4, '0')}/${currentYear}`
  }

  const extractDnNumber = (fullDn: string) => {
    const match = fullDn.match(/^DN-(\d+)\/\d{2}$/)
    return match ? match[1] : fullDn
  }

  const generateDnSuggestions = () => {
    // Parse existing DN numbers to find the highest number for current year
    const currentYear = new Date().getFullYear().toString().slice(-2) // Get last 2 digits
    const dnPattern = /^DN-(\d+)\/(\d{2})$/
    
    let maxNumber = 0
    deliveryNotes.forEach(note => {
      const match = note.deliveryNoteNumber.match(dnPattern)
      if (match) {
        const [, numStr, yearStr] = match
        const num = parseInt(numStr, 10)
        const year = yearStr
        // Consider numbers from current year and previous year
        if (year === currentYear || parseInt(year, 10) === parseInt(currentYear, 10) - 1) {
          if (num > maxNumber) maxNumber = num
        }
      }
    })

    // Generate 5 previous and 5 next numbers (just the number part)
    const suggestions: string[] = []
    const startNum = Math.max(1, maxNumber - 4)
    for (let i = startNum; i <= maxNumber + 5; i++) {
      suggestions.push(i.toString())
    }
    
    setDnSuggestions(suggestions)
  }

  useEffect(() => {
    if (deliveryNotes.length > 0 && showForm) {
      generateDnSuggestions()
    }
  }, [deliveryNotes, showForm])

  const fetchDeliveryNotes = async () => {
    try {
      console.log('Fetching delivery notes...')
      const res = await fetch('/api/delivery-notes')
      console.log('Response status:', res.status, res.statusText)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('API error response:', errorText)
        throw new Error(`API error: ${res.status}`)
      }
      
      const data = await res.json()
      console.log('Delivery notes data:', data)
      setDeliveryNotes(Array.isArray(data) ? data : [])
      checkDeliveryIssues(Array.isArray(data) ? data : [])
      setLoading(false)
      console.log('Loading complete, deliveryNotes.length:', Array.isArray(data) ? data.length : 0)
    } catch (error) {
      console.error('Failed to fetch delivery notes:', error)
      setDeliveryNotes([])
      setLoading(false)
    }
  }

  const fetchDeliveryNoteRequests = async () => {
    try {
      const res = await fetch('/api/delivery-notes/requests?status=PENDING')
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      const data = await res.json()
      setDnRequests(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch delivery note requests:', error)
      setDnRequests([])
    }
  }

  const getInspectionDerivedStatus = (inspection: ReadyInspection) => {
    const steps = inspection.steps || []
    const statuses = steps.map(step => step.status || 'PENDING')

    if (statuses.some(status => status === 'FAILED')) return 'REJECTED'
    if (statuses.some(status => status === 'HOLD')) return 'HOLD'
    if (statuses.length > 0 && statuses.every(status => status === 'APPROVED')) return 'APPROVED'
    if (statuses.some(status => status !== 'PENDING')) return 'IN_PROGRESS'
    return inspection.status || 'PENDING'
  }

  const getApprovedQty = (inspection: ReadyInspection) =>
    (inspection.steps || []).reduce((sum, step) => sum + (step.approvedQty || 0), 0)

  const fetchReadyInspections = async () => {
    setReadyLoading(true)
    try {
      const res = await fetch('/api/quality-inspection')
      if (res.ok) {
        const data = await res.json()
        const inspections = Array.isArray(data) ? data : []
        const approved = inspections.filter(
          (inspection: ReadyInspection) => getInspectionDerivedStatus(inspection) === 'APPROVED'
        )
        setReadyInspections(approved)
      } else {
        setReadyInspections([])
      }
    } catch (error) {
      console.error('Failed to fetch ready inspections:', error)
      setReadyInspections([])
    } finally {
      setReadyLoading(false)
    }
  }

  const startDeliveryNoteFromInspection = (inspection: ReadyInspection) => {
    const jobOrderId = inspection.jobOrderItem?.jobOrder?.id
    if (!jobOrderId) {
      setError('Job order not found for this inspection.')
      setTimeout(() => setError(null), 3000)
      return
    }

    setShowForm(true)
    setEditingId(null)
    handleJobOrderChange(jobOrderId)
  }

  const markRequestCompleted = async (id: string) => {
    try {
      const res = await fetch('/api/delivery-notes/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'COMPLETED' })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update request')
      }

      fetchDeliveryNoteRequests()
    } catch (error) {
      console.error('Failed to update delivery note request:', error)
    }
  }

  const checkDeliveryIssues = (notes: DeliveryNote[]) => {
    const issues: Array<{type: string, message: string}> = []
    
    // Group deliveries by job order
    const jobOrderDeliveries: Record<string, any> = {}
    
    notes.forEach(note => {
      if (!note.jobOrderId || !note.items) return
      
      const jobOrderId = note.jobOrderId // Create a non-null variable
      
      if (!jobOrderDeliveries[jobOrderId]) {
        jobOrderDeliveries[jobOrderId] = {
          jobNumber: note.jobOrder?.jobNumber,
          items: {}
        }
      }
      
      note.items.forEach(item => {
        if (!item.jobOrderItemId) return
        
        const itemId = item.jobOrderItemId // Create a non-null variable
        
        if (!jobOrderDeliveries[jobOrderId].items[itemId]) {
          jobOrderDeliveries[jobOrderId].items[itemId] = {
            description: item.itemDescription,
            totalQty: item.quantity,
            deliveredQty: 0
          }
        }
        
        jobOrderDeliveries[jobOrderId].items[itemId].deliveredQty += item.deliveredQuantity || 0
      })
    })
    
    // Check for issues
    Object.entries(jobOrderDeliveries).forEach(([jobOrderId, jobData]: [string, any]) => {
      Object.entries(jobData.items).forEach(([itemId, itemData]: [string, any]) => {
        const deliveryPercent = (itemData.deliveredQty / itemData.totalQty) * 100
        
        if (itemData.deliveredQty > itemData.totalQty) {
          issues.push({
            type: 'over-delivery',
            message: `Job ${jobData.jobNumber}: "${itemData.description}" - Over-delivered by ${itemData.deliveredQty - itemData.totalQty} units (${itemData.deliveredQty}/${itemData.totalQty})`
          })
        } else if (deliveryPercent >= 80 && deliveryPercent < 100) {
          issues.push({
            type: 'high-delivery',
            message: `Job ${jobData.jobNumber}: "${itemData.description}" - ${deliveryPercent.toFixed(0)}% delivered (${itemData.deliveredQty}/${itemData.totalQty})`
          })
        }
      })
    })
    
    setNotifications(issues)
  }

  const fetchJobOrders = async () => {
    try {
      const res = await fetch('/api/job-orders')
      const data = await res.json()
      // API returns { jobs: [...], totalCount: ... }
      const jobsArray = Array.isArray(data) ? data : (data?.jobs || [])
      setJobOrders(jobsArray)
    } catch (error) {
      console.error('Failed to fetch job orders:', error)
      setJobOrders([])
    }
  }

  const handleJobOrderChange = async (jobOrderId: string) => {
    setFormData(prev => ({ ...prev, jobOrderId }))
    
    // Auto-fill from selected job order
    const selectedJobOrder = jobOrders.find(jo => jo.id === jobOrderId)
    if (selectedJobOrder) {
      // Fetch previous deliveries for this job order to calculate balance
      let previousDeliveries: any = {}
      try {
        const res = await fetch(`/api/delivery-notes?jobOrderId=${jobOrderId}`)
        if (res.ok) {
          const deliveries = await res.json()
          // Sum up delivered quantities by jobOrderItemId (exclude current editing note)
          deliveries.forEach((dn: any) => {
            // Skip the delivery note being edited
            if (editingId && dn.id === editingId) return
            
            if (dn.items) {
              dn.items.forEach((item: any) => {
                if (item.jobOrderItemId) {
                  if (!previousDeliveries[item.jobOrderItemId]) {
                    previousDeliveries[item.jobOrderItemId] = 0
                  }
                  previousDeliveries[item.jobOrderItemId] += item.deliveredQuantity || 0
                }
              })
            }
          })
        }
      } catch (error) {
        console.error('Failed to fetch previous deliveries:', error)
      }

      // Extract line items from job order with balance qty and sub-items structure
      const lineItems = (selectedJobOrder.items || []).map((item: any) => {
        const totalQty = item.quantity || 0
        const deliveredQty = previousDeliveries[item.id] || 0
        const balanceQty = totalQty - deliveredQty

        return {
          id: item.id || `temp-${Math.random()}`,
          jobOrderItemId: item.id,
          description: item.workDescription || '',
          balanceQty: balanceQty,  // Balance = total - previously delivered
          totalQty: totalQty,
          subItems: [{
            id: `sub-${Math.random()}`,
            subDescription: '',
            unit: item.unit || '',
            deliveredQuantity: 0,
            remarks: ''
          }]
        }
      })

      setFormData(prev => ({
        ...prev,
        jobSalesOrder: selectedJobOrder.jobNumber,
        client: selectedJobOrder.clientName || prev.client,
        shipmentTo: selectedJobOrder.clientName || '', // Default to Client Name
        refPoNumber: selectedJobOrder.lpoContractNo || '', // Pull from Job Order LPO/Contract No
        country: 'Qatar', // Default to Qatar
        shipmentType: 'Land', // Default to Land
        lineItems: lineItems // Populate line items from job order
      }))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-set department based on division
      if (field === 'division') {
        if (value === 'Workshop') {
          updated.department = 'Fabrication'
        } else if (value === 'Manufacturing') {
          updated.department = 'Pipe Mill'
        }
      }
      
      return updated
    })
  }

  const handleSubItemChange = (lineIndex: number, subIndex: number, field: string, value: any) => {
    setFormData(prev => {
      const items = [...prev.lineItems]
      items[lineIndex].subItems[subIndex] = { ...items[lineIndex].subItems[subIndex], [field]: value }
      return { ...prev, lineItems: items }
    })
  }

  const addSubItem = (lineIndex: number) => {
    setFormData(prev => {
      const items = [...prev.lineItems]
      items[lineIndex].subItems.push({
        id: `sub-${Math.random()}`,
        subDescription: '',
        unit: '',
        deliveredQuantity: 0,
        remarks: ''
      })
      return { ...prev, lineItems: items }
    })
  }

  const removeSubItem = (lineIndex: number, subIndex: number) => {
    setFormData(prev => {
      const items = [...prev.lineItems]
      items[lineIndex].subItems = items[lineIndex].subItems.filter((_, i) => i !== subIndex)
      return { ...prev, lineItems: items }
    })
  }

  const getSuggestions = (field: string, value: string): string[] => {
    if (!value) return []
    const suggestions = new Set<string>()
    deliveryNotes.forEach(note => {
      const fieldValue = note[field as keyof DeliveryNote]
      if (fieldValue && typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(value.toLowerCase())) {
        suggestions.add(fieldValue)
      }
    })
    return Array.from(suggestions).slice(0, 5)
  }

  const applySuggestion = (field: string, value: string) => {
    handleInputChange(field, value)
    setShowSuggestions(prev => ({ ...prev, [field]: false }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.deliveryNoteNumber) {
      setError('Delivery Note Number is required')
      return
    }

    // Format the DN number before submission
    const fullDnNumber = formatDnNumber(formData.deliveryNoteNumber)

    // Check if job order has quality inspections completed
    if (formData.jobOrderId) {
      try {
        const inspectionRes = await fetch(`/api/quality-inspection?jobOrderId=${formData.jobOrderId}`)
        if (inspectionRes.ok) {
          const inspections = await inspectionRes.json()
          const allCompleted = Array.isArray(inspections) && inspections.length > 0 && 
                              inspections.every((insp: any) => insp.status === 'COMPLETED')
          
          if (inspections.length === 0) {
            setError('⚠️ No quality inspections found for this job order. Please complete quality inspection first.')
            return
          }
          
          if (!allCompleted) {
            const pendingCount = inspections.filter((insp: any) => insp.status !== 'COMPLETED').length
            setError(`⚠️ Quality inspection not fully completed. ${pendingCount} inspection(s) still pending. Please complete all inspections before creating delivery note.`)
            return
          }
        }
      } catch (error) {
        console.error('Failed to check quality inspections:', error)
        setError('Failed to verify quality inspection status')
        return
      }
    }

    setError(null)
    try {
      const url = editingId ? `/api/delivery-notes/${editingId}` : '/api/delivery-notes'
      const method = editingId ? 'PUT' : 'POST'

      const normalizedLineItems = formData.lineItems.map((line) => {
        const hasSubItems = Array.isArray(line.subItems) && line.subItems.length > 0
        const normalizedSubItems = hasSubItems
          ? line.subItems.map((sub) => ({
              ...sub,
              subDescription: sub.subDescription?.trim() ? sub.subDescription : line.description
            }))
          : [
              {
                id: `sub-${Math.random()}`,
                subDescription: line.description,
                unit: '',
                deliveredQuantity: 0,
                remarks: ''
              }
            ]

        return { ...line, subItems: normalizedSubItems }
      })

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          deliveryNoteNumber: fullDnNumber,  // Use formatted DN number
          lineItems: normalizedLineItems 
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save delivery note')
      }

      setSuccess('Delivery note created successfully!')
      setTimeout(() => {
        setShowForm(false)
        setEditingId(null)
        resetForm()
        setSuccess(null)
        fetchDeliveryNotes()
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }

  const resetForm = () => {
    setFormData({
      deliveryNoteNumber: '',
      jobOrderId: '',
      client: '',
      country: 'Qatar',
      division: '',
      department: '',
      refPoNumber: '',
      jobSalesOrder: '',
      shipmentTo: '',
      comments: '',
      shipmentType: 'Land',
      representativeName: '',
      representativeNo: '',
      qidNumber: '',
      vehicleNumber: '',
      vehicleType: 'NBTC',
      lineItems: []
    })
    setShowSuggestions({})
  }

  const handleEdit = async (note: DeliveryNote) => {
    // Group items by jobOrderItemId to reconstruct the structure
    const itemsMap = new Map<string, typeof note.items>()
    note.items?.forEach(item => {
      const key = item.jobOrderItemId || 'no-job-item'
      if (!itemsMap.has(key)) {
        itemsMap.set(key, [])
      }
      itemsMap.get(key)!.push(item)
    })

    // Fetch job order to get original descriptions
    let jobOrderItems: any = {}
    if (note.jobOrderId) {
      try {
        const res = await fetch(`/api/job-orders?id=${note.jobOrderId}`)
        if (res.ok) {
          const data = await res.json()
          const jobOrder = data.jobs?.[0] || data
          if (jobOrder.items) {
            jobOrder.items.forEach((item: any) => {
              jobOrderItems[item.id] = {
                description: item.workDescription,
                totalQty: item.quantity
              }
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch job order:', error)
      }
    }

    // Reconstruct lineItems with proper structure
    const lineItems = Array.from(itemsMap.entries()).map(([jobOrderItemId, items]) => {
      const firstItem = items && items.length > 0 ? items[0] : null
      // Get description from job order if available, otherwise fall back to delivery note item
      const jobOrderItem = jobOrderItems[jobOrderItemId]
      const description = jobOrderItem?.description || firstItem?.itemDescription || ''
      const totalQty = jobOrderItem?.totalQty || firstItem?.quantity || 0
      
      return {
        id: firstItem?.id || `temp-${Math.random()}`,
        jobOrderItemId: jobOrderItemId !== 'no-job-item' ? jobOrderItemId : undefined,
        description: description,
        balanceQty: totalQty,  // Show total qty from job order
        totalQty: totalQty,
        subItems: items ? items.map(item => ({
          id: item.id,
          subDescription: item.itemDescription,
          unit: item.unit,
          deliveredQuantity: item.deliveredQuantity,
          remarks: item.remarks
        })) : []
      }
    })

    setFormData({
      deliveryNoteNumber: extractDnNumber(note.deliveryNoteNumber),  // Extract just the number part
      jobOrderId: note.jobOrderId || '',
      client: note.client || '',
      country: note.country || 'Qatar',
      division: note.division || '',
      department: note.department || '',
      refPoNumber: note.refPoNumber || '',
      jobSalesOrder: note.jobOrder?.jobNumber || '',
      shipmentTo: note.shipmentTo || '',
      comments: '',
      shipmentType: note.shipmentType || 'Land',
      representativeName: note.representativeName || '',
      representativeNo: note.representativeNo || '',
      qidNumber: note.qidNumber || '',
      vehicleNumber: note.vehicleNumber || '',
      vehicleType: note.vehicleType || 'NBTC',
      lineItems: lineItems
    })
    setEditingId(note.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery note?')) return

    try {
      const res = await fetch(`/api/delivery-notes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchDeliveryNotes()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handlePrint = (id: string) => {
    window.open(`/store/delivery-notes/${id}/print`, '_blank')
  }

  const handleView = (id: string) => {
    router.push(`/store/delivery-notes/${id}`)
  }

  const SearchableField = ({ label, field, value, placeholder }: { label: string; field: string; value: string; placeholder: string }) => {
    const suggestions = getSuggestions(field, value)
    const hasVisibleSuggestions = showSuggestions[field] && suggestions.length > 0
    
    return (
      <div className="relative">
        <Label className="font-semibold">{label}</Label>
        <Input
          value={value}
          onChange={(e) => {
            handleInputChange(field, e.target.value)
            setShowSuggestions(prev => ({ ...prev, [field]: true }))
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, [field]: false })), 200)}
          onFocus={() => value && setShowSuggestions(prev => ({ ...prev, [field]: true }))}
          placeholder={placeholder}
          className="mt-2"
          autoComplete="off"
        />
        {hasVisibleSuggestions && (
          <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-lg mt-1 shadow-lg z-10">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => applySuggestion(field, suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    console.log('Rendering loading state...')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading delivery notes...</p>
        </div>
      </div>
    )
  }

  console.log('Rendering main view, deliveryNotes.length:', deliveryNotes.length)
  const selectedJobOrder = jobOrders.find(jo => jo.id === formData.jobOrderId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Button */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Delivery Notes</h1>
            <p className="text-slate-600 mt-1 text-sm">Manage delivery of materials for job orders</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Button
                onClick={() => setShowNotifications(!showNotifications)}
                variant="outline"
                className={`bg-white relative ${notifications.length > 0 ? 'border-orange-500' : ''}`}
              >
                <span title={`${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}>
                  <Bell className={`h-4 w-4 ${notifications.length > 0 ? 'text-orange-500' : ''}`} />
                </span>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </Button>
              {showNotifications && notifications.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-semibold text-sm text-slate-900">Delivery Notifications</h3>
                  </div>
                  {notifications.map((notif, idx) => (
                    <div
                      key={idx}
                      className={`p-3 border-b border-slate-100 text-sm ${
                        notif.type === 'over-delivery' ? 'bg-red-50' : 'bg-orange-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {notif.type === 'over-delivery' ? (
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Bell className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={notif.type === 'over-delivery' ? 'text-red-800' : 'text-orange-800'}>
                          {notif.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() => router.push('/store/delivery-notes/print-settings')}
              variant="outline"
              className="bg-white"
            >
              <Settings className="mr-2 h-4 w-4" />
              Print Settings
            </Button>
            <Button
              onClick={() => {
                setShowForm(!showForm)
                if (showForm) resetForm()
                setEditingId(null)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? 'Cancel' : 'New Delivery Note'}
            </Button>
          </div>
        </div>

        {(readyLoading || readyInspections.length > 0) && (
          <Card className="mb-6 border-emerald-200 bg-emerald-50">
            <CardHeader className="py-3 bg-emerald-100">
              <CardTitle className="text-emerald-900 text-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Ready for Delivery Notes ({readyInspections.length})
              </CardTitle>
              <CardDescription className="text-emerald-700">
                Approved inspections ready for delivery note processing
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {readyLoading ? (
                <div className="px-3 py-3 text-sm text-emerald-700">Loading approvals...</div>
              ) : readyInspections.length === 0 ? (
                <div className="px-3 py-3 text-sm text-emerald-700">No approved inspections yet.</div>
              ) : (
                <div className="divide-y divide-emerald-200">
                  {readyInspections.map((inspection) => {
                    const jobOrder = inspection.jobOrderItem?.jobOrder
                    const approvedQty = getApprovedQty(inspection)
                    const totalQty = inspection.jobOrderItem?.quantity ?? 0
                    const unit = inspection.jobOrderItem?.unit || ''

                    return (
                      <div key={inspection.id} className="grid grid-cols-12 items-center gap-2 px-3 py-2 text-[12px]">
                        <div className="col-span-3">
                          <div className="font-semibold text-emerald-900">{jobOrder?.jobNumber || 'N/A'}</div>
                          <div className="text-[11px] text-emerald-700">{jobOrder?.clientName || 'N/A'}</div>
                        </div>
                        <div className="col-span-5 truncate text-emerald-800">
                          {inspection.jobOrderItem?.workDescription || 'N/A'}
                        </div>
                        <div className="col-span-2 text-emerald-700">
                          Approved: {approvedQty} / {totalQty} {unit}
                        </div>
                        <div className="col-span-1 text-emerald-700">
                          {new Date(inspection.createdAt).toLocaleDateString()}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startDeliveryNoteFromInspection(inspection)}
                            className="h-7 text-[11px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 border-emerald-300"
                          >
                            Start
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {dnRequests.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader className="py-3 bg-amber-100">
              <CardTitle className="text-amber-900 text-lg flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Delivery Note Print Requests ({dnRequests.length})
              </CardTitle>
              <CardDescription className="text-amber-700">Requests from Quality Inspection for DN issue</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-amber-200">
                {dnRequests.map((req) => (
                  <div key={req.id} className="grid grid-cols-12 items-center gap-2 px-3 py-2 text-[12px]">
                    <div className="col-span-3">
                      <div className="font-semibold text-amber-900">{req.jobOrder?.jobNumber || 'N/A'}</div>
                      <div className="text-[11px] text-amber-700">{req.jobOrder?.clientName || 'N/A'}</div>
                    </div>
                    <div className="col-span-5 truncate text-amber-800">
                      {req.jobOrderItem?.workDescription || 'N/A'}
                    </div>
                    <div className="col-span-2 text-amber-700">
                      {req.jobOrderItem?.quantity ?? 0} {req.jobOrderItem?.unit || ''}
                    </div>
                    <div className="col-span-1 text-amber-700">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markRequestCompleted(req.id)}
                        className="h-7 text-[11px] text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        {showForm && (
          <Card className="mb-6 shadow-lg">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{editingId ? 'Edit' : 'Create'} Delivery Note</CardTitle>
                  <p className="text-sm text-blue-700 mt-2">
                    <AlertTriangle className="inline-block w-4 h-4 mr-2" />
                    Ensure quality inspection is fully completed before creating delivery note
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Button
                      type="button"
                      onClick={() => setShowDraftMenu(!showDraftMenu)}
                      variant="outline"
                      size="sm"
                      className="bg-white"
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Drafts ({savedDrafts.length}/5)
                    </Button>
                    {showDraftMenu && (
                      <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-300 rounded-lg shadow-xl z-50">
                        <div className="p-4 border-b border-slate-200">
                          <h3 className="font-semibold text-sm mb-3">Save Current Form as Draft</h3>
                          <div className="flex gap-2">
                            <Input
                              value={draftName}
                              onChange={(e) => setDraftName(e.target.value)}
                              placeholder="Enter draft name..."
                              className="h-9 text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  saveDraft()
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={saveDraft}
                              size="sm"
                              disabled={savedDrafts.length >= 5 && !savedDrafts.some(d => d.name === draftName.trim())}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                          </div>
                          {savedDrafts.length >= 5 && !savedDrafts.some(d => d.name === draftName.trim()) && (
                            <p className="text-xs text-red-600 mt-2">Maximum 5 drafts reached. Delete a draft to save new one.</p>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm">Saved Drafts</h3>
                            {savedDrafts.length > 0 && (
                              <Button
                                type="button"
                                onClick={clearAllDrafts}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-xs"
                              >
                                Clear All
                              </Button>
                            )}
                          </div>
                          {savedDrafts.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">No saved drafts</p>
                          ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                              {savedDrafts.map((draft, index) => (
                                <div key={index} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{draft.name}</p>
                                      <p className="text-xs text-slate-500 mt-1">
                                        {new Date(draft.timestamp).toLocaleString()}
                                      </p>
                                      <p className="text-xs text-slate-600 mt-1">
                                        DN: {draft.data.deliveryNoteNumber ? formatDnNumber(draft.data.deliveryNoteNumber) : 'Not set'} • 
                                        Job: {draft.data.jobSalesOrder || 'Not set'} • 
                                        Items: {draft.data.lineItems?.length || 0}
                                      </p>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        type="button"
                                        onClick={() => loadDraft(draft)}
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-2"
                                      >
                                        Load
                                      </Button>
                                      <Button
                                        type="button"
                                        onClick={() => deleteDraft(draft.name)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-lg">
                          <Button
                            type="button"
                            onClick={() => setShowDraftMenu(false)}
                            variant="ghost"
                            size="sm"
                            className="w-full"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Close
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            {error && (
              <div className="bg-red-50 border-b border-red-200 px-4 py-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-semibold text-sm">Cannot Create Delivery Note</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-b border-green-200 px-4 py-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-green-800 font-semibold text-sm">{success}</p>
                </div>
              </div>
            )}
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Line 1: Delivery Note Number, Country, Division, Department */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                      <Label className="font-semibold text-xs">Delivery Note Number *</Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                          DN-
                        </div>
                        <Input
                          value={formData.deliveryNoteNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '') // Only allow digits
                            handleInputChange('deliveryNoteNumber', value)
                            setShowSuggestions(prev => ({ ...prev, dnNumber: true }))
                          }}
                          onFocus={() => {
                            setShowSuggestions(prev => ({ ...prev, dnNumber: true }))
                            if (dnSuggestions.length === 0) generateDnSuggestions()
                          }}
                          onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, dnNumber: false })), 200)}
                          placeholder="0001"
                          className="mt-1 h-9 text-sm pl-10 pr-16"
                          autoComplete="off"
                          maxLength={4}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                          /{new Date().getFullYear().toString().slice(-2)}
                        </div>
                      </div>
                      {formData.deliveryNoteNumber && (
                        <p className="text-xs text-slate-600 mt-1">
                          Preview: <span className="font-semibold">{formatDnNumber(formData.deliveryNoteNumber)}</span>
                        </p>
                      )}
                      {showSuggestions.dnNumber && dnSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-lg mt-1 shadow-lg z-50 max-h-60 overflow-y-auto">
                          {dnSuggestions
                            .filter(num => num.includes(formData.deliveryNoteNumber) || !formData.deliveryNoteNumber)
                            .map((num, idx) => {
                              const fullDn = formatDnNumber(num)
                              const exists = deliveryNotes.some(note => note.deliveryNoteNumber === fullDn)
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    handleInputChange('deliveryNoteNumber', num)
                                    setShowSuggestions(prev => ({ ...prev, dnNumber: false }))
                                  }}
                                  className={`w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex justify-between items-center ${
                                    exists ? 'bg-red-50 text-red-600' : ''
                                  }`}
                                  disabled={exists}
                                >
                                  <span>{fullDn}</span>
                                  {exists && <span className="text-xs">(Used)</span>}
                                </button>
                              )
                            })}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="font-semibold text-xs">Country</Label>
                      <Input
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="Country"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-xs">Division</Label>
                      <select
                        value={formData.division}
                        onChange={(e) => handleInputChange('division', e.target.value)}
                        className="mt-1 h-9 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      >
                        <option value="">Select Division</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Manufacturing">Manufacturing</option>
                      </select>
                    </div>
                    <div>
                      <Label className="font-semibold text-xs">Department</Label>
                      <Input
                        value={formData.department}
                        disabled
                        placeholder="Auto-filled"
                        className="mt-1 h-9 text-sm bg-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Line 2: Job Order, Client, Ref/PO */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="font-semibold text-xs">Job Order</Label>
                      <select
                        value={formData.jobOrderId}
                        onChange={(e) => handleJobOrderChange(e.target.value)}
                        className="w-full mt-1 h-9 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select Job Order --</option>
                        {jobOrders.map(jo => (
                          <option key={jo.id} value={jo.id}>
                            {jo.jobNumber} - {jo.productName}{jo.clientName ? ` | ${jo.clientName}` : ''}
                          </option>
                        ))}
                      </select>
                      {selectedJobOrder && (
                        <p className="mt-1 text-[10px] text-slate-500">
                          Client: {selectedJobOrder.clientName || 'N/A'}{selectedJobOrder.lpoContractNo ? ` • LPO: ${selectedJobOrder.lpoContractNo}` : ''}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="font-semibold text-xs">Client</Label>
                      <Input
                        value={formData.client}
                        onChange={(e) => handleInputChange('client', e.target.value)}
                        placeholder="Client name"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-xs">Ref/PO Number</Label>
                      <Input
                        value={formData.refPoNumber}
                        onChange={(e) => handleInputChange('refPoNumber', e.target.value)}
                        placeholder="PO Number"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Line 3: Line Items */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 text-sm">Line Items (from Job Order)</h3>
                  
                  {formData.lineItems.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-300 bg-slate-100">
                              <th className="text-left px-2 py-1 font-semibold w-[25%]">Line Item Description</th>
                              <th className="text-left px-2 py-1 font-semibold w-[8%]">Total Qty</th>
                              <th className="text-left px-2 py-1 font-semibold w-[8%]">Balance Qty</th>
                              <th className="text-left px-2 py-1 font-semibold w-[59%]">Sub Items (Description, Unit, Delivered Qty, Remarks)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.lineItems.map((item, lineIndex) => (
                              <React.Fragment key={item.id}>
                                {/* Parent Line Item Row */}
                                <tr className="border-b border-slate-200 bg-slate-50 font-semibold">
                                  <td className="px-2 py-1">
                                    <div className="text-xs font-semibold">{item.description}</div>
                                  </td>
                                  <td className="px-2 py-1">
                                    <div className="text-xs font-semibold text-slate-600">{item.totalQty}</div>
                                  </td>
                                  <td className="px-2 py-1">
                                    <div className="text-xs font-semibold text-blue-600">{item.balanceQty}</div>
                                  </td>
                                  <td className="px-2 py-1 text-right">
                                    <Button
                                      type="button"
                                      onClick={() => addSubItem(lineIndex)}
                                      className="bg-blue-500 hover:bg-blue-600 h-6 px-2 text-xs"
                                    >
                                      <Plus className="h-2 w-2 mr-1" />
                                      Add Sub Item
                                    </Button>
                                  </td>
                                </tr>

                                {/* Sub Items Rows */}
                                {item.subItems.map((subItem, subIndex) => (
                                  <tr key={subItem.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-2 py-1" colSpan={4}>
                                      <div className="flex gap-2 items-end pl-6">
                                        <div className="flex-1">
                                          <label className="text-[10px] text-slate-500 block mb-0.5">Sub Item Description</label>
                                          <Input
                                            value={subItem.subDescription}
                                            onChange={(e) => handleSubItemChange(lineIndex, subIndex, 'subDescription', e.target.value)}
                                            placeholder="Sub Item Description"
                                            className="text-xs h-7"
                                          />
                                        </div>
                                        <div className="w-24">
                                          <label className="text-[10px] text-slate-500 block mb-0.5">Unit</label>
                                          <Input
                                            value={subItem.unit}
                                            onChange={(e) => handleSubItemChange(lineIndex, subIndex, 'unit', e.target.value)}
                                            placeholder="Unit"
                                            className="text-xs h-7"
                                          />
                                        </div>
                                        <div className="w-24">
                                          <label className="text-[10px] text-slate-500 block mb-0.5">Del.Qty</label>
                                          <Input
                                            type="number"
                                            value={subItem.deliveredQuantity}
                                            onChange={(e) => handleSubItemChange(lineIndex, subIndex, 'deliveredQuantity', parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                            className="text-xs h-7"
                                          />
                                        </div>
                                        <div className="w-40">
                                          <label className="text-[10px] text-slate-500 block mb-0.5">Remarks</label>
                                          <Input
                                            value={subItem.remarks || ''}
                                            onChange={(e) => handleSubItemChange(lineIndex, subIndex, 'remarks', e.target.value)}
                                            placeholder="Remarks"
                                            className="text-xs h-7"
                                          />
                                        </div>
                                        <div className="w-8">
                                          <Button
                                            type="button"
                                            onClick={() => removeSubItem(lineIndex, subIndex)}
                                            className="bg-red-600 hover:bg-red-700 h-7 w-full p-0"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {(() => {
                        const allSameUnit = formData.lineItems.every(item => 
                          item.subItems.every(si => si.unit && si.unit === item.subItems[0]?.unit)
                        )
                        const totalDeliveryQty = formData.lineItems.reduce((sum, item) => 
                          sum + item.subItems.reduce((subSum, si) => subSum + (si.deliveredQuantity || 0), 0), 0
                        )
                        return allSameUnit && formData.lineItems.length > 0 && formData.lineItems[0].subItems[0]?.unit ? (
                          <div className="mt-2 text-right">
                            <span className="text-xs font-semibold text-slate-700">
                              Total Delivery Quantity: {totalDeliveryQty.toFixed(2)} {formData.lineItems[0].subItems[0]?.unit}
                            </span>
                          </div>
                        ) : null
                      })()}
                    </>
                  ) : (
                    <p className="text-slate-500 text-center py-4">Select a job order to auto-populate line items</p>
                  )}
                </div>

                {/* Line 4: Personnel & Vehicle */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <Label className="font-semibold text-xs">Representative Name</Label>
                      <Input
                        value={formData.representativeName}
                        onChange={(e) => handleInputChange('representativeName', e.target.value)}
                        placeholder="Name"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-xs">Representative No.</Label>
                      <Input
                        value={formData.representativeNo}
                        onChange={(e) => handleInputChange('representativeNo', e.target.value)}
                        placeholder="No."
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-xs">QID Number</Label>
                      <Input
                        value={formData.qidNumber}
                        onChange={(e) => handleInputChange('qidNumber', e.target.value)}
                        placeholder="QID"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-xs">Vehicle Number</Label>
                      <Input
                        value={formData.vehicleNumber}
                        onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                        placeholder="Vehicle No."
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-xs">Vehicle Type</Label>
                      <select
                        value={formData.vehicleType}
                        onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                        className="w-full mt-1 h-9 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="NBTC">NBTC</option>
                        <option value="CLIENT">Client</option>
                        <option value="THIRD_PARTY">Third Party</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {editingId ? 'Update' : 'Create'} Delivery Note
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                      setEditingId(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Delivery Notes List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Delivery Notes ({deliveryNotes.length})
            </CardTitle>
            <CardDescription>All delivery notes for material shipments</CardDescription>
          </CardHeader>
          <CardContent>
            {deliveryNotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No delivery notes created yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase w-12">Expand</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">DN Number</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Job Order</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Weight (KG)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {deliveryNotes.map(note => {
                      const isExpanded = expandedNotes.has(note.id)
                      return (
                        <React.Fragment key={note.id}>
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const newExpanded = new Set(expandedNotes)
                                  if (isExpanded) {
                                    newExpanded.delete(note.id)
                                  } else {
                                    newExpanded.add(note.id)
                                  }
                                  setExpandedNotes(newExpanded)
                                }}
                                className="h-6 w-6 p-0"
                              >
                                {isExpanded ? '▼' : '▶'}
                              </Button>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900">{note.deliveryNoteNumber}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{note.jobOrder?.jobNumber || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{note.client || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-slate-900">{note.totalQuantity}</td>
                            <td className="px-4 py-3 text-sm text-slate-900">{note.totalWeight}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                note.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                note.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {note.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleView(note.id)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePrint(note.id)}
                                  title="Print"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(note)}
                                  className="text-blue-600"
                                  title="Edit"
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(note.id)}
                                  className="text-red-600"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className="px-4 py-3 bg-slate-50">
                                <div className="ml-8">
                                  <div className="flex gap-6 mb-3 text-sm">
                                    <div><span className="font-semibold">Delivery Note Number:</span> {note.deliveryNoteNumber}</div>
                                    <div><span className="font-semibold">Date:</span> {new Date(note.createdAt).toLocaleDateString()}</div>
                                    <div><span className="font-semibold">Status:</span> <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      note.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                      note.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>{note.status}</span></div>
                                    <div><span className="font-semibold">Job Order No.:</span> {note.jobOrder?.jobNumber || 'N/A'}</div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-xs text-slate-700">
                                    <div><span className="font-semibold">Representative Name:</span> {note.representativeName || 'N/A'}</div>
                                    <div><span className="font-semibold">Representative No.:</span> {note.representativeNo || 'N/A'}</div>
                                    <div><span className="font-semibold">QID Number:</span> {note.qidNumber || 'N/A'}</div>
                                    <div><span className="font-semibold">Vehicle Number:</span> {note.vehicleNumber || 'N/A'}</div>
                                    <div><span className="font-semibold">Vehicle Type:</span> {note.vehicleType || 'N/A'}</div>
                                    <div><span className="font-semibold">Shipment Type:</span> {note.shipmentType || 'N/A'}</div>
                                  </div>
                                  {note.items && note.items.length > 0 ? (
                                    <>
                                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Line Items:</h4>
                                  <table className="w-full border border-slate-200">
                                    <thead className="bg-slate-200">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Description</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Unit</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Total Qty</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Delivered Qty</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Balance Qty</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Remarks</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                      {(() => {
                                        // Group items by jobOrderItemId to show aggregated data
                                        const groupedItems = note.items.reduce((acc: any, item: any) => {
                                          const key = item.jobOrderItemId || item.itemDescription
                                          if (!acc[key]) {
                                            acc[key] = {
                                              jobOrderItemId: item.jobOrderItemId,
                                              description: item.itemDescription,
                                              unit: item.unit,
                                              totalQty: item.quantity,
                                              deliveredQty: 0,
                                              remarks: []
                                            }
                                          }
                                          acc[key].deliveredQty += item.deliveredQuantity || 0
                                          if (item.remarks) acc[key].remarks.push(item.remarks)
                                          return acc
                                        }, {})

                                        // Calculate cumulative delivered quantities for balance
                                        const cumulativeDelivered: Record<string, number> = {}
                                        
                                        // Get all delivery notes for this job order up to current note
                                        const currentNoteIndex = deliveryNotes.findIndex(dn => dn.id === note.id)
                                        const previousNotes = deliveryNotes.slice(currentNoteIndex)
                                        
                                        previousNotes.forEach((dn: any) => {
                                          if (dn.jobOrderId === note.jobOrderId && dn.items) {
                                            dn.items.forEach((item: any) => {
                                              if (item.jobOrderItemId) {
                                                if (!cumulativeDelivered[item.jobOrderItemId]) {
                                                  cumulativeDelivered[item.jobOrderItemId] = 0
                                                }
                                                cumulativeDelivered[item.jobOrderItemId] += item.deliveredQuantity || 0
                                              }
                                            })
                                          }
                                        })

                                        return Object.values(groupedItems).map((item: any, idx: number) => {
                                          const totalDelivered = cumulativeDelivered[item.jobOrderItemId] || item.deliveredQty
                                          const balance = item.totalQty - totalDelivered
                                          const deliveryPercent = (totalDelivered / item.totalQty) * 100
                                          const isOverDelivered = balance < 0
                                          const isHighDelivery = deliveryPercent >= 80 && !isOverDelivered
                                          
                                          return (
                                            <tr key={idx} className={isOverDelivered ? 'bg-red-50' : isHighDelivery ? 'bg-orange-50' : ''}>
                                              <td className="px-3 py-2 text-sm text-slate-900">{item.description}</td>
                                              <td className="px-3 py-2 text-sm text-slate-600">{item.unit}</td>
                                              <td className="px-3 py-2 text-sm text-slate-900">{item.totalQty}</td>
                                              <td className="px-3 py-2 text-sm text-slate-900 font-medium">{item.deliveredQty}</td>
                                              <td className={`px-3 py-2 text-sm font-medium ${
                                                isOverDelivered ? 'text-red-600' : isHighDelivery ? 'text-orange-600' : 'text-blue-600'
                                              }`}>
                                                {balance}
                                                {isOverDelivered && (
                                                  <span className="ml-2 inline-flex items-center">
                                                    <AlertTriangle className="h-3 w-3 text-red-600" />
                                                  </span>
                                                )}
                                                {isHighDelivery && (
                                                  <span className="ml-1 text-xs">({deliveryPercent.toFixed(0)}%)</span>
                                                )}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-slate-600">{item.remarks.join(', ') || '-'}</td>
                                            </tr>
                                          )
                                        })
                                      })()}
                                    </tbody>
                                  </table>
                                    </>
                                  ) : (
                                    <p className="text-xs text-slate-500">No line items available.</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
