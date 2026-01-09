'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'

interface Client {
  id: string
  name: string
  address: string | null
  paymentTerms: string | null
}

interface JobOrder {
  id: string
  jobNumber: string
  clientId: string | null
  lpoContractNo: string | null
  items: JobOrderItem[]
}

interface JobOrderItem {
  id: string
  workDescription: string
  quantity: number | null
  unit: string
  unitPrice: number | null
  totalPrice: number | null
}

interface InvoiceItem {
  jobOrderItemId: string
  lineItemDescription: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  deliveryNoteNo: string
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([])
  const [selectedDeliveryNotes, setSelectedDeliveryNotes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [invoiceSuggestions, setInvoiceSuggestions] = useState<any>(null)

  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    clientId: '',
    jobOrderId: '',
    clientReference: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    taxRate: 0,
    discount: 0,
    notes: '',
    terms: '',
    bankDetails: '',
    paymentTerms: '45 DAYS',
    mainDescription: 'Job Order'
  })

  const [items, setItems] = useState<InvoiceItem[]>([{
    jobOrderItemId: '',
    lineItemDescription: '',
    unit: 'Nos',
    quantity: 0,
    unitPrice: 0,
    totalPrice: 0,
    deliveryNoteNo: ''
  }])

  useEffect(() => {
    fetchClients()
    fetchJobOrders()
    fetchInvoiceSuggestions()
    fetchUserBankDetails()
  }, [])

  useEffect(() => {
    if (invoiceForm.jobOrderId && jobOrders.length > 0 && clients.length > 0) {
      loadJobOrderDetails()
      fetchDeliveryNotes()
    } else {
      setDeliveryNotes([])
      setSelectedDeliveryNotes([])
    }
  }, [invoiceForm.jobOrderId, jobOrders, clients])

  const fetchInvoiceSuggestions = async () => {
    try {
      const res = await fetch('/api/invoices/suggestions')
      const data = await res.json()
      setInvoiceSuggestions(data)
      // Auto-select first suggested number
      if (data.suggestedNumbers && data.suggestedNumbers.length > 0) {
        setInvoiceForm(prev => ({ ...prev, invoiceNumber: data.suggestedNumbers[0] }))
      }
    } catch (error) {
      console.error('Failed to fetch invoice suggestions:', error)
    }
  }

  const fetchUserBankDetails = async () => {
    try {
      const res = await fetch('/api/users/me')
      const data = await res.json()
      if (data.bankDetails) {
        setInvoiceForm(prev => ({ ...prev, bankDetails: data.bankDetails }))
      } else {
        // Set default bank details if user hasn't configured them
        setInvoiceForm(prev => ({ 
          ...prev, 
          bankDetails: `DUKHAN BANK QATAR
A/C no: 10000 1771 788
IBAN no: QA25BKWA000000010001771788
DOHA BRANCH`
        }))
      }
    } catch (error) {
      console.error('Failed to fetch bank details:', error)
      // Set default bank details on error
      setInvoiceForm(prev => ({ 
        ...prev, 
        bankDetails: `DUKHAN BANK QATAR
A/C no: 10000 1771 788
IBAN no: QA25BKWA000000010001771788
DOHA BRANCH`
      }))
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients?status=ACTIVE')
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch clients:', error)
      setClients([])
    }
  }

  const fetchJobOrders = async () => {
    try {
      const res = await fetch('/api/job-orders')
      const data = await res.json()
      // API returns { jobs: [...], totalCount: ... }
      setJobOrders(Array.isArray(data.jobs) ? data.jobs : Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch job orders:', error)
      setJobOrders([])
    }
  }

  const loadJobOrderDetails = async () => {
    const jobOrder = jobOrders.find(jo => jo.id === invoiceForm.jobOrderId)
    console.log('=== Job Order Selection Debug ===')
    console.log('Selected job order ID:', invoiceForm.jobOrderId)
    console.log('All job orders:', jobOrders)
    console.log('Selected job order:', jobOrder)
    console.log('Job order clientId:', jobOrder?.clientId)
    console.log('Job order lpoContractNo:', jobOrder?.lpoContractNo)
    console.log('All clients:', clients)
    
    if (!jobOrder) {
      console.log('ERROR: Job order not found!')
      return
    }

    // Auto-fill client details
    if (jobOrder.clientId) {
      const client = clients.find(c => c.id === jobOrder.clientId)
      console.log('Found client:', client)
      if (client) {
        setInvoiceForm(prev => ({
          ...prev,
          clientId: client.id,
          clientReference: jobOrder.lpoContractNo || '',
          terms: client.paymentTerms || 'Net 30',
          mainDescription: jobOrder.jobNumber || 'Job Order'
        }))
        console.log('✓ Auto-filled client:', client.name, 'Reference:', jobOrder.lpoContractNo)
      } else {
        console.log('ERROR: Client not found with ID:', jobOrder.clientId)
      }
    } else {
      console.log('WARNING: Job order has no clientId')
    }
  }

  const fetchDeliveryNotes = async () => {
    const jobOrder = jobOrders.find(jo => jo.id === invoiceForm.jobOrderId)
    if (!jobOrder) return

    try {
      const res = await fetch(`/api/delivery-notes?jobOrderId=${jobOrder.id}`)
      const data = await res.json()
      
      if (!Array.isArray(data) || data.length === 0) {
        console.log('No delivery notes found for this job order')
        setDeliveryNotes([])
        return
      }

      console.log('Loaded delivery notes:', data)
      setDeliveryNotes(data)
    } catch (error) {
      console.error('Failed to fetch delivery notes:', error)
      setDeliveryNotes([])
    }
  }

  const loadItemsFromDeliveryNotes = () => {
    const jobOrder = jobOrders.find(jo => jo.id === invoiceForm.jobOrderId)
    if (!jobOrder || selectedDeliveryNotes.length === 0) return

    const selectedDNs = deliveryNotes.filter(dn => selectedDeliveryNotes.includes(dn.id))
    
    if (selectedDNs.length === 0) {
      alert('Please select at least one delivery note.')
      return
    }

    // Group delivery note items by job order item
    const itemsMap = new Map()
    
    selectedDNs.forEach((dn: any) => {
      dn.items?.forEach((item: any) => {
        if (item.jobOrderItemId) {
          if (!itemsMap.has(item.jobOrderItemId)) {
            const jobOrderItem = jobOrder.items?.find((joi: any) => joi.id === item.jobOrderItemId)
            itemsMap.set(item.jobOrderItemId, {
              jobOrderItemId: item.jobOrderItemId,
              lineItemDescription: jobOrderItem?.workDescription || '',
              dnDetails: [],
              unit: item.unit,
              quantity: 0,
              unitPrice: jobOrderItem?.unitPrice || 0,
              totalPrice: 0,
              deliveryNoteNo: dn.deliveryNoteNumber
            })
          }
          // Add DN details with quantity
          const existing = itemsMap.get(item.jobOrderItemId)
          existing.dnDetails.push({
            description: item.itemDescription,
            quantity: item.deliveredQuantity || 0,
            dnNumber: dn.deliveryNoteNumber
          })
          existing.quantity += item.deliveredQuantity || 0
          if (!existing.deliveryNoteNo.includes(dn.deliveryNoteNumber)) {
            existing.deliveryNoteNo = existing.deliveryNoteNo + ', ' + dn.deliveryNoteNumber
          }
        }
      })
    })

    // Convert to array and format descriptions
    const loadedItems = Array.from(itemsMap.values()).map(item => {
      // Format: Job Order Description\nDN1 Description - Qty\nDN2 Description - Qty
      const dnLines = item.dnDetails.map((dn: any) => `${dn.description} - ${dn.quantity}`).join('\n')
      const fullDescription = item.lineItemDescription + (dnLines ? '\n' + dnLines : '')
      
      return {
        jobOrderItemId: item.jobOrderItemId,
        lineItemDescription: fullDescription,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        deliveryNoteNo: item.deliveryNoteNo
      }
    })
    if (loadedItems.length > 0) {
      setItems(loadedItems)
      console.log('Loaded items from delivery notes:', loadedItems)
    } else {
      alert('No delivered items found in selected delivery notes.')
    }
  }

  const addItem = () => {
    setItems([...items, {
      jobOrderItemId: '',
      lineItemDescription: '',
      unit: 'Nos',
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
      deliveryNoteNo: ''
    }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setItems(newItems)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const calculateTaxAmount = () => {
    return calculateSubtotal() * (invoiceForm.taxRate / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount() - invoiceForm.discount
  }

  const numberToWords = (num: number): string => {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE']
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN']
    
    if (num === 0) return 'ZERO'
    
    const convertHundreds = (n: number): string => {
      if (n === 0) return ''
      if (n < 10) return ones[n]
      if (n < 20) return teens[n - 10]
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
      return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : '')
    }
    
    const convertThousands = (n: number): string => {
      if (n < 1000) return convertHundreds(n)
      return convertHundreds(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 !== 0 ? ' ' + convertHundreds(n % 1000) : '')
    }
    
    return convertThousands(Math.floor(num)) + ' ONLY'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...invoiceForm,
        items: items.map(item => ({
          jobOrderItemId: item.jobOrderItemId || null,
          description: `Main Description: ${invoiceForm.mainDescription}\n${item.lineItemDescription}\nTowards Delivery Note no: ${item.deliveryNoteNo}`,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice
        }))
      }

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to create invoice')
        setLoading(false)
        return
      }

      alert('Invoice created successfully!')
      router.push('/invoices')
    } catch (error) {
      console.error('Failed to create invoice:', error)
      alert('Failed to create invoice')
      setLoading(false)
    }
  }

  const selectedClient = clients.find(c => c.id === invoiceForm.clientId)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create Invoice</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-lg">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 py-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Invoice Number *</Label>
                    <select
                      required
                      value={invoiceForm.invoiceNumber}
                      onChange={(e) => setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select Invoice Number</option>
                      {invoiceSuggestions?.suggestedNumbers && (
                        <optgroup label="Suggested Numbers">
                          {invoiceSuggestions.suggestedNumbers.map((num: string) => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </optgroup>
                      )}
                      {invoiceSuggestions?.lastInvoices && invoiceSuggestions.lastInvoices.length > 0 && (
                        <optgroup label="Recent Invoices (Reference)">
                          {invoiceSuggestions.lastInvoices.map((inv: any) => (
                            <option key={inv.invoiceNumber} value={inv.invoiceNumber} disabled>
                              {inv.invoiceNumber} - {inv.clientName} - QAR {inv.amount.toFixed(2)}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <div>
                    <Label>Invoice Date *</Label>
                    <Input
                      type="date"
                      required
                      value={invoiceForm.invoiceDate}
                      onChange={(e) => setInvoiceForm({...invoiceForm, invoiceDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Client *</Label>
                    <select
                      required
                      value={invoiceForm.clientId}
                      onChange={(e) => setInvoiceForm({...invoiceForm, clientId: e.target.value})}
                      disabled={!!invoiceForm.jobOrderId}
                      className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                    {invoiceForm.jobOrderId && (
                      <p className="text-xs text-gray-500 mt-1">Auto-filled from Job Order</p>
                    )}
                  </div>
                  <div>
                    <Label>Job Order (Optional)</Label>
                    <select
                      value={invoiceForm.jobOrderId}
                      onChange={(e) => setInvoiceForm({...invoiceForm, jobOrderId: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select Job Order</option>
                      {jobOrders.map(jo => (
                        <option key={jo.id} value={jo.id}>{jo.jobNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Label>Client Reference (e.g., QF-PO-29344-QEE Dtd 25/08/2024)</Label>
                    <Input
                      placeholder="Your Ref no."
                      value={invoiceForm.clientReference}
                      onChange={(e) => setInvoiceForm({...invoiceForm, clientReference: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Notes Selection */}
            {invoiceForm.jobOrderId && deliveryNotes.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-lg">Select Delivery Notes</CardTitle>
                  <p className="text-xs text-gray-600">
                    Choose the delivery notes to include in this invoice
                  </p>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="space-y-2">
                    {deliveryNotes.map((dn: any) => (
                      <label key={dn.id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDeliveryNotes.includes(dn.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDeliveryNotes([...selectedDeliveryNotes, dn.id])
                            } else {
                              setSelectedDeliveryNotes(selectedDeliveryNotes.filter(id => id !== dn.id))
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{dn.deliveryNoteNumber}</div>
                          <div className="text-sm text-gray-600">
                            Date: {new Date(dn.date).toLocaleDateString()} | Items: {dn.items?.length || 0}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedDeliveryNotes.length > 0 && (
                    <Button 
                      type="button" 
                      onClick={loadItemsFromDeliveryNotes}
                      className="mt-4"
                    >
                      Load Items from Selected Delivery Notes
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Line Items</CardTitle>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label className="text-sm font-semibold">Main Description</Label>
                  <Input
                    value={invoiceForm.mainDescription}
                    onChange={(e) => setInvoiceForm({...invoiceForm, mainDescription: e.target.value})}
                    placeholder="Job Order"
                    className="text-sm h-9 mt-1"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-100">
                        <th className="text-left px-2 py-1.5 font-semibold text-xs text-slate-700">Item</th>
                        <th className="text-left px-2 py-1.5 font-semibold text-xs text-slate-700">Line Item Description</th>
                        <th className="text-left px-2 py-1.5 font-semibold text-xs text-slate-700">Unit</th>
                        <th className="text-left px-2 py-1.5 font-semibold text-xs text-slate-700">Qty</th>
                        <th className="text-left px-2 py-1.5 font-semibold text-xs text-slate-700">Unit Price</th>
                        <th className="text-left px-2 py-1.5 font-semibold text-xs text-slate-700">Total</th>
                        <th className="text-center px-2 py-1.5 font-semibold text-xs text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-2 py-1.5">
                            <span className="font-semibold text-xs text-slate-600">#{index + 1}</span>
                          </td>
                          <td className="px-2 py-1.5">
                            <Textarea
                              required
                              value={item.lineItemDescription}
                              onChange={(e) => updateItem(index, 'lineItemDescription', e.target.value)}
                              placeholder="Detailed description"
                              rows={2}
                              className="text-xs"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              required
                              value={item.unit}
                              onChange={(e) => updateItem(index, 'unit', e.target.value)}
                              className="text-xs h-7 w-20"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              required
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="text-xs h-7 w-24"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              required
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="text-xs h-7 w-28"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              value={item.totalPrice.toFixed(2)}
                              disabled
                              className="bg-slate-50 text-xs h-7 w-28 font-semibold"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {items.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* DN Numbers below table */}
                {items.some(item => item.deliveryNoteNo) && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Delivery Note Numbers:</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item, index) => (
                        item.deliveryNoteNo && (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <span className="text-slate-600">Item #{index + 1}:</span>
                            <Input
                              value={item.deliveryNoteNo}
                              onChange={(e) => updateItem(index, 'deliveryNoteNo', e.target.value)}
                              placeholder="DN-XXXX/YY"
                              className="text-xs h-7 w-32"
                            />
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bank Details & Terms */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-lg">Bank Details & Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 py-3">
                <div>
                  <Label className="text-sm">Bank Details</Label>
                  <Textarea
                    value={invoiceForm.bankDetails}
                    onChange={(e) => setInvoiceForm({...invoiceForm, bankDetails: e.target.value})}
                    rows={3}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-sm">Additional Notes</Label>
                  <Textarea
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Block */}
          <div>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 py-3">
                {selectedClient && (
                  <div className="pb-4 border-b">
                    <Label className="text-xs text-gray-500">DUE FROM M/s:</Label>
                    <p className="font-semibold">{selectedClient.name}</p>
                    {selectedClient.address && (
                      <p className="text-sm text-gray-600">{selectedClient.address}</p>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Payment Terms</Label>
                    <Input
                      value={invoiceForm.paymentTerms}
                      onChange={(e) => setInvoiceForm({...invoiceForm, paymentTerms: e.target.value})}
                      placeholder="45 DAYS"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="flex justify-between pt-2">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{calculateSubtotal().toFixed(2)} QAR</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Tax Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={invoiceForm.taxRate}
                        onChange={(e) => setInvoiceForm({...invoiceForm, taxRate: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Discount (QAR)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={invoiceForm.discount}
                        onChange={(e) => setInvoiceForm({...invoiceForm, discount: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Tax Amount:</span>
                    <span>{calculateTaxAmount().toFixed(2)} QAR</span>
                  </div>
                  
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>TOTAL:</span>
                    <span>{calculateTotal().toFixed(2)} QAR</span>
                  </div>
                  
                  <div className="text-xs text-gray-600 pt-2">
                    <strong>In Words:</strong><br/>
                    {numberToWords(calculateTotal())}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Invoice'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
