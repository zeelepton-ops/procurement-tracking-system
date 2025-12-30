'use client'

import { useState, useEffect } from 'react'
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
  fabrication: string | null
  refPoNumber: string | null
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
    country: '',
    division: '',
    department: '',
    fabrication: '',
    refPoNumber: '',
    jobSalesOrder: '',
    shipmentTo: '',
    comments: '',
    shipmentType: '',
    representativeName: '',
    representativeNo: '',
    qidNumber: '',
    vehicleNumber: '',
    vehicleType: 'NBTC'
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
      setJobOrders(Array.isArray(data) ? data : [])
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
      setFormData(prev => ({
        ...prev,
        jobSalesOrder: selectedJobOrder.jobNumber,
        client: selectedJobOrder.clientName || prev.client,
        refPoNumber: prev.refPoNumber
      }))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
      country: '',
      division: '',
      department: '',
      fabrication: '',
      refPoNumber: '',
      jobSalesOrder: '',
      shipmentTo: '',
      comments: '',
      shipmentType: '',
      representativeName: '',
      representativeNo: '',
      qidNumber: '',
      vehicleNumber: '',
      vehicleType: 'NBTC'
    })
    setShowSuggestions({})
  }

  const handleEdit = (note: DeliveryNote) => {
    setFormData({
      deliveryNoteNumber: note.deliveryNoteNumber,
      jobOrderId: note.jobOrderId || '',
      client: note.client || '',
      country: note.country || '',
      division: note.division || '',
      department: note.department || '',
      fabrication: note.fabrication || '',
      refPoNumber: note.refPoNumber || '',
      jobSalesOrder: note.jobOrder?.jobNumber || '',
      shipmentTo: '',
      comments: '',
      shipmentType: '',
      representativeName: '',
      representativeNo: '',
      qidNumber: '',
      vehicleNumber: '',
      vehicleType: 'NBTC'
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
            <CardHeader>
              <CardTitle>{editingId ? 'Edit' : 'Create'} Delivery Note</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Delivery Note Number and Job Order */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4">Delivery Note Header</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Delivery Note Number *</Label>
                      <Input
                        value={formData.deliveryNoteNumber}
                        onChange={(e) => handleInputChange('deliveryNoteNumber', e.target.value)}
                        placeholder="e.g., 15767/25"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold">Job Order</Label>
                      <select
                        value={formData.jobOrderId}
                        onChange={(e) => handleJobOrderChange(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select Job Order --</option>
                        {jobOrders.map(jo => (
                          <option key={jo.id} value={jo.id}>{jo.jobNumber} - {jo.productName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Client and Header Information */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4">Client & Project Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="font-semibold">Client</Label>
                      <Input
                        value={formData.client}
                        onChange={(e) => handleInputChange('client', e.target.value)}
                        placeholder="Client name"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold">Country</Label>
                      <Input
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="Country"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold">Division</Label>
                      <Input
                        value={formData.division}
                        onChange={(e) => handleInputChange('division', e.target.value)}
                        placeholder="Division"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <Label className="font-semibold">Department</Label>
                      <Input
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        placeholder="Department"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold">Fabrication</Label>
                      <Input
                        value={formData.fabrication}
                        onChange={(e) => handleInputChange('fabrication', e.target.value)}
                        placeholder="Fabrication"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold">Ref/PO Number</Label>
                      <Input
                        value={formData.refPoNumber}
                        onChange={(e) => handleInputChange('refPoNumber', e.target.value)}
                        placeholder="PO Number"
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Shipment Details */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4">Shipment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Shipment To</Label>
                      <Input
                        value={formData.shipmentTo}
                        onChange={(e) => handleInputChange('shipmentTo', e.target.value)}
                        placeholder="Shipment location"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold">Shipment Type</Label>
                      <Input
                        value={formData.shipmentType}
                        onChange={(e) => handleInputChange('shipmentType', e.target.value)}
                        placeholder="e.g., AIR, SEA, LAND"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="font-semibold">Comments</Label>
                    <Textarea
                      value={formData.comments}
                      onChange={(e) => handleInputChange('comments', e.target.value)}
                      placeholder="Additional comments"
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Section 4: Personnel & QID */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4">Personnel Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="font-semibold">Representative Name</Label>
                      <Input
                        value={formData.representativeName}
                        onChange={(e) => handleInputChange('representativeName', e.target.value)}
                        placeholder="Name"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold">Representative No.</Label>
                      <Input
                        value={formData.representativeNo}
                        onChange={(e) => handleInputChange('representativeNo', e.target.value)}
                        placeholder="No."
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold">QID Number</Label>
                      <Input
                        value={formData.qidNumber}
                        onChange={(e) => handleInputChange('qidNumber', e.target.value)}
                        placeholder="QID"
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 5: Vehicle Details */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4">Vehicle Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Vehicle Number</Label>
                      <Input
                        value={formData.vehicleNumber}
                        onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                        placeholder="Vehicle No."
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold">Vehicle Type</Label>
                      <select
                        value={formData.vehicleType}
                        onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
