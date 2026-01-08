'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, FileText, Printer, Trash2, Eye, Settings } from 'lucide-react'

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

export default function DeliveryNotesPage() {
  const router = useRouter()
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([])
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({})
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [dnSuggestions, setDnSuggestions] = useState<string[]>([])

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
    fetchDeliveryNotes()
    fetchJobOrders()
  }, [])

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

    // Generate 5 previous and 5 next numbers
    const suggestions: string[] = []
    const startNum = Math.max(1, maxNumber - 4)
    for (let i = startNum; i <= maxNumber + 5; i++) {
      suggestions.push(`DN-${i.toString().padStart(4, '0')}/${currentYear}`)
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
      const res = await fetch('/api/delivery-notes')
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      const data = await res.json()
      setDeliveryNotes(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch delivery notes:', error)
      setDeliveryNotes([])
      setLoading(false)
    }
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
      alert('Delivery Note Number is required')
      return
    }

    try {
      const url = editingId ? `/api/delivery-notes/${editingId}` : '/api/delivery-notes'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save delivery note')
      }

      setShowForm(false)
      setEditingId(null)
      resetForm()
      fetchDeliveryNotes()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      deliveryNoteNumber: note.deliveryNoteNumber,
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
      representativeName: '',
      representativeNo: '',
      qidNumber: '',
      vehicleNumber: '',
      vehicleType: 'NBTC',
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading delivery notes...</p>
        </div>
      </div>
    )
  }

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

        {/* Form */}
        {showForm && (
          <Card className="mb-6 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{editingId ? 'Edit' : 'Create'} Delivery Note</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Line 1: Delivery Note Number, Country, Division, Department */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                      <Label className="font-semibold text-xs">Delivery Note Number *</Label>
                      <Input
                        value={formData.deliveryNoteNumber}
                        onChange={(e) => {
                          handleInputChange('deliveryNoteNumber', e.target.value)
                          setShowSuggestions(prev => ({ ...prev, dnNumber: true }))
                        }}
                        onFocus={() => {
                          setShowSuggestions(prev => ({ ...prev, dnNumber: true }))
                          if (dnSuggestions.length === 0) generateDnSuggestions()
                        }}
                        onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, dnNumber: false })), 200)}
                        placeholder="e.g., DN-0001/26"
                        className="mt-1 h-9 text-sm"
                        autoComplete="off"
                      />
                      {showSuggestions.dnNumber && dnSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-lg mt-1 shadow-lg z-50 max-h-60 overflow-y-auto">
                          {dnSuggestions
                            .filter(dn => dn.toLowerCase().includes(formData.deliveryNoteNumber.toLowerCase()) || !formData.deliveryNoteNumber)
                            .map((dn, idx) => {
                              const exists = deliveryNotes.some(note => note.deliveryNoteNumber === dn)
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    handleInputChange('deliveryNoteNumber', dn)
                                    setShowSuggestions(prev => ({ ...prev, dnNumber: false }))
                                  }}
                                  className={`w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex justify-between items-center ${
                                    exists ? 'bg-red-50 text-red-600' : ''
                                  }`}
                                  disabled={exists}
                                >
                                  <span>{dn}</span>
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

                {/* Line 2: Client, Ref/PO, Job Order */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    <div>
                      <Label className="font-semibold text-xs">Job Order</Label>
                      <select
                        value={formData.jobOrderId}
                        onChange={(e) => handleJobOrderChange(e.target.value)}
                        className="w-full mt-1 h-9 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select Job Order --</option>
                        {jobOrders.map(jo => (
                          <option key={jo.id} value={jo.id}>{jo.jobNumber} - {jo.productName}</option>
                        ))}
                      </select>
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
                          {isExpanded && note.items && note.items.length > 0 && (
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
                                          
                                          return (
                                            <tr key={idx}>
                                              <td className="px-3 py-2 text-sm text-slate-900">{item.description}</td>
                                              <td className="px-3 py-2 text-sm text-slate-600">{item.unit}</td>
                                              <td className="px-3 py-2 text-sm text-slate-900">{item.totalQty}</td>
                                              <td className="px-3 py-2 text-sm text-slate-900 font-medium">{item.deliveredQty}</td>
                                              <td className="px-3 py-2 text-sm text-blue-600 font-medium">
                                                {balance}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-slate-600">{item.remarks.join(', ') || '-'}</td>
                                            </tr>
                                          )
                                        })
                                      })()}
                                    </tbody>
                                  </table>
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
