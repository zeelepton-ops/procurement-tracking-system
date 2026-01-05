'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { FileText, Plus, Search, Eye, Edit, Trash2, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string | null
  subtotal: number
  taxAmount: number
  discount: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  paymentStatus: string
  status: string
  client: {
    id: string
    name: string
  }
  jobOrder?: {
    id: string
    jobNumber: string
  } | null
  _count: {
    items: number
    payments: number
  }
}

export default function InvoicesPage() {
  const { data: session } = useSession()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL')

  useEffect(() => {
    fetchInvoices()
  }, [statusFilter, paymentStatusFilter])

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (paymentStatusFilter !== 'ALL') params.set('paymentStatus', paymentStatusFilter)
      if (searchTerm) params.set('search', searchTerm)

      const res = await fetch(`/api/invoices?${params.toString()}`)
      const data = await res.json()
      setInvoices(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      const res = await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to delete invoice')
        return
      }

      alert('Invoice deleted successfully!')
      fetchInvoices()
    } catch (error) {
      console.error('Failed to delete invoice:', error)
      alert('Failed to delete invoice')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-orange-100 text-orange-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      UNPAID: 'bg-red-100 text-red-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Invoicing</h1>
        </div>
        <Link href="/invoices/create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Invoice #, Client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onBlur={fetchInvoices}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <Label>Payment Status</Label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="ALL">All</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{invoice.client.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.jobOrder ? invoice.jobOrder.jobNumber : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(invoice.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{invoice.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{invoice.balanceAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                        {invoice.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Link href={`/invoices/${invoice.id}`}>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                        </Link>
                        {session?.user?.role === 'ADMIN' && invoice.status === 'DRAFT' && (
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invoices.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No invoices found. Click "Create Invoice" to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
