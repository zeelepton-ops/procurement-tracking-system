'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft, Edit, Trash2 } from 'lucide-react'

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
  shipmentTo: string | null
  totalQuantity: number
  totalWeight: number
  comments: string | null
  shipmentType: string | null
  representativeName: string | null
  representativeNo: string | null
  qidNumber: string | null
  vehicleNumber: string | null
  vehicleType: string
  status: string
  items: {
    id: string
    itemDescription: string
    unit: string
    quantity: number
    weight: number | null
    remarks: string | null
  }[]
}

export default function DeliveryNoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchDeliveryNote()
  }, [id])

  const fetchDeliveryNote = async () => {
    try {
      setError(null)
      const res = await fetch(`/api/delivery-notes/${id}`)
      if (!res.ok) throw new Error('Failed to load delivery note')
      const data = await res.json()
      setDeliveryNote(data)
    } catch (error) {
      console.error('Failed to fetch delivery note:', error)
      setError('Failed to load delivery note')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this delivery note?')) return

    try {
      setError(null)
      const res = await fetch(`/api/delivery-notes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete delivery note')
      setSuccess('Delivery note deleted successfully')
      setTimeout(() => router.push('/store/delivery-notes'), 1500)
    } catch (error) {
      console.error('Failed to delete delivery note:', error)
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading delivery note...</p>
        </div>
      </div>
    )
  }

  if (!deliveryNote) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-slate-500">Delivery note not found</p>
        </div>
      </div>
    )
  }

  const dn = deliveryNote

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
            {success}
          </div>
        )}
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/store/delivery-notes')}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-slate-900">Delivery Note {dn.deliveryNoteNumber}</h1>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => window.open(`/store/delivery-notes/${id}/print`, '_blank')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={() => router.push('/store/delivery-notes')}
              variant="outline"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Main Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Delivery Note Number</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{dn.deliveryNoteNumber}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Date</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{new Date(dn.date).toLocaleDateString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                dn.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                dn.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {dn.status}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Job Order No.</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-slate-900">{dn.jobOrder?.jobNumber || 'N/A'}</p>
              {dn.jobOrder && (
                <p className="text-xs text-slate-600 mt-1">{dn.jobOrder.productName}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Client and Reference Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Header Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Client</p>
                <p className="text-base font-medium">{dn.client || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Country</p>
                <p className="text-base font-medium">{dn.country || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Division</p>
                <p className="text-base font-medium">{dn.division || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Department</p>
                <p className="text-base font-medium">{dn.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Fabrication</p>
                <p className="text-base font-medium">{dn.fabrication || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Ref/PO Number</p>
                <p className="text-base font-medium">{dn.refPoNumber || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>{dn.items.length} item(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Item Description</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Unit</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Weight (KG)</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dn.items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">{item.itemDescription}</td>
                      <td className="px-4 py-3 text-sm">{item.unit}</td>
                      <td className="px-4 py-3 text-sm font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm">{item.weight || '-'}</td>
                      <td className="px-4 py-3 text-sm">{item.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end gap-8">
              <div>
                <p className="text-sm text-slate-600">Total Quantity</p>
                <p className="text-lg font-bold text-slate-900">{dn.totalQuantity}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Weight (KG)</p>
                <p className="text-lg font-bold text-slate-900">{dn.totalWeight.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Shipment & Personnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Shipment To</p>
                <p className="text-base font-medium">{dn.shipmentTo || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Shipment Type</p>
                <p className="text-base font-medium">{dn.shipmentType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Representative Name</p>
                <p className="text-base font-medium">{dn.representativeName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">QID Number</p>
                <p className="text-base font-medium">{dn.qidNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Vehicle Number</p>
                <p className="text-base font-medium">{dn.vehicleNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Vehicle Type</p>
                <p className="text-base font-medium">{dn.vehicleType}</p>
              </div>
            </div>
            {dn.comments && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-semibold text-slate-600 mb-2">Comments</p>
                <p className="text-sm text-slate-700">{dn.comments}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
