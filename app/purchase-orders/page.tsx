'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Plus, X, Download, Trash2, Eye, Edit2 } from 'lucide-react'

interface MaterialRequest {
  id: string
  requestNumber: string
  itemName: string
  description: string
  quantity: number
  unit: string
  status: string
  items?: Array<{
    id: string
    itemName: string
    description: string
    quantity: number
    unit: string
  }>
}

interface PurchaseOrderItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  materialRequestId: string
}

interface PurchaseOrder {
  id: string
  poNumber: string
  supplierName: string
  supplierContact?: string
  orderDate: string
  expectedDelivery?: string
  status: string
  purchaseOrderItems: PurchaseOrderItem[]
  createdAt: string
}

export default function PurchaseOrdersPage() {
  const { data: session } = useSession()
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [isViewingPO, setIsViewingPO] = useState(false)
  const [isEditingPO, setIsEditingPO] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    poNumber: '',
    supplierName: '',
    supplierContact: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDelivery: ''
  })

  const [selectedItems, setSelectedItems] = useState<
    Array<{
      materialRequestId: string
      description: string
      quantity: number
      unit: string
      unitPrice: number
    }>
  >([])

  // Fetch data
  useEffect(() => {
    fetchPurchaseOrders()
    fetchMaterialRequests()
  }, [])

  async function fetchPurchaseOrders() {
    try {
      const res = await fetch('/api/purchase-orders')
      const data = await res.json()
      setPos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch POs:', error)
    }
  }

  async function fetchMaterialRequests() {
    try {
      const res = await fetch('/api/material-requests?pageSize=1000')
      const data = await res.json()
      setMaterialRequests(
        Array.isArray(data)
          ? data.filter((mr: any) => mr.status !== 'RECEIVED' && mr.status !== 'CANCELLED')
          : []
      )
    } catch (error) {
      console.error('Failed to fetch material requests:', error)
    }
  }

  async function createPurchaseOrder() {
    if (!formData.poNumber.trim() || !formData.supplierName.trim() || selectedItems.length === 0) {
      alert('Please fill in all required fields and select at least one item')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: selectedItems
        })
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to create PO')
        return
      }

      setFormData({
        poNumber: '',
        supplierName: '',
        supplierContact: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDelivery: ''
      })
      setSelectedItems([])
      setShowCreateForm(false)
      fetchPurchaseOrders()
      alert('Purchase Order created successfully!')
    } catch (error) {
      console.error('Failed to create PO:', error)
      alert('Failed to create purchase order')
    } finally {
      setLoading(false)
    }
  }

  function addItemToOrder(mr: MaterialRequest) {
    if (selectedItems.find((it) => it.materialRequestId === mr.id)) {
      alert('Item already added')
      return
    }

    const itemsToAdd = mr.items && mr.items.length > 0 ? mr.items : [{ id: mr.id, itemName: mr.itemName, description: mr.description, quantity: mr.quantity, unit: mr.unit }]

    itemsToAdd.forEach((item) => {
      setSelectedItems((prev) => [
        ...prev,
        {
          materialRequestId: item.id,
          description: `${item.itemName} - ${item.description}`,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: 0
        }
      ])
    })
  }

  function removeItemFromOrder(index: number) {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItemPrice(index: number, unitPrice: number) {
    setSelectedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, unitPrice, totalPrice: item.quantity * unitPrice } : item
      )
    )
  }

  async function deletePO(id: string) {
    if (!confirm('Are you sure you want to delete this PO?')) return

    try {
      const res = await fetch(`/api/purchase-orders?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchPurchaseOrders()
        alert('PO deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete PO:', error)
      alert('Failed to delete PO')
    }
  }

  function generatePOPDF(po: PurchaseOrder) {
    // Simple text-based PDF generation
    const content = `
PURCHASE ORDER

PO Number: ${po.poNumber}
Supplier: ${po.supplierName}
Contact: ${po.supplierContact || 'N/A'}
Order Date: ${new Date(po.orderDate).toLocaleDateString()}
Expected Delivery: ${po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : 'N/A'}

ITEMS:
${po.purchaseOrderItems
  .map(
    (item, idx) => `
${idx + 1}. ${item.description}
   Qty: ${item.quantity} ${item.unit}
   Unit Price: ${item.unitPrice.toFixed(2)}
   Total: ${item.totalPrice.toFixed(2)}
`
  )
  .join('')}

TOTAL: ${po.purchaseOrderItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}

Generated: ${new Date().toLocaleString()}
`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PO-${po.poNumber}.txt`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Purchase Orders</h1>
            <p className="text-slate-600">Create and manage purchase orders for suppliers</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {showCreateForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                New PO
              </>
            )}
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-6 border-blue-100 bg-blue-50">
            <CardHeader>
              <CardTitle>Create Purchase Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>PO Number *</Label>
                  <Input
                    value={formData.poNumber}
                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    placeholder="PO-2025-001"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Supplier Name *</Label>
                  <Input
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    placeholder="Supplier name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Supplier Contact</Label>
                  <Input
                    value={formData.supplierContact}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierContact: e.target.value })
                    }
                    placeholder="Email / Phone"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Order Date</Label>
                  <Input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Expected Delivery</Label>
                  <Input
                    type="date"
                    value={formData.expectedDelivery}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedDelivery: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Add Items Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Add Items from Material Requests</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3 bg-white mb-3">
                  {materialRequests.length > 0 ? (
                    materialRequests.map((mr) => (
                      <div
                        key={mr.id}
                        className="flex items-center justify-between p-2 border rounded hover:bg-slate-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{mr.requestNumber}</div>
                          <div className="text-xs text-slate-600">
                            {mr.itemName} • {mr.quantity} {mr.unit}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addItemToOrder(mr)}
                          className="h-8"
                        >
                          Add
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No material requests available</p>
                  )}
                </div>
              </div>

              {/* Selected Items */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">
                  Selected Items ({selectedItems.length})
                </h3>
                {selectedItems.length > 0 ? (
                  <div className="space-y-3">
                    {selectedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 border rounded bg-white"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.description}</div>
                          <div className="text-xs text-slate-600">
                            {item.quantity} {item.unit}
                          </div>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItemPrice(idx, parseFloat(e.target.value) || 0)
                            }
                            placeholder="Unit Price"
                            className="h-8 text-sm"
                            step="0.01"
                          />
                        </div>
                        <div className="w-24 text-right">
                          <div className="text-sm font-semibold">
                            {(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeItemFromOrder(idx)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-end pt-3 border-t">
                      <div className="text-lg font-bold">
                        Total: {selectedItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No items selected</p>
                )}
              </div>

              <div className="flex gap-2 justify-end border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setSelectedItems([])
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createPurchaseOrder}
                  disabled={loading || selectedItems.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Creating...' : 'Create PO'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PO List */}
        <div className="grid gap-4">
          {pos.length > 0 ? (
            pos.map((po) => (
              <Card key={po.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{po.poNumber}</CardTitle>
                      <CardDescription>{po.supplierName}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {po.status || 'DRAFT'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <div className="text-slate-600">Order Date</div>
                      <div className="font-medium">{new Date(po.orderDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-slate-600">Expected Delivery</div>
                      <div className="font-medium">
                        {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-600">Items</div>
                      <div className="font-medium">{po.purchaseOrderItems.length}</div>
                    </div>
                    <div>
                      <div className="text-slate-600">Total</div>
                      <div className="font-medium">
                        {po.purchaseOrderItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPO(po)
                        setIsViewingPO(true)
                      }}
                      className="h-8"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generatePOPDF(po)}
                      className="h-8"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePO(po.id)}
                      className="h-8 ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-600">No purchase orders yet. Create one to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* View PO Modal */}
        {isViewingPO && selectedPO && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{selectedPO.poNumber}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsViewingPO(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-600">Supplier</div>
                    <div className="font-medium">{selectedPO.supplierName}</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Contact</div>
                    <div className="font-medium">{selectedPO.supplierContact || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Order Date</div>
                    <div className="font-medium">
                      {new Date(selectedPO.orderDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600">Expected Delivery</div>
                    <div className="font-medium">
                      {selectedPO.expectedDelivery
                        ? new Date(selectedPO.expectedDelivery).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Items</h3>
                  <div className="space-y-2">
                    {selectedPO.purchaseOrderItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm border-b pb-2">
                        <div>
                          <div>{item.description}</div>
                          <div className="text-xs text-slate-600">
                            {item.quantity} {item.unit} @ {item.unitPrice.toFixed(2)}
                          </div>
                        </div>
                        <div className="font-medium">{item.totalPrice.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-3 text-lg font-bold border-t">
                    Total:{' '}
                    {selectedPO.purchaseOrderItems
                      .reduce((sum, item) => sum + item.totalPrice, 0)
                      .toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
