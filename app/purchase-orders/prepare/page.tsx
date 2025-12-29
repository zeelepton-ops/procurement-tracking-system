'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { AlertCircle, Plus, Trash2 } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  paymentTerms?: string
  leadTimeDays?: number
  contacts?: Array<{ id: string; name: string; email?: string; phone?: string; role?: string; isPrimary?: boolean }>
}

interface POItem {
  materialRequestId: string
  description: string
  quantity: number
  unit: string
}

interface POData {
  supplierId: string
  items: POItem[]
}

export default function PreparePO() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [supplierContact, setSupplierContact] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [poNumber, setPONumber] = useState('')
  const [items, setItems] = useState<POItem[]>([{ materialRequestId: '', description: '', quantity: 1, unit: 'PCS' }])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [preps, setPreps] = useState<any[]>([])

  useEffect(() => {
    fetchSuppliers()
    fetchPreps()
  }, [])

  async function fetchSuppliers() {
    try {
      const res = await fetch('/api/suppliers')
      const data = await res.json()
      setSuppliers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
      setMessage('Failed to load suppliers')
    }
  }

  async function fetchPreps() {
    try {
      const res = await fetch('/api/po-prep')
      const data = await res.json()
      setPreps(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch preps:', error)
    }
  }

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    setSelectedSupplier(supplier || null)
    
    if (supplier) {
      // Auto-populate contact information
      const primaryContact = supplier.contacts?.find(c => c.isPrimary) || supplier.contacts?.[0]
      setSupplierContact(primaryContact?.email || supplier.email || '')
      setPaymentTerms(supplier.paymentTerms || '')
    }
  }

  const addItemRow = () => {
    setItems([...items, { materialRequestId: '', description: '', quantity: 1, unit: 'PCS' }])
  }

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItemField = (index: number, field: string, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const createPO = async () => {
    if (!selectedSupplier) {
      setMessage('Please select a supplier')
      return
    }

    if (!poNumber) {
      setMessage('Please enter a PO number')
      return
    }

    if (items.some(item => !item.description || !item.quantity)) {
      setMessage('Please fill in all item details')
      return
    }

    setLoading(true)
    try {
      const poData = {
        poNumber,
        supplierName: selectedSupplier.name,
        supplierContact,
        paymentTerms,
        expectedDelivery: new Date(new Date().getTime() + (selectedSupplier.leadTimeDays || 14) * 24 * 60 * 60 * 1000).toISOString(),
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: 0,
          totalPrice: 0
        }))
      }

      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create PO')
      }

      setMessage('PO created successfully!')
      setPONumber('')
      setSelectedSupplier(null)
      setSupplierContact('')
      setPaymentTerms('')
      setItems([{ materialRequestId: '', description: '', quantity: 1, unit: 'PCS' }])
      
      setTimeout(() => setMessage(''), 3000)
      fetchPreps()
    } catch (error) {
      console.error('Failed to create PO:', error)
      setMessage(error instanceof Error ? error.message : 'Failed to create PO')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Create Purchase Order</h1>
        <p className="text-slate-600 text-sm">Select a supplier and add items to create a new PO</p>
      </div>

      {message && (
        <div className={`p-3 rounded text-sm ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">PO Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">PO Number</Label>
              <Input
                value={poNumber}
                onChange={(e) => setPONumber(e.target.value)}
                placeholder="PO-2025-001"
                disabled={loading}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Supplier *</Label>
              <Select
                value={selectedSupplier?.id || ''}
                onChange={(e) => handleSupplierChange(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Contact Person</Label>
              <Input
                value={supplierContact}
                onChange={(e) => setSupplierContact(e.target.value)}
                placeholder={selectedSupplier?.contactPerson || 'Contact email or person'}
                disabled={loading}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Payment Terms</Label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g., Net 30, Cash on Delivery"
                disabled={loading}
              />
            </div>
          </div>

          {selectedSupplier && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <div className="font-semibold text-blue-900">Selected Supplier Details:</div>
              <div className="text-blue-800 mt-2 space-y-1">
                {selectedSupplier.address && <div><span className="font-medium">Address:</span> {selectedSupplier.address}</div>}
                {selectedSupplier.phone && <div><span className="font-medium">Phone:</span> {selectedSupplier.phone}</div>}
                {selectedSupplier.leadTimeDays && <div><span className="font-medium">Lead Time:</span> {selectedSupplier.leadTimeDays} days</div>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
          <CardDescription>Add items to include in this purchase order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs text-slate-600">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItemField(idx, 'description', e.target.value)}
                    placeholder="Item description"
                    disabled={loading}
                  />
                </div>
                <div className="w-24">
                  <Label className="text-xs text-slate-600">Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItemField(idx, 'quantity', Number(e.target.value))}
                    placeholder="1"
                    disabled={loading}
                  />
                </div>
                <div className="w-20">
                  <Label className="text-xs text-slate-600">Unit</Label>
                  <Select
                    value={item.unit}
                    onChange={(e) => updateItemField(idx, 'unit', e.target.value)}
                    disabled={loading}
                  >
                    <option value="PCS">PCS</option>
                    <option value="KG">KG</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="BOX">BOX</option>
                  </Select>
                </div>
                <Button
                  onClick={() => removeItemRow(idx)}
                  variant="outline"
                  size="sm"
                  className="h-9"
                  disabled={items.length === 1 || loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              onClick={addItemRow}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          onClick={createPO}
          className="bg-green-600 hover:bg-green-700"
          disabled={loading || !selectedSupplier}
        >
          {loading ? 'Creating...' : 'Create PO'}
        </Button>
      </div>

      {preps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent POs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {preps.slice(0, 5).map(prep => (
                <div key={prep.id} className="text-sm p-2 bg-slate-50 rounded">
                  <div className="font-medium text-slate-800">{prep.id}</div>
                  <div className="text-slate-600">{new Date(prep.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}