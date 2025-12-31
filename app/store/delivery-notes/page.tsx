'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, FileText, Printer, Trash2, Eye } from 'lucide-react'

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
      subDescription?: string
      unit: string
      quantity: number
      deliveredQuantity: number
      remarks?: string
    }>
  })

  useEffect(() => {
    fetchDeliveryNotes()
    fetchJobOrders()
  }, [])

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

  const handleJobOrderChange = (jobOrderId: string) => {
    setFormData(prev => ({ ...prev, jobOrderId }))
    
    // Auto-fill from selected job order
    const selectedJobOrder = jobOrders.find(jo => jo.id === jobOrderId)
    if (selectedJobOrder) {
      // Extract line items from job order
      const lineItems = (selectedJobOrder.items || []).map((item: any) => ({
        id: item.id || `temp-${Math.random()}`,
        jobOrderItemId: item.id,
        description: item.workDescription || '',
        unit: item.unit || '',
        quantity: item.quantity || 0,
        deliveredQuantity: 0,
        remarks: ''
      }))

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

  const handleLineItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const items = [...prev.lineItems]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, lineItems: items }
    })
  }

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, {
        id: `temp-${Math.random()}`,
        description: '',
        subDescription: '',
        unit: '',
        quantity: 0,
        deliveredQuantity: 0,
        remarks: ''
      }]
    }))
  }

  const removeLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }))
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

  const handleEdit = (note: DeliveryNote) => {
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
      lineItems: []
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Delivery Notes</h1>
          <p className="text-slate-600 mt-2">Manage delivery of materials for job orders</p>
        </div>

        {/* Create Button */}
        <div className="mb-6">
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
                    <div>
                      <Label className="font-semibold text-xs">Delivery Note Number *</Label>
                      <Input
                        value={formData.deliveryNoteNumber}
                        onChange={(e) => handleInputChange('deliveryNoteNumber', e.target.value)}
                        placeholder="e.g., 15767/25"
                        className="mt-1 h-9 text-sm"
                      />
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-sm">Line Items</h3>
                    <Button
                      type="button"
                      onClick={addLineItem}
                      className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  
                  {formData.lineItems.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-300 bg-slate-100">
                              <th className="text-left px-2 py-1 font-semibold w-[35%]">Description</th>
                              <th className="text-left px-2 py-1 font-semibold w-[8%]">Unit</th>
                              <th className="text-left px-2 py-1 font-semibold w-[10%]">Total Qty</th>
                              <th className="text-left px-2 py-1 font-semibold w-[10%]">Delivery Qty</th>
                              <th className="text-left px-2 py-1 font-semibold w-[22%]">Remarks</th>
                              <th className="text-center px-2 py-1 font-semibold w-[5%]">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.lineItems.map((item, index) => (
                              <React.Fragment key={item.id}>
                                <tr className="border-b border-slate-200 hover:bg-slate-50">
                                  <td className="px-2 py-1">
                                    <Input
                                      value={item.description}
                                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                      placeholder="Description"
                                      className="text-xs h-8 mb-1"
                                    />
                                    <Input
                                      value={item.subDescription || ''}
                                      onChange={(e) => handleLineItemChange(index, 'subDescription', e.target.value)}
                                      placeholder="Sub Description"
                                      className="text-xs h-7 text-slate-600 bg-slate-50"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <Input
                                      value={item.unit}
                                      onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                                      placeholder="Unit"
                                      className="text-xs h-8 w-full"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                      placeholder="0"
                                      className="text-xs h-8 w-full"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <Input
                                      type="number"
                                      value={item.deliveredQuantity}
                                      onChange={(e) => handleLineItemChange(index, 'deliveredQuantity', parseFloat(e.target.value) || 0)}
                                      placeholder="0"
                                      className="text-xs h-8 w-full"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <Input
                                      value={item.remarks || ''}
                                      onChange={(e) => handleLineItemChange(index, 'remarks', e.target.value)}
                                      placeholder="Remarks"
                                      className="text-xs h-8"
                                    />
                                  </td>
                                  <td className="px-2 py-1 text-center">
                                    <Button
                                      type="button"
                                      onClick={() => removeLineItem(index)}
                                      className="bg-red-600 hover:bg-red-700 h-7 w-7 p-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </td>
                                </tr>
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {(() => {
                        const allSameUnit = formData.lineItems.every((item, _, arr) => item.unit && item.unit === arr[0].unit)
                        const totalDeliveryQty = formData.lineItems.reduce((sum, item) => sum + (item.deliveredQuantity || 0), 0)
                        return allSameUnit && formData.lineItems.length > 0 && formData.lineItems[0].unit ? (
                          <div className="mt-2 text-right">
                            <span className="text-xs font-semibold text-slate-700">
                              Total Delivery Quantity: {totalDeliveryQty.toFixed(2)} {formData.lineItems[0].unit}
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
                    {deliveryNotes.map(note => (
                      <tr key={note.id} className="hover:bg-slate-50 transition-colors">
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
                          {new Date(note.createdAt).toLocaleDateString()}
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
                    ))}
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
