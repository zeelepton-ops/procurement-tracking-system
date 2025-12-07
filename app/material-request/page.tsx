'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Package, Clock, AlertTriangle } from 'lucide-react'

interface JobOrder {
  id: string
  jobNumber: string
  productName: string
  drawingRef: string | null
}

interface InventoryItem {
  id: string
  itemName: string
  currentStock: number
  unit: string
}

export default function MaterialRequestPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    jobOrderId: '',
    materialType: 'RAW_MATERIAL',
    itemName: '',
    description: '',
    quantity: '',
    unit: 'KG',
    reasonForRequest: '',
    requiredDate: '',
    preferredSupplier: '',
    stockQtyInInventory: '0',
    urgencyLevel: 'NORMAL',
    requestedBy: 'Production Team'
  })

  useEffect(() => {
    fetchJobOrders()
    fetchInventory()
  }, [])

  const fetchJobOrders = async () => {
    try {
      const res = await fetch('/api/job-orders')
      const data = await res.json()
      setJobOrders(data)
    } catch (error) {
      console.error('Failed to fetch job orders:', error)
    }
  }

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory')
      const data = await res.json()
      setInventory(data)
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    }
  }

  const handleItemNameChange = (itemName: string) => {
    const inventoryItem = inventory.find(item => item.itemName === itemName)
    if (inventoryItem) {
      setFormData(prev => ({
        ...prev,
        itemName,
        unit: inventoryItem.unit,
        stockQtyInInventory: inventoryItem.currentStock.toString()
      }))
    } else {
      setFormData(prev => ({ ...prev, itemName }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/material-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setSuccess(true)
        // Reset form
        setFormData({
          jobOrderId: '',
          materialType: 'RAW_MATERIAL',
          itemName: '',
          description: '',
          quantity: '',
          unit: 'KG',
          reasonForRequest: '',
          requiredDate: '',
          preferredSupplier: '',
          stockQtyInInventory: '0',
          urgencyLevel: 'NORMAL',
          requestedBy: 'Production Team'
        })
        
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to create material request:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Material Request Entry</h1>
          <p className="text-slate-600">Request raw materials and consumables for job orders</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">Material request submitted successfully!</p>
          </div>
        )}

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              New Material Request
            </CardTitle>
            <CardDescription className="text-blue-100">
              Fill out the form below to request materials for production
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Order Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Job Order *
                  </label>
                  <Select
                    value={formData.jobOrderId}
                    onChange={(e) => setFormData({ ...formData, jobOrderId: e.target.value })}
                    required
                  >
                    <option value="">Select Job Order</option>
                    {jobOrders.map(jo => (
                      <option key={jo.id} value={jo.id}>
                        {jo.jobNumber} - {jo.productName}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Material Type *
                  </label>
                  <Select
                    value={formData.materialType}
                    onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                    required
                  >
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="CONSUMABLE">Consumable</option>
                  </Select>
                </div>
              </div>

              {/* Item Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Item Name *
                  </label>
                  <Input
                    value={formData.itemName}
                    onChange={(e) => handleItemNameChange(e.target.value)}
                    placeholder="e.g., Steel Plate, Welding Rod"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Current Stock in Inventory
                  </label>
                  <Input
                    type="number"
                    value={formData.stockQtyInInventory}
                    onChange={(e) => setFormData({ ...formData, stockQtyInInventory: e.target.value })}
                    placeholder="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description, specifications, grade, etc."
                  rows={3}
                  required
                />
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantity *
                  </label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unit *
                  </label>
                  <Select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                  >
                    <option value="KG">Kilograms (KG)</option>
                    <option value="TON">Tons</option>
                    <option value="PCS">Pieces (PCS)</option>
                    <option value="METER">Meters</option>
                    <option value="LITER">Liters</option>
                    <option value="BOX">Box</option>
                    <option value="SET">Set</option>
                  </Select>
                </div>
              </div>

              {/* Reason and Dates */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Request *
                </label>
                <Textarea
                  value={formData.reasonForRequest}
                  onChange={(e) => setFormData({ ...formData, reasonForRequest: e.target.value })}
                  placeholder="Explain why this material is needed"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Required Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.requiredDate}
                    onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Urgency Level *
                  </label>
                  <Select
                    value={formData.urgencyLevel}
                    onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value })}
                    required
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preferred Supplier (Optional)
                </label>
                <Input
                  value={formData.preferredSupplier}
                  onChange={(e) => setFormData({ ...formData, preferredSupplier: e.target.value })}
                  placeholder="Enter preferred supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Requested By *
                </label>
                <Input
                  value={formData.requestedBy}
                  onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                  placeholder="Your name or department"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Material Request'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
