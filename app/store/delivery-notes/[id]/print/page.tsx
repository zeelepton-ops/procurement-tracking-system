'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

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
  items: {
    id: string
    itemDescription: string
    unit: string
    quantity: number
    weight: number | null
    remarks: string | null
  }[]
}

export default function DeliveryNotePrintPage() {
  const params = useParams()
  const id = params.id as string
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeliveryNote()
  }, [id])

  const fetchDeliveryNote = async () => {
    try {
      const res = await fetch(`/api/delivery-notes/${id}`)
      const data = await res.json()
      setDeliveryNote(data)
      setLoading(false)
      setTimeout(() => window.print(), 500)
    } catch (error) {
      console.error('Failed to fetch delivery note:', error)
      setLoading(false)
    }
  }

  if (loading || !deliveryNote) {
    return <div className="p-8">Loading delivery note...</div>
  }

  const dn = deliveryNote

  return (
    <div className="bg-white p-12" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
      {/* Header */}
      <div className="mb-8" style={{ borderBottom: '2px solid #000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>NBTC-FOSP 04 Rev.0</h1>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>DELIVERY NOTE</h2>
        </div>

        {/* DN Number and Date */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <table style={{ borderCollapse: 'collapse', border: '1px solid #000' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '5px 10px', fontWeight: 'bold', width: '200px' }}>
                  Delivery Note No: {dn.deliveryNoteNumber}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '5px 10px', fontWeight: 'bold' }}>
                  Date: {new Date(dn.date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Information Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '20px' }}>
        <tbody>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '100px' }}>Client</td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>{dn.client || ''}</td>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '100px' }}>Division</td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>{dn.division || ''}</td>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '100px' }}>Fabrication</td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>{dn.fabrication || ''}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Country</td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>{dn.country || ''}</td>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Department</td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>{dn.department || ''}</td>
            <td colSpan={2}></td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Ref./PO Number</td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>{dn.refPoNumber || ''}</td>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Job/Sales Order</td>
            <td colSpan={3} style={{ border: '1px solid #000', padding: '8px' }}>
              {dn.jobOrder?.jobNumber || ''}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '50px' }}>Sl. No</th>
            <th style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Item Description</th>
            <th style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '80px' }}>Unit</th>
            <th style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '80px' }}>Quantity</th>
            <th style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '100px' }}>Weight(KG)</th>
            <th style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {dn.items && dn.items.length > 0 ? (
            dn.items.map((item, idx) => (
              <tr key={item.id}>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{item.itemDescription}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.unit}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.weight || ''}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{item.remarks || ''}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ border: '1px solid #000', padding: '20px', textAlign: 'center' }}>
                No items
              </td>
            </tr>
          )}
          {/* Empty rows for template */}
          {(!dn.items || dn.items.length < 10) &&
            Array.from({ length: Math.max(0, 10 - (dn.items?.length || 0)) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={{ border: '1px solid #000', padding: '30px 8px' }}></td>
                <td style={{ border: '1px solid #000', padding: '30px 8px' }}></td>
                <td style={{ border: '1px solid #000', padding: '30px 8px' }}></td>
                <td style={{ border: '1px solid #000', padding: '30px 8px' }}></td>
                <td style={{ border: '1px solid #000', padding: '30px 8px' }}></td>
                <td style={{ border: '1px solid #000', padding: '30px 8px' }}></td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', textAlign: 'right' }}>
                Shipment to
              </td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>{dn.shipmentTo || ''}</td>
              <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', textAlign: 'right' }}>
                Total -
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{dn.totalQuantity}</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{dn.totalWeight.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}></td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Comments</td>
              <td colSpan={5} style={{ border: '1px solid #000', padding: '8px', minHeight: '40px' }}>
                {dn.comments || ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Shipment and Personnel Details */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '20%' }}>Shipment Type</td>
            <td style={{ border: '1px solid #000', padding: '8px' }} colSpan={2}>
              {dn.shipmentType || ''}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Representative Name/No.</td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>{dn.representativeName || ''}</td>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '20%' }}>QID No.</td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>{dn.qidNumber || ''}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Vehicle No</td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              <input
                type="checkbox"
                checked={dn.vehicleType === 'NBTC'}
                disabled
                style={{ marginRight: '5px' }}
              />
              NBTC
              <input
                type="checkbox"
                checked={dn.vehicleType === 'CLIENT'}
                disabled
                style={{ marginLeft: '20px', marginRight: '5px' }}
              />
              Client
              <input
                type="checkbox"
                checked={dn.vehicleType === 'THIRD_PARTY'}
                disabled
                style={{ marginLeft: '20px', marginRight: '5px' }}
              />
              Third Party
            </td>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
              {dn.vehicleNumber}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px' }}>
        <p style={{ margin: '5px 0', fontStyle: 'italic' }}>("Received the above goods in order")</p>
        <p style={{ margin: '40px 0 5px', textAlign: 'right' }}>Page 1 / 1</p>
      </div>
    </div>
  )
}
