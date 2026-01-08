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
  mainDescription: string
  lineItemDescription: string
  totalQuantity: number
  unitPrice: number
  subItems: Array<{
    id: string
    description: string
    unit: string
    quantity: number
    deliveryNoteNo: string
    totalPrice: number
  }>
  paymentTerm: string
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
    bankDetails: ''
  })

  const [items, setItems] = useState<InvoiceItem[]>([{
    jobOrderItemId: '',
    mainDescription: '',
    lineItemDescription: '',
    totalQuantity: 0,
    unitPrice: 0,
    subItems: [{
      id: `sub-${Date.now()}`,
      description: '',
      unit: 'Nos',
      quantity: 0,
      deliveryNoteNo: '',
      totalPrice: 0
    }],
    paymentTerm: '45 DAYS'
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
        // Format client reference with date
        const poName = jobOrder.lpoContractNo || ''
        const today = new Date()
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
        const clientRef = poName ? `${poName} Dated: ${formattedDate}` : ''
        
        setInvoiceForm(prev => ({
          ...prev,
          clientId: client.id,
          clientReference: clientRef,
          terms: client.paymentTerms || 'Net 30'
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

    // Group delivery note items by job order item with sub-items
    const itemsMap = new Map()
    
    selectedDNs.forEach((dn: any) => {
      dn.items?.forEach((item: any) => {
        if (item.jobOrderItemId) {
          const jobOrderItem = jobOrder.items?.find((joi: any) => joi.id === item.jobOrderItemId)
          
          if (!itemsMap.has(item.jobOrderItemId)) {
            itemsMap.set(item.jobOrderItemId, {
              jobOrderItemId: item.jobOrderItemId,
              mainDescription: 'Job Order',
              lineItemDescription: item.itemDescription,
              totalQuantity: jobOrderItem?.quantity || 0,
              unitPrice: jobOrderItem?.unitPrice || 0,
              subItems: [],
              paymentTerm: '45 DAYS'
            })
          }
          
          // Add sub-item for each delivery note item
          const existing = itemsMap.get(item.jobOrderItemId)
          existing.subItems.push({
            id: `sub-${Date.now()}-${Math.random()}`,
            description: item.itemDescription,
            unit: item.unit,
            quantity: item.deliveredQuantity || 0,
            deliveryNoteNo: dn.deliveryNoteNumber,
            totalPrice: (item.deliveredQuantity || 0) * (jobOrderItem?.unitPrice || 0)
          })
        }
      })
    })

    // Convert to array
    const loadedItems = Array.from(itemsMap.values())

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
      mainDescription: '',
      lineItemDescription: '',
      totalQuantity: 0,
      unitPrice: 0,
      subItems: [{
        id: `sub-${Date.now()}`,
        description: '',
        unit: 'Nos',
        quantity: 0,
        deliveryNoteNo: '',
        totalPrice: 0
      }],
      paymentTerm: '45 DAYS'
    }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const addSubItem = (itemIndex: number) => {
    const newItems = [...items]
    newItems[itemIndex].subItems.push({
      id: `sub-${Date.now()}-${Math.random()}`,
      description: '',
      unit: 'Nos',
      quantity: 0,
      deliveryNoteNo: '',
      totalPrice: 0
    })
    setItems(newItems)
  }

  const removeSubItem = (itemIndex: number, subIndex: number) => {
    const newItems = [...items]
    newItems[itemIndex].subItems = newItems[itemIndex].subItems.filter((_, i) => i !== subIndex)
    setItems(newItems)
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const updateSubItem = (itemIndex: number, subIndex: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[itemIndex].subItems[subIndex] = { 
      ...newItems[itemIndex].subItems[subIndex], 
      [field]: value 
    }
    
    // Recalculate total price for sub-item
    if (field === 'quantity') {
      const unitPrice = newItems[itemIndex].unitPrice || 0
      newItems[itemIndex].subItems[subIndex].totalPrice = value * unitPrice
    }
    
    setItems(newItems)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const itemTotal = item.subItems.reduce((subSum, subItem) => subSum + (subItem.totalPrice || 0), 0)
      return sum + itemTotal
    }, 0)
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
      // Flatten sub-items into individual invoice items
      const flattenedItems = items.flatMap(item => 
        item.subItems.map(subItem => ({
          jobOrderItemId: item.jobOrderItemId || null,
          description: `${item.lineItemDescription}\n${subItem.description}\nTowards Delivery Note no: ${subItem.deliveryNoteNo}\nPayment Term: ${item.paymentTerm}`,
          quantity: subItem.quantity,
          unit: subItem.unit,
          unitPrice: item.unitPrice
        }))
      )

      const payload = {
        ...invoiceForm,
        items: flattenedItems
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
      setLoading(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === invoiceForm.clientId);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <CardHeader>
                  <CardTitle>Select Delivery Notes</CardTitle>
                  <p className="text-sm text-gray-600">
                    Choose the delivery notes to include in this invoice
                  </p>
                </CardHeader>
                <CardContent>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-100">
                        <th className="text-left px-2 py-2 font-semibold w-[30%]">Line Item Description</th>
                        <th className="text-left px-2 py-2 font-semibold w-[8%]">Total Qty</th>
                        <th className="text-left px-2 py-2 font-semibold w-[8%]">Unit Price</th>
                        <th className="text-left px-2 py-2 font-semibold w-[49%]">Sub Items (Desc, Unit, Qty, DN No, Amount)</th>
                        <th className="text-left px-2 py-2 font-semibold w-[5%]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, itemIndex) => (
                        <React.Fragment key={itemIndex}>
                          {/* Parent Line Item Row */}
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <td className="px-2 py-2">
                              <Input
                                value={item.lineItemDescription}
                                onChange={(e) => updateItem(itemIndex, 'lineItemDescription', e.target.value)}
                                placeholder="Line item description"
                                className="text-xs h-7"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                type="number"
                                value={item.totalQuantity}
                                onChange={(e) => updateItem(itemIndex, 'totalQuantity', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="text-xs h-7"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(itemIndex, 'unitPrice', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="text-xs h-7"
                              />
                            </td>
                            <td className="px-2 py-2 text-right">
                              <Button
                                type="button"
                                onClick={() => addSubItem(itemIndex)}
                                className="bg-blue-500 hover:bg-blue-600 h-6 px-2 text-xs"
                                size="sm"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Sub Item
                              </Button>
                            </td>
                            <td className="px-2 py-2">
                              {items.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeItem(itemIndex)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
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
                                      value={subItem.description}
                                      onChange={(e) => updateSubItem(itemIndex, subIndex, 'description', e.target.value)}
                                      placeholder="Sub Item Description"
                                      className="text-xs h-7"
                                    />
                                  </div>
                                  <div className="w-24">
                                    <label className="text-[10px] text-slate-500 block mb-0.5">Unit</label>
                                    <Input
                                      value={subItem.unit}
                                      onChange={(e) => updateSubItem(itemIndex, subIndex, 'unit', e.target.value)}
                                      placeholder="Unit"
                                      className="text-xs h-7"
                                    />
                                  </div>
                                  <div className="w-24">
                                    <label className="text-[10px] text-slate-500 block mb-0.5">Quantity</label>
                                    <Input
                                      type="number"
                                      value={subItem.quantity}
                                      onChange={(e) => updateSubItem(itemIndex, subIndex, 'quantity', parseFloat(e.target.value) || 0)}
                                      placeholder="0"
                                      className="text-xs h-7"
                                    />
                                  </div>
                                  <div className="w-40">
                                    <label className="text-[10px] text-slate-500 block mb-0.5">DN Number</label>
                                    <Input
                                      value={subItem.deliveryNoteNo}
                                      onChange={(e) => updateSubItem(itemIndex, subIndex, 'deliveryNoteNo', e.target.value)}
                                      placeholder="DN-0001/26"
                                      className="text-xs h-7"
                                    />
                                  </div>
                                  <div className="w-28">
                                    <label className="text-[10px] text-slate-500 block mb-0.5">Amount</label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={subItem.totalPrice}
                                      readOnly
                                      className="text-xs h-7 bg-slate-50"
                                    />
                                  </div>
                                  <div className="w-8">
                                    <Button
                                      type="button"
                                      onClick={() => removeSubItem(itemIndex, subIndex)}
                                      className="bg-red-600 hover:bg-red-700 h-7 w-full p-0"
                                      size="sm"
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
              </CardContent>
            </Card>

            {/* Totals Section */}
                        <div>
                          <Label>Total Price (QAR)</Label>
                          <Input
                            type="number"
                            value={item.totalPrice.toFixed(2)}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Payment Term</Label>
                          <Input
                            value={item.paymentTerm}
                            onChange={(e) => updateItem(index, 'paymentTerm', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bank Details & Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Bank Details & Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Bank Details</Label>
                  <Textarea
                    value={invoiceForm.bankDetails}
                    onChange={(e) => setInvoiceForm({...invoiceForm, bankDetails: e.target.value})}
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{calculateSubtotal().toFixed(2)} QAR</span>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Tax Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={invoiceForm.taxRate}
                      onChange={(e) => setInvoiceForm({...invoiceForm, taxRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Tax Amount:</span>
                    <span>{calculateTaxAmount().toFixed(2)} QAR</span>
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
